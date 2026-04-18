# Netlify: voice (OpenAI Realtime) + meal parse + Render (USDA)

Voice and meal parsing use **different** backends. **Render** is only for the optional **USDA** Python API; **OpenAI live voice** uses **Netlify Functions** in this repo (no Render required for voice).

## 1. Netlify environment variables (checklist)

In **Netlify** → your site → **Site configuration** → **Environment variables**:

### Required for OpenAI **live voice** (Realtime)

| Variable | Scopes | Value |
|----------|--------|--------|
| **`OPENAI_API_KEY`** | All (or at least **Functions** + any scope Netlify uses for serverless) | Your OpenAI secret key |

Without this, `/.netlify/functions/realtime-session` cannot call OpenAI.

### Required for the **browser build** (Vite embeds these)

Set for **Production** (and **Preview** if you use branch deploys). After changing, **trigger a new deploy** so Vite bakes them in.

| Variable | Example | Description |
|----------|---------|-------------|
| **`VITE_REALTIME_SESSION_URL`** | `/realtime/session` | Same-origin path; [`app/public/_redirects`](../app/public/_redirects) sends it to `realtime-session` function. |
| **`VITE_MEAL_PARSE_URL`** | `/meal-parse` **or** full Render URL (below) | Same-origin `/meal-parse` → Netlify **OpenAI-only** function. Full `https://…onrender.com/meal-parse` → **USDA** service on Render. |
| **`VITE_SUPABASE_URL`** | `https://….supabase.co` | Auth + cloud sync |
| **`VITE_SUPABASE_ANON_KEY`** | `sb_publishable_…` | Supabase anon key |

Optional: `VITE_POSTHOG_KEY`, `VITE_MEAL_PARSE_STRICT`, `OPENAI_REALTIME_MODEL`, `OPENAI_REALTIME_VOICE`, `OPENAI_MEAL_PARSE_MODEL`, `BYTE_REALTIME_INSTRUCTIONS` (function env; same screen).

**Redeploy** after any change to `VITE_*` or `OPENAI_API_KEY`.

---

## 2. Verify Realtime relay (DevTools)

1. Open your **production** Netlify URL, sign in, go to **Voice**, start **live coach** (Realtime).
2. **DevTools** → **Network** → find **`realtime`** or the request whose URL ends with **`/realtime/session`** (method **POST**).
3. **Success:** Response **Content-Type** is **`application/sdp`** (SDP answer). Status **200**.
4. **Wrong:** Response is **HTML** (often `text/html`) — SPA fallback is winning; confirm deploy includes [`app/public/_redirects`](../app/public/_redirects) and [`netlify/functions/realtime-session.mjs`](../netlify/functions/realtime-session.mjs).
5. **Wrong:** **401/500** — open **Netlify** → **Functions** → **realtime-session** logs; confirm **`OPENAI_API_KEY`** is set for the environment that served that deploy.

---

## 3. USDA meal parse on **Render** (optional)

If the Python service is deployed (e.g. `https://byterepo.onrender.com`):

1. **Netlify** build env:  
   **`VITE_MEAL_PARSE_URL=https://byterepo.onrender.com/meal-parse`**  
   (replace host with your real Render web service URL.)

2. **Render** → service → **Environment**:  
   **`MEAL_PARSE_CORS_ORIGINS`** = your Netlify origin(s), e.g.  
   `https://your-site.netlify.app`  
   (comma-separated if multiple; required so the browser may call Render from the Netlify app.)

3. Redeploy **Netlify** after changing `VITE_MEAL_PARSE_URL`.

**Render** `OPENAI_API_KEY` / `USDA_API_KEY` apply only to the **Python** meal-parse app, not to Netlify voice functions.

---

## Architecture (short)

- **Voice:** Browser → `POST /realtime/session` (same host) → Netlify function → OpenAI Realtime.
- **Meal parse (Netlify default):** `POST /meal-parse` → Netlify function → OpenAI Chat Completions.
- **Meal parse (USDA):** `VITE_MEAL_PARSE_URL` → full Render URL → FastAPI on Render.

They are separate; connecting parsed items into the live coach is optional app logic, not something Render does automatically.
