import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Mic, Pencil, Plus, X } from 'lucide-react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { ByteLogo } from '@/components/ByteLogo'
import { VoiceImmersiveCapture } from '@/components/VoiceImmersiveCapture'
import { useByte } from '@/context/useByte'
import { useMicLevel } from '@/hooks/useMicLevel'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { parseMealWithApi, parseMealTranscriptBestEffort } from '@/lib/mealParseApi'
import { QUICK_SUGGESTIONS, parseMealFromTranscript, sumMealItems } from '@/lib/nutrition'
import { MEAL_LABELS, MEAL_ORDER, type MealItem, type MealSlot } from '@/lib/types'

function parseSlot(s: string | null): MealSlot {
  if (s && MEAL_ORDER.includes(s as MealSlot)) return s as MealSlot
  return 'lunch'
}

export function VoicePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const prefillApplied = useRef(false)
  const liveParseSeq = useRef(0)
  const [params] = useSearchParams()
  const initialSlot = useMemo(() => parseSlot(params.get('slot')), [params])
  const [slot, setSlot] = useState<MealSlot>(initialSlot)
  useEffect(() => {
    setSlot(initialSlot)
  }, [initialSlot])
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'listen' | 'confirm'>('listen')
  const [previewItems, setPreviewItems] = useState<ReturnType<typeof parseMealFromTranscript> | null>(
    null,
  )
  const [committedTranscript, setCommittedTranscript] = useState('')
  const [liveItems, setLiveItems] = useState<MealItem[]>([])

  const wantsImmersive =
    params.get('capture') === '1' ||
    (location.state as { immersive?: boolean } | null)?.immersive === true
  const showImmersive = wantsImmersive && step === 'listen'

  const { logMeal } = useByte()

  const speech = useSpeechRecognition({
    onError: (msg) => setError(msg),
  })

  const { level: micLevel, error: micVizError } = useMicLevel(speech.listening && showImmersive)

  useEffect(() => {
    if (!showImmersive) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [showImmersive])

  useEffect(() => {
    if (prefillApplied.current) return
    const st = location.state as { prefillTranscript?: string } | undefined
    const text = st?.prefillTranscript?.trim()
    if (!text) return
    prefillApplied.current = true
    speech.setTranscriptManual(text)
    navigate({ pathname: location.pathname, search: location.search, hash: location.hash }, { replace: true, state: null })
  }, [location.hash, location.pathname, location.search, location.state, navigate, speech])

  const transcriptForDisplay = speech.displayTranscript || speech.finalText

  const exitImmersive = useCallback(() => {
    const next = new URLSearchParams(params)
    next.delete('capture')
    const qs = next.toString()
    navigate({ pathname: location.pathname, search: qs ? `?${qs}` : '' }, { replace: true, state: null })
  }, [location.pathname, navigate, params])

  useEffect(() => {
    if (!showImmersive || step !== 'listen') {
      setLiveItems([])
      return
    }
    const text = transcriptForDisplay.trim()
    if (!text) {
      setLiveItems([])
      return
    }
    const seq = ++liveParseSeq.current
    const timer = window.setTimeout(async () => {
      const items = await parseMealTranscriptBestEffort(text)
      if (liveParseSeq.current !== seq) return
      setLiveItems(
        items.map((it, i) => ({
          ...it,
          id: it.id || `live-${i}-${it.name}`,
        })),
      )
    }, 500)
    return () => {
      window.clearTimeout(timer)
    }
  }, [showImmersive, step, transcriptForDisplay])

  const handleAnalyze = useCallback(async () => {
    const text = transcriptForDisplay.trim()
    if (!text) {
      setError('Add a description or use the microphone first.')
      return
    }
    setError(null)
    setCommittedTranscript(text)
    speech.stop()
    if (wantsImmersive) exitImmersive()
    const apiItems = await parseMealWithApi(text)
    const items =
      apiItems && apiItems.length > 0 ? apiItems : parseMealFromTranscript(text)
    setPreviewItems(items)
    setStep('confirm')
  }, [exitImmersive, speech, transcriptForDisplay, wantsImmersive])

  const handleConfirmLog = useCallback(() => {
    if (!previewItems?.length) return
    const t = sumMealItems(previewItems)
    const prep = new Date()
    const cook = 15
    const done = new Date(prep.getTime() + cook * 60_000)
    logMeal(slot, {
      calories: t.calories,
      protein: t.protein,
      carbs: t.carbs,
      fat: t.fat,
      items: previewItems,
      timeRangeLabel: `${prep.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })} - ${done.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`,
      prepStarted: prep.toISOString(),
      cookingMinutes: cook,
      mealCompleted: done.toISOString(),
      voiceTranscript: committedTranscript,
    })
    navigate('/home')
  }, [committedTranscript, logMeal, navigate, previewItems, slot])

  const applySuggestion = (line: string) => {
    speech.setTranscriptManual(line)
    setError(null)
  }

  const handleEditDescription = useCallback(() => {
    speech.stop()
    speech.setTranscriptManual(committedTranscript)
    setPreviewItems(null)
    setStep('listen')
    setError(null)
  }, [committedTranscript, speech])

  return (
    <div className="bg-gradient-to-b from-gray-50/80 to-white">
      {showImmersive && (
        <VoiceImmersiveCapture
          slot={slot}
          onSlotChange={setSlot}
          transcript={transcriptForDisplay}
          listening={speech.listening}
          speechSupported={speech.supported}
          onToggleMic={() => {
            setError(null)
            speech.toggle()
          }}
          liveItems={liveItems}
          audioLevel={micLevel}
          micVizError={micVizError}
          onClose={exitImmersive}
          onReview={() => void handleAnalyze()}
          onUseKeyboard={exitImmersive}
          bottomError={error}
        />
      )}

      <header className="border-b border-white/10 bg-neutral-950 px-6 pb-8 pt-14 text-white">
        <div className="relative mb-8 flex items-center justify-between">
          <button
            type="button"
            aria-label="Close"
            onClick={() => navigate(-1)}
            className="-ml-1 rounded-full p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" strokeWidth={1.75} />
          </button>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <ByteLogo />
          </div>
          <div className="w-9" aria-hidden />
        </div>

        <div className="text-center">
          <p className="text-label mb-2 text-white/45">Voice</p>
          <h1 className="text-display-title text-white">Voice Meal Logging</h1>
        </div>
      </header>

      <div className="px-6 pb-6 pt-10">
        <label className="text-label mb-2 block text-gray-400">Meal</label>
        <select
          value={slot}
          onChange={(e) => setSlot(e.target.value as MealSlot)}
          className="mb-10 w-full rounded-xl border-0 bg-white px-4 py-3.5 text-[15px] text-gray-900 shadow-sm ring-1 ring-black/[0.06] focus:outline-none focus:ring-2 focus:ring-black/20"
        >
          {MEAL_ORDER.map((s) => (
            <option key={s} value={s}>
              {MEAL_LABELS[s]}
            </option>
          ))}
        </select>

        {step === 'listen' && (
          <>
            <div className="mb-12 flex flex-col items-center text-center">
              <div className="relative mb-10 flex min-h-[11rem] w-full items-center justify-center">
                {speech.listening && (
                  <>
                    <div className="absolute h-[17rem] w-[17rem] animate-ping rounded-full bg-blue-500/[0.07]" />
                    <div className="absolute h-[14rem] w-[14rem] rounded-full bg-blue-500/[0.06]" />
                  </>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setError(null)
                    speech.toggle()
                  }}
                  className="relative inline-flex items-center justify-center rounded-full focus:outline-none focus-visible:ring-4 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-gray-100"
                >
                  <div
                    className={`relative flex h-40 w-40 items-center justify-center rounded-full bg-gradient-to-b from-neutral-800 to-black shadow-[0_24px_48px_-12px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.06)_inset] ${!speech.supported ? 'opacity-45' : ''}`}
                  >
                    <Mic className="h-[4.25rem] w-[4.25rem] text-white" strokeWidth={1.25} />
                  </div>
                </button>
              </div>

              <h2 className="mb-3 max-w-[20rem] text-lg font-semibold leading-snug tracking-tight text-gray-900">
                {speech.listening ? 'Listening…' : speech.supported ? 'Tap the mic to speak' : 'Dictation unavailable'}
              </h2>
              <p className="max-w-[19rem] text-sm leading-relaxed text-gray-500">
                {speech.supported
                  ? 'Describe your meal naturally. You can edit the text below for accuracy.'
                  : 'Use Chrome or Edge on desktop/Android, or type your meal below.'}
              </p>
            </div>

            <div className="mb-6">
              <label className="text-label mb-2 block text-gray-400">Description</label>
              <textarea
                value={transcriptForDisplay}
                onChange={(e) => speech.setTranscriptManual(e.target.value)}
                rows={5}
                placeholder="Example: I had grilled chicken breast with mixed salad and quinoa for lunch…"
                className="min-h-36 w-full rounded-2xl border-0 bg-white p-5 text-[17px] leading-relaxed text-gray-900 shadow-sm ring-1 ring-black/[0.06] transition-shadow placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/15"
              />
            </div>

            {error && <p className="mb-6 text-sm leading-relaxed text-red-600">{error}</p>}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex-1 rounded-xl bg-white py-4 text-[15px] font-medium text-gray-800 shadow-sm ring-1 ring-black/[0.06] transition-colors hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAnalyze}
                className="flex-1 rounded-xl bg-neutral-950 py-4 text-[15px] font-medium text-white shadow-lg transition-all hover:bg-black active:scale-[0.99]"
              >
                Review
              </button>
            </div>
          </>
        )}

        {step === 'confirm' && previewItems && (
          <div className="space-y-8">
            <div>
              <p className="text-label mb-2 text-gray-400">Check before saving</p>
              <h3 className="text-xl font-semibold tracking-tight text-gray-900">Review estimate</h3>
              <p className="mt-3 text-sm leading-relaxed text-gray-500">
                We match ingredients to a local library and fill gaps with a rough estimate. Edit your
                description anytime, then review again.
              </p>
            </div>
            <ul className="space-y-0 divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white p-1 shadow-sm ring-1 ring-black/[0.04]">
              {previewItems.map((i) => (
                <li key={i.id} className="px-4 py-4 text-[15px] text-gray-800 first:pt-3 last:pb-3">
                  <span className="font-medium">{i.name}</span>
                  <span className="text-gray-500"> — {i.calories} cal</span>
                </li>
              ))}
            </ul>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="rounded-2xl bg-gray-50/90 py-5 ring-1 ring-black/[0.04]">
                <div className="text-stat tabular-nums text-gray-900">{sumMealItems(previewItems).calories}</div>
                <div className="mt-1 text-xs font-medium text-gray-500">calories</div>
              </div>
              <div className="rounded-2xl bg-gray-50/90 py-5 ring-1 ring-black/[0.04]">
                <div className="font-semibold tabular-nums text-sm leading-snug text-gray-900">
                  {sumMealItems(previewItems).protein}g / {sumMealItems(previewItems).carbs}g /{' '}
                  {sumMealItems(previewItems).fat}g
                </div>
                <div className="mt-1 text-xs font-medium text-gray-500">P / C / F</div>
              </div>
            </div>
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleConfirmLog}
                className="w-full rounded-xl bg-neutral-950 py-4 text-[15px] font-medium text-white shadow-lg transition-all hover:bg-black active:scale-[0.99]"
              >
                Save to log
              </button>
              <button
                type="button"
                onClick={handleEditDescription}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3.5 text-sm font-medium text-gray-800 shadow-sm ring-1 ring-black/[0.06] transition-colors hover:bg-gray-50"
              >
                <Pencil className="h-4 w-4 text-gray-400" aria-hidden />
                Edit description
              </button>
            </div>
          </div>
        )}
      </div>

      {step === 'listen' && (
        <>
          <div className="px-6 pb-8">
            <p className="text-label mb-4 text-gray-400">Quick add</p>
            <div className="space-y-3">
              {QUICK_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => applySuggestion(suggestion)}
                  className="group flex w-full items-center justify-between rounded-2xl border border-gray-100 bg-white px-5 py-4 text-left shadow-sm ring-1 ring-black/[0.03] transition-colors hover:border-gray-200 hover:bg-gray-50/80"
                >
                  <span className="text-[15px] text-gray-800">{suggestion}</span>
                  <Plus className="h-5 w-5 shrink-0 text-gray-300 transition-colors group-hover:text-gray-500" />
                </button>
              ))}
            </div>
          </div>

          <div className="px-6 pb-28">
            <div className="rounded-2xl border border-gray-100 bg-gray-50/90 p-6 ring-1 ring-black/[0.03]">
              <p className="text-label mb-3 text-gray-400">How it works</p>
              <h3 className="mb-5 text-base font-semibold tracking-tight text-gray-900">Voice logging</h3>
              <div className="space-y-5 text-sm leading-relaxed text-gray-600">
                <div className="flex gap-4">
                  <span className="text-label mt-0.5 w-6 shrink-0 text-gray-400">01</span>
                  <p>Speak naturally about your meal and ingredients</p>
                </div>
                <div className="flex gap-4">
                  <span className="text-label mt-0.5 w-6 shrink-0 text-gray-400">02</span>
                  <p>Byte estimates nutrition from your words (edit text anytime)</p>
                </div>
                <div className="flex gap-4">
                  <span className="text-label mt-0.5 w-6 shrink-0 text-gray-400">03</span>
                  <p>Review and confirm to add to your daily log</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
