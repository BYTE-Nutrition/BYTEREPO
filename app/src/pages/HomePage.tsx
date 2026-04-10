import { useState } from 'react'
import { ChevronRight, Droplet, Menu, Mic } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ByteLogo } from '@/components/ByteLogo'
import { HomeMenuDrawer } from '@/components/HomeMenuDrawer'
import { useByte } from '@/context/useByte'
import { useVoiceEntry } from '@/context/VoiceEntryContext'
import { dayNutritionTotals } from '@/lib/aggregate'
import { MEAL_LABELS, MEAL_ORDER } from '@/lib/types'

function mealGreeting(): string {
  const h = new Date().getHours()
  if (h < 11) return 'Morning in the kitchen'
  if (h < 15) return 'Midday fuel'
  if (h < 18) return 'Afternoon bite'
  return 'Evening meal'
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
  const caloriesRemaining = Math.round(calorieGoal - totals.calories + exercise)

  const loggedMeals = MEAL_ORDER.filter((s) => day.meals[s]).length

  return (
    <div className="min-h-full bg-[#f7f6f3] text-stone-800">
      <HomeMenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="px-6 pb-4 pt-[max(3rem,env(safe-area-inset-top))]">
        <div className="relative mb-12 flex items-center justify-center">
          <span className="pointer-events-none absolute left-0 w-10 shrink-0" aria-hidden />
          <ByteLogo />
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            aria-haspopup="dialog"
            onClick={() => setMenuOpen(true)}
            className="absolute right-0 rounded-full p-2 text-stone-600 transition-colors hover:bg-stone-200/50 hover:text-stone-900"
          >
            <Menu className="h-6 w-6" strokeWidth={1.75} />
          </button>
        </div>

        <header className="mb-14 text-center">
          <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-stone-400">
            {mealGreeting()}
          </p>
          <h1 className="mx-auto max-w-[16rem] text-[1.625rem] font-medium leading-snug tracking-[-0.02em] text-stone-900">
            {firstName ? `${firstName}, what are you making?` : 'What are you making?'}
          </h1>
          <p className="mx-auto mt-4 max-w-[17rem] text-[15px] font-normal leading-relaxed text-stone-500">
            Speak naturally. I’ll track ingredients and nutrition as you go.
          </p>
        </header>

        <div className="mb-16 flex flex-col items-center">
          <button
            type="button"
            onClick={async () => {
              await primeMic()
              navigate('/voice?capture=1', { state: { autoStartVoice: true } })
            }}
            aria-label="Log meal with voice"
            className="group flex h-[5.5rem] w-[5.5rem] items-center justify-center rounded-full bg-stone-900 shadow-[0_20px_50px_-18px_rgba(0,0,0,0.35)] transition-transform active:scale-[0.97] motion-safe:transition-shadow motion-safe:duration-300 hover:shadow-[0_24px_56px_-16px_rgba(0,0,0,0.4)]"
          >
            <Mic
              className="h-9 w-9 text-[#f5e6c8] transition-transform duration-300 group-hover:scale-105"
              strokeWidth={1.75}
            />
          </button>
          <p className="mt-5 text-[13px] font-medium tracking-wide text-stone-600">Tap to speak</p>
          <p className="mt-1 text-xs text-stone-400">Your cooking assistant</p>
        </div>

        <p className="mb-10 text-center text-[13px] leading-relaxed text-stone-500">
          <span className="text-stone-700 tabular-nums">{caloriesRemaining}</span>
          <span className="text-stone-400"> kcal left today</span>
          <span className="mx-2 text-stone-300" aria-hidden>
            ·
          </span>
          <span className="tabular-nums text-stone-500">
            {loggedMeals}/{MEAL_ORDER.length} meals
          </span>
        </p>

        <div className="mb-2 px-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">Today</p>
        </div>

        <ul className="mb-12 divide-y divide-stone-200/80 border-y border-stone-200/80">
          {MEAL_ORDER.map((slot) => {
            const meal = day.meals[slot]
            const empty = !meal
            return (
              <li key={slot}>
                <button
                  type="button"
                  onClick={() => (empty ? navigate(`/voice?slot=${slot}`) : navigate(`/meals/${slot}`))}
                  className="flex w-full items-center gap-4 py-4 text-left transition-colors active:bg-stone-200/30"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-[15px] font-medium tracking-tight text-stone-900">
                      {MEAL_LABELS[slot]}
                    </div>
                    <div className="mt-0.5 text-sm text-stone-500">
                      {empty ? 'Not logged yet' : meal.timeRangeLabel}
                    </div>
                  </div>
                  {!empty && meal.items.length > 0 && (
                    <div className="max-w-[38%] shrink truncate text-right text-sm text-stone-500">
                      {meal.items[0]?.name}
                      {meal.items.length > 1 ? ` +${meal.items.length - 1}` : ''}
                    </div>
                  )}
                  <div className="flex shrink-0 items-center gap-2">
                    {!empty && (
                      <span className="text-sm tabular-nums text-stone-600">{meal.calories}</span>
                    )}
                    <ChevronRight className="h-4 w-4 text-stone-300" strokeWidth={1.5} aria-hidden />
                  </div>
                </button>
              </li>
            )
          })}
        </ul>

        <div className="border-t border-stone-200/80 pt-8">
          <div className="mb-4 flex items-baseline justify-between px-1">
            <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">Hydration</span>
            <span className="text-xs tabular-nums text-stone-400">{day.waterGlasses} / 8</span>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {Array.from({ length: 8 }).map((_, i) => {
              const filled = i < day.waterGlasses
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setWaterGlasses(i + 1)}
                  aria-label={`Water: ${i + 1} of 8 glasses`}
                  className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${
                    filled
                      ? 'border-sky-400/50 bg-sky-500/90 text-white'
                      : 'border-stone-200 bg-white/60 text-stone-300 hover:border-stone-300'
                  }`}
                >
                  {filled ? <Droplet className="h-4 w-4" strokeWidth={1.75} fill="currentColor" /> : null}
                </button>
              )
            })}
          </div>
        </div>

        <p className="mt-12 pb-4 text-center text-[11px] leading-relaxed text-stone-400">
          Protein {Math.round(totals.protein)}g · Carbs {Math.round(totals.carbs)}g · Fat {Math.round(totals.fat)}g
        </p>
      </div>
    </div>
  )
}
