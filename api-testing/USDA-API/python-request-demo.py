import os
import requests
import json

class USDAAPI:
    def __init__(self, api_key):
        self.api_key = api_key

    def search(self, query):
        url = "https://api.nal.usda.gov/fdc/v1/foods/search"
        params = {
            "query": query,
            "api_key": self.api_key
        }
        res = requests.get(url, params=params)
        return res.json()
    def search_by_id(self, fdc_id):
        url = f"https://api.nal.usda.gov/fdc/v1/food/{fdc_id}"
        
        params = {
            "api_key": API_KEY
        }

        res = requests.get(url, params=params)
        
        if res.status_code != 200:
            raise Exception(f"API error: {res.status_code}")

        return res.json()
    def save_to_file(self, data, filename="nutrition_output.json"):
        with open(filename, "w") as f:
            json.dump(data, f, indent=2)

API_KEY = os.getenv("USDA_API_KEY")
API = USDAAPI(API_KEY)

res = API.search("chicken breast")
API.save_to_file(res, "chicken_breast_output.json")

res = API.search_by_id(2187885)
API.save_to_file(res, "chicken_breast_fdcid_output.json")