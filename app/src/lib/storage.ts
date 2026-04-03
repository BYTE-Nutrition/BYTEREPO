import type {
  AppState,
  DayData,
  GoalPace,
  MealItem,
  MealLog,
  MealSlot,
  UserGoal,
  UserProfile,
  UserSex,
} from './types'
import { MEAL_ORDER } from './types'
import { totalsFromMealItems } from './aggregate'
import { computeGoalsFromProfile } from './goalsFromProfile'
import { todayKey } from './dates'

const STORAGE_KEY = 'byte-app-v1'

const USER_GOALS: UserGoal[] = [
  'weight_loss',
  'weight_gain',
  'muscle_gain',
  'maintenance',
  'cooking',
  'general_health',
]

function normalizeGoal(g: unknown): UserGoal {
  return typeof g === 'string' && USER_GOALS.includes(g as UserGoal) ? (g as UserGoal) : 'maintenance'
}

const USER_SEX: UserSex[] = ['male', 'female', 'prefer_not_say']
function normalizeSex(s: unknown): UserSex {
  return typeof s === 'string' && USER_SEX.includes(s as UserSex) ? (s as UserSex) : 'prefer_not_say'
}

const GOAL_PACES: GoalPace[] = ['gradual', 'steady', 'ambitious']
function normalizePace(p: unknown): GoalPace {
  return typeof p === 'string' && GOAL_PACES.includes(p as GoalPace) ? (p as GoalPace) : 'steady'
}

const defaultProfile: UserProfile = {
  name: '',
  age: 30,
  sex: 'prefer_not_say',
  heightCm: 170,
  weightKg: 72,
  cooksPerWeek: 4,
  goal: 'maintenance',
  goalPace: 'steady',
}

function defaultGoalsFromProfile(p: UserProfile) {
  return computeGoalsFromProfile(p)
}

export function emptyDay(): DayData {
  const meals = {} as DayData['meals']
  for (const s of MEAL_ORDER) meals[s] = null
  return { meals, waterGlasses: 0, exerciseCalories: 0 }
}

function demoDay(): DayData {
  const breakfastItems: MealItem[] = [
    {
      id: crypto.randomUUID(),
      name: 'Oatmeal with berries',
      amount: '1 cup oats, 1/2 cup blueberries',
      calories: 320,
      protein: 12,
      carbs: 58,
      fat: 6,
    },
    {
      id: crypto.randomUUID(),
      name: 'Greek yogurt',
      amount: '150g plain',
      calories: 100,
      protein: 17,
      carbs: 6,
      fat: 0,
    },
  ]

  const lunchItems: MealItem[] = [
    {
      id: crypto.randomUUID(),
      name: 'Grilled chicken breast',
      amount: '200g',
      calories: 330,
      protein: 62,
      carbs: 0,
      fat: 7,
    },
    {
      id: crypto.randomUUID(),
      name: 'Mixed salad',
      amount: '2 cups lettuce, 1 tomato',
      calories: 45,
      protein: 2,
      carbs: 9,
      fat: 0,
    },
    {
      id: crypto.randomUUID(),
      name: 'Quinoa',
      amount: '1/2 cup cooked',
      calories: 111,
      protein: 4,
      carbs: 20,
      fat: 2,
    },
  ]

  const snackItems: MealItem[] = [
    {
      id: crypto.randomUUID(),
      name: 'Apple',
      amount: '1 medium',
      calories: 95,
      protein: 0,
      carbs: 25,
      fat: 0,
    },
    {
      id: crypto.randomUUID(),
      name: 'Almonds',
      amount: '15 pieces (23g)',
      calories: 61,
      protein: 2,
      carbs: 2,
      fat: 5,
    },
  ]

  const mk = (
    slot: MealSlot,
    items: MealItem[],
    timeRangeLabel: string,
    prepHour: number,
    prepMin: number,
    cookMin: number,
  ): MealLog => {
    const t = totalsFromMealItems(items)
    const prep = new Date()
    prep.setHours(prepHour, prepMin, 0, 0)
    const done = new Date(prep.getTime() + cookMin * 60_000)
    return {
      id: crypto.randomUUID(),
      slot,
      calories: t.calories,
      protein: t.protein,
      carbs: t.carbs,
      fat: t.fat,
      items,
      timeRangeLabel,
      prepStarted: prep.toISOString(),
      cookingMinutes: cookMin,
      mealCompleted: done.toISOString(),
    }
  }

  const meals = {} as DayData['meals']
  meals.breakfast = mk('breakfast', breakfastItems, '8:30 AM - 8:45 AM', 8, 30, 15)
  meals.lunch = mk('lunch', lunchItems, '12:30 PM - 1:00 PM', 12, 30, 30)
  meals.snack = mk('snack', snackItems, '3:20 PM', 15, 20, 5)
  meals.dinner = null

  return { meals, waterGlasses: 6, exerciseCalories: 0 }
}

/** New install: onboarding required, empty today, placeholder goals until onboarding finishes. */
export function createFreshOnboardingState(): AppState {
  const t = todayKey()
  const profile = { ...defaultProfile }
  return {
    onboardingComplete: false,
    profile,
    planStartDate: t,
    goals: defaultGoalsFromProfile(profile),
    days: { [t]: emptyDay() },
  }
}

/** Demo / reset: skip onboarding, sample data. */
export function createInitialState(): AppState {
  const t = todayKey()
  const start = new Date()
  start.setDate(start.getDate() - 14)
  const planStart = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`

  const profile: UserProfile = {
    name: 'Alex',
    age: 28,
    sex: 'female',
    heightCm: 168,
    weightKg: 62,
    cooksPerWeek: 5,
    goal: 'maintenance',
    goalPace: 'steady',
  }

  return {
    onboardingComplete: true,
    profile,
    planStartDate: planStart,
    goals: defaultGoalsFromProfile(profile),
    days: {
      [t]: demoDay(),
    },
  }
}

function migrateParsed(parsed: AppState): AppState {
  const next = { ...parsed }
  if (typeof next.onboardingComplete !== 'boolean') {
    next.onboardingComplete = true
  }
  if (!next.profile || typeof next.profile.name !== 'string') {
    next.profile = { ...defaultProfile }
  } else {
    const p = next.profile as Partial<UserProfile> & { name?: string }
    next.profile = {
      name: typeof p.name === 'string' ? p.name : '',
      age: typeof p.age === 'number' && p.age >= 13 ? p.age : 30,
      sex: normalizeSex(p.sex),
      heightCm:
        typeof p.heightCm === 'number' && p.heightCm >= 120 && p.heightCm <= 220 ? p.heightCm : 170,
      weightKg:
        typeof p.weightKg === 'number' && p.weightKg >= 30 && p.weightKg <= 250 ? p.weightKg : 72,
      cooksPerWeek:
        typeof p.cooksPerWeek === 'number' && p.cooksPerWeek >= 0 && p.cooksPerWeek <= 21
          ? Math.round(p.cooksPerWeek)
          : 4,
      goal: normalizeGoal(p.goal),
      goalPace: normalizePace(p.goalPace),
    }
  }
  return next
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as AppState
      if (parsed.days && parsed.goals) return migrateParsed(parsed)
    }
  } catch {
    /* ignore */
  }
  return createFreshOnboardingState()
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* ignore */
  }
}

export function ensureDay(state: AppState, key: string): DayData {
  if (!state.days[key]) {
    state.days[key] = emptyDay()
  }
  return state.days[key]
}
