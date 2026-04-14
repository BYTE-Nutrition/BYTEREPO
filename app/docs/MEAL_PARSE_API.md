# Meal parse API (OpenAI proxy)

The Byte app can call your server to turn a **voice transcript** into structured `MealItem` rows. Keep **OpenAI API keys only on the server**; the client uses `VITE_MEAL_PARSE_URL` (full URL to this endpoint, no secrets).

### API-only (strict) mode

Set **`VITE_MEAL_PARSE_STRICT`** to `1`, `true`, or `yes` in the app `.env` (then restart Vite). The client will **not** use the offline `nutrition.ts` keyword list: voice **Review** and meal detail **Add ingredient** require a working `VITE_MEAL_PARSE_URL` and a successful response with at least one item; otherwise the UI shows an error instead of silent fallback.

## Endpoint

- **Method:** `POST`
- **URL:** Whatever you set in `VITE_MEAL_PARSE_URL` (e.g. `https://api.example.com/meal-parse` or `http://localhost:5050/meal-parse` on the same host as [realtime-proxy](../../realtime-proxy))
- **Content-Type:** `application/json`
- **CORS:** Allow your web app origin.

## Request body

```json
{
  "transcript": "I had two eggs, toast, and coffee for breakfast"
}
```

| Field         | Type   | Required | Notes                          |
| ------------- | ------ | -------- | ------------------------------ |
| `transcript`  | string | yes      | User’s meal description        |

Recommended server-side limits: max transcript length (e.g. 4k chars), rate limiting, and authentication if the endpoint is public.

## Success response

**Status:** `200`

**Body:**

```json
{
  "items": [
    {
      "id": "optional-client-will-generate-if-missing",
      "name": "Eggs",
      "amount": "2 large",
      "calories": 140,
      "protein": 12,
      "carbs": 1,
      "fat": 10,
      "fdcId": 748967,
      "nutritionSource": "usda"
    }
  ]
}
```

### `items[]` shape (MealItem)

| Field       | Type   | Required | Notes                                      |
| ----------- | ------ | -------- | ------------------------------------------ |
| `id`        | string | no       | If omitted, the app assigns a UUID         |
| `name`      | string | yes      | Ingredient / line label                    |
| `amount`    | string | yes      | Human-readable portion                     |
| `calories`  | number | yes      | Integer kcal (rounded client-side)         |
| `protein`   | number | yes      | Grams (rounded client-side)                |
| `carbs`     | number | yes      | Grams                                      |
| `fat`       | number | yes      | Grams                                      |
| `fdcId`     | number | no       | USDA FoodData Central id when known      |
| `nutritionSource` | string | no   | `"usda"` or `"estimate"` when set          |

The client skips individual rows that are missing required fields; HTTP errors still fail the request. With **`VITE_MEAL_PARSE_STRICT`**, there is no local fallback.

When **`items` is an empty array** but the request succeeded, the server may include **`hint`**: a short human-readable reason (e.g. USDA rate limit / missing keys).

## Error responses

Any non-`200` response, network error, or timeout causes the client to **ignore** the API and use `parseMealFromTranscript` locally. You may still return JSON errors for logging:

```json
{ "error": "message" }
```

## OpenAI integration hints

1. Call a small chat model (e.g. GPT-4.1-mini / 4o-mini) with a system prompt: return **only** JSON matching `{ "items": MealItem[] }`.
2. Use **JSON mode** or **structured outputs** so the payload is valid JSON.
3. Validate and sanitize on the server before responding.

## Environment (Vite)

```bash
VITE_MEAL_PARSE_URL=https://your-host/meal-parse
```

If unset or the request fails, voice logging still works using the local heuristic parser.
