import { parseMealFromTranscript } from '@/lib/nutrition'
import type { MealItem } from '@/lib/types'

/**
 * Full URL to your meal-parse endpoint (e.g. https://api.example.com/meal-parse).
 * Set via VITE_MEAL_PARSE_URL. No API keys in the client.
 *
 * ## Contract (see docs/MEAL_PARSE_API.md)
 * POST JSON: { "transcript": string }
 * Response JSON: { "items": MealItem[] }
 */
export function getMealParseUrl(): string | null {
  const raw = import.meta.env.VITE_MEAL_PARSE_URL?.trim()
  return raw || null
}

function truthyEnv(v: string | undefined): boolean {
  const s = v?.trim().toLowerCase()
  return s === '1' || s === 'true' || s === 'yes'
}

/** When true, the app never uses `parseMealFromTranscript`—only `VITE_MEAL_PARSE_URL`. */
export function isMealParseStrict(): boolean {
  return truthyEnv(import.meta.env.VITE_MEAL_PARSE_STRICT)
}

function coerceFiniteNumber(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim()) {
    const n = Number(v)
    if (Number.isFinite(n)) return n
  }
  return null
}

/** One row from meal-parse; skips invalid entries instead of failing the whole response. */
function normalizeOneItem(el: unknown): MealItem | null {
  if (!el || typeof el !== 'object') return null
  const o = el as Record<string, unknown>
  if (typeof o.name !== 'string' || !o.name.trim()) return null
  const amountRaw =
    typeof o.amount === 'string' ? o.amount.trim() : typeof o.amount === 'number' ? String(o.amount) : ''
  const amountOut = amountRaw || '1 serving'
  const cal = coerceFiniteNumber(o.calories)
  const p = coerceFiniteNumber(o.protein)
  const cb = coerceFiniteNumber(o.carbs)
  const f = coerceFiniteNumber(o.fat)
  if (cal === null || p === null || cb === null || f === null) return null
  const row: MealItem = {
    id: typeof o.id === 'string' && o.id ? o.id : crypto.randomUUID(),
    name: o.name.trim(),
    amount: amountOut,
    calories: Math.round(cal),
    protein: Math.round(p),
    carbs: Math.round(cb),
    fat: Math.round(f),
  }
  const fid = coerceFiniteNumber(o.fdcId)
  if (fid !== null && fid > 0) {
    row.fdcId = Math.round(fid)
  }
  if (o.nutritionSource === 'usda' || o.nutritionSource === 'estimate') {
    row.nutritionSource = o.nutritionSource
  }
  return row
}

function parseMealItemsPayload(json: unknown): { items: MealItem[] | null; hint?: string } {
  if (!json || typeof json !== 'object') return { items: null }
  const root = json as Record<string, unknown>
  const hint = typeof root.hint === 'string' ? root.hint.trim() || undefined : undefined
  const rawItems = root.items
  if (!Array.isArray(rawItems)) return { items: null, hint }
  if (rawItems.length === 0) return { items: [], hint }
  const out: MealItem[] = []
  for (const el of rawItems) {
    const row = normalizeOneItem(el)
    if (row) out.push(row)
  }
  return { items: out, hint }
}

export type MealParseResponse = {
  items: MealItem[] | null
  /** Present when the server returns 200 but no usable rows (e.g. USDA 429, misconfiguration). */
  hint?: string
}

const DEFAULT_TIMEOUT_MS = 12_000

/**
 * Calls your backend; `items: null` means network/HTTP error or unparseable JSON body.
 */
export async function parseMealWithApi(
  transcript: string,
  signal?: AbortSignal,
): Promise<MealParseResponse> {
  const url = getMealParseUrl()
  const text = transcript.trim()
  if (!url || !text) return { items: null }

  const combined = new AbortController()
  const onExternalAbort = () => combined.abort()
  if (signal) {
    if (signal.aborted) return { items: null }
    signal.addEventListener('abort', onExternalAbort)
  }
  const t = window.setTimeout(() => combined.abort(), DEFAULT_TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ transcript: text }),
      signal: combined.signal,
    })
    if (!res.ok) return { items: null }
    const json: unknown = await res.json()
    return parseMealItemsPayload(json)
  } catch {
    return { items: null }
  } finally {
    window.clearTimeout(t)
    if (signal) signal.removeEventListener('abort', onExternalAbort)
  }
}

/**
 * When `VITE_MEAL_PARSE_STRICT` is set: only meal-parse (or [] if URL missing / request fails / empty items).
 * Otherwise: API when configured and successful, else local `parseMealFromTranscript` fallback.
 */
export async function parseMealTranscriptBestEffort(
  transcript: string,
  signal?: AbortSignal,
): Promise<MealItem[]> {
  const text = transcript.trim()
  if (!text) return []
  const { items: apiItems } = await parseMealWithApi(text, signal)
  if (apiItems && apiItems.length > 0) return apiItems
  if (isMealParseStrict()) return []
  return parseMealFromTranscript(text)
}
