/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MEAL_PARSE_URL?: string
  /** Full URL of your OpenAI Realtime SDP relay (see app/docs/REALTIME_SESSION_API.md) */
  readonly VITE_REALTIME_SESSION_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
