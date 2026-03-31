import { ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ByteLogo } from '@/components/ByteLogo'
import { useByte } from '@/context/useByte'
import { USER_GOAL_OPTIONS } from '@/lib/goalsFromProfile'
import type { UserGoal } from '@/lib/types'

export function ProfilePage() {
  const navigate = useNavigate()
  const {
    state,
    goals,
    day,
    setGoals,
    setExerciseCalories,
    setPlanStartDate,
    updateProfile,
    resetToDemo,
    clearAllData,
  } = useByte()

  return (
    <div>
      <div className="relative overflow-hidden rounded-b-[2.25rem] bg-gradient-to-b from-neutral-900 to-neutral-950 px-6 pb-8 pt-14 text-white shadow-[0_16px_36px_-14px_rgba(0,0,0,0.35)]">
        <div className="relative mb-6 flex items-center justify-between">
          <button
            type="button"
            aria-label="Back"
            onClick={() => navigate(-1)}
            className="-ml-1 rounded-full p-2 text-white/80 hover:bg-white/10"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={1.75} />
          </button>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <ByteLogo />
          </div>
          <div className="w-9" aria-hidden />
        </div>
        <p className="text-label mb-1 text-center text-white/45">You</p>
        <h1 className="text-display-title text-center text-white">Profile</h1>
      </div>

      <div className="space-y-6 px-6 py-6">
        <section>
          <h2 className="text-section mb-3 text-gray-900">About you</h2>
          <p className="mb-3 text-xs text-gray-500">
            Changing age or goal recalculates calorie and protein targets (you can still edit numbers below).
          </p>
          <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
            <label className="block text-sm text-gray-600">
              Name
              <input
                type="text"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
                value={state.profile.name}
                onChange={(e) => updateProfile({ name: e.target.value })}
              />
            </label>
            <label className="block text-sm text-gray-600">
              Age
              <select
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
                value={state.profile.age}
                onChange={(e) => updateProfile({ age: Number(e.target.value) || 30 })}
              >
                {Array.from({ length: 88 }, (_, i) => i + 13).map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm text-gray-600">
              Main goal
              <select
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
                value={state.profile.goal}
                onChange={(e) => updateProfile({ goal: e.target.value as UserGoal })}
              >
                {USER_GOAL_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section>
          <h2 className="text-section mb-3 text-gray-900">Daily goals</h2>
          <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
            <label className="block text-sm text-gray-600">
              Calories
              <input
                type="number"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
                value={goals.calorieGoal}
                onChange={(e) => setGoals({ calorieGoal: Number(e.target.value) || 0 })}
              />
            </label>
            <label className="block text-sm text-gray-600">
              Protein (g)
              <input
                type="number"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
                value={goals.proteinGoal}
                onChange={(e) => setGoals({ proteinGoal: Number(e.target.value) || 0 })}
              />
            </label>
            <label className="block text-sm text-gray-600">
              Carbs (g)
              <input
                type="number"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
                value={goals.carbsGoal}
                onChange={(e) => setGoals({ carbsGoal: Number(e.target.value) || 0 })}
              />
            </label>
            <label className="block text-sm text-gray-600">
              Fat (g)
              <input
                type="number"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
                value={goals.fatGoal}
                onChange={(e) => setGoals({ fatGoal: Number(e.target.value) || 0 })}
              />
            </label>
          </div>
        </section>

        <section>
          <h2 className="text-section mb-3 text-gray-900">Today</h2>
          <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
            <label className="block text-sm text-gray-600">
              Exercise calories burned (adds to remaining budget)
              <input
                type="number"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
                value={day.exerciseCalories}
                onChange={(e) => setExerciseCalories(Number(e.target.value) || 0)}
              />
            </label>
          </div>
        </section>

        <section>
          <h2 className="text-section mb-3 text-gray-900">Plan</h2>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <label className="block text-sm text-gray-600">
              Plan start date (for week counter)
              <input
                type="date"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
                value={state.planStartDate}
                onChange={(e) => e.target.value && setPlanStartDate(e.target.value)}
              />
            </label>
            <p className="mt-2 text-xs text-gray-500">
              Tip: set this to the Monday you started tracking for a meaningful week number on Home.
            </p>
          </div>
        </section>

        <section className="space-y-3 pb-24">
          <button
            type="button"
            onClick={() => resetToDemo()}
            className="w-full rounded-xl bg-gray-900 py-3 font-medium text-white"
          >
            Reset to demo data
          </button>
          <button
            type="button"
            onClick={() => {
              if (
                window.confirm(
                  'Erase all data and start the setup flow again? This cannot be undone.',
                )
              ) {
                clearAllData()
                navigate('/onboarding', { replace: true })
              }
            }}
            className="w-full rounded-xl border border-gray-300 py-3 font-medium text-gray-800"
          >
            Clear all data
          </button>
        </section>
      </div>
    </div>
  )
}
