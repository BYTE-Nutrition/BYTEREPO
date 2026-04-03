import { ChevronRight, Mic } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AppScreenHeader } from '@/components/AppScreenHeader'
import { useByte } from '@/context/useByte'
import { MEAL_LABELS, MEAL_ORDER } from '@/lib/types'

export function MealsPage() {
  const navigate = useNavigate()
  const { day } = useByte()

  return (
    <div className="min-h-full bg-[#f7f6f3] text-stone-800">
      <AppScreenHeader
        onBack={() => navigate(-1)}
        eyebrow="Today"
        title="Meals"
        subtitle="Tap a slot to view or add."
        rightSlot={
          <button
            type="button"
            aria-label="Log with voice"
            onClick={() => navigate('/voice?capture=1')}
            className="-mr-1 rounded-full p-2 text-amber-700 transition-colors hover:bg-stone-200/50"
          >
            <Mic className="h-5 w-5" strokeWidth={1.75} />
          </button>
        }
      />

      <ul className="divide-y divide-stone-200/80 border-y border-stone-200/80 px-6">
        {MEAL_ORDER.map((slot) => {
          const meal = day.meals[slot]
          const empty = !meal
          return (
            <li key={slot}>
              <button
                type="button"
                onClick={() => (empty ? navigate(`/voice?slot=${slot}`) : navigate(`/meals/${slot}`))}
                className="flex w-full items-center gap-4 py-4 text-left transition-colors active:bg-stone-200/25"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] font-medium tracking-tight text-stone-900">{MEAL_LABELS[slot]}</div>
                  <div className="mt-0.5 text-sm text-stone-500">
                    {empty ? 'Not logged yet' : meal.timeRangeLabel}
                  </div>
                </div>
                {!empty && (
                  <span className="shrink-0 text-sm tabular-nums text-stone-600">{meal.calories} kcal</span>
                )}
                <ChevronRight className="h-4 w-4 shrink-0 text-stone-300" strokeWidth={1.5} aria-hidden />
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
