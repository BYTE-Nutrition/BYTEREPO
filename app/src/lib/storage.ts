import type { AppState, DayData, MealItem, MealLog, MealSlot } from './types'
import { MEAL_ORDER } from './types'
import { todayKey } from './dates'

const STORAGE_KEY = 'byte-app-v1'

export function emptyDay(): DayData {
  const meals = {} as DayData['meals']
  for (const s of MEAL_ORDER) meals[s] = null
  return { meals, waterGlasses: 0, exerciseCalories: 0 }
}

function sumItems(items: MealItem[]) {
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
    const t = sumItems(items)
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

export function createInitialState(): AppState {
  const t = todayKey()
  const start = new Date()
  start.setDate(start.getDate() - 14)
  const planStart = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`

  return {
    planStartDate: planStart,
    goals: {
      calorieGoal: 2000,
      proteinGoal: 150,
      carbsGoal: 250,
      fatGoal: 67,
    },
    days: {
      [t]: demoDay(),
    },
  }
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as AppState
      if (parsed.days && parsed.goals) return parsed
    }
  } catch {
    /* ignore */
  }
  return createInitialState()
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
