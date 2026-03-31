import { Award, Calendar, ChevronLeft, Flame, Target, TrendingUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ByteLogo } from '@/components/ByteLogo'
import { RingProgress } from '@/components/ui/ring-progress'
import { useByte } from '@/context/useByte'
import { dayNutritionTotals } from '@/lib/aggregate'
import { dateKey, parseKey, rollingWeekKeys, shortWeekdayLabel, weekRangeLabel } from '@/lib/dates'
import { emptyDay } from '@/lib/storage'

export function ProgressPage() {
  const navigate = useNavigate()
  const { state, goals, todayKey: tk } = useByte()
  const keys = rollingWeekKeys(tk)
  const rangeLabel = weekRangeLabel(keys[keys.length - 1])

  const daily = keys.map((k) => {
    const day = state.days[k] ?? emptyDay()
    const t = dayNutritionTotals(day)
    return { key: k, calories: t.calories, goal: goals.calorieGoal }
  })

  const avgCalories =
    daily.reduce((a, d) => a + d.calories, 0) / Math.max(1, daily.length)

  const daysOnTrack = daily.filter((d) => d.calories > 0 && d.calories <= d.goal).length

  const streak = (() => {
    let n = 0
    let k = tk
    for (let i = 0; i < 400; i++) {
      const day = state.days[k] ?? emptyDay()
      const cals = dayNutritionTotals(day).calories
      if (cals <= 0) break
      if (cals > goals.calorieGoal * 1.08) break
      n++
      const d = parseKey(k)
      d.setDate(d.getDate() - 1)
      k = dateKey(d)
    }
    return n
  })()

  const macroWeekly = (['protein', 'carbs', 'fat'] as const).map((m) => {
    const goalKey = m === 'protein' ? 'proteinGoal' : m === 'carbs' ? 'carbsGoal' : 'fatGoal'
    const goal = goals[goalKey]
    let sum = 0
    for (const k of keys) {
      const day = state.days[k] ?? emptyDay()
      for (const slot of Object.values(day.meals)) {
        if (!slot) continue
        sum += slot[m]
      }
    }
    const avg = sum / 7
    const ring = m === 'protein' ? 'text-teal-500' : m === 'carbs' ? 'text-amber-500' : 'text-rose-400'
    const label = m === 'protein' ? 'Protein' : m === 'carbs' ? 'Carbs' : 'Fat'
    const unit = 'g'
    return { name: label, avg, goal, ring, unit }
  })

  const stats = [
    { label: 'Avg Calories', value: Math.round(avgCalories).toString(), color: 'text-blue-500', icon: Flame },
    { label: 'Days On Track', value: `${daysOnTrack}/7`, color: 'text-green-500', icon: Target },
    { label: 'Streak', value: `${streak} days`, color: 'text-orange-500', icon: Award },
  ]

  return (
    <div>
      <div className="relative overflow-hidden rounded-b-[2.25rem] bg-gradient-to-b from-neutral-900 via-neutral-950 to-neutral-950 px-6 pb-8 pt-14 text-white shadow-[0_20px_40px_-18px_rgba(0,0,0,0.4)]">
        <div className="absolute -right-12 top-0 h-36 w-36 rounded-full bg-amber-400/10 blur-3xl" aria-hidden />
        <div className="relative mb-6 flex items-center justify-between">
          <button
            type="button"
            aria-label="Back"
            onClick={() => navigate(-1)}
            className="-ml-1 rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={1.75} />
          </button>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <ByteLogo />
          </div>
          <Calendar className="h-5 w-5 text-white/55" aria-hidden strokeWidth={1.75} />
        </div>

        <div className="relative text-center">
          <p className="text-label mb-2 text-white/45">This week</p>
          <h1 className="text-display-title mb-2 text-white">Weekly progress</h1>
          <p className="text-sm text-white/50">{rangeLabel}</p>
        </div>
      </div>

      <div className="px-6 py-8">
        <div className="grid grid-cols-3 gap-3">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div
                key={stat.label}
                className="rounded-2xl bg-white p-4 text-center shadow-[0_8px_28px_-12px_rgba(0,0,0,0.1)] ring-1 ring-stone-200/80"
              >
                <Icon className={`mx-auto mb-2 h-5 w-5 ${stat.color}`} strokeWidth={1.75} />
                <div className="text-stat mb-1 text-stone-900 tabular-nums">{stat.value}</div>
                <div className="text-[11px] font-medium text-stone-500">{stat.label}</div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="border-b border-stone-200/60 px-6 py-6">
        <h2 className="text-section mb-4 text-stone-900">Daily calorie intake</h2>
        <div className="mb-3 flex h-48 items-end justify-between gap-2">
          {daily.map((day) => {
            const percentage = (day.calories / day.goal) * 100
            const isOverGoal = day.calories > day.goal
            return (
              <div key={day.key} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex w-full flex-1 flex-col justify-end overflow-hidden rounded-xl bg-stone-100 ring-1 ring-stone-200/80">
                  <div
                    className={`w-full rounded-t-xl ${isOverGoal ? 'bg-amber-500' : 'bg-teal-500'}`}
                    style={{ height: `${Math.min(100, percentage)}%` }}
                  />
                </div>
                <div className="text-[11px] font-medium text-stone-500">{shortWeekdayLabel(day.key)}</div>
              </div>
            )
          })}
        </div>
        <div className="flex items-center justify-center gap-5 text-xs">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-teal-500 ring-2 ring-teal-500/25" />
            <span className="font-medium text-stone-600">On track</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-amber-500/25" />
            <span className="font-medium text-stone-600">Over goal</span>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        <h2 className="text-section mb-4 text-stone-900">Weekly macro averages</h2>
        <div className="space-y-4">
          {macroWeekly.map((macro) => (
            <div
              key={macro.name}
              className="flex items-center gap-4 rounded-3xl bg-white p-4 shadow-[0_8px_28px_-12px_rgba(0,0,0,0.1)] ring-1 ring-stone-200/80"
            >
              <RingProgress
                value={macro.avg}
                max={macro.goal}
                size={72}
                strokeWidth={5}
                trackClassName="text-stone-200"
                progressClassName={macro.ring}
                className="shrink-0"
              >
                <div className="text-xs font-bold tabular-nums text-stone-800">
                  {((macro.avg / macro.goal) * 100).toFixed(0)}
                  <span className="text-[9px] font-semibold text-stone-400">%</span>
                </div>
              </RingProgress>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-stone-900">{macro.name}</div>
                <div className="mt-0.5 text-sm tabular-nums text-stone-500">
                  {Math.round(macro.avg)} / {macro.goal}
                  {macro.unit} daily avg
                </div>
                <div className="mt-1 text-xs text-stone-400">vs. your goal (7-day)</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-6 pb-24">
        <h2 className="text-section mb-4 text-stone-900">Notes</h2>
        <div className="space-y-3">
          <div className="rounded-3xl bg-stone-100/90 p-5 ring-1 ring-stone-200/80">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-teal-600 shadow-sm ring-1 ring-stone-200/80">
                <TrendingUp className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <div>
                <h3 className="mb-1 font-semibold text-stone-900">Consistency</h3>
                <p className="text-sm leading-relaxed text-stone-600">
                  {daysOnTrack >= 4
                    ? "You've been consistent this week. Keep up the good work!"
                    : 'Log meals across more days this week to see stronger trends.'}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-stone-100/90 p-5 ring-1 ring-stone-200/80">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-amber-600 shadow-sm ring-1 ring-stone-200/80">
                <Target className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <div>
                <h3 className="mb-1 font-semibold text-stone-900">Protein</h3>
                <p className="text-sm leading-relaxed text-stone-600">
                  {macroWeekly[0].avg < goals.proteinGoal * 0.9
                    ? 'Consider adding more protein to reach your daily target.'
                    : 'Your protein average looks solid for the week.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
