"""Using OpenAI to turn a free-text meal transcript into structured foods + quantities."""

from __future__ import annotations

import json
import os
import re
from typing import Any

from openai import OpenAI
from pydantic import BaseModel, ConfigDict, Field, field_validator


class ExtractedLine(BaseModel):
    model_config = ConfigDict(extra="ignore")

    name: str = Field(description="Short display name for the log")
    usda_query: str = Field(description="Best USDA FDC search phrase (generic food, not brand, unless user named one)")
    fdc_id: int | None = Field(default=None, description="FDC ID only if user gave a code or you are certain; else null")
    servings: float = Field(default=1.0, description="How many FDC label servings (e.g. 2 eggs -> 2)")
    grams: float | None = Field(
        default=None,
        description="Explicit grams eaten if stated or clearly inferable; else null",
    )
    amount_text: str = Field(description="Human-readable portion, e.g. '2 large eggs' or '1 cup cooked rice'")

    @field_validator("fdc_id", mode="before")
    @classmethod
    def coerce_fdc(cls, v: object) -> int | None:
        if v is None or v == "":
            return None
        try:
            i = int(float(v))  # type: ignore[arg-type]
            return i if i > 0 else None
        except (TypeError, ValueError):
            return None

    @field_validator("grams", mode="before")
    @classmethod
    def coerce_grams(cls, v: object) -> float | None:
        if v is None or v == "":
            return None
        try:
            x = float(v)  # type: ignore[arg-type]
            return x if x > 0 else None
        except (TypeError, ValueError):
            return None

    @field_validator("servings", mode="before")
    @classmethod
    def coerce_servings(cls, v: object) -> float:
        if v is None or v == "":
            return 1.0
        try:
            x = float(v)  # type: ignore[arg-type]
            return max(0.01, min(500.0, x))
        except (TypeError, ValueError):
            return 1.0


class ExtractedMeal(BaseModel):
    items: list[ExtractedLine] = Field(default_factory=list)


_MEATISH_SUBSTR = (
    "salmon",
    "tuna",
    "chicken",
    "beef",
    "pork",
    "turkey",
    "steak",
    "bacon",
    "sausage",
    "cod",
    "tilapia",
    "halibut",
    "shrimp",
    "lamb",
    "fish",
    "fillet",
)


def _fix_tiny_grams_likely_meant_ounces(lines: list[ExtractedLine]) -> list[ExtractedLine]:
    """ASR often yields '3 grams of salmon' for '3 ounces'. Values 1–6 g for meat/fish are treated as ounces."""
    out: list[ExtractedLine] = []
    for line in lines:
        g = line.grams
        if g is None or g > 6.0:
            out.append(line)
            continue
        blob = f"{line.name} {line.usda_query}".lower()
        if not any(m in blob for m in _MEATISH_SUBSTR):
            out.append(line)
            continue
        oz = float(g)
        new_g = round(oz * 28.349523125, 1)
        note = "portion interpreted as oz (tiny g values for meat/fish are usually speech errors)"
        at = line.amount_text.strip()
        out.append(
            line.model_copy(
                update={
                    "grams": new_g,
                    "amount_text": f"{at} — {note}" if at else note,
                }
            )
        )
    return out


