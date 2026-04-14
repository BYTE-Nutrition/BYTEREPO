import json
import os
from typing import Any

import requests


class USDAAPI:
    """USDA FoodData Central (FDC) v1 — same endpoints as `python-request-demo.py`."""

    def __init__(self, api_key: str | None) -> None:
        self.api_key = api_key

    def search(self, query: str, page_size: int = 10) -> dict[str, Any]:
        url = "https://api.nal.usda.gov/fdc/v1/foods/search"
        params = {
            "query": query,
            "api_key": self.api_key,
            "pageSize": page_size,
        }
        res = requests.get(url, params=params, timeout=20)
        res.raise_for_status()
        return res.json()

    def search_by_id(self, fdc_id: int) -> dict[str, Any]:
        url = f"https://api.nal.usda.gov/fdc/v1/food/{fdc_id}"
        params = {"api_key": self.api_key}
        res = requests.get(url, params=params, timeout=20)
        if res.status_code != 200:
            raise RuntimeError(f"API error: {res.status_code}")
        return res.json()

    def save_to_file(self, data: object, filename: str = "nutrition_output.json") -> None:
        with open(filename, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)


def api_from_env() -> USDAAPI:
    return USDAAPI(os.getenv("USDA_API_KEY"))
