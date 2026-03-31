import type { DayData, MealItem, MealLog } from './types'
import { MEAL_ORDER } from './types'

/** Sum of calories and macros from line items; meal-level totals should always match this. */
export function totalsFromMealItems(items: MealItem[]): Pick<MealLog, 'calories' | 'protein' | 'carbs' | 'fat'> {
  return items.reduce(
    (a, i) => ({
      calories: a.calories + i.calories,
      protein: a.protein + i.protein,
      carbs: a.carbs + i.carbs,
      fat: a.fat + i.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  )
}

export function dayNutritionTotals(day: DayData) {
  let calories = 0
  let protein = 0
  let carbs = 0
  let fat = 0
  for (const slot of MEAL_ORDER) {
    const m = day.meals[slot]
    if (m) {
      calories += m.calories
      protein += m.protein
      carbs += m.carbs
      fat += m.fat
    }
  }
  return { calories, protein, carbs, fat }
}
