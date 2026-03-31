import { Apple, Coffee, Cookie, Droplet, Plus, TrendingUp, Utensils } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ByteLogo } from '@/components/ByteLogo'
import { RingProgress } from '@/components/ui/ring-progress'
import { useByte } from '@/context/useByte'
import { dayNutritionTotals } from '@/lib/aggregate'
import { MEAL_LABELS, MEAL_ORDER, type MealSlot } from '@/lib/types'

const SLOT_ICONS: Record<MealSlot, typeof Coffee> = {
  breakfast: Coffee,
  lunch: Utensils,
  snack: Cookie,
  dinner: Apple,
}

export function HomePage() {
  const navigate = useNavigate()
  const { state, day, goals, weekNumber, setWaterGlasses } = useByte()
  const firstName = state.profile.name.trim().split(/\s+/)[0] ?? ''
  const totals = dayNutritionTotals(day)
  const exercise = day.exerciseCalories
  const calorieGoal = goals.calorieGoal
  const caloriesRemaining = calorieGoal - totals.calories + exercise
  const progressPercentage = Math.min(100, (totals.calories / calorieGoal) * 100)

  const macros = [
    {
      name: 'Protein',
      current: totals.protein,
      goal: goals.proteinGoal,
      ring: 'text-teal-500',
      unit: 'g',
    },
    {
      name: 'Carbs',
      current: totals.carbs,
      goal: goals.carbsGoal,
      ring: 'text-amber-500',
      unit: 'g',
    },
    {
      name: 'Fat',
      current: totals.fat,
      goal: goals.fatGoal,
      ring: 'text-rose-400',
      unit: 'g',
    },
  ]

  return (
    <div>
      <div className="relative overflow-hidden rounded-b-[2.25rem] bg-gradient-to-b from-neutral-900 via-neutral-950 to-neutral-950 px-6 pb-10 pt-14 text-white shadow-[0_24px_48px_-20px_rgba(0,0,0,0.45)]">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber-400/10 blur-3xl" aria-hidden />
        <div className="absolute -bottom-8 -left-12 h-40 w-40 rounded-full bg-white/5 blur-2xl" aria-hidden />

        <div className="relative mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white/90 ring-1 ring-white/15 backdrop-blur-sm">
            <TrendingUp className="h-3.5 w-3.5 text-amber-300/90" strokeWidth={2} />
            <span>Week {weekNumber}</span>
          </div>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <ByteLogo />
          </div>
          <div className="w-[4.5rem]" aria-hidden />
        </div>

        <div className="relative flex flex-col items-center text-center">
          <p className="mb-5 text-[15px] font-medium tracking-tight text-white/80">
            {firstName ? `Hey, ${firstName}` : 'Hey there'}
          </p>
          <RingProgress
            value={totals.calories}
            max={calorieGoal}
            size={200}
            strokeWidth={13}
            trackClassName="text-white/[0.14]"
            progressClassName="text-amber-300"
            className="mb-8"
          >
            <div className="text-display-hero tabular-nums text-white">{Math.round(caloriesRemaining)}</div>
            <div className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">
              Calories left
            </div>
            <div className="mt-2 text-xs tabular-nums text-white/55">{Math.round(progressPercentage)}% of goal</div>
          </RingProgress>

          <div className="flex w-full max-w-[17.5rem] justify-between gap-4 text-sm tabular-nums">
            <div>
              <div className="text-label mb-1 text-white/40">Goal</div>
              <div className="font-medium text-white">{calorieGoal}</div>
            </div>
            <div>
              <div className="text-label mb-1 text-white/40">Food</div>
              <div className="font-medium text-amber-200/95">{Math.round(totals.calories)}</div>
            </div>
            <div>
              <div className="text-label mb-1 text-white/40">Exercise</div>
              <div className="font-medium text-teal-300/90">{exercise}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-8">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <p className="text-label mb-1 text-stone-400">Today</p>
            <h2 className="text-section text-stone-900">Macro balance</h2>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {macros.map((macro) => {
            const pct = Math.min(100, (macro.current / macro.goal) * 100)
            return (
              <div
                key={macro.name}
                className="flex flex-col items-center rounded-3xl bg-white py-5 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.12)] ring-1 ring-stone-200/80"
              >
                <RingProgress
                  value={macro.current}
                  max={macro.goal}
                  size={80}
                  strokeWidth={5}
                  trackClassName="text-stone-200"
                  progressClassName={macro.ring}
                >
                  <div className="text-base font-semibold tabular-nums leading-none text-stone-900">
                    {Math.round(macro.current)}
                  </div>
                  <div className="mt-0.5 text-[9px] font-medium tabular-nums text-stone-400">
                    /{macro.goal}
                    {macro.unit}
                  </div>
                </RingProgress>
                <div className="mt-3 text-center text-[11px] font-semibold text-stone-500">{macro.name}</div>
                <div className="mt-0.5 text-[10px] tabular-nums text-stone-400">{Math.round(pct)}%</div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="px-6 pb-6">
        <h2 className="text-section mb-4 text-stone-900">Today&apos;s meals</h2>

        <div className="space-y-3">
          {MEAL_ORDER.map((slot) => {
            const meal = day.meals[slot]
            const Icon = SLOT_ICONS[slot]
            const empty = !meal
            return (
              <button
                type="button"
                key={slot}
                onClick={() => (empty ? navigate(`/voice?slot=${slot}`) : navigate(`/meals/${slot}`))}
                className={`w-full rounded-3xl p-4 text-left shadow-[0_6px_24px_-10px_rgba(0,0,0,0.1)] ring-1 transition-colors ${
                  empty
                    ? 'border border-dashed border-stone-200/80 bg-white/70 ring-stone-200/60'
                    : 'border-0 bg-white ring-stone-200/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                        empty ? 'bg-stone-100 text-stone-400' : 'bg-neutral-950 text-white shadow-md'
                      }`}
                    >
                      <Icon className="h-5 w-5" strokeWidth={1.75} />
                    </div>
                    <div>
                      <div className="font-medium text-stone-900">{MEAL_LABELS[slot]}</div>
                      <div className="text-sm text-stone-500">
                        {empty ? 'Not logged' : meal.timeRangeLabel}
                      </div>
                    </div>
                  </div>
                  {empty ? (
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-950 text-white shadow-md">
                      <Plus className="h-4 w-4" strokeWidth={2.5} />
                    </span>
                  ) : (
                    <div className="text-right">
                      <div className="font-semibold tabular-nums text-stone-900">{meal.calories}</div>
                      <div className="text-xs text-stone-400">cal</div>
                    </div>
                  )}
                </div>
                {!empty && meal.items.length > 0 && (
                  <div className="mt-3 pl-14">
                    {meal.items.map((item) => (
                      <div key={item.id} className="text-sm text-stone-600">
                        • {item.name} ({item.amount})
                      </div>
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="px-6 pb-8">
        <div className="rounded-3xl bg-white p-6 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.1)] ring-1 ring-stone-200/80">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 ring-1 ring-sky-500/20">
                <Droplet className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <div>
                <h2 className="text-section text-stone-900">Water</h2>
                <p className="text-xs text-stone-500">{day.waterGlasses} of 8 glasses</p>
              </div>
            </div>
            <span className="text-sm font-semibold tabular-nums text-stone-700">
              {Math.round((day.waterGlasses / 8) * 100)}%
            </span>
          </div>
          <div className="flex justify-center gap-2.5">
            {Array.from({ length: 8 }).map((_, i) => {
              const filled = i < day.waterGlasses
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setWaterGlasses(i + 1)}
                  aria-label={`Set water to ${i + 1} glasses`}
                  className={`flex h-11 w-11 items-center justify-center rounded-full border-2 transition-all ${
                    filled
                      ? 'border-sky-400 bg-sky-500 text-white shadow-md shadow-sky-500/30 ring-2 ring-sky-300/40 ring-offset-2 ring-offset-white'
                      : 'border-stone-200 bg-stone-50/80 text-stone-200 hover:border-stone-300'
                  }`}
                >
                  {filled && <Droplet className="h-4 w-4 shrink-0 text-white" fill="currentColor" />}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
