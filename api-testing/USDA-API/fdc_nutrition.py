"""USDA FDC food resolution and quantity-based macro scaling."""

from __future__ import annotations

import math
import re
import uuid
from typing import Any

import requests

from openai_extract import ExtractedLine
from usda_api import USDAAPI


def amount_label(food: dict[str, Any]) -> str:
    h = food.get("householdServingFullText")
    if isinstance(h, str) and h.strip():
        return h.strip()
    su, un = food.get("servingSize"), food.get("servingSizeUnit")
    if su is not None and isinstance(un, str) and str(un).strip():
        return f"{su} {un}".strip()
    pw = food.get("packageWeight")
    if isinstance(pw, str) and pw.strip():
        return pw.strip()
    return "1 serving (USDA)"


def macros_from_food_nutrients(detail: dict[str, Any]) -> tuple[float, float, float, float]:
    """(calories, protein_g, carbs_g, fat_g) from foodNutrients (search or detail)."""
    calories = protein = carbs = fat = 0.0
    for n in detail.get("foodNutrients") or []:
        if isinstance(n.get("nutrient"), dict):
            nid = n["nutrient"].get("id")
            val = n.get("amount")
        else:
            nid = n.get("nutrientId")
            val = n.get("value")
        if val is None or nid is None:
            continue
        try:
            v = float(val)
        except (TypeError, ValueError):
            continue
        if nid == 1008:
            calories = v
        elif nid == 1003:
            protein = v
        elif nid == 1005:
            carbs = v
        elif nid == 1004:
            fat = v
    return calories, protein, carbs, fat


def macros_for_scaling(detail: dict[str, Any]) -> tuple[float, float, float, float]:
    """
    Prefer branded labelNutrients (matches printed Nutrition Facts / serving).
    If the label is missing or all zeros, use foodNutrients (common for produce / SR entries).
    """
    ln = detail.get("labelNutrients")
    if isinstance(ln, dict):
        cal_b = ln.get("calories")
        if isinstance(cal_b, dict) and cal_b.get("value") is not None:

            def gv(key: str) -> float:
                b = ln.get(key)
                if isinstance(b, dict) and b.get("value") is not None:
                    try:
                        return float(b["value"])
                    except (TypeError, ValueError):
                        pass
                return 0.0

            cal, p, cb, f = gv("calories"), gv("protein"), gv("carbohydrates"), gv("fat")
            if cal > 0 or p > 0 or cb > 0 or f > 0:
                return cal, p, cb, f

    return macros_from_food_nutrients(detail)


def _nutrient_derivation_lower(n: dict[str, Any]) -> str:
    d = n.get("foodNutrientDerivation")
    if isinstance(d, dict):
        return str(d.get("description") or "").lower()
    return ""


def reference_grams_for_macros(detail: dict[str, Any]) -> float:
    """
    Grams of food that the reported macro totals in `foodNutrients` apply to.
    Branded: usually servingSize in g. Survey/Foundation: often per 100 g.
    """
    ss = detail.get("servingSize")
    su = str(detail.get("servingSizeUnit") or "").strip().lower()
    if isinstance(ss, (int, float)) and float(ss) > 0:
        if su in ("g", "gram", "grams"):
            return float(ss)
        if su in ("ml", "milliliter", "milliliters", "millilitre", "millilitres"):
            return float(ss)
        if su in ("oz", "ounce", "ounces"):
            return float(ss) * 28.3495

    for n in detail.get("foodNutrients") or []:
        desc = _nutrient_derivation_lower(n)
        if "100 g" in desc or "100g" in desc:
            return 100.0

    dt = str(detail.get("dataType") or "")
    if any(x in dt for x in ("Foundation", "Survey", "SR Legacy")):
        return 100.0

    portions = detail.get("foodPortions") or []
    for portion in portions:
        if not isinstance(portion, dict):
            continue
        gw = portion.get("gramWeight")
        if isinstance(gw, (int, float)) and float(gw) > 0:
            return float(gw)

    return 100.0


