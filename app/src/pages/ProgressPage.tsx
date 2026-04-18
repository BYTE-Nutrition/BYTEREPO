import type { CSSProperties } from 'react'
import { useMemo } from 'react'
import { ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { NoirRollover, NoirStatusBar } from '@/components/noir/NoirPrimitives'
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

  const maxChart = useMemo(() => {
    const peak = Math.max(...daily.map((d) => d.calories), goals.calorieGoal, 1)
    return peak
  }, [daily, goals.calorieGoal])

  return (
    <div className="noir-page-enter noir-screen-root noir-surface relative min-h-full text-[var(--paper)]">
      <NoirStatusBar dark />
      <div className="pb-32 pl-6 pr-6 pt-14">
        <div className="mb-8 flex items-center justify-between">
          <button
            type="button"
            aria-label="Back"
            onClick={() => navigate(-1)}
            className="noir-magnet -ml-2 rounded-full p-2 text-[var(--paper)]"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={1.75} />
          </button>
          <div className="eyebrow text-[var(--paper)]/60">This week</div>
          <div className="w-6" aria-hidden />
        </div>

        <div className="mb-10">
          <div className="eyebrow mb-3 text-[var(--paper)]/60">{rangeLabel}</div>
          <h1 className="display-serif text-[3rem] leading-[1.02] tracking-tight text-[var(--paper)]">
            Steady hand,
            <br />
            steady heat.
          </h1>
        </div>

        <div className="mb-10 border-b border-[var(--line)] pb-8">
          <div className="eyebrow mb-2 text-[var(--paper)]/60">Average intake</div>
          <div className="display-serif text-[5.75rem] leading-none tracking-tight text-[var(--paper)]">
            <NoirRollover value={Math.round(avgCalories)} />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--paper)]/50">kcal / day</div>
            <div className="font-mono text-[11px] text-[var(--paper)]/50">goal {goals.calorieGoal}</div>
          </div>
        </div>

        <div className="mb-10 grid grid-cols-3 gap-3 border-b border-[var(--line)] pb-8">
          <div>
            <div className="eyebrow mb-1 text-[var(--paper)]/55">Days in range</div>
            <div className="display-serif text-3xl leading-none">
              {daysOnTrack}
              <span className="text-[var(--paper)]/30">/7</span>
            </div>
          </div>
          <div className="col-span-2">
            <div className="eyebrow mb-1 text-[var(--paper)]/55">Logging streak</div>
            <div className="display-serif text-3xl leading-none">{streak} days</div>
          </div>
        </div>

        <div className="mb-10">
          <div className="eyebrow mb-4 text-[var(--paper)]/60">Energy by day</div>
          <div className="flex h-48 items-end justify-between gap-2">
            {daily.map((day, i) => {
              const pct = day.calories / maxChart
              const over = day.calories > day.goal
              return (
                <div key={day.key} className="flex flex-1 flex-col items-center gap-2">
                  <div className="relative flex h-full w-full flex-col justify-end">
                    <div
                      className="noir-bar-fill w-full rounded-t-sm"
                      style={
                        {
                          height: `${pct * 100}%`,
                          minHeight: day.calories > 0 ? 4 : 0,
                          background: over ? 'var(--champagne)' : 'var(--paper)',
                          '--pct': 1,
                          animationDelay: `${i * 80}ms`,
                        } as CSSProperties
                      }
                    />
                    <div
                      className="absolute left-0 right-0 border-t border-dashed border-[var(--paper)]/30"
                      style={{ bottom: `${(goals.calorieGoal / maxChart) * 100}%` }}
                    />
                  </div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--paper)]/50">
                    {shortWeekdayLabel(day.key)}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-3 font-mono text-[11px] text-[var(--paper)]/45">
            — — goal line ·{' '}
            <span className="font-semibold" style={{ color: 'var(--champagne)' }}>
              ■
            </span>{' '}
            over
          </div>
        </div>

        <div className="mb-10">
          <div className="eyebrow mb-4 text-[var(--paper)]/60">Macros vs goal · weekly avg</div>
          <div className="space-y-5">
            {macroWeekly.map((macro) => {
              const pct = macro.goal > 0 ? Math.min(1, macro.avg / macro.goal) : 0
              return (
                <div key={macro.name}>
                  <div className="mb-2 flex items-baseline justify-between">
                    <span className="display-serif text-lg text-[var(--paper)]">{macro.name}</span>
                    <span className="font-mono text-[11px] tabular-nums text-[var(--paper)]/55">
                      {Math.round(macro.avg)}
                      <span className="text-[var(--paper)]/35">
                        {' '}
                        / {macro.goal}
                        {macro.unit}
                      </span>
                    </span>
                  </div>
                  <div className="h-[3px] overflow-hidden bg-[var(--line-soft)]">
                    <div
                      className="h-full bg-[var(--paper)] transition-[width] duration-500"
                      style={{ width: `${pct * 100}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="border-t border-[var(--line)] pt-8">
          <div className="eyebrow mb-3 text-[var(--paper)]/60">Reflection</div>
          <p className="display-serif text-[22px] leading-[1.3] text-[var(--paper)]/90">
            {daysOnTrack >= 4
              ? 'You’ve been steady this week. That kind of rhythm makes logging feel effortless.'
              : 'Logging on more days will make patterns easier to see—no pressure, one meal at a time.'}{' '}
            {macroWeekly[0].avg < goals.proteinGoal * 0.9
              ? 'If you’d like more protein, try mentioning lean meats, legumes, or dairy when you log.'
              : 'Your protein average is in a good place for the week.'}
          </p>
          <div className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--paper)]/45">
            — Byte, your cooking assistant
          </div>
        </div>
      </div>
    </div>
  )
}
