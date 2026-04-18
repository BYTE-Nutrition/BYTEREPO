import type { CSSProperties } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, Edit2, Plus, Trash2, X } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { NoirRollover, NoirStatusBar } from '@/components/noir/NoirPrimitives'
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

  const shell = 'noir-page-enter noir-screen-root noir-surface relative min-h-full text-[var(--paper)]'

  if (!slot) {
    return (
      <div className={`${shell} px-6 py-16 text-center`}>
        <p className="text-[var(--paper)]/70">Meal not found.</p>
        <button
          type="button"
          className="noir-magnet mt-6 text-sm font-medium text-[var(--paper)] underline underline-offset-4"
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
      <div className={shell}>
        <NoirStatusBar dark />
        <div className="px-6 pb-28 pt-14">
          <button
            type="button"
            aria-label="Back"
            onClick={() => navigate(-1)}
            className="noir-magnet -ml-2 mb-10 rounded-full p-2 text-[var(--paper)]"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={1.75} />
          </button>
          <p className="text-[15px] leading-relaxed text-[var(--paper)]/70">
            No {MEAL_LABELS[slot].toLowerCase()} logged yet.
          </p>
          <button
            type="button"
            className="noir-magnet mt-8 w-full rounded-full bg-[var(--paper)] py-4 text-[13px] font-medium text-[var(--ink)]"
            onClick={() => goToVoice(navigate, slot)}
          >
            Log with voice
          </button>
        </div>
      </div>
    )
  }

  const pct = macroPercents(meal.protein, meal.carbs, meal.fat)
  const mealMacros = [
    { name: 'Protein', amount: meal.protein, percentage: pct.p },
    { name: 'Carbs', amount: meal.carbs, percentage: pct.c },
    { name: 'Fat', amount: meal.fat, percentage: pct.f },
  ]

  const total = meal.calories || 1
  const pProt = ((meal.protein * 4) / total) * 100
  const pCarb = ((meal.carbs * 4) / total) * 100
  const pFat = ((meal.fat * 9) / total) * 100

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
    <div className={shell}>
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
          <div className="eyebrow text-[var(--paper)]/60">
            Course 0{MEAL_ORDER.indexOf(slot) + 1}
          </div>
          <button
            type="button"
            aria-label="Edit with voice"
            onClick={() => goToVoice(navigate, slot, meal.voiceTranscript)}
            className="-mr-2 rounded-full p-2 text-[var(--paper)]"
          >
            <Edit2 className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </button>
        </div>

        <div className="mb-8">
          <div className="eyebrow mb-3 text-[var(--paper)]/60">{meal.timeRangeLabel}</div>
          <h1 className="display-serif text-[3.25rem] leading-[0.98] tracking-tight text-[var(--paper)]">
            {MEAL_LABELS[slot]}
          </h1>
        </div>

        <div className="relative mb-8 aspect-[4/3] w-full overflow-hidden rounded-2xl border border-[var(--line)]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                repeating-linear-gradient(135deg, rgba(244,242,238,0.05) 0px, rgba(244,242,238,0.05) 1px, transparent 1px, transparent 12px),
                radial-gradient(ellipse at 30% 30%, #1a1a1a 0%, #000 60%)
              `,
            }}
          />
          <div className="absolute inset-0 grid place-items-center">
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--paper)]/40">
              [ plate photography ]
            </div>
          </div>
          <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between text-[var(--paper)]">
            <div className="display-serif max-w-[65%] text-2xl leading-tight">{meal.items[0]?.name ?? '—'}</div>
            <div className="text-right">
              <div className="display-serif text-4xl leading-none">
                <NoirRollover value={meal.calories} />
              </div>
              <div className="eyebrow mt-1 text-[9px] text-[var(--paper)]/60">kcal total</div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <div className="eyebrow mb-3 text-[var(--paper)]/60">Composition</div>
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-[var(--line-soft)]">
            <div className="noir-bar-fill bg-[var(--paper)]" style={{ width: `${pProt}%`, '--pct': 1 } as CSSProperties} />
            <div
              className="noir-bar-fill bg-[var(--paper)]/50"
              style={{ width: `${pCarb}%`, '--pct': 1 } as CSSProperties}
            />
            <div className="noir-bar-fill bg-[var(--paper)]/25" style={{ width: `${pFat}%`, '--pct': 1 } as CSSProperties} />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { l: 'Protein', v: meal.protein, dot: 'bg-[var(--paper)]' },
              { l: 'Carbs', v: meal.carbs, dot: 'bg-[var(--paper)]/50' },
              { l: 'Fat', v: meal.fat, dot: 'bg-[var(--paper)]/25' },
            ].map((m) => (
              <div key={m.l}>
                <div className="mb-1 flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${m.dot}`} />
                  <span className="eyebrow text-[var(--paper)]/60">{m.l}</span>
                </div>
                <div className="display-serif text-[22px] leading-none text-[var(--paper)]">
                  <NoirRollover value={Math.round(m.v)} />
                  <span className="ml-1 font-mono text-[10px] text-[var(--paper)]/45">g</span>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-center font-mono text-[10px] text-[var(--paper)]/45">
            Balance ~{mealMacros[0].percentage}% / {mealMacros[1].percentage}% / {mealMacros[2].percentage}%
          </p>
        </div>

        {meal.voiceTranscript && (
          <div className="mb-8 rounded-2xl border border-[var(--line)] bg-[var(--ink-2)] p-5">
            <div className="eyebrow mb-2 text-[var(--paper)]/55">You said</div>
            <p className="display-serif text-[17px] leading-snug text-[var(--paper)]">
              &ldquo;{meal.voiceTranscript}&rdquo;
            </p>
            <button
              type="button"
              onClick={() => goToVoice(navigate, slot, meal.voiceTranscript)}
              className="mt-4 font-mono text-[11px] uppercase tracking-[0.15em] text-[var(--champagne)] underline underline-offset-4"
            >
              Refine with voice
            </button>
          </div>
        )}

        <div className="mb-8">
          <div className="mb-3 flex items-baseline justify-between">
            <div className="eyebrow text-[var(--paper)]/60">On the plate</div>
            <button
              type="button"
              onClick={() => {
                setAddDraft('')
                setAddItemError(null)
                setAddSheetOpen(true)
              }}
              className="font-mono text-[11px] uppercase tracking-[0.15em] text-[var(--paper)]/70 underline underline-offset-4"
            >
              Add
            </button>
          </div>

          <ul className="divide-y divide-[var(--line-soft)] border-y border-[var(--line)]">
            {meal.items.map((ingredient, idx) => (
              <li key={ingredient.id} className="py-4">
                <div className="flex items-start justify-between gap-3">
                  <span className="w-6 shrink-0 font-mono text-[10px] text-[var(--paper)]/40">0{idx + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="display-serif text-[19px] leading-tight text-[var(--paper)]">{ingredient.name}</p>
                    <p className="mt-0.5 text-xs text-[var(--paper)]/50">{ingredient.amount}</p>
                    <p className="mt-2 font-mono text-[11px] tabular-nums text-[var(--paper)]/45">
                      {ingredient.calories} kcal · {ingredient.protein}P · {ingredient.carbs}C · {ingredient.fat}F
                    </p>
                    {ingredient.fdcId != null && (
                      <p className="mt-1 text-[11px] text-[var(--paper)]/40">
                        USDA FDC{' '}
                        <a
                          href={`https://fdc.nal.usda.gov/fdc-app.html#/food-details/${ingredient.fdcId}/nutrients`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[var(--champagne)] underline underline-offset-2"
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
                    className="shrink-0 rounded-full p-2 text-[var(--paper)]/40 hover:bg-[var(--paper)]/10 hover:text-[var(--paper)]"
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
            className="noir-magnet mt-8 w-full rounded-full border border-[var(--line-strong)] py-3.5 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--paper)]/80"
          >
            Clear this meal
          </button>
        </div>

        <div>
          <p className="eyebrow mb-4 text-[var(--paper)]/60">Timeline</p>
          <ul className="space-y-0 border-l border-[var(--line)] pl-5">
            <li className="relative pb-6">
              <span className="absolute -left-[1.36rem] top-1 h-2 w-2 rounded-full bg-[var(--paper)]/40" aria-hidden />
              <p className="text-sm font-medium text-[var(--paper)]">Prep</p>
              <p className="text-sm text-[var(--paper)]/50">
                {prep.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
              </p>
            </li>
            <li className="relative pb-6">
              <span className="absolute -left-[1.36rem] top-1 h-2 w-2 rounded-full bg-[var(--paper)]/40" aria-hidden />
              <p className="text-sm font-medium text-[var(--paper)]">Cooking</p>
              <p className="text-sm text-[var(--paper)]/50">{meal.cookingMinutes} minutes</p>
            </li>
            <li className="relative">
              <span className="absolute -left-[1.36rem] top-1 h-2 w-2 rounded-full bg-[var(--champagne)]" aria-hidden />
              <p className="text-sm font-medium text-[var(--paper)]">Done</p>
              <p className="text-sm text-[var(--paper)]/50">
                {done.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
              </p>
            </li>
          </ul>
        </div>

        <div className="mt-10 flex gap-3">
          <button
            type="button"
            onClick={() => {
              setAddDraft('')
              setAddItemError(null)
              setAddSheetOpen(true)
            }}
            className="noir-magnet flex flex-1 items-center justify-center gap-1.5 rounded-full border border-[var(--line-strong)] py-4 font-mono text-[13px] uppercase tracking-[0.2em] text-[var(--paper)]"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
            Add
          </button>
          <button
            type="button"
            onClick={() => goToVoice(navigate, slot, meal.voiceTranscript)}
            className="noir-magnet flex-1 rounded-full bg-[var(--paper)] py-4 font-mono text-[13px] uppercase tracking-[0.2em] text-[var(--ink)]"
          >
            Continue course
          </button>
        </div>
      </div>

      {addSheetOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-[3px]">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 cursor-default"
            onClick={() => setAddSheetOpen(false)}
          />
          <div
            className="byte-noir relative z-10 mx-auto w-full max-w-md rounded-2xl border border-[var(--line)] bg-[var(--ink-2)] p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="presentation"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="display-serif text-[1.125rem] text-[var(--paper)]">Add ingredient</h3>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setAddSheetOpen(false)}
                className="rounded-full p-2 text-[var(--paper)]/60 hover:bg-[var(--paper)]/10"
              >
                <X className="h-5 w-5" strokeWidth={1.75} />
              </button>
            </div>
            <p className="mb-3 text-sm leading-relaxed text-[var(--paper)]/55">
              {isMealParseStrict()
                ? 'Uses meal-parse only—describe foods like on the voice log screen.'
                : 'Describe foods in plain language—same as when you talk to Byte.'}
            </p>
            <textarea
              value={addDraft}
              onChange={(e) => setAddDraft(e.target.value)}
              rows={4}
              placeholder='e.g. "1 apple" or "yogurt and berries"'
              className="mb-4 min-h-28 w-full rounded-xl border border-[var(--line)] bg-[var(--ink-3)] p-4 text-[15px] text-[var(--paper)] placeholder:text-[var(--paper)]/35 focus:border-[var(--champagne)]/50 focus:outline-none focus:ring-1 focus:ring-[var(--champagne)]/30"
            />
            {addItemError ? <p className="mb-3 text-sm leading-relaxed text-red-400">{addItemError}</p> : null}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setAddSheetOpen(false)}
                className="flex-1 rounded-full border border-[var(--line-strong)] py-3.5 font-mono text-xs uppercase tracking-[0.15em] text-[var(--paper)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSubmitAddItem()}
                disabled={!addDraft.trim() || addItemBusy}
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[var(--paper)] py-3.5 font-mono text-xs font-medium uppercase tracking-[0.15em] text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-40"
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