def normalize_transcript(text: str) -> str:
    t = text.lower().replace("\u2019", "'").replace("\u2018", "'")
    t = re.sub(r"[^a-z0-9\s'/]", " ", t)
    return re.sub(r"\s+", " ", t).strip()


def split_phrases(text: str) -> list[str]:
    """
    Split into segments for USDA search. Must split on commas *before* normalize_transcript,
    which strips commas—otherwise 'A, B, C' becomes one undifferentiated phrase.
    """
    t = text.lower().replace("\u2019", "'").replace("\u2018", "'")
    rough = re.split(r"\b(?:and|with|plus|along|alongside)\b|,", t, flags=re.I)
    out: list[str] = []
    for p in rough:
        n = normalize_transcript(p)
        if n:
            out.append(n)
    return out


def parse_leading_count_and_food(seg: str) -> tuple[float, str]:
    """
    "3 green beans" -> (3.0, "green beans"); "chicken breast" -> (1.0, "chicken breast").
    """
    s = seg.strip()
    m = re.match(r"^(\d+(?:\.\d+)?)\s+(.+)$", s)
    if m:
        n = float(m.group(1))
        rest = m.group(2).strip()
        if n > 0 and len(rest) >= 2:
            return min(500.0, max(0.01, n)), rest
    return 1.0, s


def polish_food_search_query(food_fragment: str) -> str:
    """Strip leading article for a cleaner FDC search."""
    s = re.sub(r"^(a|an)\s+", "", food_fragment.strip(), flags=re.I).strip()
    return s if len(s) >= 2 else food_fragment.strip()


def search_first_scaled(
    api: USDAAPI,
    seg: str,
    *,
    servings: float | None = None,
    grams: float | None = None,
    display_name: str | None = None,
) -> tuple[dict[str, Any] | None, int | None, str | None]:
    """
    USDA search one phrase → first hit → detail → scaled MealItem dict.
    Leading counts (e.g. "3 green beans") become servings; FDC is queried without the number.
    Returns (item_or_none, fdc_id, skip_reason).
    """
    q = seg.strip()
    if len(q) < 2:
        return None, None, "query_too_short"

    auto_count, food_fragment = parse_leading_count_and_food(q)
    q_search = polish_food_search_query(food_fragment)
    if len(q_search) < 2:
        q_search = q

    eff_servings = float(servings) if servings is not None else auto_count

    try:
        data = api.search(q_search, page_size=10)
    except requests.exceptions.RequestException as e:
        return None, None, f"usda_search_error:{e}"

    if isinstance(data, dict) and data.get("error"):
        err = data["error"]
        if isinstance(err, dict):
            msg = str(err.get("message") or err.get("code") or err)
        else:
            msg = str(err)
        return None, None, f"usda_api_error:{msg}"

    foods = data.get("foods") if isinstance(data, dict) else None
    if not isinstance(foods, list) or not foods or not isinstance(foods[0], dict):
        return None, None, "no_search_hits"

    top = foods[0]
    fid = top.get("fdcId")
    if not isinstance(fid, int):
        return None, None, "missing_fdc_id"

    nm = (display_name or "").strip() or str(top.get("description") or seg).strip() or seg
    line = ExtractedLine(
        name=nm,
        usda_query=q_search,
        fdc_id=fid,
        servings=eff_servings,
        grams=grams,
        amount_text=amount_label(top),
    )
    item = scaled_item_for_line(api, line, fid)
    if not item:
        return None, fid, "zero_macros_or_detail_fetch_failed"
    return item, fid, None


def legacy_single_from_query(
    api: USDAAPI,
    query: str,
    *,
    servings: float | None = None,
    grams: float | None = None,
    display_name: str | None = None,
) -> tuple[dict[str, Any] | None, str | None]:
    """One USDA search phrase → one MealItem (or None, reason)."""
    item, _fid, reason = search_first_scaled(
        api,
        query,
        servings=servings,
        grams=grams,
        display_name=display_name,
    )
    return item, reason


