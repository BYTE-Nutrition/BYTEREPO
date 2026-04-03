import { useNavigate } from 'react-router-dom'
import { AppScreenHeader } from '@/components/AppScreenHeader'
import { useByte } from '@/context/useByte'
import { USER_GOAL_OPTIONS } from '@/lib/goalsFromProfile'
import type { UserGoal } from '@/lib/types'

const field =
  'mt-2 w-full rounded-xl border border-stone-200/80 bg-white/90 px-3.5 py-3 text-[15px] text-stone-900 shadow-sm focus:border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-400/25'

const sectionTitle = 'text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400'

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
    <div className="min-h-full bg-[#f7f6f3] text-stone-800">
      <AppScreenHeader
        onBack={() => navigate(-1)}
        eyebrow="You"
        title="Profile"
        subtitle="Targets and preferences—adjust anytime."
      />

      <div className="space-y-10 px-6 pb-28 pt-2">
        <section>
          <p className={`${sectionTitle} mb-4`}>About you</p>
          <p className="mb-4 text-sm leading-relaxed text-stone-500">
            Age and goal recalculate calorie and protein targets. You can still fine-tune numbers below.
          </p>
          <div className="space-y-5 rounded-2xl border border-stone-200/60 bg-white/50 px-4 py-5">
            <label className="block text-sm font-medium text-stone-600">
              Name
              <input
                type="text"
                className={field}
                value={state.profile.name}
                onChange={(e) => updateProfile({ name: e.target.value })}
              />
            </label>
            <label className="block text-sm font-medium text-stone-600">
              Age
              <select
                className={field}
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
            <label className="block text-sm font-medium text-stone-600">
              Main goal
              <select
                className={field}
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
          <p className={`${sectionTitle} mb-4`}>Daily targets</p>
          <div className="space-y-5 rounded-2xl border border-stone-200/60 bg-white/50 px-4 py-5">
            <label className="block text-sm font-medium text-stone-600">
              Calories
              <input
                type="number"
                className={field}
                value={goals.calorieGoal}
                onChange={(e) => setGoals({ calorieGoal: Number(e.target.value) || 0 })}
              />
            </label>
            <label className="block text-sm font-medium text-stone-600">
              Protein (g)
              <input
                type="number"
                className={field}
                value={goals.proteinGoal}
                onChange={(e) => setGoals({ proteinGoal: Number(e.target.value) || 0 })}
              />
            </label>
            <label className="block text-sm font-medium text-stone-600">
              Carbs (g)
              <input
                type="number"
                className={field}
                value={goals.carbsGoal}
                onChange={(e) => setGoals({ carbsGoal: Number(e.target.value) || 0 })}
              />
            </label>
            <label className="block text-sm font-medium text-stone-600">
              Fat (g)
              <input
                type="number"
                className={field}
                value={goals.fatGoal}
                onChange={(e) => setGoals({ fatGoal: Number(e.target.value) || 0 })}
              />
            </label>
          </div>
        </section>

        <section>
          <p className={`${sectionTitle} mb-4`}>Today</p>
          <div className="rounded-2xl border border-stone-200/60 bg-white/50 px-4 py-5">
            <label className="block text-sm font-medium text-stone-600">
              Exercise calories (adds to your budget)
              <input
                type="number"
                className={field}
                value={day.exerciseCalories}
                onChange={(e) => setExerciseCalories(Number(e.target.value) || 0)}
              />
            </label>
          </div>
        </section>

        <section>
          <p className={`${sectionTitle} mb-4`}>Plan</p>
          <div className="rounded-2xl border border-stone-200/60 bg-white/50 px-4 py-5">
            <label className="block text-sm font-medium text-stone-600">
              Plan start (for week count on Home)
              <input
                type="date"
                className={field}
                value={state.planStartDate}
                onChange={(e) => e.target.value && setPlanStartDate(e.target.value)}
              />
            </label>
            <p className="mt-3 text-xs leading-relaxed text-stone-400">
              Set to the Monday you started for a meaningful week number.
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <button
            type="button"
            onClick={() => resetToDemo()}
            className="w-full rounded-2xl bg-stone-900 py-3.5 text-[15px] font-medium text-[#f5e6c8] transition-colors hover:bg-stone-800"
          >
            Reset to demo data
          </button>
          <button
            type="button"
            onClick={() => {
              if (
                window.confirm(
                  'Erase all data and start setup again? This cannot be undone.',
                )
              ) {
                clearAllData()
                navigate('/onboarding', { replace: true })
              }
            }}
            className="w-full rounded-2xl border border-stone-300/80 bg-white/60 py-3.5 text-[15px] font-medium text-stone-700"
          >
            Clear all data
          </button>
        </section>
      </div>
    </div>
  )
}
