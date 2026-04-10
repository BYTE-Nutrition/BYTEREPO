# Realtime session API (OpenAI WebRTC proxy)

The Byte app can open a **live voice session** (mic → OpenAI Realtime → spoken replies) using **WebRTC**. Your **OpenAI API key stays on the server** only. The client sets `VITE_REALTIME_SESSION_URL` to the **full URL** of your proxy endpoint (no secrets in the bundle).

This mirrors the security model of [MEAL_PARSE_API.md](./MEAL_PARSE_API.md): the browser talks only to **your** backend; your backend talks to OpenAI.

## Transport: unified SDP relay

Byte uses OpenAI’s **unified interface** ([Realtime WebRTC guide](https://platform.openai.com/docs/guides/realtime-webrtc)):

1. The app creates a WebRTC offer (SDP) and `POST`s the raw SDP body to your URL.
2. Your server forwards that SDP plus a **session** JSON (model, instructions, audio) to `https://api.openai.com/v1/realtime/calls` with `Authorization: Bearer <OPENAI_API_KEY>`.
3. Your server returns the SDP **answer** text to the app.
4. The app completes the peer connection; audio and the `oai-events` data channel flow between the browser and OpenAI.

The browser **never** receives your standard API key.

## Endpoint

- **Method:** `POST`
- **URL:** Whatever you set in `VITE_REALTIME_SESSION_URL` (e.g. `https://api.example.com/realtime/session`)
- **Content-Type:** `application/sdp` (or `text/plain` if your framework maps it)
- **Body:** Raw WebRTC **offer** SDP string (not JSON).
- **Optional headers:** `X-Byte-Goals` — free-text line appended to the Realtime `instructions` (e.g. `User's daily goals: 1800 kcal, 140g protein, …`). The Byte app sends the user’s macro targets when connecting.
- **CORS:** Allow your web app origin (including custom headers if you use `X-Byte-Goals`).

## Success response

**Status:** `200`

**Content-Type:** `application/sdp` (or `text/plain`)

**Body:** Raw WebRTC **answer** SDP string from OpenAI (pass through unchanged).

## Error responses

Return **non-200** with a short JSON or plain-text message if session creation fails (missing API key, OpenAI error, invalid SDP). The app surfaces a generic error and can fall back to Web Speech + meal parse.

Example:

```json
{ "error": "Failed to create realtime session" }
```

## Server environment

| Variable            | Required | Notes |
| ------------------- | -------- | ----- |
| `OPENAI_API_KEY`    | yes      | Standard org/project key; **never** exposed to the client. |

Optional: `ALLOWED_ORIGINS` (comma-separated) for CORS in production.

## Session configuration (server-side only)

Your proxy should send a `session` field in the multipart body to OpenAI alongside `sdp`, for example:

- `type`: `"realtime"`
- `model`: e.g. `gpt-realtime-mini` (use a Realtime-capable model from OpenAI’s docs)
- `instructions`: Short system prompt positioning the assistant as Byte’s cooking / meal-logging companion
- `audio.output.voice`: e.g. `marin`
- Optionally `audio.input.transcription` if you want streamed **user** transcripts for the UI (see OpenAI Realtime transcription docs)

Recommended limits: rate limiting, max SDP size, logging without raw PII where possible.

## Client behavior

- If `VITE_REALTIME_SESSION_URL` is **unset**, Byte keeps the existing **Web Speech API** + meal-parse flow (no regression).
- If set, immersive voice can use the Realtime path; on failure, the app may fall back to Web Speech.

## iOS Safari

WebRTC and autoplay policies may require a **user gesture** before audio plays; the mic tap satisfies this in typical flows.
