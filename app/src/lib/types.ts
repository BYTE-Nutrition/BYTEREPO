export type MealSlot = 'breakfast' | 'lunch' | 'snack' | 'dinner'

export interface MealItem {
  id: string
  name: string
  /** Portion or serving description (free text; no separate quantity field in v1). */
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

export type UserGoal =
  | 'weight_loss'
  | 'weight_gain'
  | 'muscle_gain'
  | 'maintenance'
  | 'cooking'
  | 'general_health'

export interface UserProfile {
  name: string
  age: number
  goal: UserGoal
}

export interface AppState {
  /** False until user finishes name / age / goal flow */
  onboardingComplete: boolean
  profile: UserProfile
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
