"""
Meal-parse HTTP service: transcript -> MealItem[] for the Byte app.

Debug: set MEAL_PARSE_DEBUG=1, then POST /meal-parse/debug with the same body as /meal-parse
to get { "items", "trace" } showing OpenAI lines, USDA resolution, fallbacks, and legacy segments.

Run: uvicorn meal_parse_server:app --reload --port 8787
App: VITE_MEAL_PARSE_URL=/meal-parse
"""

from __future__ import annotations

import logging
import os
from typing import Any

import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from fdc_nutrition import (
    legacy_phrase_parse,
    legacy_phrase_parse_with_trace,
    legacy_single_from_query,
    resolve_fdc_id,
    scaled_item_for_line,
    split_phrases,
)
from openai_extract import ExtractedLine, extract_meal_structured
from usda_api import USDAAPI

logger = logging.getLogger(__name__)

app = FastAPI(title="Byte USDA meal-parse")
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("MEAL_PARSE_CORS_ORIGINS", "*").split(","),
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TranscriptBody(BaseModel):
    transcript: str = Field(..., min_length=1, max_length=4096)


def _process_openai_lines(
    api: USDAAPI,
    lines: list[ExtractedLine],
    trace_steps: list[dict[str, Any]] | None,
) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    for i, line in enumerate(lines):
        step: dict[str, Any] = {"index": i, "line": line.model_dump()}
        row: dict[str, Any] | None = None
        try:
            fid = resolve_fdc_id(api, line)
        except requests.exceptions.RequestException as e:
            step["resolve_error"] = str(e)
            fid = None
        step["resolved_fdc_id"] = fid

        if fid is not None:
            row = scaled_item_for_line(api, line, fid)
        step["scaled_from_openai"] = row

        if row is None:
            fb, reason = legacy_single_from_query(
                api,
                (line.usda_query or line.name or "").strip(),
                servings=line.servings,
                grams=line.grams,
                display_name=line.name,
            )
            step["fallback_search"] = {"used": fb is not None, "reason": reason, "query": (line.usda_query or line.name or "").strip()}
            row = fb

        step["final_item"] = row
        if trace_steps is not None:
            trace_steps.append(step)
        if row:
            items.append(row)
    return items


def _empty_meal_parse_hint(*, openai_lines: int) -> str:
    parts: list[str] = []
    if not os.getenv("OPENAI_API_KEY", "").strip():
        parts.append("Set OPENAI_API_KEY on the meal-parse server for reliable multi-item parsing.")
    elif openai_lines == 0:
        parts.append("OpenAI returned no food lines for this transcript.")
    else:
        parts.append(
            "OpenAI returned lines but every USDA lookup failed—check USDA_API_KEY "
            "(invalid or placeholder keys often get HTTP 429 from FoodData Central)."
        )
    parts.append("Restart uvicorn after editing api-testing/USDA-API/.env.")
    return " ".join(parts)


@app.post("/meal-parse")
def meal_parse(body: TranscriptBody) -> dict[str, Any]:
    key = os.getenv("USDA_API_KEY", "").strip()
    if not key:
        raise HTTPException(status_code=503, detail="USDA_API_KEY is not set on the server")

    raw = body.transcript.strip()
    api = USDAAPI(key)

    openai_line_count = 0
    if os.getenv("OPENAI_API_KEY", "").strip():
        try:
            lines = extract_meal_structured(raw)
        except Exception as e:
            logger.warning("OpenAI extract failed: %s", e)
            lines = []

        openai_line_count = len(lines)
        if lines:
            items = _process_openai_lines(api, lines, trace_steps=None)
            if items:
                return {"items": items}

    try:
        legacy = legacy_phrase_parse(api, raw)
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=502, detail=str(e)) from e

    if legacy:
        return {"items": legacy}
    if raw:
        return {"items": [], "hint": _empty_meal_parse_hint(openai_lines=openai_line_count)}
    return {"items": []}


@app.post("/meal-parse/debug")
def meal_parse_debug(body: TranscriptBody) -> dict[str, Any]:
    """Returns items plus a trace. Enable with MEAL_PARSE_DEBUG=1 on the server."""
    if os.getenv("MEAL_PARSE_DEBUG", "").strip() != "1":
        raise HTTPException(
            status_code=404,
            detail="Disabled. Set MEAL_PARSE_DEBUG=1 in the meal-parse server environment, restart uvicorn, POST again.",
        )

    key = os.getenv("USDA_API_KEY", "").strip()
    if not key:
        raise HTTPException(status_code=503, detail="USDA_API_KEY is not set on the server")

    raw = body.transcript.strip()
    api = USDAAPI(key)
    trace: dict[str, Any] = {
        "transcript": raw,
        "openai_configured": bool(os.getenv("OPENAI_API_KEY", "").strip()),
        "segments_if_legacy": split_phrases(raw),
    }

    lines: list[ExtractedLine] = []
    if trace["openai_configured"]:
        try:
            lines = extract_meal_structured(raw)
            trace["openai_ok"] = True
            trace["openai_lines"] = [ln.model_dump() for ln in lines]
        except Exception as e:
            trace["openai_ok"] = False
            trace["openai_error"] = str(e)

    items: list[dict[str, Any]] = []
    if lines:
        steps: list[dict[str, Any]] = []
        items = _process_openai_lines(api, lines, trace_steps=steps)
        trace["pipeline"] = "openai_plus_fallback_per_line"
        trace["steps"] = steps
    else:
        try:
            items, leg_trace = legacy_phrase_parse_with_trace(api, raw)
        except requests.exceptions.RequestException as e:
            raise HTTPException(status_code=502, detail=str(e)) from e
        trace["pipeline"] = "legacy_only"
        trace["steps"] = leg_trace

    trace["item_count"] = len(items)
    return {"items": items, "trace": trace}

