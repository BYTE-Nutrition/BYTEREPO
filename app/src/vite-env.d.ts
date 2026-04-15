/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MEAL_PARSE_URL?: string
  /** Full URL of your OpenAI Realtime SDP relay (see app/docs/REALTIME_SESSION_API.md) */
  readonly VITE_REALTIME_SESSION_URL?: string
  /** Supabase project URL — from Supabase dashboard → Settings → API */
  readonly VITE_SUPABASE_URL: string
  /** Supabase anon/public key — from Supabase dashboard → Settings → API */
  readonly VITE_SUPABASE_ANON_KEY: string
  /** PostHog project API key — from PostHog → Project Settings → Project API key */
  readonly VITE_POSTHOG_KEY?: string
  /** PostHog ingestion host — defaults to https://us.i.posthog.com */
  readonly VITE_POSTHOG_HOST?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
