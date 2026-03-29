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
      <div className="relative bg-black px-6 pb-6 pt-14 text-white">
        <div className="relative mb-6 flex items-center justify-between">
          <button type="button" aria-label="Back" onClick={() => navigate(-1)} className="rounded-lg p-1 hover:bg-white/10">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="absolute left-1/2 top-0 -translate-x-1/2">
            <ByteLogo className="text-white" />
          </div>
          <button
            type="button"
            aria-label="Add meal"
            onClick={() => navigate('/voice')}
            className="rounded-lg p-1 hover:bg-white/10"
          >
            <Plus className="h-6 w-6" />
          </button>
        </div>
        <h1 className="text-center text-2xl font-bold">Meals</h1>
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
              className={`flex w-full items-center justify-between rounded-xl border p-4 text-left ${
                empty ? 'border-dashed border-gray-300' : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    empty ? 'bg-gray-100' : 'bg-black'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${empty ? 'text-gray-400' : 'text-white'}`} />
                </div>
                <div>
                  <div className="font-medium text-gray-900">{MEAL_LABELS[slot]}</div>
                  <div className="text-sm text-gray-500">{empty ? 'Not logged' : meal.timeRangeLabel}</div>
                </div>
              </div>
              {!empty && (
                <div className="text-right">
                  <div className="font-semibold tabular-nums text-gray-900">{meal.calories}</div>
                  <div className="text-xs text-gray-500">cal</div>
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
