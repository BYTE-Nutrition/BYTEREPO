export type MealSlot = 'breakfast' | 'lunch' | 'snack' | 'dinner'

export type MealNutritionSource = 'usda' | 'estimate'

export interface MealItem {
  id: string
  name: string
  /** Portion or serving description (free text; no separate quantity field in v1). */
  amount: string
  calories: number
  protein: number
  carbs: number
  fat: number
  /** USDA FoodData Central `fdcId` when this line was resolved from the FDC API. */
  fdcId?: number
  /** Whether macros came from USDA-backed meal-parse vs local heuristics. */
  nutritionSource?: MealNutritionSource
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

/** Used for Mifflin–St Jeor BMR. */
export type UserSex = 'male' | 'female' | 'prefer_not_say'

/** How quickly you want to move toward your health goal (affects calorie adjustment). */
export type GoalPace = 'gradual' | 'steady' | 'ambitious'

/** Diet pattern / restrictions for coaching and meal suggestions. */
export type DietaryRestriction =
  | 'none'
  | 'vegetarian'
  | 'vegan'
  | 'pescatarian'
  | 'other'

export interface UserProfile {
  name: string
  age: number
  sex: UserSex
  /** Centimeters */
  heightCm: number
  /** Kilograms */
  weightKg: number
  /** Home-cooked meals per week (engagement / activity proxy). */
  cooksPerWeek: number
  goal: UserGoal
  goalPace: GoalPace
  dietaryRestriction: DietaryRestriction
  /** Free text: required when `dietaryRestriction` is `other`; optional notes (e.g. foods to avoid). */
  dietaryNotes: string
}

export interface AppState {
  /** False until user finishes onboarding (profile + targets) */
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

/** Passed via `navigate('/voice?...', { state })` */
export type VoiceLocationState = {
  autoStartVoice?: boolean
  prefillTranscript?: string
  immersive?: boolean
}
