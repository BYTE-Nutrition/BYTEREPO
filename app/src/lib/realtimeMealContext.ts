import { totalsFromMealItems } from '@/lib/aggregate'
import type { MealItem } from '@/lib/types'

const MAX_TRANSCRIPT = 1200

/** True when the app is configured to call the meal-parse backend (often USDA-backed). */
export function mealParsePipelineConfigured(): boolean {
  const raw = import.meta.env.VITE_MEAL_PARSE_URL?.trim()
  return Boolean(raw)
}

/**
 * Text block injected into OpenAI Realtime instructions so spoken answers can
 * reference the same numbers the log UI uses.
 */
export function buildAssistantMealContextFromLive(
  items: MealItem[],
  transcript: string,
  usdaPipelineConfigured: boolean,
): string {
  const t = transcript.trim()
  const shortTranscript = t.length > MAX_TRANSCRIPT ? `${t.slice(0, MAX_TRANSCRIPT)}…` : t || '(empty)'

  const sourceLine = usdaPipelineConfigured
    ? 'Source: line items are produced by the app meal-parse service (typically USDA FoodData Central search + scaling when the server is set up).'
    : 'Source: line items are local heuristic estimates only (meal-parse URL not set in this build).'

  if (!items.length) {
    return [
      sourceLine,
      `User transcript: ${shortTranscript}`,
      'Parsed foods: none yet — encourage them to name ingredients and amounts; avoid claiming USDA numbers until lines appear.',
    ].join('\n')
  }

  const lines = items.map((i) => {
    const fdc = i.fdcId != null ? `, USDA fdcId ${i.fdcId}` : ''
    const src = i.nutritionSource === 'usda' ? ' (usda)' : i.nutritionSource === 'estimate' ? ' (estimate)' : ''
    return `- ${i.name} — ${i.amount}: ~${i.calories} kcal, P ${i.protein}g, C ${i.carbs}g, F ${i.fat}g${src}${fdc}`
  })
  const tot = totalsFromMealItems(items)

  return [
    sourceLine,
    `User transcript: ${shortTranscript}`,
    'Parsed foods (use these for “too much?” / health / balance questions):',
    ...lines,
    `Running totals (approx.): ${tot.calories} kcal, P ${tot.protein}g, C ${tot.carbs}g, F ${tot.fat}g`,
  ].join('\n')
}
