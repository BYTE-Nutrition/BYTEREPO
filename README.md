# BYTEREPO

Monorepo for **Byte** (AI nutrition / voice meal logging) and its related frontends.

## Project structure

| Directory | Purpose |
|-----------|---------|
| **`app/`** | Main Byte web app (React + Vite + TypeScript). Deploy with **Netlify** (root `netlify.toml`, `base = app`). |
| **`netlify/functions/`** | **Netlify serverless:** `realtime-session` + `meal-parse`. Set **`OPENAI_API_KEY`** in Netlify site env. (The root **`api/`** folder mirrors the same handlers for other hosts if you need them.) |
| **`realtime-proxy/`** | Optional long-running Node server (SDP relay + meal-parse) for **local dev** or **Railway/Render** if you do not use Netlify functions. |
| **`website/`** | Separate marketing / site project (if used). |
| **`fifi-cursor-app/`** | Additional app / experiment. |

## Run locally

### 1. Backend (`realtime-proxy`)

```bash
cd realtime-proxy
cp .env.example .env   # add your real OPENAI_API_KEY in .env (never commit .env)
npm install
npm start
```

Default URL: **http://localhost:5050** (`PORT` is configurable).

Set **`OPENAI_API_KEY`** in the shell or in `realtime-proxy/.env` (`npm start` loads it via `dotenv`).

### 2. Frontend (`app`)

```bash
cd app
cp .env.example .env   # optional; see env vars below
npm install
npm run dev
```

Vite dev server proxies **`/realtime/session`** and **`/meal-parse`** to **`http://localhost:5050`** so you can use path-only URLs in `.env`.

## Environment variables

### `app/` (client — only non-secret URLs)

Set in **Netlify** site environment (or `app/.env.local` locally). **Never** put `OPENAI_API_KEY` in `VITE_*`; those values are embedded in the browser bundle.

| Variable | Example (local) | Description |
|----------|-----------------|-------------|
| `VITE_REALTIME_SESSION_URL` | `/realtime/session` or `https://your-api.example.com/realtime/session` | POST endpoint for WebRTC SDP relay. |
| `VITE_MEAL_PARSE_URL` | `/meal-parse` or `https://your-api.example.com/meal-parse` | POST JSON `{ transcript }` → `{ items }`. |

Production (**Netlify**): use path-only URLs **`/realtime/session`** and **`/meal-parse`** (rewrites in `app/public/_redirects` → `netlify/functions/`). Add **`OPENAI_API_KEY`** (and optional `OPENAI_MEAL_PARSE_MODEL`, `OPENAI_REALTIME_*`, `BYTE_REALTIME_INSTRUCTIONS`) under **Site configuration → Environment variables** so functions can call OpenAI.

Production (**external proxy**): use full **HTTPS** URLs pointing at **`realtime-proxy`** on Railway/Render/etc.

### `realtime-proxy/` (server — secrets only here)

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | **Required.** OpenAI API key; set on Railway/Render or in shell. |
| `PORT` | Optional; default `5050`. |
| `OPENAI_REALTIME_MODEL` | Optional; default `gpt-realtime-mini`. |
| `OPENAI_REALTIME_VOICE` | Optional; default `marin`. |
| `ALLOWED_ORIGINS` | Optional CORS allowlist (comma-separated). |

See **`realtime-proxy/.env.example`** and **`app/.env.example`**.

## Deployment

- **Netlify:** Link the GitHub repo; **`netlify.toml`** sets **`base = "app"`**, build **`npm ci && npm run build`**, publish **`dist`**. Functions live in **`netlify/functions/`**; **`app/public/_redirects`** maps **`/realtime/session`** and **`/meal-parse`** to them before the SPA fallback. **Step-by-step env + verification:** [`docs/NETLIFY_DEPLOY.md`](docs/NETLIFY_DEPLOY.md).
- **Backend only (`realtime-proxy/`)** → **Railway** or **Render** if you prefer not to use serverless: set **`OPENAI_API_KEY`**, expose HTTPS, then set **`VITE_REALTIME_SESSION_URL`** / **`VITE_MEAL_PARSE_URL`** to that host.

## Scripts (repo root)

```bash
npm run dev:app       # vite dev in app/
npm run build:app     # production build in app/
```

Do **not** commit **`.env`**, **`.env.local`**, or **`realtime-proxy/.env`**. They are listed in the root **`.gitignore`**.
