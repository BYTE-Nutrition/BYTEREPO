import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { AppState, Goals, MealItem, MealLog, MealSlot, UserProfile } from '@/lib/types'
import { totalsFromMealItems } from '@/lib/aggregate'
import { computeGoalsFromProfile } from '@/lib/goalsFromProfile'
import {
  createFreshOnboardingState,
  createInitialState,
  emptyDay,
  ensureDay,
  loadState,
  loadStateFromCloud,
  saveState,
  saveStateToCloud,
} from '@/lib/storage'
import { formatRange, planWeekNumber, todayKey } from '@/lib/dates'
import { ByteContext, type ByteContextValue } from './byte-context'
import { useAuth } from './AuthContext'

export function ByteProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [state, setState] = useState<AppState>(() => loadState())
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tk = todayKey()

  // When a user signs in, pull their saved state from Supabase.
  useEffect(() => {
    if (!user) return
    loadStateFromCloud(user.id).then((cloudState) => {
      if (cloudState) setState(cloudState)
    })
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Save to localStorage immediately; debounce cloud writes by 1.5 s.
  useEffect(() => {
    saveState(state)
    if (!user) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      saveStateToCloud(user.id, state)
    }, 1500)
  }, [state]) // eslint-disable-line react-hooks/exhaustive-deps

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

  const updateProfile = useCallback((p: Partial<UserProfile>) => {
    setState((s) => {
      const profile = { ...s.profile, ...p }
      const recalc =
        'age' in p ||
        'goal' in p ||
        'heightCm' in p ||
        'weightKg' in p ||
        'sex' in p ||
        'cooksPerWeek' in p ||
        'goalPace' in p
      const goals = recalc ? computeGoalsFromProfile(profile) : s.goals
      return { ...s, profile, goals }
    })
  }, [])

  const completeOnboarding = useCallback((profile: UserProfile) => {
    const t = todayKey()
    const goals = computeGoalsFromProfile(profile)
    setState({
      onboardingComplete: true,
      profile,
      planStartDate: t,
      goals,
      days: { [t]: emptyDay() },
    })
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
        Object.assign(full, totalsFromMealItems(full.items))
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
        const t = totalsFromMealItems(items)
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
        const t = totalsFromMealItems(items)
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
        const t = totalsFromMealItems(items)
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
    setState(createFreshOnboardingState())
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
      updateProfile,
      completeOnboarding,
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
      updateProfile,
      completeOnboarding,
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
