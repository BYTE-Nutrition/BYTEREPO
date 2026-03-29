export type MealSlot = 'breakfast' | 'lunch' | 'snack' | 'dinner'

export interface MealItem {
  id: string
  name: string
  amount: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

export interface MealLog {
  id: string
  slot: MealSlot
  calories: number
  protein: number
  carbs: number
  fat: number
  items: MealItem[]
  timeRangeLabel: string
  prepStarted: string
  cookingMinutes: number
  mealCompleted: string
  /** Original voice or typed description used to build this meal */
  voiceTranscript?: string
}

export interface DayData {
  meals: Record<MealSlot, MealLog | null>
  waterGlasses: number
  exerciseCalories: number
}

export interface Goals {
  calorieGoal: number
  proteinGoal: number
  carbsGoal: number
  fatGoal: number
}

export interface AppState {
  planStartDate: string
  goals: Goals
  days: Record<string, DayData>
}

export const MEAL_ORDER: MealSlot[] = ['breakfast', 'lunch', 'snack', 'dinner']

export const MEAL_LABELS: Record<MealSlot, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  snack: 'Snack',
  dinner: 'Dinner',
}
