import { ChevronLeft, Clock, Edit2, Trash2, Utensils } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { ByteLogo } from '@/components/ByteLogo'
import { useByte } from '@/context/useByte'
import { parseMealFromTranscript } from '@/lib/nutrition'
import { MEAL_LABELS, MEAL_ORDER, type MealItem, type MealSlot } from '@/lib/types'

function macroPercents(p: number, c: number, f: number) {
  const cal = 4 * p + 4 * c + 9 * f
  if (cal <= 0) return { p: 0, c: 0, f: 0 }
  return {
    p: Math.round(((4 * p) / cal) * 100),
    c: Math.round(((4 * c) / cal) * 100),
    f: Math.round(((9 * f) / cal) * 100),
  }
}

export function MealDetailPage() {
  const navigate = useNavigate()
  const { slot: slotParam } = useParams()
  const slot = (MEAL_ORDER.includes(slotParam as MealSlot) ? slotParam : null) as MealSlot | null
  const { day, removeMealItem, addMealItem, clearMeal } = useByte()

  if (!slot) {
    return (
      <div className="p-6">
        <p className="text-gray-600">Meal not found.</p>
        <button type="button" className="mt-4 text-blue-600" onClick={() => navigate('/meals')}>
          Back to meals
        </button>
      </div>
    )
  }

  const meal = day.meals[slot]
  if (!meal) {
    return (
      <div className="p-6">
        <p className="text-gray-600">No {MEAL_LABELS[slot].toLowerCase()} logged yet.</p>
        <button
          type="button"
          className="mt-4 rounded-xl bg-black px-4 py-3 text-white"
          onClick={() => navigate(`/voice?slot=${slot}`)}
        >
          Log with voice
        </button>
      </div>
    )
  }

  const pct = macroPercents(meal.protein, meal.carbs, meal.fat)
  const mealMacros = [
    { name: 'Protein', amount: meal.protein, color: 'bg-blue-500', percentage: pct.p },
    { name: 'Carbs', amount: meal.carbs, color: 'bg-green-500', percentage: pct.c },
    { name: 'Fat', amount: meal.fat, color: 'bg-orange-500', percentage: pct.f },
  ]

  const prep = new Date(meal.prepStarted)
  const done = new Date(meal.mealCompleted)

  const handleAddItem = () => {
    const raw = window.prompt('Describe the food item (e.g. "1 apple" or "greek yogurt"):')
    if (!raw?.trim()) return
    const parsed = parseMealFromTranscript(raw)
    const item: MealItem =
      parsed[0] ??
      ({
        id: crypto.randomUUID(),
        name: raw.trim(),
        amount: '1 serving',
        calories: 120,
        protein: 6,
        carbs: 15,
        fat: 4,
      } as MealItem)
    addMealItem(slot, { ...item, id: crypto.randomUUID() })
  }

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
            aria-label="Re-log with voice"
            onClick={() => navigate(`/voice?slot=${slot}`)}
            className="rounded-lg p-1 hover:bg-white/10"
          >
            <Edit2 className="h-5 w-5" />
          </button>
        </div>

        <div className="text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white">
            <Utensils className="h-8 w-8 text-black" />
          </div>
          <h1 className="mb-1 text-2xl font-bold">{MEAL_LABELS[slot]}</h1>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-300">
            <Clock className="h-4 w-4" />
            <span>{meal.timeRangeLabel}</span>
          </div>
        </div>
      </div>

      <div className="border-b border-gray-100 bg-white px-6 py-6">
        <div className="mb-4 text-center">
          <div className="mb-2 text-5xl font-bold tabular-nums text-gray-900">{meal.calories}</div>
          <div className="text-sm text-gray-500">Total Calories</div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {mealMacros.map((macro) => (
            <div key={macro.name} className="rounded-lg bg-gray-50 p-3 text-center">
              <div className="mb-1 text-2xl font-bold tabular-nums text-gray-900">{macro.amount}g</div>
              <div className="mb-2 text-xs text-gray-500">{macro.name}</div>
              <div className={`h-1.5 w-full rounded-full ${macro.color}`} />
              <div className="mt-1 text-xs text-gray-400">{macro.percentage}%</div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-6 py-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Ingredients</h2>
          <button type="button" onClick={handleAddItem} className="text-sm font-medium text-blue-500">
            Add Item
          </button>
        </div>

        <div className="space-y-3">
          {meal.items.map((ingredient) => (
            <div key={ingredient.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="mb-3 flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="mb-1 font-medium text-gray-900">{ingredient.name}</h3>
                  <p className="text-sm text-gray-500">{ingredient.amount}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeMealItem(slot, ingredient.id)}
                  className="rounded-lg p-2 hover:bg-gray-100"
                  aria-label={`Remove ${ingredient.name}`}
                >
                  <Trash2 className="h-4 w-4 text-gray-400" />
                </button>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center text-sm">
                <div className="rounded-lg bg-gray-50 py-2">
                  <div className="font-semibold tabular-nums text-gray-900">{ingredient.calories}</div>
                  <div className="text-xs text-gray-500">cal</div>
                </div>
                <div className="rounded-lg bg-blue-50 py-2">
                  <div className="font-semibold tabular-nums text-blue-600">{ingredient.protein}g</div>
                  <div className="text-xs text-gray-500">protein</div>
                </div>
                <div className="rounded-lg bg-green-50 py-2">
                  <div className="font-semibold tabular-nums text-green-600">{ingredient.carbs}g</div>
                  <div className="text-xs text-gray-500">carbs</div>
                </div>
                <div className="rounded-lg bg-orange-50 py-2">
                  <div className="font-semibold tabular-nums text-orange-600">{ingredient.fat}g</div>
                  <div className="text-xs text-gray-500">fat</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => {
            if (window.confirm(`Clear ${MEAL_LABELS[slot]} for today?`)) clearMeal(slot)
            navigate('/meals')
          }}
          className="mt-6 w-full rounded-xl border border-red-200 py-3 text-sm font-medium text-red-600"
        >
          Clear this meal
        </button>
      </div>

      <div className="px-6 pb-24">
        <h2 className="mb-4 font-semibold text-gray-900">Cooking Timeline</h2>
        <div className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 p-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-500">
                <Clock className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">Prep Started</div>
                <div className="text-sm text-gray-600">{prep.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</div>
              </div>
            </div>
            <div className="ml-4 h-6 border-l-2 border-blue-300" />
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-500">
                <Utensils className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">Cooking Time</div>
                <div className="text-sm text-gray-600">{meal.cookingMinutes} minutes</div>
              </div>
            </div>
            <div className="ml-4 h-6 border-l-2 border-blue-300" />
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-500">
                <Clock className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">Meal Completed</div>
                <div className="text-sm text-gray-600">{done.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
