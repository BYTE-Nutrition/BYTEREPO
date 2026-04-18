import { Mic } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { NoirRollover, NoirStatusBar } from '@/components/noir/NoirPrimitives'
import { useByte } from '@/context/useByte'
import { useVoiceEntry } from '@/context/VoiceEntryContext'
import { MEAL_LABELS, MEAL_ORDER } from '@/lib/types'

function formatTodayLine(): string {
  return new Date().toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
}

export function MealsPage() {
  const navigate = useNavigate()
  const { day } = useByte()
  const { primeMic } = useVoiceEntry()

  return (
    <div className="noir-page-enter noir-screen-root noir-surface relative min-h-full">
      <NoirStatusBar dark />
      <div className="pb-32 pl-6 pr-6 pt-14">
        <div className="mb-8 flex items-center justify-between">
          <button
            type="button"
            aria-label="Back"
            onClick={() => navigate(-1)}
            className="noir-magnet -ml-2 rounded-full p-2 text-[var(--paper)]"
          >
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 6l-6 6 6 6" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Log with voice"
            onClick={async () => {
              await primeMic()
              navigate('/voice?capture=1', { state: { autoStartVoice: true } })
            }}
            className="-mr-2 rounded-full p-2 text-[var(--paper)]"
          >
            <Mic className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>

        <div className="mb-10">
          <div className="eyebrow mb-3 text-[var(--paper)]/60">Today · {formatTodayLine()}</div>
          <h1 className="display-serif text-[3rem] leading-[1.02] tracking-tight text-[var(--paper)]">
            Your
            <br />
            courses.
          </h1>
        </div>

        <div className="divide-y divide-[var(--line-soft)] border-y border-[var(--line)]">
          {MEAL_ORDER.map((slot, idx) => {
            const meal = day.meals[slot]
            const empty = !meal
            return (
              <button
                key={slot}
                type="button"
                onClick={() => (empty ? navigate(`/voice?slot=${slot}`) : navigate(`/meals/${slot}`))}
                className="group relative flex w-full gap-5 py-6 text-left"
                style={{
                  animation: `noir-slide-up 600ms cubic-bezier(0.22,1,0.36,1) both`,
                  animationDelay: `${120 + idx * 80}ms`,
                }}
              >
                <div className="w-14 shrink-0">
                  <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--paper)]/40">
                    Course
                  </div>
                  <div className="mt-1 display-serif text-[34px] leading-none text-[var(--paper)]">0{idx + 1}</div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="display-serif text-[26px] leading-tight text-[var(--paper)]">
                    {MEAL_LABELS[slot]}
                  </div>
                  <div className="mt-1 text-[13px] leading-snug text-[var(--paper)]/55">
                    {empty ? 'Awaiting ingredients' : meal.timeRangeLabel}
                  </div>
                  {!empty && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {meal.items.slice(0, 3).map((it) => (
                        <span
                          key={it.id}
                          className="rounded-full border border-[var(--line)] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--paper)]/65"
                        >
                          {it.name.length > 22 ? `${it.name.slice(0, 22)}…` : it.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  {empty ? (
                    <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--paper)]/40">
                      — · —
                    </div>
                  ) : (
                    <>
                      <div className="display-serif text-[26px] leading-none text-[var(--paper)]">
                        <NoirRollover value={meal.calories} />
                      </div>
                      <div className="eyebrow mt-1 text-[9px] text-[var(--paper)]/50">kcal</div>
                    </>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        <p className="mt-10 text-[13px] leading-relaxed text-[var(--paper)]/55">
          Each meal is a chapter. Describe aloud what you&apos;re preparing — ingredients, portions, pairings — and
          Byte will compose the rest.
        </p>
      </div>
    </div>
  )
}
