# CODEBASE.md

A tour of the **BYTEREPO** monorepo for a developer who knows React/Next.js but has never opened this project before.

---

## 1. PROJECT OVERVIEW

**Byte** is an AI-powered nutrition / meal logging web app: a user taps a mic, describes what they're cooking (e.g. *"grilled salmon with rice and greens"*), and an OpenAI Realtime voice agent converses with them while a separate pipeline parses the same transcript into line items with calories/macros — preferably from the USDA FoodData Central database. Meals are saved per day/slot (breakfast/lunch/snack/dinner), totals roll up on a Home dashboard, and state syncs to Supabase when the user signs in with Google.

The repo is a loose "workspace" (not Yarn/Turbo workspaces) that contains the main React/Vite web app (`app/`), three interchangeable backends for the two server endpoints it needs (`api/`, `netlify/functions/`, `realtime-proxy/`), a Python USDA service (`api-testing/USDA-API/`), a separate marketing site (`website/`), an unused Expo/React-Native experiment at the root, and an `fifi-cursor-app/` scratch project.

---

## 2. FOLDER STRUCTURE

### Root

| Path | What it does |
|------|---|
| `App.tsx` | Stub Expo/React-Native screen — only consumed by the root `package.json`'s `expo` dependency; **not** used by the Byte web app. |
| `app.json`, `babel.config.js` | Expo config for that stub root app. |
| `package.json` (root) | Workspace proxy: `dev:app`, `build:app`, `dev:website`, `dev:fifi`. Also pulls in `expo`, `react-native-web` for the Expo stub. |
| `README.md` | Human-facing monorepo/deploy guide. |
| `netlify.toml` | Builds `app/` on Netlify and registers `../netlify/functions` as the functions dir. |
| `render.yaml` | Render blueprint that deploys `api-testing/USDA-API/` as a Python FastAPI service. |
| `vercel.json` | Alternative deploy: builds `app/` and serves `api/*.js` as Vercel Functions. |
| `test.txt` | Empty placeholder, ignorable. |
| `supreme-cursor-app/` | Empty scratch dir. |

### `app/` — the main React + Vite + TypeScript web app

