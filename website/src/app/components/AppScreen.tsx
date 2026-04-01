import type { ReactNode } from 'react'

interface AppScreenProps {
  type: 'dashboard' | 'meals' | 'progress' | 'goals'
}

/** Matches app RingProgress math: pct = min(100, value/max) of circumference filled. */
function MiniRing({
  size,
  stroke,
  pct,
  trackClassName,
  progressClassName,
  children,
}: {
  size: number
  stroke: number
  pct: number
  trackClassName: string
  progressClassName: string
  children: ReactNode
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const dash = (Math.min(100, Math.max(0, pct)) / 100) * c
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg className="size-full -rotate-90" viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className={trackClassName}
          stroke="currentColor"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          className={progressClassName}
          stroke="currentColor"
        />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-1 text-center">
        {children}
      </div>
    </div>
  )
}

function MockByteLogo({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-xl bg-white px-2 py-0.5 shadow-[0_8px_20px_-6px_rgba(0,0,0,0.45)] ring-1 ring-black/10 ${className}`}
    >
      <span className="text-[0.72rem] font-black tracking-[0.08em] text-black">BYTE</span>
    </span>
  )
}

const MEALS_MOCK = [
  { label: 'Breakfast', sub: '8:00 – 10:00', cal: 350, icon: 'coffee' as const, filled: true },
  { label: 'Lunch', sub: 'Not logged', cal: null, icon: 'utensils' as const, filled: false },
  { label: 'Snack', sub: 'Not logged', cal: null, icon: 'cookie' as const, filled: false },
  { label: 'Dinner', sub: '6:00 – 9:00', cal: 520, icon: 'apple' as const, filled: true },
]

function MealIcon({ type }: { type: 'coffee' | 'utensils' | 'cookie' | 'apple' }) {
  const cls = 'h-4 w-4'
  if (type === 'coffee')
    return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
        <path d="M6 1v3M10 1v3M14 1v3" />
      </svg>
    )
  if (type === 'utensils')
    return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path d="M3 2v7c0 1.1.9 2 2 2h0a2 2 0 0 0 2-2V2M7 2v20M21 15V2v0a5 5 0 0 0-5 5v6" />
      </svg>
    )
  if (type === 'cookie')
    return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
        <path d="M8.5 8.5v.01M16 15.5v.01M12 12v.01M11 17v.01M7 14v.01" />
      </svg>
    )
  return (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path d="M12 20.94c1.5 0 2.75-1.06 3.16-2.44M12 20.94c-1.5 0-2.75-1.06-3.16-2.44M8.84 18.5a7 7 0 0 1 6.32 0M12 20.94V12M12 12c-2.5-3-2-7 0-10 2 3 2.5 7 0 10" />
    </svg>
  )
}

export function AppScreen({ type }: AppScreenProps) {
  if (type === 'dashboard') {
    const calorieGoal = 2100
    const food = 853
    const exercise = 120
    const remaining = calorieGoal - food + exercise
    const pctOfGoal = Math.min(100, Math.round((food / calorieGoal) * 100))

    return (
      <div className="h-full w-full overflow-y-auto bg-[#fafaf9]">
        <div className="relative overflow-hidden rounded-b-[1.75rem] bg-gradient-to-b from-neutral-900 via-neutral-950 to-neutral-950 px-3 pb-5 pt-2 text-white shadow-[0_16px_36px_-14px_rgba(0,0,0,0.4)]">
          <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-amber-400/10 blur-2xl" aria-hidden />
          <div className="absolute -bottom-6 -left-8 h-24 w-24 rounded-full bg-white/5 blur-xl" aria-hidden />

          {/* Top row clears Dynamic Island; logo sits on its own row below */}
          <div className="relative mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-[10px] font-medium text-white/90 ring-1 ring-white/15">
              <svg className="h-3 w-3 text-amber-300/90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
              <span>Week 3</span>
            </div>
            <div className="w-10" aria-hidden />
          </div>
          <div className="relative mb-4 flex justify-center">
            <MockByteLogo />
          </div>

          <div className="relative flex flex-col items-center text-center">
            <p className="mb-3 text-[13px] font-medium tracking-tight text-white/80">Hey, Alex</p>
            <MiniRing
              size={118}
              stroke={9}
              pct={(food / calorieGoal) * 100}
              trackClassName="text-white/[0.14]"
              progressClassName="text-amber-300"
            >
              <div className="text-[1.65rem] font-semibold leading-none tabular-nums text-white">{remaining}</div>
              <div className="mt-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-white/45">
                Calories left
              </div>
              <div className="mt-1 text-[10px] tabular-nums text-white/55">{pctOfGoal}% of goal</div>
            </MiniRing>

            <div className="mt-4 flex w-full max-w-[14rem] justify-between gap-2 text-[11px] tabular-nums">
              <div>
                <div className="mb-0.5 text-[9px] font-semibold uppercase tracking-[0.06em] text-white/40">Goal</div>
                <div className="font-medium text-white">{calorieGoal}</div>
              </div>
              <div>
                <div className="mb-0.5 text-[9px] font-semibold uppercase tracking-[0.06em] text-white/40">Food</div>
                <div className="font-medium text-amber-200/95">{food}</div>
              </div>
              <div>
                <div className="mb-0.5 text-[9px] font-semibold uppercase tracking-[0.06em] text-white/40">Exercise</div>
                <div className="font-medium text-teal-300/90">{exercise}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-3 py-3">
          <p className="text-[9px] font-semibold uppercase tracking-[0.06em] text-stone-400">Today</p>
          <h2 className="text-[13px] font-semibold tracking-tight text-stone-900">Macro balance</h2>
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            {[
              { name: 'Protein', cur: 45, goal: 150, ring: 'text-teal-500' },
              { name: 'Carbs', cur: 120, goal: 200, ring: 'text-amber-500' },
              { name: 'Fat', cur: 38, goal: 70, ring: 'text-rose-400' },
            ].map((m) => (
              <div
                key={m.name}
                className="flex flex-col items-center rounded-2xl bg-white py-2.5 shadow-[0_6px_20px_-10px_rgba(0,0,0,0.12)] ring-1 ring-stone-200/80"
              >
                <MiniRing
                  size={52}
                  stroke={3.5}
                  pct={(m.cur / m.goal) * 100}
                  trackClassName="text-stone-200"
                  progressClassName={m.ring}
                >
                  <div className="text-[11px] font-semibold tabular-nums leading-none text-stone-900">{m.cur}</div>
                  <div className="mt-0.5 text-[7px] font-medium tabular-nums text-stone-400">
                    /{m.goal}g
                  </div>
                </MiniRing>
                <div className="mt-1.5 text-center text-[9px] font-semibold text-stone-500">{m.name}</div>
                <div className="text-[8px] tabular-nums text-stone-400">{Math.round((m.cur / m.goal) * 100)}%</div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-3 pb-3">
          <h2 className="text-[13px] font-semibold text-stone-900">Today&apos;s meals</h2>
          <div className="mt-2 space-y-1.5">
            {MEALS_MOCK.slice(0, 3).map((meal) => (
              <div
                key={meal.label}
                className={`flex w-full items-center justify-between rounded-2xl p-2.5 text-left shadow-[0_4px_16px_-8px_rgba(0,0,0,0.1)] ring-1 ${
                  meal.filled ? 'bg-white ring-stone-200/80' : 'border border-dashed border-stone-200/80 bg-white/70 ring-stone-200/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                      meal.filled ? 'bg-neutral-950 text-white shadow-sm' : 'bg-stone-100 text-stone-400'
                    }`}
                  >
                    <MealIcon type={meal.icon} />
                  </div>
                  <div>
                    <div className="text-[12px] font-medium text-stone-900">{meal.label}</div>
                    <div className="text-[10px] text-stone-500">{meal.sub}</div>
                  </div>
                </div>
                {meal.filled && meal.cal != null ? (
                  <div className="text-right">
                    <div className="text-[12px] font-semibold tabular-nums text-stone-900">{meal.cal}</div>
                    <div className="text-[9px] text-stone-400">cal</div>
                  </div>
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-950 text-white shadow-sm">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (type === 'meals') {
    return (
      <div className="h-full w-full overflow-y-auto bg-[#fafaf9]">
        <div className="relative overflow-hidden rounded-b-[1.75rem] bg-gradient-to-b from-neutral-900 to-neutral-950 px-3 pb-5 pt-2 text-white shadow-[0_14px_32px_-12px_rgba(0,0,0,0.35)]">
          <div className="relative mb-2 flex items-center justify-between">
            <div className="-ml-0.5 rounded-full p-1.5 text-white/80">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </div>
            <div className="-mr-0.5 rounded-full p-1.5 text-white/80">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path d="M12 5v14M5 12h14" />
              </svg>
            </div>
          </div>
          <div className="relative mb-3 flex justify-center">
            <MockByteLogo />
          </div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.06em] text-center text-white/45">Today</p>
          <h1 className="text-center text-[1.15rem] font-bold tracking-tight text-white">Meals</h1>
        </div>

        <div className="space-y-1.5 px-3 py-3">
          {MEALS_MOCK.map((meal) => (
            <div
              key={meal.label}
              className={`flex w-full items-center justify-between rounded-2xl p-2.5 text-left shadow-[0_4px_16px_-8px_rgba(0,0,0,0.1)] ring-1 ${
                meal.filled ? 'bg-white ring-stone-200/80' : 'border border-dashed border-stone-200/80 bg-white/70 ring-stone-200/60'
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                    meal.filled ? 'bg-neutral-950 text-white shadow-sm' : 'bg-stone-100 text-stone-400'
                  }`}
                >
                  <MealIcon type={meal.icon} />
                </div>
                <div>
                  <div className="text-[12px] font-medium text-stone-900">{meal.label}</div>
                  <div className="text-[10px] text-stone-500">{meal.sub}</div>
                </div>
              </div>
              {meal.filled && meal.cal != null && (
                <div className="text-right">
                  <div className="text-[12px] font-semibold tabular-nums text-stone-900">{meal.cal}</div>
                  <div className="text-[9px] text-stone-400">cal</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (type === 'progress') {
    const daily = [
      { h: 72, over: false },
      { h: 88, over: false },
      { h: 65, over: false },
      { h: 95, over: true },
      { h: 70, over: false },
      { h: 82, over: false },
      { h: 58, over: false },
    ]
    const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

    return (
      <div className="h-full w-full overflow-y-auto bg-[#fafaf9]">
        <div className="relative overflow-hidden rounded-b-[1.75rem] bg-gradient-to-b from-neutral-900 via-neutral-950 to-neutral-950 px-3 pb-5 pt-2 text-white shadow-[0_16px_36px_-14px_rgba(0,0,0,0.4)]">
          <div className="absolute -right-8 top-0 h-24 w-24 rounded-full bg-amber-400/10 blur-2xl" aria-hidden />
          <div className="relative mb-2 flex items-center justify-between">
            <div className="-ml-0.5 rounded-full p-1.5 text-white/80">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </div>
            <svg className="h-4 w-4 text-white/55" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
          </div>
          <div className="relative mb-3 flex justify-center">
            <MockByteLogo />
          </div>
          <div className="text-center">
            <p className="text-[9px] font-semibold uppercase tracking-[0.06em] text-white/45">This week</p>
            <h1 className="text-[1.05rem] font-bold tracking-tight text-white">Weekly progress</h1>
            <p className="mt-0.5 text-[10px] text-white/50">Mar 23 – Mar 29</p>
          </div>
        </div>

        <div className="px-3 py-3">
          <div className="grid grid-cols-3 gap-1.5">
            {[
              {
                label: 'Avg Calories',
                value: '1,847',
                color: 'text-blue-500',
                icon: (
                  <path d="M8.5 14.5c-1.5-4 2.5-7 4-9 1 2.5 2 4 2 6.5 0 3-1.5 5.5-4 8.5-2-2.5-3.5-5-2-6z" />
                ),
              },
              {
                label: 'Days On Track',
                value: '5/7',
                color: 'text-green-500',
                icon: (
                  <>
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="6" />
                    <circle cx="12" cy="12" r="2" />
                  </>
                ),
              },
              {
                label: 'Streak',
                value: '4 days',
                color: 'text-orange-500',
                icon: <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" />,
              },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl bg-white p-2 text-center shadow-[0_6px_20px_-10px_rgba(0,0,0,0.1)] ring-1 ring-stone-200/80"
              >
                <svg className={`mx-auto mb-1 h-4 w-4 ${s.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  {s.icon}
                </svg>
                <div className="text-[13px] font-bold tabular-nums text-stone-900">{s.value}</div>
                <div className="text-[8px] font-medium text-stone-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-b border-stone-200/60 px-3 pb-3">
          <h2 className="text-[13px] font-semibold text-stone-900">Daily calorie intake</h2>
          <div className="mt-2 flex h-28 items-end justify-between gap-1">
            {daily.map((d, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex w-full flex-1 flex-col justify-end overflow-hidden rounded-lg bg-stone-100 ring-1 ring-stone-200/80">
                  <div
                    className={`w-full rounded-t-md ${d.over ? 'bg-amber-500' : 'bg-teal-500'}`}
                    style={{ height: `${d.h}%` }}
                  />
                </div>
                <div className="text-[8px] font-medium text-stone-500">{days[i]}</div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-center gap-4 text-[8px]">
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-teal-500 ring-2 ring-teal-500/25" />
              <span className="font-medium text-stone-600">On track</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-amber-500 ring-2 ring-amber-500/25" />
              <span className="font-medium text-stone-600">Over goal</span>
            </div>
          </div>
        </div>

        <div className="px-3 py-2 pb-4">
          <h2 className="text-[13px] font-semibold text-stone-900">Weekly macro averages</h2>
          <div className="mt-2 space-y-2">
            {[
              { name: 'Protein', avg: 142, goal: 150, ring: 'text-teal-500' },
              { name: 'Carbs', avg: 188, goal: 200, ring: 'text-amber-500' },
              { name: 'Fat', avg: 62, goal: 70, ring: 'text-rose-400' },
            ].map((m) => (
              <div
                key={m.name}
                className="flex items-center gap-2 rounded-2xl bg-white p-2 shadow-[0_6px_20px_-10px_rgba(0,0,0,0.1)] ring-1 ring-stone-200/80"
              >
                <MiniRing
                  size={44}
                  stroke={3.5}
                  pct={(m.avg / m.goal) * 100}
                  trackClassName="text-stone-200"
                  progressClassName={m.ring}
                >
                  <div className="text-[9px] font-bold tabular-nums text-stone-800">
                    {Math.round((m.avg / m.goal) * 100)}
                    <span className="text-[7px] font-semibold text-stone-400">%</span>
                  </div>
                </MiniRing>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-medium text-stone-900">{m.name}</div>
                  <div className="text-[9px] tabular-nums text-stone-500">
                    {m.avg} / {m.goal}g daily avg
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // goals — Profile “Daily goals” style
  return (
    <div className="h-full w-full overflow-y-auto bg-[#fafaf9]">
      <div className="relative overflow-hidden rounded-b-[1.75rem] bg-gradient-to-b from-neutral-900 to-neutral-950 px-3 pb-5 pt-2 text-white shadow-[0_14px_32px_-12px_rgba(0,0,0,0.35)]">
        <div className="relative mb-2 flex items-center justify-between">
          <div className="-ml-0.5 rounded-full p-1.5 text-white/80">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </div>
          <div className="w-7" aria-hidden />
        </div>
        <div className="relative mb-3 flex justify-center">
          <MockByteLogo />
        </div>
        <p className="text-[9px] font-semibold uppercase tracking-[0.06em] text-center text-white/45">You</p>
        <h1 className="text-center text-[1.15rem] font-bold tracking-tight text-white">Profile</h1>
      </div>

      <div className="space-y-4 px-3 py-3 pb-4">
        <section>
          <h2 className="text-[13px] font-semibold text-stone-900">Daily goals</h2>
          <div className="mt-2 space-y-2 rounded-xl border border-stone-200 bg-white p-2.5">
            {[
              { label: 'Calories', value: '2,100' },
              { label: 'Protein', value: '150 g' },
              { label: 'Carbs', value: '200 g' },
              { label: 'Fat', value: '70 g' },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between border-b border-stone-100 py-1.5 last:border-0 last:pb-0"
              >
                <span className="text-[11px] text-stone-600">{row.label}</span>
                <span className="text-[11px] font-semibold tabular-nums text-stone-900">{row.value}</span>
              </div>
            ))}
          </div>
        </section>

        <button
          type="button"
          className="w-full rounded-xl bg-neutral-950 py-2.5 text-[12px] font-medium text-white shadow-lg shadow-black/20 ring-1 ring-white/10"
        >
          Save changes
        </button>
      </div>
    </div>
  )
}
