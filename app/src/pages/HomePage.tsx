import type { CSSProperties } from 'react'
import { useState } from 'react'
import { ChevronRight, Menu, Mic } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { HomeMenuDrawer } from '@/components/HomeMenuDrawer'
import { NoirByteMark, NoirRollover, NoirStatusBar } from '@/components/noir/NoirPrimitives'
import { useByte } from '@/context/useByte'
import { useVoiceEntry } from '@/context/VoiceEntryContext'
import { dayNutritionTotals } from '@/lib/aggregate'
import { MEAL_LABELS, MEAL_ORDER } from '@/lib/types'

function mealGreeting(): string {
  const h = new Date().getHours()
  if (h < 11) return 'Morning service'
  if (h < 15) return 'Midday pause'
  if (h < 18) return 'Afternoon'
  return 'Evening service'
}

function formatTodayLine(): string {
  return new Date().toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
}

export function HomePage() {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const { state, day, goals, setWaterGlasses } = useByte()
  const { primeMic } = useVoiceEntry()
  const firstName = state.profile.name.trim().split(/\s+/)[0] ?? ''
  const totals = dayNutritionTotals(day)
  const exercise = day.exerciseCalories
  const calorieGoal = goals.calorieGoal
  const caloriesRemaining = Math.max(0, Math.round(calorieGoal - totals.calories + exercise))
  const loggedMeals = MEAL_ORDER.filter((s) => day.meals[s]).length
  const dateLine = formatTodayLine()

  const headline = firstName
    ? (
        <>
          {firstName}, what are you
          <br />
          <span className="noir-shimmer-on-dark">making today?</span>
        </>
      )
    : (
        <>
          What are you
          <br />
          <span className="noir-shimmer-on-dark">making today?</span>
        </>
      )

  return (
    <div className="noir-page-enter noir-screen-root noir-surface relative min-h-full">
      <NoirStatusBar dark />
      <HomeMenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="pb-32 pl-6 pr-6 pt-14">
        <div className="mb-10 flex items-center justify-between">
          <NoirByteMark size="md" />
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            aria-haspopup="dialog"
            onClick={() => setMenuOpen(true)}
            className="noir-magnet -mr-2 rounded-full p-2 text-[var(--paper)]"
          >
            <Menu className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>

        <div className="relative mb-10">
          <div className="eyebrow mb-3 text-[var(--paper)]/60">
            {mealGreeting()} · {dateLine}
          </div>
          <h1 className="display-serif text-[2.75rem] leading-[1.02] tracking-tight text-[var(--paper)]">{headline}</h1>
        </div>

        <button
          type="button"
          onClick={async () => {
            await primeMic()
            navigate('/voice?capture=1', { state: { autoStartVoice: true } })
          }}
          aria-label="Log meal with voice"
          className="noir-magnet group relative mx-auto mb-4 block focus:outline-none"
        >
          <div className="relative mx-auto h-[168px] w-[168px]">
            <div className="noir-ring absolute inset-0 rounded-full" />
            <div className="noir-ring delay-1 absolute inset-0 rounded-full" />
            <div
              className="relative h-full w-full overflow-hidden rounded-full"
              style={{
                background: 'radial-gradient(circle at 35% 32%, #2a2a2a 0%, #141414 55%, #080808 100%)',
                boxShadow:
                  'inset 0 0 30px rgba(255,255,255,0.06), inset 0 -10px 30px rgba(0,0,0,0.5), 0 20px 40px -10px rgba(0,0,0,0.6)',
                animation: 'noir-orb-breath 3.4s ease-in-out infinite',
              }}
            >
              <div className="absolute inset-0 grid place-items-center text-[var(--paper)]">
                <Mic className="h-[38px] w-[38px]" strokeWidth={1.5} />
              </div>
            </div>
          </div>
        </button>
        <div className="mb-10 text-center">
          <div className="display-serif text-[19px] text-[var(--paper)]">Tap to speak</div>
          <div className="eyebrow mt-1.5 text-[var(--paper)]/55">Byte is listening</div>
        </div>

        <div className="relative mb-10 border-y border-[var(--line)] py-4">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="eyebrow mb-1.5 text-[var(--paper)]/55">Remaining today</div>
              <div className="display-serif text-[2.75rem] leading-none text-[var(--paper)]">
                <NoirRollover value={caloriesRemaining} />
                <span className="ml-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--paper)]/45">
                  kcal
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="eyebrow mb-1.5 text-[var(--paper)]/55">Meals</div>
              <div className="display-serif text-[2rem] leading-none text-[var(--paper)]">
                {loggedMeals}
                <span className="text-[var(--paper)]/30">/{MEAL_ORDER.length}</span>
              </div>
            </div>
          </div>
          <div className="mt-4 h-0.5 w-full overflow-hidden bg-[var(--line-soft)]">
            <div
              className="noir-bar-fill h-full w-full bg-[var(--paper)]"
              style={
                {
                  width: '100%',
                  '--pct': Math.min(1, totals.calories / calorieGoal),
                } as CSSProperties
              }
            />
          </div>
          <div className="mt-5 flex justify-around">
            {(
              [
                { label: 'Protein', value: totals.protein, goal: goals.proteinGoal },
                { label: 'Carbs', value: totals.carbs, goal: goals.carbsGoal },
                { label: 'Fat', value: totals.fat, goal: goals.fatGoal },
              ] as const
            ).map(({ label, value, goal }) => {
              const pct = goal > 0 ? Math.min(1, value / goal) : 0
              const r = 20
              const circ = 2 * Math.PI * r
              const offset = circ * (1 - pct)
              return (
                <div key={label} className="flex flex-col items-center gap-2">
                  <div className="relative h-[52px] w-[52px]">
                    <svg width={52} height={52} className="-rotate-90" aria-hidden>
                      <circle
                        cx={26}
                        cy={26}
                        r={r}
                        fill="none"
                        stroke="var(--line-soft)"
                        strokeWidth={2}
                      />
                      <circle
                        cx={26}
                        cy={26}
                        r={r}
                        fill="none"
                        stroke="var(--paper)"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeDasharray={circ}
                        strokeDashoffset={offset}
                        style={{ transition: 'stroke-dashoffset 600ms cubic-bezier(0.22,1,0.36,1)' }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-mono text-[10px] tabular-nums leading-none text-[var(--paper)]">
                        {Math.round(value)}
                      </span>
                      <span className="font-mono text-[7px] leading-none text-[var(--paper)]/40">g</span>
                    </div>
                  </div>
                  <span className="eyebrow text-[9px] text-[var(--paper)]/55">{label}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mb-8">
          <div className="mb-3 flex items-baseline justify-between">
            <div className="eyebrow text-[var(--paper)]/60">Today&apos;s menu</div>
            <button
              type="button"
              onClick={() => navigate('/meals')}
              className="eyebrow text-[var(--paper)]/70 underline decoration-[0.5px] underline-offset-4"
            >
              All
            </button>
          </div>
          <div className="divide-y divide-[var(--line-soft)]">
            {MEAL_ORDER.map((slot, idx) => {
              const meal = day.meals[slot]
              const empty = !meal
              return (
                <button
                  key={slot}
                  type="button"
                  onClick={async () => {
                    if (!empty) {
                      navigate(`/meals/${slot}`)
                      return
                    }
                    await primeMic()
                    navigate(`/voice?slot=${slot}&capture=1`, { state: { autoStartVoice: true } })
                  }}
                  className="group relative flex w-full items-center gap-4 py-4 text-left"
                  style={{
                    animation: `noir-slide-up 600ms cubic-bezier(0.22,1,0.36,1) both`,
                    animationDelay: `${120 + idx * 70}ms`,
                  }}
                >
                  <span className="w-6 font-mono text-[10px] tracking-[0.2em] text-[var(--paper)]/40">
                    0{idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="display-serif text-[22px] leading-tight tracking-tight text-[var(--paper)]">
                      {MEAL_LABELS[slot]}
                    </div>
                    <div className="mt-0.5 text-xs text-[var(--paper)]/50">
                      {empty ? '— Not yet logged' : `${meal.items[0]?.name ?? ''}${meal.items.length > 1 ? ` + ${meal.items.length - 1}` : ''}`}
                    </div>
                  </div>
                  {!empty && (
                    <div className="text-right">
                      <div className="font-mono text-[13px] tabular-nums text-[var(--paper)]">{meal.calories}</div>
                      <div className="eyebrow text-[9px] text-[var(--paper)]/50">kcal</div>
                    </div>
                  )}
                  <ChevronRight
                    className="h-3.5 w-3.5 shrink-0 text-[var(--paper)]/30 transition-transform group-hover:translate-x-0.5"
                    strokeWidth={1.5}
                    aria-hidden
                  />
                </button>
              )
            })}
          </div>
        </div>

        <div className="mt-6 border-t border-[var(--line)] pt-6">
          <div className="mb-4 flex items-baseline justify-between">
            <div className="eyebrow text-[var(--paper)]/60">Hydration</div>
            <div className="font-mono text-[11px] tabular-nums text-[var(--paper)]/55">
              {day.waterGlasses}
              <span className="text-[var(--paper)]/30">/8</span>
            </div>
          </div>
          <div className="flex gap-1.5">
            {Array.from({ length: 8 }).map((_, i) => {
              const filled = i < day.waterGlasses
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setWaterGlasses(i + 1)}
                  aria-label={`Water: ${i + 1} of 8`}
                  className={`h-10 flex-1 rounded-sm transition-all ${
                    filled ? 'bg-[var(--paper)]' : 'border border-[var(--line)] bg-transparent'
                  }`}
                  style={{ transitionDelay: `${i * 40}ms` }}
                />
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}
