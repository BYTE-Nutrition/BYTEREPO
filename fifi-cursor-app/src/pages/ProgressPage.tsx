import { Award, Calendar, ChevronLeft, Flame, Target, TrendingUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ByteLogo } from '@/components/ByteLogo'
import { Progress } from '@/components/ui/progress'
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
    const color = m === 'protein' ? 'bg-blue-500' : m === 'carbs' ? 'bg-green-500' : 'bg-orange-500'
    const label = m === 'protein' ? 'Protein' : m === 'carbs' ? 'Carbs' : 'Fat'
    const unit = 'g'
    return { name: label, avg, goal, color, unit }
  })

  const stats = [
    { label: 'Avg Calories', value: Math.round(avgCalories).toString(), color: 'text-blue-500', icon: Flame },
    { label: 'Days On Track', value: `${daysOnTrack}/7`, color: 'text-green-500', icon: Target },
    { label: 'Streak', value: `${streak} days`, color: 'text-orange-500', icon: Award },
  ]

  return (
    <div>
      <div className="relative bg-black px-6 pb-6 pt-14 text-white">
        <div className="relative mb-6 flex items-center justify-between">
          <button type="button" aria-label="Back" onClick={() => navigate(-1)} className="rounded-lg p-1 hover:bg-white/10">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="absolute left-1/2 top-0 -translate-x-1/2">
            <ByteLogo className="text-white" />
          </div>
          <Calendar className="h-5 w-5 text-white/80" aria-hidden />
        </div>

        <div className="text-center">
          <h1 className="mb-2 text-2xl font-bold">Weekly Progress</h1>
          <p className="text-sm text-gray-300">{rangeLabel}</p>
        </div>
      </div>

      <div className="border-b border-gray-100 bg-white px-6 py-6">
        <div className="grid grid-cols-3 gap-3">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="rounded-xl bg-gray-50 p-4 text-center">
                <Icon className={`mx-auto mb-2 h-5 w-5 ${stat.color}`} />
                <div className="mb-1 text-2xl font-bold text-gray-900 tabular-nums">{stat.value}</div>
                <div className="text-xs text-gray-500">{stat.label}</div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="border-b border-gray-100 px-6 py-6">
        <h2 className="mb-4 font-semibold text-gray-900">Daily Calorie Intake</h2>
        <div className="mb-3 flex h-48 items-end justify-between gap-2">
          {daily.map((day) => {
            const percentage = (day.calories / day.goal) * 100
            const isOverGoal = day.calories > day.goal
            return (
              <div key={day.key} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex flex-1 w-full flex-col justify-end overflow-hidden rounded-lg bg-gray-100">
                  <div
                    className={`w-full rounded-t-lg ${isOverGoal ? 'bg-orange-500' : 'bg-blue-500'}`}
                    style={{ height: `${Math.min(100, percentage)}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500">{shortWeekdayLabel(day.key)}</div>
              </div>
            )
          })}
        </div>
        <div className="flex items-center justify-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded bg-blue-500" />
            <span className="text-gray-600">On Track</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded bg-orange-500" />
            <span className="text-gray-600">Over Goal</span>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        <h2 className="mb-4 font-semibold text-gray-900">Weekly Macro Averages</h2>
        <div className="space-y-4">
          {macroWeekly.map((macro) => (
            <div key={macro.name} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium text-gray-900">{macro.name}</span>
                <span className="text-sm text-gray-500 tabular-nums">
                  {Math.round(macro.avg)}/{macro.goal}
                  {macro.unit}
                </span>
              </div>
              <Progress value={Math.min(100, (macro.avg / macro.goal) * 100)} className="h-2" />
              <div className="mt-2 text-xs text-gray-500">
                {((macro.avg / macro.goal) * 100).toFixed(0)}% of weekly goal
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-6 pb-24">
        <h2 className="mb-4 font-semibold text-gray-900">Insights</h2>
        <div className="space-y-3">
          <div className="rounded-xl border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-500">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="mb-1 font-medium text-gray-900">Great Progress!</h3>
                <p className="text-sm text-gray-600">
                  {daysOnTrack >= 4
                    ? "You've been consistent this week. Keep up the good work!"
                    : 'Log meals across more days this week to see stronger trends.'}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-500">
                <Target className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="mb-1 font-medium text-gray-900">Protein Goal</h3>
                <p className="text-sm text-gray-600">
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