| Path | What it does |
|------|---|
| `app/index.html` | Vite entry; mounts `#root`. |
| `app/vite.config.ts` | Configures the `@/` alias, Tailwind v4 plugin, and a dev proxy that forwards `/realtime/session` and `/meal-parse` to `http://localhost:5050` (the `realtime-proxy`). Optional `/meal-parse-usda` → `$VITE_MEAL_PARSE_USDA_TARGET` rewrite so Vite can proxy Render's USDA service without browser CORS in dev. |
| `app/public/_redirects` | Netlify path-based routing: `/realtime/session` and `/meal-parse` → `/.netlify/functions/*`, then SPA fallback. |
| `app/public/favicon.svg`, `apple-touch-icon.jpg`, `icons.svg`, `manifest.webmanifest` | PWA / icon assets. |
| `app/dist/` | Built output (committed — unusual; probably shouldn't be). |
| `app/docs/MEAL_PARSE_API.md`, `REALTIME_SESSION_API.md` | Contracts for the two backend endpoints. |
| `app/.env.example`, `.env.local` | Example / local env for the Vite client. |

#### `app/src/`

| Path | What it does |
|------|---|
| `main.tsx` | Mounts `<App />` with `StrictMode`, imports global CSS. |
| `App.tsx` | Wraps everything in `AuthProvider → ByteProvider → BrowserRouter → VoiceEntryProvider → Layout` and defines all routes (`/`, `/signin`, `/onboarding`, `/home`, `/voice`, `/progress`, `/meals`, `/meals/:slot`, `/profile`). |
| `index.css`, `styles/noir.css` | Tailwind v4 base + the "Byte Noir" theme (dark palette, serifs, rings, wave bars). |
| `vite-env.d.ts` | Vite env-var types. |

**`app/src/pages/`** — one per route

| File | What it does |
|------|---|
| `LandingPage.tsx` | Splash that routes to `/signin`, `/onboarding`, or `/home` when the animation finishes. |
| `SignInPage.tsx` | Google OAuth button via Supabase. |
| `OnboardingPage.tsx` | 11-step intake (name, age, sex, height/weight, cooks/week, goal, pace, dietary restriction, notes) → calls `completeOnboarding` and computes macro goals. |
| `HomePage.tsx` | Daily dashboard: greeting, big mic orb → `/voice?capture=1`, remaining kcal, protein/carbs/fat rings, meal list, hydration (water glasses). |
| `VoicePage.tsx` | The meal-capture screen. Two modes: immersive Realtime UI (`?capture=1`) or a classic mic-toggle + textarea + Review flow. Owns all the voice/meal-parse orchestration. |
| `ProgressPage.tsx` | 7-day rolling calorie/streak view. |
| `MealsPage.tsx` | Today's four slots; empty slots open `/voice`. |
| `MealDetailPage.tsx` | Per-slot meal editor: add, edit, delete line items (uses `parseMealWithApi` to add an ingredient from free text). |
| `ProfilePage.tsx` | Name/age/sex/height/weight/goal/dietary editing; manual goal overrides; Reset to Demo / Clear All Data. |

**`app/src/context/`** — React context providers

| File | What it does |
|------|---|
| `AuthContext.tsx` | Wraps Supabase auth. Exposes `{ session, user, loading, signInWithGoogle, signOut }` and identifies users in PostHog on sign-in. |
| `ByteContext.tsx` | The big stateful provider: loads `AppState` from `localStorage`, pulls from Supabase when a user signs in, writes back locally on every change and to cloud on a 1.5s debounce. Exposes `logMeal`, `updateMealItems`, `addMealItem`, `removeMealItem`, `setWaterGlasses`, `updateProfile`, `completeOnboarding`, etc. |
| `byte-context.ts` | Just declares `ByteContext` + the `ByteContextValue` type, so `useByte` can import without pulling in the provider. |
| `useByte.ts` | `useContext(ByteContext)` helper that throws if used outside the provider. |
| `VoiceEntryContext.tsx` | Holds a pre-obtained `MediaStream` so tapping the mic button and navigating to `/voice` doesn't require a second `getUserMedia` permission prompt. `primeMic()` on tap, `takePrimedStream()` inside the Realtime hook, `releasePrimedMic()` on cancel. |

**`app/src/hooks/`**

| File | What it does |
|------|---|
| `useOpenAiRealtimeVoice.ts` | **The core voice hook.** Opens an `RTCPeerConnection` with a mic track and an `oai-events` data channel, POSTs the SDP offer to your `VITE_REALTIME_SESSION_URL`, accepts the answer, then parses incoming `response.*` / `conversation.item.input_audio_transcription.*` events to build `conversationMessages`, `userTranscript`, and `assistantSpeaking`. Pushes `session.update` with live meal context (see `realtimeMealContext`) whenever parsed items change. |
| `useSpeechRecognition.ts` | Fallback browser-native `SpeechRecognition` (`webkit` prefix on Safari). Used by the non-immersive classic mic on `VoicePage` and as a fallback textarea editor. |
| `useMicLevel.ts` | Audio level (RMS) 0–1 via `AudioContext` + `AnalyserNode`. Can reuse a shared `MediaStream` to avoid a second mic prompt. |

**`app/src/components/`**

| File | What it does |
|------|---|
| `Layout.tsx` | The app shell: routing guards (redirect to `/signin` if no session, to `/onboarding` if incomplete), centered "phone frame" on desktop, mounts `BottomNav` when not on landing/signin/onboarding/voice. |
| `BottomNav.tsx` | Rounded bottom tab bar (Home / Meals / Voice / Rhythm / Profile). The voice tab is a primary floating button that calls `primeMic()` then navigates to `/voice?capture=1`. |
| `AppScreenHeader.tsx` | Generic screen header (back button, eyebrow, title, subtitle). |
| `HomeMenuDrawer.tsx` | Slide-out right drawer linking to Profile / Rhythm / Meals. |
| `VoiceImmersiveCapture.tsx` | Full-screen dark voice UI: animated orb, mic button, chat transcript, "Composing" live items card, cooking tips, Cancel / Review CTA. |
| `ByteLogo.tsx` | SVG wordmark. |
| `noir/NoirPrimitives.tsx` | Themed primitives: `NoirStatusBar`, `NoirByteMark`, `NoirRollover` (animated number), `NoirMealSlotRail`. |
| `noir/SplashScreen.tsx` | Landing splash animation. |
| `ui/ring-progress.tsx` | Circular macro progress ring. |
| `ui/utils.ts` | `cn()` helper (`clsx` + `tailwind-merge`). |

**`app/src/lib/`** — pure logic, no React

| File | What it does |
|------|---|
| `types.ts` | All core types: `MealItem`, `MealLog`, `DayData`, `Goals`, `UserProfile`, `MealSlot`, `AppState`, plus `MEAL_ORDER` and `MEAL_LABELS`. |
| `storage.ts` | `loadState` / `saveState` → `localStorage['byte-app-v1']` with schema migration; `loadStateFromCloud` / `saveStateToCloud` → Supabase `user_states` table; `createFreshOnboardingState`, `createInitialState` (demo data), `emptyDay`. |
| `supabase.ts` | Creates and exports the `supabase` client from `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (throws if either is missing). |
| `analytics.ts` | Thin PostHog wrapper (`identify`, `reset`, `track`); no-ops if `VITE_POSTHOG_KEY` isn't set. |
| `aggregate.ts` | `totalsFromMealItems(items)` and `dayNutritionTotals(day)` — single source of truth for sums. |
| `goalsFromProfile.ts` | Mifflin–St Jeor BMR × activity factor (from `cooksPerWeek`) → TDEE, then applies goal-type delta (weight_loss / muscle_gain / …) and pace (gradual/steady/ambitious), and derives protein/carb/fat grams. Also exports `USER_GOAL_OPTIONS` and `GOAL_PACE_OPTIONS`. |
| `dates.ts` | Local-timezone date keys (`YYYY-MM-DD`), `todayKey`, `rollingWeekKeys`, `planWeekNumber`, `formatRange`. |
| `nutrition.ts` | **Offline** keyword-based meal parser. A hardcoded `FOODS` list (~40 items) with lowercase `keys`; `parseMealFromTranscript` splits the text on *and/with/plus/comma*, greedily matches the longest key per segment, and falls back to a generic estimate. Also exports `QUICK_SUGGESTIONS`. |
| `mealParseApi.ts` | The HTTP client for `VITE_MEAL_PARSE_URL`. `parseMealWithApi(transcript)` POSTs JSON with a 12 s abort; `parseMealTranscriptBestEffort(transcript)` returns API items if non-empty, else falls back to `parseMealFromTranscript` (unless `VITE_MEAL_PARSE_STRICT` is set). `isMealParseStrict()` and `getMealParseUrl()` are used by the UI to explain errors. |
| `realtimeMealContext.ts` | Builds the structured text block that the frontend pushes into the Realtime session's `instructions` every time parsed items change (so the voice agent can answer "is this too much?" using the same numbers as the UI). Also exports `mealItemsHaveUsdaBacking(items)` and `mealParsePipelineConfigured()`. |
| `realtimeCoachBase.ts` | Default persona / system prompt for the Realtime coach (kept in sync with the server's `DEFAULT_BYTE_INSTRUCTIONS` fallback). |
| `cookingTips.ts` | Regex → tip mapping driven by the current transcript + parsed items (used for the "Tips" card in the immersive UI). |
| `voiceTranscript.ts` | Tiny type: `VoiceTranscriptMessage = { id, role, text, createdAt, status }`. |

**`app/src/assets/`** — PNGs/SVGs (`byte-logo.jpg`, `hero.png`, `react.svg`, `vite.svg`).
**`app/src/types/speech.d.ts`** — global types for `SpeechRecognition` / `webkitSpeechRecognition`.

### Three parallel backends for the same two endpoints

These exist because the deploy target is configurable (Netlify vs Vercel vs Render/Railway). All three implement the same `POST /realtime/session` (SDP relay) and `POST /meal-parse` (transcript → items) contracts.

| Path | What it does |
|------|---|
| `realtime-proxy/index.mjs` | Long-running Node/Express server (default port `5050`) — used for **local dev** via the Vite proxy. Reads `OPENAI_API_KEY` from `realtime-proxy/.env`. `POST /realtime/session` forwards the browser's SDP offer to `https://api.openai.com/v1/realtime/calls` with an `X-Byte-Goals`-aware instructions block. |
| `realtime-proxy/meal-parse.mjs` | `registerMealParse(app, getApiKey)` — `POST /meal-parse` → OpenAI `gpt-4o-mini` Chat Completions with a JSON-mode prompt that returns `{ items: MealItem[] }`. |
| `realtime-proxy/package.json`, `.env.example`, `.gitignore` | Standalone Node app config. |
| `netlify/functions/realtime-session.mjs` | Same SDP relay as above, but as a Netlify Function (event-based handler). |
| `netlify/functions/meal-parse.mjs` | Same `gpt-4o-mini` meal parser, as a Netlify Function. |
| `api/realtime/session.js` | Same SDP relay, as a Vercel-style function (CommonJS `module.exports` with `bodyParser: false`). |
| `api/meal-parse.js` | Same `gpt-4o-mini` parser, as a Vercel function. |
| `api/test.js` | Throwaway `{ ok: true }` endpoint. |
| `api/package.json` | Minimal `{ }`. |

### `api-testing/USDA-API/` — the "real" (Python) meal parser

This is the **USDA-backed** meal-parse service; when `VITE_MEAL_PARSE_URL` points here, line items carry real `fdcId`s from USDA FoodData Central. Deployable on Render via `render.yaml`; can also be run locally via `npm run meal-parse` in `app/` (which starts uvicorn on port `8787`).

| File | What it does |
|------|---|
| `meal_parse_server.py` | FastAPI app: `POST /meal-parse` accepts `{transcript}`, calls OpenAI to extract structured `ExtractedLine[]`, resolves each line to a USDA `fdcId`, scales macros to the stated portion, falls back to legacy phrase matching if OpenAI is unconfigured or fails. Also `POST /meal-parse/debug` (behind `MEAL_PARSE_DEBUG=1`) returns the full trace. |
| `openai_extract.py` | `ExtractedLine` Pydantic schema and the OpenAI structured-output call that produces it. |
| `fdc_nutrition.py` | Core USDA helpers: `resolve_fdc_id`, `scaled_item_for_line` (label nutrients, then `foodNutrients` fallback), `legacy_phrase_parse`, `legacy_single_from_query`, `split_phrases`. |
| `usda_api.py` | Tiny wrapper around `api.nal.usda.gov/fdc/v1/foods/search` and `/food/{fdcId}`. |
| `python-request-demo.py` | One-off scratch demo. |
| `requirements.txt`, `dev.env` | Python deps and shell-loaded dev env. |

### Everything else

| Path | What it does |
|------|---|
| `docs/NETLIFY_DEPLOY.md` | Step-by-step Netlify setup + env-var verification guide. |
| `mockups/noir/` | Designer mockups. |
| `website/` | **Separate** marketing site (shadcn-based, its own `vite.config.ts` and `package.json`). Not part of the Byte app. |
| `fifi-cursor-app/` | Another standalone Vite/React experiment. |

---

## 3. KEY CONCEPTS

1. **Three endpoints, three backends, one URL contract.** The frontend only knows `VITE_REALTIME_SESSION_URL` and `VITE_MEAL_PARSE_URL`. Whether those resolve to the local Express server, Netlify Functions, Vercel Functions, or the Python FastAPI on Render is a deploy choice — the client code never changes. **Crucially**, only the Python backend is USDA-backed; the Node/Netlify/Vercel meal-parsers just ask `gpt-4o-mini` for nutrition numbers (so `fdcId` will be undefined on those rows).

2. **OpenAI Realtime is a direct WebRTC connection, not a proxy.** `useOpenAiRealtimeVoice` opens a peer connection *in the browser*, sends its SDP offer to `/realtime/session` on your server, and your server only relays that SDP to OpenAI and returns the answer. Audio and the `oai-events` data channel then flow **browser ↔ OpenAI directly**. Your server never sees the audio bytes or the transcript.

3. **The Realtime agent and the USDA parser are two independent pipelines that run on the same transcript.** The voice agent's job is conversation/coaching; it deliberately does **not** compute calories. A separate `parseMealTranscriptBestEffort` call hits `/meal-parse`, and whatever it returns is pushed back into the Realtime session via `session.update` so the voice agent can reference "structured meal estimates" without inventing numbers.

4. **`VoiceEntryContext` exists to survive one audio prompt.** Browsers require a user gesture for `getUserMedia`. The mic button on `HomePage`/`BottomNav` calls `primeMic()` synchronously in the click handler, and `useOpenAiRealtimeVoice.connect` later calls `takePrimedStream()`. Without this, the user would see two permission prompts (once for the level meter, once for WebRTC) or a second tap would be required after navigation.

5. **`ByteContext` is the app's state machine.** It loads `AppState` from `localStorage` on mount, hydrates from Supabase after sign-in, persists locally on every mutation and to Supabase on a 1.5s debounce. `state.days` is keyed by `YYYY-MM-DD` (local TZ); every meal/slot write goes through `logMeal`/`updateMealItems`/`addMealItem`/`removeMealItem` which always re-totals via `totalsFromMealItems` so meal-level macros never drift from their items.

6. **Two layers of fallback in meal parsing.** (a) `parseMealTranscriptBestEffort` tries `/meal-parse`; if it fails or returns `[]` and the app is not in strict mode, it falls back to `parseMealFromTranscript` (the local `FOODS` keyword list). (b) Inside the Python server, if the OpenAI extraction step fails or no USDA lookup succeeds, it falls back to `legacy_phrase_parse` — a server-side keyword search. The UI distinguishes these: rows with `fdcId` show "USDA FoodData Central · reference #…"; rows without it show a warning banner.

7. **Goals (kcal + macros) are derived, not entered.** `computeGoalsFromProfile` does Mifflin–St Jeor → TDEE (via a `cooksPerWeek`-indexed activity factor) → goal-type delta and pace → protein/fat/carb split. It runs automatically when the relevant profile fields change, but `ProfilePage` also lets the user override the derived numbers manually.

8. **Auth gate + onboarding gate live in `Layout.tsx`.** One effect redirects to `/signin` when the session is `null`; a second redirects to `/onboarding` when `state.onboardingComplete === false`. Both allow `/` so the splash can run.

9. **The "immersive" voice page and the "classic" voice page are the same route.** `/voice?capture=1` (or `state.immersive === true`) renders `VoiceImmersiveCapture` over the top. The classic view (plain mic orb + textarea + Suggestions) is what you see at `/voice?slot=lunch` from the meal list.

10. **Desktop uses a faux phone frame.** `Layout.tsx` wraps the whole app in a `md:w-[390px] md:rounded-[2.75rem]` container so the mobile-first UI looks intentional on a laptop screen. The dark theme is the "Byte Noir" palette defined in `app/src/styles/noir.css`.

---

## 4. DATA FLOW — user speaks → UI updates

The numbered files/functions below are the ones that actually run; skipping `main.tsx` / routing.

1. **Tap the floating mic tab** in `components/BottomNav.tsx`. Handler calls `VoiceEntryContext.primeMic()` → `navigator.mediaDevices.getUserMedia({audio:true})` → stores the stream in a ref, then `navigate('/voice?capture=1', { state: { autoStartVoice: true } })`.
2. **`VoicePage`** (`pages/VoicePage.tsx`) mounts and detects `showImmersive=true` from the query string, then in a `useLayoutEffect` calls `beginImmersiveListening()` via `queueMicrotask` (so the autoStart only fires once).
3. **`beginImmersiveListening`** calls `realtime.connect()` on the `useOpenAiRealtimeVoice` hook.
4. **`useOpenAiRealtimeVoice.connect`** (`hooks/useOpenAiRealtimeVoice.ts`):
   - Creates `RTCPeerConnection` with a public STUN server.
   - Hooks `pc.ontrack` to attach the remote audio to `<audio ref={realtimeAudioRef}>`.
   - Takes the primed `MediaStream` from `VoiceEntryContext` (or calls `getUserMedia` again).
   - `pc.addTrack(micTrack, stream)` and `pc.createDataChannel('oai-events')`.
   - `pc.createOffer()` → `setLocalDescription` → `POST offer.sdp` to `VITE_REALTIME_SESSION_URL` with `X-Byte-Goals` header (the user's daily kcal/macro targets as text).
5. **Your SDP relay** (one of `realtime-proxy/index.mjs`, `netlify/functions/realtime-session.mjs`, or `api/realtime/session.js`) wraps the SDP in a `multipart/form-data` body along with a JSON `session` config (`type: realtime`, model `gpt-realtime-mini`, instructions = `BYTE_REALTIME_INSTRUCTIONS` + goals header, input transcription model `gpt-4o-mini-transcribe`, output voice `marin`) and `POST`s to `https://api.openai.com/v1/realtime/calls`. OpenAI returns an SDP answer, which the relay forwards back as `application/sdp`.
6. **`connect` receives the SDP answer**, calls `pc.setRemoteDescription({type:'answer',sdp})`, sets status `'live'`. On `dc.open`, pushes the **initial** assistant instructions (`BYTE_REALTIME_COACH_BASE` + the meal-context block from `realtimeMealContext.buildAssistantMealContextFromLive`).
7. **User speaks.** Their audio flows directly over WebRTC to OpenAI (your server is not in the audio path anymore). OpenAI streams events back over the `oai-events` data channel as JSON.
8. **`handleDataMessage`** parses each event. The two most important families:
   - `conversation.item.input_audio_transcription.delta` / `.completed` → updates `userTranscript` and the streaming user bubble in `conversationMessages`. On `.completed`, pushes a **fresh** `session.update` with the latest meal-context block (so later assistant turns see updated USDA numbers).
   - `response.output_audio_transcript.delta` / `.done` (and the text-channel variants) → appends to the streaming assistant bubble and clears `assistantSpeaking` on `response.done`.
9. **Parallel, debounced USDA parse.** A `useEffect` in `VoicePage` watches `transcriptForDisplay` and every 500 ms calls `parseMealTranscriptBestEffort(text)` (`lib/mealParseApi.ts`). This `POST`s `{transcript}` to `VITE_MEAL_PARSE_URL`. The response `{items: MealItem[]}` lands in `liveItems` state.
10. **`liveItems` is passed as `mealLiveItems` into `useOpenAiRealtimeVoice`.** The hook's `useMemo` recomputes `assistantInstructions`, and a 450 ms-debounced `useEffect` pushes a new `session.update` over the data channel so the agent's next spoken reply grounds in the same numbers the UI shows.
11. **UI renders.**
    - `VoiceImmersiveCapture` renders each `conversationMessages` turn (user right/white, assistant left/dark), an animated orb scaled by `useMicLevel` → `audioLevel`, the "Composing" card with `liveItems` + total kcal, and `cookingTips` derived from `lib/cookingTips.ts`.
    - Remote model audio plays automatically via the hidden `<audio>` element.
12. **Tap "Review"** → `handleAnalyze`:
    - Disconnects the Realtime session (releases the mic).
    - Calls `parseMealWithApi(text)` one more time (not `bestEffort` — the user has committed). If the returned array is empty and the server provided a `hint`, surface it; if the app is in strict mode and the request failed, refuse to fall back.
    - Otherwise sets `previewItems`, `previewSource = 'api' | 'local'`, advances to `step='confirm'`.
13. **Tap "Plate it · save to log"** → `handleConfirmLog` → `ByteContext.logMeal(slot, { items, calories, protein, carbs, fat, voiceTranscript, … })`.
14. **`ByteContext.logMeal`** `structuredClone`s state, calls `ensureDay(tk)`, runs `totalsFromMealItems` to authoritatively compute kcal/macros, writes `day.meals[slot]`, sets state.
15. **`ByteContext`'s persistence effect** runs: `saveState` writes to `localStorage['byte-app-v1']` synchronously; if a user is signed in, `saveStateToCloud(user.id, state)` is scheduled on a 1.5s debounce and `upsert`s into Supabase `user_states`.
16. **Navigate to `/home`**, which reads `day`, `goals`, and `dayNutritionTotals(day)` from `ByteContext` and re-renders the remaining-kcal, macro rings, and meal list rows.

---

## 5. VOICE FLOW (microphone → audio playback → text log)

```
┌─────────────────────────────┐
│ BottomNav primary button    │  user taps
│   → primeMic()              │  ── getUserMedia (one permission prompt)
│   → navigate('/voice?…',    │
│       state:{autoStartVoice})│
└──────────────┬──────────────┘
               ▼
┌─────────────────────────────┐
│ VoicePage useLayoutEffect   │  on mount, if autoStartVoice
│   → beginImmersiveListening │
│   → realtime.connect()      │
└──────────────┬──────────────┘
               ▼
┌───────────────────────────────────────────────────────────┐
│ useOpenAiRealtimeVoice.connect                            │
│   1. new RTCPeerConnection({stun:google})                 │
│   2. takePrimedStream() || getUserMedia()                 │
│      → pc.addTrack(micTrack)                              │
│   3. pc.createDataChannel('oai-events')                   │
│   4. createOffer → setLocalDescription                    │
│   5. POST offer.sdp                                       │
│      to VITE_REALTIME_SESSION_URL                         │
│      with header X-Byte-Goals: "…kcal, …g protein, …"     │
└──────────────┬────────────────────────────────────────────┘
               ▼
┌──────────────────────────────────────────────────────────────┐
│ SDP relay (index.mjs / realtime-session.mjs / session.js):   │
│   multipart form { sdp, session JSON(model,voice,tools…)}    │
│   → POST https://api.openai.com/v1/realtime/calls            │
│   → receives SDP answer                                      │
│   → returns it verbatim as application/sdp                   │
└──────────────┬───────────────────────────────────────────────┘
               ▼
┌─────────────────────────────┐
│ connect (cont'd):           │
│   6. setRemoteDescription   │
│   7. on dc.open:            │
│      pushSessionInstructions│  ← BYTE_REALTIME_COACH_BASE
│                                + meal-context block
└──────────────┬──────────────┘
               ▼
 ╔═══════════════════════════════════════════════════════════╗
 ║  AFTER SDP HANDSHAKE: audio flows BROWSER ↔ OPENAI        ║
 ║  DIRECTLY over WebRTC. Your server is no longer involved. ║
 ╚══════════════╤════════════════════════════════════════════╝
                │
   mic track ───┼──▶ OpenAI Realtime model
                │      (transcription: gpt-4o-mini-transcribe,
                │       voice: marin)
                │
   ◀────────────┤ remote audio track → <audio ref={realtimeAudioRef}> autoplay
                │
   ◀────────────┤ JSON events on 'oai-events' data channel
                │
                ▼
┌──────────────────────────────────────────────────────────────┐
│ handleDataMessage(raw)                                       │
│                                                              │
│  type = conversation.item.input_audio_transcription.delta    │
│    → segmentUserRef += delta                                 │
│    → setUserTranscript(committed + segment)                  │
│    → append/extend "user / streaming" message                │
│                                                              │
│  type = …transcription.completed                             │
│    → commit segment to committedUserRef                      │
│    → finalize user bubble                                    │
│    → pushSessionInstructions(latest meal context)            │
│                                                              │
│  type = response.created                                     │
│    → assistantSpeaking=true; open assistant streaming bubble │
│                                                              │
│  type = response.output_audio_transcript.delta               │
│    → append delta to assistant streaming bubble              │
│                                                              │
│  type = response.output_audio_transcript.done                │
│    → finalize assistant bubble                               │
│                                                              │
│  type = response.done                                        │
│    → assistantSpeaking=false                                 │
└──────────────────────────────────────────────────────────────┘
                │
                ▼
┌──────────────────────────────┐       ┌─────────────────────────────────┐
│ VoiceImmersiveCapture renders│       │ useMicLevel(localStream)         │
│   messages[] as chat bubbles │       │  → audioLevel (0..1)             │
│   liveItems[] as "Composing" │       │  → orb scale/ring opacity        │
└──────────────────────────────┘       └─────────────────────────────────┘
                │
                ▼
        user taps Review → disconnect() stops mic track,
        closes PeerConnection, sets srcObject=null on audio element.
```

Fallbacks worth knowing:
- If `VITE_REALTIME_SESSION_URL` isn't set, the immersive UI shows `VOICE_UNAVAILABLE_MSG` and the mic orb is disabled.
- Outside the immersive flow, `useSpeechRecognition` (native Web Speech API) is used instead — that's why `VoicePage` also keeps a `speech.setTranscriptManual(...)` call in sync after leaving immersive mode.

---

## 6. NUTRITION FLOW (food detection → USDA → UI)

Two separate callers use the same `/meal-parse` endpoint, each with a different UX around it.

### A. Live "Composing" card while the user is speaking

1. `VoicePage.tsx` → `useEffect([transcriptForDisplay])`.
2. After a 500 ms debounce, calls `parseMealTranscriptBestEffort(text)` from `lib/mealParseApi.ts`.
3. Inside `parseMealTranscriptBestEffort`:
   - Calls `parseMealWithApi(text)` → `fetch(VITE_MEAL_PARSE_URL, { method:'POST', body: JSON.stringify({transcript}), signal: 12s-timeout })`.
   - If the server returns `{items: [...]}`, each row is normalized by `normalizeOneItem` (coerces numbers, fills missing id/amount, preserves `fdcId`, `nutritionSource`).
   - If the response is empty and `VITE_MEAL_PARSE_STRICT` is not set, falls back to `parseMealFromTranscript(text)` from `lib/nutrition.ts` — a 40-entry keyword list that matches phrases split on *and/with/plus/,*.
4. Result lands in `liveItems` state. A concurrency guard (`liveParseSeq`) drops stale responses.
5. `liveItems` drives:
   - The "Composing" card in `VoiceImmersiveCapture` (per-item name, amount, kcal, rollover total).
   - `realtimeMealContext.buildAssistantMealContextFromLive(...)`, which produces a text block like:
     ```
     Source: at least some line items are USDA FoodData Central-backed …
     User transcript: "grilled salmon with rice"
     Parsed foods (use these for "too much?" / health / balance questions):
     - Salmon — 170g fillet: ~350 kcal, P 34g, C 0g, F 22g (usda), USDA fdcId 175167
     …
     Running totals: …
     ```
   - This block is pushed to the Realtime session via `session.update` so the voice agent grounds its answers in it.

### B. "Review" before logging, and "Add ingredient" inside a meal

`VoicePage.handleAnalyze` / `MealDetailPage`'s add sheet call `parseMealWithApi(text)` directly and surface the hint (`"Set OPENAI_API_KEY on the meal-parse server…"`, `"USDA_API_KEY is invalid…"`, etc.) when the server returns `{items: [], hint}`. In strict mode, a failed/empty response blocks the flow.

### Server-side, when the endpoint is the Python FastAPI (`meal_parse_server.py`)

This is the **only** path that produces USDA-backed rows:

1. `POST /meal-parse` receives `{transcript}`.
2. If `OPENAI_API_KEY` is set, calls `openai_extract.extract_meal_structured(raw)` → a Pydantic `list[ExtractedLine]`, each with `name`, `usda_query`, `servings`, `grams`, `amount_text`.
3. For each extracted line: `resolve_fdc_id(api, line)` → `USDAAPI.search(query)` against `https://api.nal.usda.gov/fdc/v1/foods/search` → picks the best `fdcId`. Then `scaled_item_for_line(api, line, fid)` fetches `/food/{fdcId}`, pulls nutrient IDs `1008/1003/1005/1004` (calories/protein/carbs/fat) preferring `labelNutrients` over `foodNutrients`, and scales by servings or grams to match the stated portion.
4. If OpenAI extraction fails or no USDA match succeeds, `legacy_phrase_parse(api, raw)` splits the text on connective words and searches USDA for each phrase individually.
5. Returns `{items: [{id, name, amount, calories, protein, carbs, fat, fdcId, nutritionSource:"usda"}, …]}` (or `{items:[], hint:"…"}` when nothing matched).

### Server-side, when the endpoint is Node/Netlify/Vercel (`meal-parse.mjs` / `.js`)

1. `POST /meal-parse` receives `{transcript}`.
2. Single call to OpenAI `gpt-4o-mini` Chat Completions, JSON mode, with a one-shot system prompt asking it to return `{items:[{id,name,amount,calories,protein,carbs,fat}]}`.
3. `normalizeItems` coerces and rounds the numbers.
4. Returns `{items: [...]}`. These rows will **not** have `fdcId` or `nutritionSource: "usda"`; the UI renders the "Not USDA-backed data" warning banner.

### Into the log

When the user taps Plate It, `VoicePage.handleConfirmLog` calls `ByteContext.logMeal(slot, { items: previewItems, … })`. `logMeal` recomputes totals from items via `totalsFromMealItems` and writes into `state.days[todayKey].meals[slot]`. `HomePage`/`MealsPage`/`ProgressPage` read those via `dayNutritionTotals`.

---

## 7. STATE MANAGEMENT

### `AppState` (the single object persisted)

Defined in `lib/types.ts`, created/migrated in `lib/storage.ts`:

```ts
interface AppState {
  onboardingComplete: boolean
  profile: UserProfile            // name, age, sex, heightCm, weightKg,
                                  // cooksPerWeek, goal, goalPace,
                                  // dietaryRestriction, dietaryNotes
  planStartDate: string           // "YYYY-MM-DD", for week numbering
  goals: Goals                    // calorieGoal, proteinGoal, carbsGoal, fatGoal
  days: Record<string, DayData>   // key = "YYYY-MM-DD"
}
interface DayData {
  meals: { breakfast|lunch|snack|dinner: MealLog | null }
  waterGlasses: number            // 0..8
  exerciseCalories: number
}
```

### Where it lives

| Layer | File | Notes |
|---|---|---|
| In-memory | `ByteContext` (`context/ByteContext.tsx`) | `useState<AppState>`; the single source of truth for UI. |
| Device | `localStorage['byte-app-v1']` | Written synchronously on every state change in `ByteContext`'s effect; loaded on mount via `loadState`. Also survives across sign-outs. |
| Cloud | Supabase table `user_states` (columns `id`, `state`, `updated_at`) | `saveStateToCloud` upserts on a 1.5 s debounce; `loadStateFromCloud` pulls after sign-in and replaces the local state. |

### What mutates it (all via `ByteContext` callbacks)

| Action | Writer | Called from |
|---|---|---|
| Finish onboarding | `completeOnboarding(profile)` | `OnboardingPage.tsx` |
| Edit profile | `updateProfile(partial)` — recomputes `goals` when BMR inputs change | `ProfilePage.tsx` |
| Manually override macros | `setGoals(partial)` | `ProfilePage.tsx` |
| Set exercise | `setExerciseCalories(n)` | `ProfilePage.tsx` |
| Drink water | `setWaterGlasses(n)` | `HomePage.tsx` |
| Log a meal | `logMeal(slot, log)` | `VoicePage.handleConfirmLog` |
| Edit items in an existing meal | `updateMealItems`, `addMealItem`, `removeMealItem` | `MealDetailPage.tsx` |
| Wipe all data | `clearAllData()` (fresh onboarding) / `resetToDemo()` | `ProfilePage.tsx` |

### Non-persisted, UI-only state

| State | Owner | Purpose |
|---|---|---|
| `session`, `user`, `loading` | `AuthContext` | Supabase auth. |
| `primedStream` ref | `VoiceEntryContext` | One-shot `MediaStream` handoff between the button tap and `getUserMedia`. |
| `status`, `userTranscript`, `conversationMessages`, `assistantSpeaking`, `localStream` | `useOpenAiRealtimeVoice` | Live WebRTC/voice state. Wiped on `disconnect()`. |
| `liveItems`, `previewItems`, `previewSource`, `committedTranscript`, `step` | `VoicePage` | Ephemeral meal-capture state. |
| `listening`, `interim`, `finalText` | `useSpeechRecognition` | Fallback Web Speech state. |
| PostHog identity | `lib/analytics.ts` | `identify()` after sign-in, `reset()` on sign-out. |

---

## 8. KNOWN ISSUES / TODO

### Incomplete / dead code

- **`realtime-proxy/index.mjs` (line 82) advertises `GET /realtime/session`** as a human-friendly explainer, but a bare `GET` is never useful — the endpoint is POST-only. Fine as-is, but the same notice is duplicated across three backends; only one of them is actually routed in any given deploy.
- **`app/package.json`'s `meal-parse` script hardcodes `../api-testing/USDA-API`** and does shell activation inline (`.venv/bin/pip …`) which will fail on non-POSIX shells or when `dev.env` / `../../realtime-proxy/.env` aren't present. The `|| true` guards hide failures.
- **`App.tsx` at the repo root** is an Expo stub (`react-native` StyleSheet) that is **not** used by the web app. The root `package.json` pulls in `expo`, `react-native`, `react-native-web` only to satisfy it. Consider deleting the Expo root entirely if React Native is not in the roadmap; it currently exists only to make `expo start` work.
- **`supreme-cursor-app/`, `test.txt`, `api/test.js`** are scratch / debugging leftovers and can be removed.
- **`app/dist/`** is committed to git. Almost certainly should be in `.gitignore`.
- **`fifi-cursor-app/` and `website/`** are fully separate projects in the same repo. Unclear if they are still needed; `website/` has its own `node_modules` and a `dist/`.

### Design quirks / fragile areas

- **Three backends for two endpoints** means any change to the contract (e.g. adding a field) needs to be made in four places: `realtime-proxy/meal-parse.mjs`, `netlify/functions/meal-parse.mjs`, `api/meal-parse.js`, and `api-testing/USDA-API/meal_parse_server.py`. The first three are near-identical copies; easy to drift.
- **The Node/Netlify/Vercel `/meal-parse` implementations are not USDA-backed.** They ask `gpt-4o-mini` for nutrition numbers. The UI already warns about this with a "Not USDA-backed data" banner, but the fact that the same URL (`/meal-parse`) has two fundamentally different semantics depending on which server is answering is a footgun.
- **`parseMealFromTranscript` is a 40-entry hardcoded list** that pretends to be a meal parser. It will match "bread" but not "ciabatta", "salmon" but not "tilapia", etc. In non-strict mode it silently masks USDA failures. Consider making strict mode the default.
- **`useOpenAiRealtimeVoice.handleDataMessage`'s dependency array is `[onError]`** but the callback closes over `setConversationMessages`, `setLastError`, etc. They're all stable setters, so it works; but the pattern is subtle and the eslint-disable-next-line workaround in `VoicePage.tsx` (line 230) suggests React's exhaustive-deps rule doesn't like this code.
- **`VoicePage.tsx` line 273** calls `exitImmersive()` inside `handleAnalyze` *only if* `wantsImmersive` is true, but `wantsImmersive` is derived from the URL and route state, not from "are we actually in the immersive UI right now". If the URL changes mid-analysis, this could skip cleanup.
- **The 500 ms debounce in the live-parse effect is tight** relative to a USDA round trip on a cold Render free tier (can be 5–10 s). Multiple in-flight requests are deduped by `liveParseSeq`, but on slow networks the "Composing" card will lag far behind the transcript. A single leading-edge debounce that waits for the last request to settle would be better.
- **`storage.ts` throws at module load** if `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` are missing (via `supabase.ts`). There is no offline-only mode; a developer cloning the repo can't `npm run dev` without configuring Supabase first.
- **Transcript length is unbounded in the immersive chat** except for a hard cap of `MAX_CONVERSATION_MESSAGES = 50` messages. A very long monologue turn can still be arbitrarily long. The model instructions are also capped at 12,000 chars with a silent `[truncated]`.
- **`X-Byte-Goals` is sent as a header on the SDP POST**, not inside the session config, so adjusting it mid-session requires reconnecting. `useOpenAiRealtimeVoice` does re-push `session.update` with instructions when `mealLiveItems` change, but the *goals header* is only applied once at session creation.
- **`VoiceEntryContext.primeMic` silently swallows permission denial** (`catch { streamRef.current = null }`). The user only finds out the mic is broken when they hit the orb and nothing happens; no UI indication.
- **Git working tree is dirty** (per the session's initial status) on `VoiceImmersiveCapture.tsx`, `useOpenAiRealtimeVoice.ts`, `storage.ts`, `types.ts`, `OnboardingPage.tsx`, `ProfilePage.tsx`, `VoicePage.tsx`, plus an untracked `api/test.js`. Worth a look before any new work.
