/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MEAL_PARSE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