def legacy_phrase_parse_with_trace(
    api: USDAAPI,
    raw: str,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """Like legacy_phrase_parse but also returns one trace dict per segment (for /meal-parse/debug)."""
    segments = split_phrases(raw)
    if not segments:
        n = normalize_transcript(raw)
        segments = [n] if n else []

    out: list[dict[str, Any]] = []
    trace_rows: list[dict[str, Any]] = []
    seen: set[int] = set()
    for seg in segments:
        item, fid, reason = search_first_scaled(api, seg)
        _auto, frag = parse_leading_count_and_food(seg.strip())
        q_used = polish_food_search_query(frag)
        if len(q_used) < 2:
            q_used = seg.strip()
        trace_rows.append(
            {
                "segment": seg,
                "fdc_id": fid,
                "reason": reason,
                "search_used": q_used,
                "item": item,
            },
        )
        if not item or fid is None:
            continue
        if fid in seen:
            trace_rows[-1]["skipped_duplicate_fdc"] = True
            continue
        seen.add(fid)
        out.append(item)

    if not out and raw.strip():
        item, fid, reason = search_first_scaled(api, raw.strip())
        trace_rows.append(
            {
                "segment": raw.strip(),
                "fdc_id": fid,
                "reason": reason,
                "search_used": raw.strip(),
                "item": item,
                "fallback_whole_transcript": True,
            },
        )
        if item:
            out.append(item)
    return out, trace_rows


def legacy_phrase_parse(api: USDAAPI, raw: str) -> list[dict[str, Any]]:
    """Heuristic phrase split + USDA search + one reference serving each (no LLM)."""
    items, _ = legacy_phrase_parse_with_trace(api, raw)
    return items


def resolve_fdc_id(api: USDAAPI, line: ExtractedLine) -> int | None:
    if line.fdc_id is not None and line.fdc_id > 0:
        try:
            api.search_by_id(int(line.fdc_id))
            return int(line.fdc_id)
        except (RuntimeError, OSError, TypeError, ValueError, requests.exceptions.RequestException):
            pass
    q = (line.usda_query or line.name or "").strip()
    if len(q) < 1:
        return None
    try:
        data = api.search(q, page_size=5)
    except requests.exceptions.RequestException:
        return None
    foods = data.get("foods") if isinstance(data, dict) else None
    if not isinstance(foods, list) or not foods:
        return None
    top = foods[0]
    if not isinstance(top, dict):
        return None
    fid = top.get("fdcId")
    return int(fid) if isinstance(fid, int) else None


def scaled_item_for_line(
    api: USDAAPI,
    line: ExtractedLine,
    fdc_id: int,
) -> dict[str, Any] | None:
    try:
        detail = api.search_by_id(fdc_id)
    except Exception:
        return None

    cal, p, cb, f = macros_for_scaling(detail)
    if cal == 0 and p == 0 and cb == 0 and f == 0:
        return None

    ref_g = reference_grams_for_macros(detail)
    if ref_g <= 0:
        ref_g = 100.0

    grams = line.grams
    if grams is not None and grams > 0:
        consumed_g = float(grams)
    else:
        consumed_g = max(0.01, float(line.servings)) * ref_g

    mult = consumed_g / ref_g
    if not math.isfinite(mult) or mult <= 0:
        mult = 1.0

    desc = str(detail.get("description") or line.name).strip() or line.name
    amt = line.amount_text.strip() if line.amount_text.strip() else amount_label(detail)

    return {
        "id": str(uuid.uuid4()),
        "name": line.name.strip() or desc,
        "amount": amt,
        "calories": round(cal * mult),
        "protein": round(p * mult),
        "carbs": round(cb * mult),
        "fat": round(f * mult),
        "fdcId": int(fdc_id),
        "nutritionSource": "usda",
    }