SYSTEM_PROMPT = """You parse meal descriptions into JSON for nutrition lookup. Missing a food the user said is a serious failure; guessing extra foods is also bad.

## Output
ONLY valid JSON: {"items":[...]} — no markdown, no commentary, no keys other than "items".

Each element must include: name, usda_query, fdc_id (number or null), servings (positive number), grams (number or null), amount_text.

## Workflow (do this before writing JSON)
1) Read the whole transcript once.
2) Mentally list EVERY distinct edible component: mains, sides, toppings, sauces, bread, cheese, eggs, produce, grains, legumes, dessert, and caloric drinks (juice, soda, latte, alcohol). Split on commas, "and", "with", "plus", "alongside", "on the side", "topped with", "as well as", new clauses.
3) For each component, decide portion (servings and/or grams). Defaults are only when the user gave no hint.
4) Emit one JSON object per component from step 2. If two components are clearly the same food repeated ("rice ... and more rice"), merge one row with summed servings.

## Splitting rules
- "X and Y", "X with Y", "X, Y, Z" → separate items unless X+Y is a fixed phrase for one dish the user clearly names as a single dish (e.g. "chicken tikka masala" as one curry) — still split rice/naan/salad if they appear.
- Do NOT drop vegetables, salad, fruit, bread, or sides because a protein was mentioned first.
- A "combo" or "plate" still lists each part the user named.
- Condiments with meaningful calories (mayo, ranch, butter, oil "drizzled") get their own row if the user mentioned them; tiny garnishes (sprinkle of parsley) can be omitted.

## Portions (liquids, soups, bowls)
Many canned soups use ~1 cup per Nutrition Facts row. Map explicit user volumes to servings/grams when possible. "Bowl" without size → ~1.5 cup-equivalent for soup/stew. Whole typical can → often ~2 cup-equivalents unless they say otherwise.

## Mass for meat and fish
If the user says a very small gram amount for meat or fish (for example "3 grams of salmon"), they almost always mean **ounces**, not literal grams—use grams field as **total grams** (e.g. 3 oz → ~85 g) or set grams null and use servings with a typical fillet size in amount_text.

## Field rules
- name: short UI label (e.g. "Grilled chicken", "Brown rice"). Never use long USDA catalog titles in name.
- usda_query: best FDC search phrase (generic unless they named a brand).
- fdc_id: null unless they gave a numeric FDC ID.
- servings, grams, amount_text: reflect what the user said; use the Portions section when they did not specify volume.

## Examples (copy the shape; do not copy these foods into unrelated transcripts)

Transcript: "grilled chicken, a cup of brown rice, and steamed broccoli"
{"items":[
  {"name":"Grilled chicken","usda_query":"chicken breast grilled","fdc_id":null,"servings":1,"grams":null,"amount_text":"Grilled chicken, typical portion"},
  {"name":"Brown rice","usda_query":"brown rice cooked","fdc_id":null,"servings":1,"grams":null,"amount_text":"1 cup cooked"},
  {"name":"Broccoli","usda_query":"broccoli steamed","fdc_id":null,"servings":1,"grams":null,"amount_text":"Steamed, side portion"}
]}

Transcript: "two eggs, bacon, and toast"
{"items":[
  {"name":"Eggs","usda_query":"egg whole cooked","fdc_id":null,"servings":2,"grams":null,"amount_text":"2 eggs"},
  {"name":"Bacon","usda_query":"bacon cooked","fdc_id":null,"servings":1,"grams":null,"amount_text":"Side portion"},
  {"name":"Toast","usda_query":"white bread toast","fdc_id":null,"servings":1,"grams":null,"amount_text":"1 slice or piece as stated"}
]}
"""


def _parse_json_object(raw: str) -> dict[str, Any]:
    raw = raw.strip()
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        m = re.search(r"\{[\s\S]*\}", raw)
        if not m:
            raise
        return json.loads(m.group(0))


def extract_meal_structured(transcript: str) -> list[ExtractedLine]:
    key = os.getenv("OPENAI_API_KEY", "").strip()
    if not key:
        raise RuntimeError("OPENAI_API_KEY is not set")

    model = os.getenv("MEAL_PARSE_OPENAI_MODEL", "gpt-4o-mini").strip()
    client = OpenAI(api_key=key)

    user_text = transcript.strip()
    completion = client.chat.completions.create(
        model=model,
        temperature=0.1,
        max_tokens=4096,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": (
                    "Transcript (extract every distinct food; do not omit sides or second dishes):\n\n"
                    f"{user_text}"
                ),
            },
        ],
    )
    content = completion.choices[0].message.content
    if not content:
        raise RuntimeError("Empty model response")

    data = _parse_json_object(content)
    meal = ExtractedMeal.model_validate(data)
    return _fix_tiny_grams_likely_meant_ounces(meal.items)
