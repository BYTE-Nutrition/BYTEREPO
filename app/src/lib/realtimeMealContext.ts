import { totalsFromMealItems } from '@/lib/aggregate'
import type { MealItem } from '@/lib/types'

const MAX_TRANSCRIPT = 1200

/** True when `VITE_MEAL_PARSE_URL` is set (meal-parse HTTP is enabled — may still be model-only, not USDA). */
export function mealParsePipelineConfigured(): boolean {
  const raw = import.meta.env.VITE_MEAL_PARSE_URL?.trim()
  return Boolean(raw)
}

/** True when at least one line came from USDA FoodData Central (fdc id or explicit source tag). */
export function mealItemsHaveUsdaBacking(items: MealItem[]): boolean {
  return items.some(
    (i) => i.nutritionSource === 'usda' || (typeof i.fdcId === 'number' && Number.isFinite(i.fdcId) && i.fdcId > 0),
  )
}

/**
 * Text block injected into OpenAI Realtime instructions so spoken answers can
 * reference the same numbers the log UI uses.
 *
 * @param mealParseUrlConfigured same idea as {@link mealParsePipelineConfigured()} (URL set vs local-only).
 */
export function buildAssistantMealContextFromLive(
  items: MealItem[],
  transcript: string,
  mealParseUrlConfigured: boolean,
): string {
  const t = transcript.trim()
  const shortTranscript = t.length > MAX_TRANSCRIPT ? `${t.slice(0, MAX_TRANSCRIPT)}…` : t || '(empty)'

  const hasUsda = mealItemsHaveUsdaBacking(items)
  let sourceLine: string
  if (!mealParseUrlConfigured) {
    sourceLine =
      'Source: line items are local heuristic estimates only (meal-parse URL not set in this build).'
  } else if (!items.length) {
    sourceLine =
      'Source: meal-parse URL is set but there are no line items yet; do not claim USDA numbers until rows show fdcId or nutritionSource usda.'
  } else if (hasUsda) {
    sourceLine =
      'Source: at least some line items are USDA FoodData Central-backed (fdcId and/or nutritionSource usda).'
  } else {
    sourceLine =
      'Source: line items came from the meal-parse API but are model estimates only (no USDA fdcId / usda markers on these rows).'
  }

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
