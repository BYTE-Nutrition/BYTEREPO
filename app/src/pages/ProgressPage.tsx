import { useNavigate } from 'react-router-dom'
import { AppScreenHeader } from '@/components/AppScreenHeader'
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

  const avgCalories = daily.reduce((a, d) => a + d.calories, 0) / Math.max(1, daily.length)

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
    const label = m === 'protein' ? 'Protein' : m === 'carbs' ? 'Carbs' : 'Fat'
    return { name: label, avg, goal, unit: 'g' as const }
  })

  return (
    <div className="min-h-full bg-[#f7f6f3] text-stone-800">
      <AppScreenHeader
        onBack={() => navigate(-1)}
        eyebrow="This week"
        title="Your rhythm"
        subtitle={rangeLabel}
      />

      <div className="border-b border-stone-200/80 px-6 py-8">
        <ul className="divide-y divide-stone-200/80 border-y border-stone-200/80">
          <li className="flex items-baseline justify-between py-4">
            <span className="text-sm text-stone-500">Avg intake</span>
            <span className="text-lg font-medium tabular-nums text-stone-900">
              {Math.round(avgCalories)} <span className="text-sm font-normal text-stone-400">kcal</span>
            </span>
          </li>
          <li className="flex items-baseline justify-between py-4">
            <span className="text-sm text-stone-500">Days in range</span>
            <span className="text-lg font-medium tabular-nums text-stone-900">
              {daysOnTrack}
              <span className="text-sm font-normal text-stone-400"> / 7</span>
            </span>
          </li>
          <li className="flex items-baseline justify-between py-4">
            <span className="text-sm text-stone-500">Logging streak</span>
            <span className="text-lg font-medium tabular-nums text-stone-900">
              {streak} <span className="text-sm font-normal text-stone-400">days</span>
            </span>
          </li>
        </ul>
      </div>

      <div className="px-6 py-8">
        <p className="mb-5 text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">Energy by day</p>
        <div className="mb-4 flex h-40 items-end justify-between gap-1.5">
          {daily.map((day) => {
            const percentage = day.goal > 0 ? (day.calories / day.goal) * 100 : 0
            const isOverGoal = day.calories > day.goal
            return (
              <div key={day.key} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex w-full flex-1 flex-col justify-end overflow-hidden rounded-lg bg-stone-200/50">
                  <div
                    className={`w-full rounded-t-lg ${isOverGoal ? 'bg-stone-600' : 'bg-stone-800'}`}
                    style={{ height: `${Math.min(100, percentage)}%`, minHeight: day.calories > 0 ? '4px' : 0 }}
                  />
                </div>
                <div className="text-[10px] font-medium text-stone-400">{shortWeekdayLabel(day.key)}</div>
              </div>
            )
          })}
        </div>
        <p className="text-center text-xs text-stone-400">
          Taller bars mean more logged. Darker fill is over your calorie target.
        </p>
      </div>

      <div className="px-6 pb-8">
        <p className="mb-5 text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">
          Macro averages vs goal
        </p>
        <div className="space-y-6">
          {macroWeekly.map((macro) => {
            const pct = macro.goal > 0 ? Math.min(100, (macro.avg / macro.goal) * 100) : 0
            return (
              <div key={macro.name}>
                <div className="mb-2 flex items-baseline justify-between text-sm">
                  <span className="font-medium text-stone-800">{macro.name}</span>
                  <span className="tabular-nums text-stone-500">
                    {Math.round(macro.avg)} / {macro.goal}
                    {macro.unit} <span className="text-stone-400">daily avg</span>
                  </span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-stone-200/80">
                  <div
                    className="h-full rounded-full bg-stone-700 transition-[width] duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="px-6 pb-28">
        <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">Reflection</p>
        <div className="space-y-4 text-sm leading-relaxed text-stone-600">
          <p>
            {daysOnTrack >= 4
              ? 'You’ve been steady this week. That kind of rhythm makes logging feel effortless.'
              : 'Logging on more days will make patterns easier to see—no pressure, one meal at a time.'}
          </p>
          <p>
            {macroWeekly[0].avg < goals.proteinGoal * 0.9
              ? 'If you’d like more protein, try mentioning lean meats, legumes, or dairy when you log.'
              : 'Your protein average is in a good place for the week.'}
          </p>
        </div>
      </div>
    </div>
  )
}
