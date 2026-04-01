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

function isMealItemShape(x: unknown): x is Omit<MealItem, 'id'> & { id?: string } {
  if (!x || typeof x !== 'object') return false
  const o = x as Record<string, unknown>
  return (
    typeof o.name === 'string' &&
    typeof o.amount === 'string' &&
    typeof o.calories === 'number' &&
    typeof o.protein === 'number' &&
    typeof o.carbs === 'number' &&
    typeof o.fat === 'number'
  )
}

function normalizeItems(raw: unknown): MealItem[] | null {
  if (!raw || typeof raw !== 'object') return null
  const items = (raw as { items?: unknown }).items
  if (!Array.isArray(items) || items.length === 0) return null
  const out: MealItem[] = []
  for (const el of items) {
    if (!isMealItemShape(el)) return null
    out.push({
      id: typeof el.id === 'string' && el.id ? el.id : crypto.randomUUID(),
      name: el.name,
      amount: el.amount,
      calories: Math.round(el.calories),
      protein: Math.round(el.protein),
      carbs: Math.round(el.carbs),
      fat: Math.round(el.fat),
    })
  }
  return out
}

const DEFAULT_TIMEOUT_MS = 12_000

/**
 * Calls your backend; returns null on network/parse errors or missing URL.
 */
export async function parseMealWithApi(transcript: string, signal?: AbortSignal): Promise<MealItem[] | null> {
  const url = getMealParseUrl()
  const text = transcript.trim()
  if (!url || !text) return null

  const combined = new AbortController()
  const onExternalAbort = () => combined.abort()
  if (signal) {
    if (signal.aborted) return null
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
    if (!res.ok) return null
    const json: unknown = await res.json()
    return normalizeItems(json)
  } catch {
    return null
  } finally {
    window.clearTimeout(t)
    if (signal) signal.removeEventListener('abort', onExternalAbort)
  }
}

/** API first when configured; otherwise local parser only. */
export async function parseMealTranscriptBestEffort(
  transcript: string,
  signal?: AbortSignal,
): Promise<MealItem[]> {
  const text = transcript.trim()
  if (!text) return []
  const apiItems = await parseMealWithApi(text, signal)
  if (apiItems && apiItems.length > 0) return apiItems
  return parseMealFromTranscript(text)
}
