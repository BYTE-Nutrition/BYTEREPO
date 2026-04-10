# Meal parse API (OpenAI proxy)

The Byte app can call your server to turn a **voice transcript** into structured `MealItem` rows. Keep **OpenAI API keys only on the server**; the client uses `VITE_MEAL_PARSE_URL` (full URL to this endpoint, no secrets).

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
      "fat": 10
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

The client validates this shape. Invalid JSON or wrong types → the app **falls back** to the built-in local parser.

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
