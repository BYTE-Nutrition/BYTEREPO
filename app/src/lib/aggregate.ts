import type { DayData } from './types'
import { MEAL_ORDER } from './types'

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
