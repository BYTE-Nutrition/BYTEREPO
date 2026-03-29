import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { AppState, DayData, Goals, MealItem, MealLog, MealSlot } from '@/lib/types'
import { MEAL_ORDER } from '@/lib/types'
import { createInitialState, emptyDay, ensureDay, loadState, saveState } from '@/lib/storage'
import { formatRange, planWeekNumber, todayKey } from '@/lib/dates'
import { ByteContext, type ByteContextValue } from './byte-context'

function recomputeMealTotals(items: MealItem[]): Pick<MealLog, 'calories' | 'protein' | 'carbs' | 'fat'> {
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

export function ByteProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState())
  const tk = todayKey()

  useEffect(() => {
    saveState(state)
  }, [state])

  const day = useMemo(() => state.days[tk] ?? emptyDay(), [state.days, tk])

  const weekNumber = useMemo(
    () => planWeekNumber(state.planStartDate, tk),
    [state.planStartDate, tk],
  )

  const setWaterGlasses = useCallback((n: number) => {
    const v = Math.max(0, Math.min(8, Math.round(n)))
    setState((s) => {
      const next = structuredClone(s)
      const d = ensureDay(next, tk)
      d.waterGlasses = v
      return next
    })
  }, [tk])

  const setExerciseCalories = useCallback((n: number) => {
    const v = Math.max(0, Math.round(n))
    setState((s) => {
      const next = structuredClone(s)
      ensureDay(next, tk).exerciseCalories = v
      return next
    })
  }, [tk])

  const setGoals = useCallback((g: Partial<Goals>) => {
    setState((s) => ({
      ...s,
      goals: { ...s.goals, ...g },
    }))
  }, [])

  const setPlanStartDate = useCallback((isoDate: string) => {
    setState((s) => ({ ...s, planStartDate: isoDate }))
  }, [])

  const logMeal = useCallback(
    (slot: MealSlot, log: Omit<MealLog, 'id' | 'slot'> & { id?: string }) => {
      setState((s) => {
        const next = structuredClone(s)
        const d = ensureDay(next, tk)
        const prep = new Date()
        const done = new Date(prep.getTime() + (log.cookingMinutes || 15) * 60_000)
        const full: MealLog = {
          ...log,
          id: log.id ?? crypto.randomUUID(),
          slot,
          timeRangeLabel: log.timeRangeLabel || formatRange(prep, done),
          prepStarted: log.prepStarted || prep.toISOString(),
          mealCompleted: log.mealCompleted || done.toISOString(),
        }
        d.meals[slot] = full
        return next
      })
    },
    [tk],
  )

  const clearMeal = useCallback(
    (slot: MealSlot) => {
      setState((s) => {
        const next = structuredClone(s)
        ensureDay(next, tk).meals[slot] = null
        return next
      })
    },
    [tk],
  )

  const updateMealItems = useCallback(
    (slot: MealSlot, items: MealItem[]) => {
      setState((s) => {
        const next = structuredClone(s)
        const m = ensureDay(next, tk).meals[slot]
        if (!m) return s
        const t = recomputeMealTotals(items)
        m.items = items
        Object.assign(m, t)
        return next
      })
    },
    [tk],
  )

  const removeMealItem = useCallback(
    (slot: MealSlot, itemId: string) => {
      setState((s) => {
        const next = structuredClone(s)
        const m = ensureDay(next, tk).meals[slot]
        if (!m) return s
        const items = m.items.filter((i) => i.id !== itemId)
        const t = recomputeMealTotals(items)
        m.items = items
        Object.assign(m, t)
        return next
      })
    },
    [tk],
  )

  const addMealItem = useCallback(
    (slot: MealSlot, item: MealItem) => {
      setState((s) => {
        const next = structuredClone(s)
        const m = ensureDay(next, tk).meals[slot]
        if (!m) return s
        const items = [...m.items, item]
        const t = recomputeMealTotals(items)
        m.items = items
        Object.assign(m, t)
        return next
      })
    },
    [tk],
  )

  const resetToDemo = useCallback(() => {
    setState(createInitialState())
  }, [])

  const clearAllData = useCallback(() => {
    const t = todayKey()
    const meals = Object.fromEntries(MEAL_ORDER.map((x) => [x, null])) as DayData['meals']
    const empty: DayData = { meals, waterGlasses: 0, exerciseCalories: 0 }
    setState({
      planStartDate: t,
      goals: {
        calorieGoal: 2000,
        proteinGoal: 150,
        carbsGoal: 250,
        fatGoal: 67,
      },
      days: { [t]: empty },
    })
  }, [])

  const value = useMemo<ByteContextValue>(
    () => ({
      state,
      todayKey: tk,
      day,
      goals: state.goals,
      weekNumber,
      setWaterGlasses,
      setExerciseCalories,
      setGoals,
      setPlanStartDate,
      logMeal,
      clearMeal,
      updateMealItems,
      removeMealItem,
      addMealItem,
      resetToDemo,
      clearAllData,
    }),
    [
      state,
      tk,
      day,
      weekNumber,
      setWaterGlasses,
      setExerciseCalories,
      setGoals,
      setPlanStartDate,
      logMeal,
      clearMeal,
      updateMealItems,
      removeMealItem,
      addMealItem,
      resetToDemo,
      clearAllData,
    ],
  )

  return <ByteContext.Provider value={value}>{children}</ByteContext.Provider>
}
