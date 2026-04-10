# BYTEREPO

Monorepo for **Byte** (AI nutrition / voice meal logging) and related frontends.

## Project structure

| Directory | Purpose |
|-----------|---------|
| **`app/`** | Main Byte web app (React + Vite + TypeScript). Deploy this folder to **Vercel**. |
| **`realtime-proxy/`** | Node server: OpenAI **Realtime** SDP relay + **`/meal-parse`** (Chat Completions). Deploy to **Railway**, **Render**, **Fly.io**, or similar — **not** Vercel serverless unless you adapt it. |
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

Set **`OPENAI_API_KEY`** in the shell or in `realtime-proxy/.env` (load with your process manager; this repo does not auto-load `.env` in `index.mjs` unless you add `dotenv`).

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

Set in **Vercel** project settings (or `app/.env` locally). **Never** put `OPENAI_API_KEY` here; `VITE_*` is embedded in the browser bundle.

| Variable | Example (local) | Description |
|----------|-----------------|-------------|
| `VITE_REALTIME_SESSION_URL` | `/realtime/session` or `https://your-api.example.com/realtime/session` | POST endpoint for WebRTC SDP relay. |
| `VITE_MEAL_PARSE_URL` | `/meal-parse` or `https://your-api.example.com/meal-parse` | POST JSON `{ transcript }` → `{ items }`. |

Production: use **HTTPS** URLs pointing at your deployed **`realtime-proxy`**.

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

- **Frontend (`app/`)** → **Vercel** (pick one):
  - **Root directory = `app`:** build **`npm run build`**, output **`dist`**. **`app/vercel.json`** SPA rewrites fix refresh and **Add to Home Screen** deep links.
  - **Root directory = repo root:** use the root **`vercel.json`** (`installCommand` / `buildCommand` / `outputDirectory` + same rewrites).
- **Backend (`realtime-proxy/`)** → **Railway** or **Render**: run **`node index.mjs`** (or **`npm start`**), set **`OPENAI_API_KEY`** and **`PORT`**, expose a public URL, then set **`VITE_*`** on Vercel to that HTTPS base + paths.

## Scripts (repo root)

```bash
npm run dev:app       # vite dev in app/
npm run build:app     # production build in app/
```

Do **not** commit **`.env`**, **`.env.local`**, or **`realtime-proxy/.env`**. They are listed in the root **`.gitignore`**.
