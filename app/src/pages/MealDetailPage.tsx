import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, Clock, Edit2, Plus, Trash2, X } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppScreenHeader } from '@/components/AppScreenHeader'
import { useByte } from '@/context/useByte'
import { getMealParseUrl, isMealParseStrict, parseMealWithApi } from '@/lib/mealParseApi'
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

function goToVoice(navigate: ReturnType<typeof useNavigate>, slot: MealSlot, prefill?: string) {
  navigate(`/voice?slot=${slot}`, prefill ? { state: { prefillTranscript: prefill } } : undefined)
}

export function MealDetailPage() {
  const navigate = useNavigate()
  const { slot: slotParam } = useParams()
  const [addSheetOpen, setAddSheetOpen] = useState(false)
  const [addDraft, setAddDraft] = useState('')
  const [addItemError, setAddItemError] = useState<string | null>(null)
  const [addItemBusy, setAddItemBusy] = useState(false)
  const slot = (MEAL_ORDER.includes(slotParam as MealSlot) ? slotParam : null) as MealSlot | null
  const { day, removeMealItem, addMealItem, clearMeal } = useByte()

  useEffect(() => {
    if (!addSheetOpen) {
      setAddItemError(null)
      setAddItemBusy(false)
    }
  }, [addSheetOpen])

  if (!slot) {
    return (
      <div className="min-h-full bg-[#f7f6f3] px-6 py-16 text-center">
        <p className="text-stone-600">Meal not found.</p>
        <button
          type="button"
          className="mt-6 text-sm font-medium text-stone-800 underline underline-offset-4"
          onClick={() => navigate('/meals')}
        >
          Back to meals
        </button>
      </div>
    )
  }

  const meal = day.meals[slot]
  if (!meal) {
    return (
      <div className="min-h-full bg-[#f7f6f3] px-6 pb-28 pt-[max(3rem,env(safe-area-inset-top))]">
        <button
          type="button"
          aria-label="Back"
          onClick={() => navigate(-1)}
          className="mb-10 -ml-1 rounded-full p-2 text-stone-500 hover:bg-stone-200/40"
        >
          <ChevronLeft className="h-5 w-5" strokeWidth={1.75} />
        </button>
        <p className="text-[15px] leading-relaxed text-stone-600">
          No {MEAL_LABELS[slot].toLowerCase()} logged yet.
        </p>
        <button
          type="button"
          className="mt-8 w-full rounded-2xl bg-stone-900 py-4 text-[15px] font-medium text-[#f5e6c8]"
          onClick={() => goToVoice(navigate, slot)}
        >
          Log with voice
        </button>
      </div>
    )
  }

  const pct = macroPercents(meal.protein, meal.carbs, meal.fat)
  const mealMacros = [
    { name: 'Protein', amount: meal.protein, percentage: pct.p },
    { name: 'Carbs', amount: meal.carbs, percentage: pct.c },
    { name: 'Fat', amount: meal.fat, percentage: pct.f },
  ]

  const prep = new Date(meal.prepStarted)
  const done = new Date(meal.mealCompleted)

  const handleSubmitAddItem = useCallback(async () => {
    const raw = addDraft.trim()
    if (!raw) return
    setAddItemError(null)
    if (isMealParseStrict()) {
      if (!getMealParseUrl()) {
        setAddItemError('API-only mode: set VITE_MEAL_PARSE_URL, then restart the dev server.')
        return
      }
      setAddItemBusy(true)
      try {
        const { items: parsed, hint } = await parseMealWithApi(raw)
        if (!parsed?.length) {
          setAddItemError(
            hint?.trim() ||
              'Meal-parse returned no items. Check USDA_API_KEY / OPENAI_API_KEY on the server, or try again.',
          )
          return
        }
        for (const p of parsed) {
          addMealItem(slot, { ...p, id: crypto.randomUUID() })
        }
        setAddDraft('')
        setAddSheetOpen(false)
      } finally {
        setAddItemBusy(false)
      }
      return
    }
    const parsed = parseMealFromTranscript(raw)
    if (parsed.length > 0) {
      for (const p of parsed) {
        addMealItem(slot, { ...p, id: crypto.randomUUID() })
      }
    } else {
      const item: MealItem = {
        id: crypto.randomUUID(),
        name: raw,
        amount: '1 serving',
        calories: 120,
        protein: 6,
        carbs: 15,
        fat: 4,
      }
      addMealItem(slot, item)
    }
    setAddDraft('')
    setAddSheetOpen(false)
  }, [addDraft, addMealItem, slot])

  return (
    <div className="min-h-full bg-[#f7f6f3] text-stone-800">
      <AppScreenHeader
        onBack={() => navigate(-1)}
        rightSlot={
          <button
            type="button"
            aria-label="Edit with voice"
            onClick={() => goToVoice(navigate, slot, meal.voiceTranscript)}
            className="-mr-1 rounded-full p-2 text-stone-500 hover:bg-stone-200/40"
          >
            <Edit2 className="h-5 w-5" strokeWidth={1.75} />
          </button>
        }
        eyebrow="Your log"
        title={MEAL_LABELS[slot]}
        subtitle={
          <span className="inline-flex items-center justify-center gap-1.5 text-stone-500">
            <Clock className="h-3.5 w-3.5" strokeWidth={1.75} />
            {meal.timeRangeLabel}
          </span>
        }
      />

      <div className="border-b border-stone-200/80 px-6 py-8 text-center">
        <p className="text-4xl font-light tabular-nums tracking-tight text-stone-900">{meal.calories}</p>
        <p className="mt-1 text-sm text-stone-500">kcal total</p>
        <p className="mx-auto mt-6 max-w-xs text-xs leading-relaxed text-stone-500">
          Protein {meal.protein}g · Carbs {meal.carbs}g · Fat {meal.fat}g
          <span className="block pt-1 text-stone-400">
            Balance ~{mealMacros[0].percentage}% / {mealMacros[1].percentage}% / {mealMacros[2].percentage}%
          </span>
        </p>
      </div>

      {meal.voiceTranscript && (
        <div className="border-b border-stone-200/80 px-6 py-8">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">You said</p>
          <p className="text-[15px] leading-relaxed text-stone-700">&ldquo;{meal.voiceTranscript}&rdquo;</p>
          <button
            type="button"
            onClick={() => goToVoice(navigate, slot, meal.voiceTranscript)}
            className="mt-4 text-sm font-medium text-stone-800 underline underline-offset-4"
          >
            Refine with voice
          </button>
        </div>
      )}

      <div className="px-6 py-8">
        <div className="mb-4 flex items-baseline justify-between">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">Ingredients</p>
          <button
            type="button"
            onClick={() => {
              setAddDraft('')
              setAddItemError(null)
              setAddSheetOpen(true)
            }}
            className="text-sm font-medium text-stone-800 underline underline-offset-4"
          >
            Add
          </button>
        </div>

        <ul className="divide-y divide-stone-200/80 border-y border-stone-200/80">
          {meal.items.map((ingredient) => (
            <li key={ingredient.id} className="py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-stone-900">{ingredient.name}</p>
                  <p className="mt-0.5 text-sm text-stone-500">{ingredient.amount}</p>
                  <p className="mt-2 text-xs tabular-nums text-stone-400">
                    {ingredient.calories} kcal · {ingredient.protein}P · {ingredient.carbs}C · {ingredient.fat}F
                  </p>
                  {ingredient.fdcId != null && (
                    <p className="mt-1 text-[11px] text-stone-400">
                      USDA FDC{' '}
                      <a
                        href={`https://fdc.nal.usda.gov/fdc-app.html#/food-details/${ingredient.fdcId}/nutrients`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-stone-600 underline underline-offset-2"
                      >
                        {ingredient.fdcId}
                      </a>
                      {ingredient.nutritionSource === 'usda' ? ' · matched from database' : null}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeMealItem(slot, ingredient.id)}
                  className="shrink-0 rounded-full p-2 text-stone-400 hover:bg-stone-200/50 hover:text-stone-600"
                  aria-label={`Remove ${ingredient.name}`}
                >
                  <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                </button>
              </div>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => {
            if (window.confirm(`Clear ${MEAL_LABELS[slot]} for today?`)) clearMeal(slot)
            navigate('/meals')
          }}
          className="mt-8 w-full rounded-2xl border border-stone-300/80 py-3.5 text-sm font-medium text-stone-600"
        >
          Clear this meal
        </button>
      </div>

      <div className="px-6 pb-28">
        <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">Timeline</p>
        <ul className="space-y-0 border-l border-stone-300/80 pl-5">
          <li className="relative pb-6">
            <span className="absolute -left-[1.36rem] top-1 h-2 w-2 rounded-full bg-stone-400" aria-hidden />
            <p className="text-sm font-medium text-stone-800">Prep</p>
            <p className="text-sm text-stone-500">
              {prep.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
            </p>
          </li>
          <li className="relative pb-6">
            <span className="absolute -left-[1.36rem] top-1 h-2 w-2 rounded-full bg-stone-400" aria-hidden />
            <p className="text-sm font-medium text-stone-800">Cooking</p>
            <p className="text-sm text-stone-500">{meal.cookingMinutes} minutes</p>
          </li>
          <li className="relative">
            <span className="absolute -left-[1.36rem] top-1 h-2 w-2 rounded-full bg-stone-600" aria-hidden />
            <p className="text-sm font-medium text-stone-800">Done</p>
            <p className="text-sm text-stone-500">
              {done.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
            </p>
          </li>
        </ul>
      </div>

      {addSheetOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-stone-900/30 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-[3px]">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 cursor-default"
            onClick={() => setAddSheetOpen(false)}
          />
          <div
            className="relative z-10 mx-auto w-full max-w-md rounded-2xl border border-stone-200/80 bg-[#faf9f7] p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[1.125rem] font-medium text-stone-900">Add ingredient</h3>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setAddSheetOpen(false)}
                className="rounded-full p-2 text-stone-500 hover:bg-stone-200/60"
              >
                <X className="h-5 w-5" strokeWidth={1.75} />
              </button>
            </div>
            <p className="mb-3 text-sm leading-relaxed text-stone-500">
              {isMealParseStrict()
                ? 'Uses meal-parse only—describe foods like on the voice log screen.'
                : 'Describe foods in plain language—same as when you talk to Byte.'}
            </p>
            <textarea
              value={addDraft}
              onChange={(e) => setAddDraft(e.target.value)}
              rows={4}
              placeholder='e.g. "1 apple" or "yogurt and berries"'
              className="mb-4 min-h-28 w-full rounded-xl border border-stone-200/80 bg-white/90 p-4 text-[15px] text-stone-900 placeholder:text-stone-400 focus:border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-400/25"
            />
            {addItemError ? (
              <p className="mb-3 text-sm leading-relaxed text-red-600/90">{addItemError}</p>
            ) : null}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setAddSheetOpen(false)}
                className="flex-1 rounded-xl border border-stone-300/80 py-3.5 text-sm font-medium text-stone-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSubmitAddItem()}
                disabled={!addDraft.trim() || addItemBusy}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-stone-900 py-3.5 text-sm font-medium text-[#f5e6c8] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus className="h-4 w-4" aria-hidden />
                {addItemBusy ? 'Adding…' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
