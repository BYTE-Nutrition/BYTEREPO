import { useNavigate } from 'react-router-dom'
import { AppScreenHeader } from '@/components/AppScreenHeader'
import { useAuth } from '@/context/AuthContext'
import { useByte } from '@/context/useByte'
import { GOAL_PACE_OPTIONS, USER_GOAL_OPTIONS } from '@/lib/goalsFromProfile'
import type { DietaryRestriction, GoalPace, UserGoal, UserSex } from '@/lib/types'

const DIETARY_CHOICES: { id: DietaryRestriction; label: string }[] = [
  { id: 'none', label: 'No restrictions' },
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'pescatarian', label: 'Pescatarian' },
  { id: 'other', label: 'Other (describe below)' },
]

const field =
  'mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--ink-2)] px-3.5 py-3 text-[15px] text-[var(--paper)] shadow-sm focus:border-[var(--champagne)]/50 focus:outline-none focus:ring-1 focus:ring-[var(--champagne)]/30'

const sectionTitle = 'eyebrow text-[var(--paper)]/55'

export function ProfilePage() {
  const navigate = useNavigate()
  const { signOut } = useAuth()
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
    <div className="noir-page-enter noir-screen-root noir-surface relative min-h-full text-[var(--paper)]">
      <AppScreenHeader
        onBack={() => navigate(-1)}
        eyebrow="You"
        title="Profile"
        subtitle="Targets and preferences—adjust anytime."
      />

      <div className="space-y-10 px-6 pb-28 pt-2">
        <section>
          <p className={`${sectionTitle} mb-4`}>About you</p>
          <p className="mb-4 text-sm leading-relaxed text-[var(--paper)]/55">
            Body stats and goals recalculate your daily targets. You can still fine-tune numbers below.
          </p>
          <div className="space-y-5 rounded-2xl border border-[var(--line)] bg-[var(--ink-2)]/90 px-4 py-5">
            <label className="block text-sm font-medium text-[var(--paper)]/70">
              Name
              <input
                type="text"
                className={field}
                value={state.profile.name}
                onChange={(e) => updateProfile({ name: e.target.value })}
              />
            </label>
            <label className="block text-sm font-medium text-[var(--paper)]/70">
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
            <label className="block text-sm font-medium text-[var(--paper)]/70">
              Sex (for energy estimates)
              <select
                className={field}
                value={state.profile.sex}
                onChange={(e) => updateProfile({ sex: e.target.value as UserSex })}
              >
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="prefer_not_say">Prefer not to say</option>
              </select>
            </label>
            <label className="block text-sm font-medium text-[var(--paper)]/70">
              Height (cm)
              <input
                type="number"
                min={120}
                max={220}
                className={field}
                value={state.profile.heightCm}
                onChange={(e) => updateProfile({ heightCm: Number(e.target.value) || 170 })}
              />
            </label>
            <label className="block text-sm font-medium text-[var(--paper)]/70">
              Weight (kg)
              <input
                type="number"
                min={35}
                max={250}
                className={field}
                value={state.profile.weightKg}
                onChange={(e) => updateProfile({ weightKg: Number(e.target.value) || 72 })}
              />
            </label>
            <label className="block text-sm font-medium text-[var(--paper)]/70">
              Home-cooked meals / week
              <input
                type="number"
                min={0}
                max={21}
                className={field}
                value={state.profile.cooksPerWeek}
                onChange={(e) => updateProfile({ cooksPerWeek: Number(e.target.value) || 0 })}
              />
            </label>
            <label className="block text-sm font-medium text-[var(--paper)]/70">
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
            <label className="block text-sm font-medium text-[var(--paper)]/70">
              Goal pace
              <select
                className={field}
                value={state.profile.goalPace}
                onChange={(e) => updateProfile({ goalPace: e.target.value as GoalPace })}
              >
                {GOAL_PACE_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label} — {o.hint}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-[var(--paper)]/70">
              Dietary restrictions
              <select
                className={field}
                value={state.profile.dietaryRestriction}
                onChange={(e) =>
                  updateProfile({ dietaryRestriction: e.target.value as DietaryRestriction })
                }
              >
                {DIETARY_CHOICES.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-[var(--paper)]/70">
              Foods to avoid / notes
              <textarea
                className={`${field} min-h-24 resize-y`}
                rows={3}
                value={state.profile.dietaryNotes}
                placeholder={
                  state.profile.dietaryRestriction === 'other'
                    ? 'Describe what you do not eat…'
                    : 'Optional — allergies, dislikes, or other details…'
                }
                onChange={(e) => updateProfile({ dietaryNotes: e.target.value })}
              />
            </label>
          </div>
        </section>

        <section>
          <p className={`${sectionTitle} mb-4`}>Daily targets</p>
          <div className="space-y-5 rounded-2xl border border-[var(--line)] bg-[var(--ink-2)]/90 px-4 py-5">
            <label className="block text-sm font-medium text-[var(--paper)]/70">
              Calories
              <input
                type="number"
                className={field}
                value={goals.calorieGoal}
                onChange={(e) => setGoals({ calorieGoal: Number(e.target.value) || 0 })}
              />
            </label>
            <label className="block text-sm font-medium text-[var(--paper)]/70">
              Protein (g)
              <input
                type="number"
                className={field}
                value={goals.proteinGoal}
                onChange={(e) => setGoals({ proteinGoal: Number(e.target.value) || 0 })}
              />
            </label>
            <label className="block text-sm font-medium text-[var(--paper)]/70">
              Carbs (g)
              <input
                type="number"
                className={field}
                value={goals.carbsGoal}
                onChange={(e) => setGoals({ carbsGoal: Number(e.target.value) || 0 })}
              />
            </label>
            <label className="block text-sm font-medium text-[var(--paper)]/70">
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
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--ink-2)]/90 px-4 py-5">
            <label className="block text-sm font-medium text-[var(--paper)]/70">
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
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--ink-2)]/90 px-4 py-5">
            <label className="block text-sm font-medium text-[var(--paper)]/70">
              Plan start (for week count on Home)
              <input
                type="date"
                className={field}
                value={state.planStartDate}
                onChange={(e) => e.target.value && setPlanStartDate(e.target.value)}
              />
            </label>
            <p className="mt-3 text-xs leading-relaxed text-[var(--paper)]/45">
              Set to the Monday you started for a meaningful week number.
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <button
            type="button"
            onClick={() => resetToDemo()}
            className="noir-magnet w-full rounded-full bg-[var(--paper)] py-3.5 font-mono text-xs uppercase tracking-[0.18em] text-[var(--ink)]"
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
            className="w-full rounded-full border border-[var(--line-strong)] py-3.5 font-mono text-xs uppercase tracking-[0.18em] text-[var(--paper)]"
          >
            Clear all data
          </button>
          <button
            type="button"
            onClick={() => signOut()}
            className="w-full rounded-full border border-[var(--line)] py-3.5 font-mono text-xs uppercase tracking-[0.18em] text-[var(--paper)]/50"
          >
            Sign out
          </button>
        </section>
      </div>
    </div>
  )
}
