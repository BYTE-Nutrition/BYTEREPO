import { Apple, ChevronLeft, Coffee, Cookie, Plus, Utensils } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ByteLogo } from '@/components/ByteLogo'
import { useByte } from '@/context/useByte'
import { MEAL_LABELS, MEAL_ORDER, type MealSlot } from '@/lib/types'

const SLOT_ICONS: Record<MealSlot, typeof Coffee> = {
  breakfast: Coffee,
  lunch: Utensils,
  snack: Cookie,
  dinner: Apple,
}

export function MealsPage() {
  const navigate = useNavigate()
  const { day } = useByte()

  return (
    <div>
      <div className="relative overflow-hidden rounded-b-[2.25rem] bg-gradient-to-b from-neutral-900 to-neutral-950 px-6 pb-8 pt-14 text-white shadow-[0_16px_36px_-14px_rgba(0,0,0,0.35)]">
        <div className="relative mb-6 flex items-center justify-between">
          <button
            type="button"
            aria-label="Back"
            onClick={() => navigate(-1)}
            className="-ml-1 rounded-full p-2 text-white/80 hover:bg-white/10"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={1.75} />
          </button>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <ByteLogo />
          </div>
          <button
            type="button"
            aria-label="Add meal"
            onClick={() => navigate('/voice')}
            className="-mr-1 rounded-full p-2 text-white/80 hover:bg-white/10"
          >
            <Plus className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>
        <p className="text-label mb-1 text-center text-white/45">Today</p>
        <h1 className="text-display-title text-center text-white">Meals</h1>
      </div>

      <div className="space-y-3 px-6 py-6">
        {MEAL_ORDER.map((slot) => {
          const meal = day.meals[slot]
          const Icon = SLOT_ICONS[slot]
          const empty = !meal
          return (
            <button
              type="button"
              key={slot}
              onClick={() => (empty ? navigate(`/voice?slot=${slot}`) : navigate(`/meals/${slot}`))}
              className={`flex w-full items-center justify-between rounded-3xl p-4 text-left shadow-[0_6px_24px_-10px_rgba(0,0,0,0.1)] ring-1 ${
                empty
                  ? 'border border-dashed border-stone-200/80 bg-white/70 ring-stone-200/60'
                  : 'border-0 bg-white ring-stone-200/80'
              }`}
            >
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
                  <div className="text-sm text-stone-500">{empty ? 'Not logged' : meal.timeRangeLabel}</div>
                </div>
              </div>
              {!empty && (
                <div className="text-right">
                  <div className="font-semibold tabular-nums text-stone-900">{meal.calories}</div>
                  <div className="text-xs text-stone-400">cal</div>
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
