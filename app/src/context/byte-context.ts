import { createContext } from 'react'
import type { AppState, DayData, Goals, MealItem, MealLog, MealSlot } from '@/lib/types'

export interface ByteContextValue {
  state: AppState
  todayKey: string
  day: DayData
  goals: Goals
  weekNumber: number
  setWaterGlasses: (n: number) => void
  setExerciseCalories: (n: number) => void
  setGoals: (g: Partial<Goals>) => void
  setPlanStartDate: (isoDate: string) => void
  logMeal: (slot: MealSlot, log: Omit<MealLog, 'id' | 'slot'> & { id?: string }) => void
  clearMeal: (slot: MealSlot) => void
  /** Replaces items and sets meal calories/macros to the sum of those items. */
  updateMealItems: (slot: MealSlot, items: MealItem[]) => void
  removeMealItem: (slot: MealSlot, itemId: string) => void
  addMealItem: (slot: MealSlot, item: MealItem) => void
  resetToDemo: () => void
  clearAllData: () => void
}

export const ByteContext = createContext<ByteContextValue | null>(null)
