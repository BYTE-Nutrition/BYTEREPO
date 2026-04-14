import os
import sys

from usda_api import USDAAPI

API_KEY = os.getenv("USDA_API_KEY")
if not API_KEY:
    sys.exit("Set USDA_API_KEY in the environment before running this demo.")

API = USDAAPI(API_KEY)

res = API.search("chicken breast")
API.save_to_file(res, "chicken_breast_output.json")

res = API.search_by_id(2187885)
API.save_to_file(res, "chicken_breast_fdcid_output.json")
