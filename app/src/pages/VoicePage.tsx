import { useCallback, useEffect, useMemo, useState } from 'react'
import { Mic, Plus, X } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ByteLogo } from '@/components/ByteLogo'
import { useByte } from '@/context/useByte'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { QUICK_SUGGESTIONS, parseMealFromTranscript, sumMealItems } from '@/lib/nutrition'
import { MEAL_LABELS, MEAL_ORDER, type MealSlot } from '@/lib/types'

function parseSlot(s: string | null): MealSlot {
  if (s && MEAL_ORDER.includes(s as MealSlot)) return s as MealSlot
  return 'lunch'
}

export function VoicePage() {
  const navigate = useNavigate()
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

  const { logMeal } = useByte()

  const speech = useSpeechRecognition({
    onError: (msg) => setError(msg),
  })

  const transcriptForDisplay = speech.displayTranscript || speech.finalText

  const handleAnalyze = useCallback(() => {
    const text = transcriptForDisplay.trim()
    if (!text) {
      setError('Add a description or use the microphone first.')
      return
    }
    setError(null)
    setCommittedTranscript(text)
    const items = parseMealFromTranscript(text)
    setPreviewItems(items)
    setStep('confirm')
    speech.stop()
  }, [speech, transcriptForDisplay])

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
    navigate('/')
  }, [committedTranscript, logMeal, navigate, previewItems, slot])

  const applySuggestion = (line: string) => {
    speech.setTranscriptManual(line)
    setError(null)
  }

  return (
    <div>
      <div className="relative bg-black px-6 pb-6 pt-14 text-white">
        <div className="relative mb-6 flex items-center justify-between">
          <button
            type="button"
            aria-label="Close"
            onClick={() => navigate(-1)}
            className="rounded-lg p-1 hover:bg-white/10"
          >
            <X className="h-6 w-6" />
          </button>
          <div className="absolute left-1/2 top-0 -translate-x-1/2">
            <ByteLogo className="text-white" />
          </div>
          <div className="w-6" />
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-bold">Voice Meal Logging</h1>
        </div>
      </div>

      <div className="px-6 py-8">
        <label className="mb-2 block text-sm font-medium text-gray-700">Meal</label>
        <select
          value={slot}
          onChange={(e) => setSlot(e.target.value as MealSlot)}
          className="mb-6 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900"
        >
          {MEAL_ORDER.map((s) => (
            <option key={s} value={s}>
              {MEAL_LABELS[s]}
            </option>
          ))}
        </select>

        {step === 'listen' && (
          <>
            <div className="mb-8 text-center">
              <button
                type="button"
                onClick={() => {
                  setError(null)
                  speech.toggle()
                }}
                className="relative mb-6 inline-flex items-center justify-center"
              >
                {speech.listening && (
                  <>
                    <div className="absolute h-48 w-48 animate-ping rounded-full bg-blue-500/20" />
                    <div className="absolute h-40 w-40 animate-pulse rounded-full bg-blue-500/30" />
                  </>
                )}
                <div
                  className={`relative flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-2xl ${!speech.supported ? 'opacity-50' : ''}`}
                >
                  <Mic className="h-16 w-16 text-white" />
                </div>
              </button>

              <h2 className="mb-2 text-xl font-semibold text-gray-900">
                {speech.listening ? 'Listening…' : speech.supported ? 'Tap the mic to speak' : 'Dictation unavailable'}
              </h2>
              <p className="text-gray-500">
                {speech.supported
                  ? 'Describe your meal naturally. You can edit the text below for accuracy.'
                  : 'Use Chrome or Edge on desktop/Android, or type your meal below.'}
              </p>
            </div>

            <label className="mb-2 block text-sm font-medium text-gray-700">Transcript (editable)</label>
            <textarea
              value={transcriptForDisplay}
              onChange={(e) => speech.setTranscriptManual(e.target.value)}
              rows={5}
              placeholder="Example: I had grilled chicken breast with mixed salad and quinoa for lunch…"
              className="mb-4 min-h-32 w-full rounded-2xl border-2 border-blue-500 p-4 text-lg leading-relaxed text-gray-900 placeholder:text-gray-400"
            />

            {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex-1 rounded-xl bg-gray-100 py-4 font-medium text-gray-900 transition-colors hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAnalyze}
                className="flex-1 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 py-4 font-medium text-white shadow-lg transition-all hover:shadow-xl"
              >
                Log Meal
              </button>
            </div>
          </>
        )}

        {step === 'confirm' && previewItems && (
          <div>
            <h3 className="mb-3 font-semibold text-gray-900">Review nutrition</h3>
            <p className="mb-4 text-sm text-gray-600">
              Parsed from your description. Adjust the transcript and go back to re-analyze if needed.
            </p>
            <ul className="mb-4 space-y-2 rounded-xl border border-gray-200 bg-white p-4">
              {previewItems.map((i) => (
                <li key={i.id} className="text-sm text-gray-800">
                  <span className="font-medium">{i.name}</span>
                  <span className="text-gray-500"> — {i.calories} cal</span>
                </li>
              ))}
            </ul>
            <div className="mb-6 grid grid-cols-2 gap-2 text-center text-sm">
              <div className="rounded-lg bg-gray-50 py-2">
                <div className="font-semibold tabular-nums">{sumMealItems(previewItems).calories}</div>
                <div className="text-xs text-gray-500">calories</div>
              </div>
              <div className="rounded-lg bg-gray-50 py-2">
                <div className="font-semibold tabular-nums">
                  {sumMealItems(previewItems).protein}g / {sumMealItems(previewItems).carbs}g /{' '}
                  {sumMealItems(previewItems).fat}g
                </div>
                <div className="text-xs text-gray-500">P / C / F</div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setStep('listen')
                  setPreviewItems(null)
                }}
                className="flex-1 rounded-xl bg-gray-100 py-4 font-medium text-gray-900 hover:bg-gray-200"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirmLog}
                className="flex-1 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 py-4 font-medium text-white shadow-lg"
              >
                Confirm
              </button>
            </div>
          </div>
        )}
      </div>

      {step === 'listen' && (
        <>
          <div className="px-6 pb-6">
            <h3 className="mb-4 font-semibold text-gray-900">Quick Add Suggestions</h3>
            <div className="space-y-2">
              {QUICK_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => applySuggestion(suggestion)}
                  className="group flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white p-4 text-left transition-all hover:border-blue-500 hover:bg-blue-50"
                >
                  <span className="text-gray-900 group-hover:text-blue-600">{suggestion}</span>
                  <Plus className="h-5 w-5 text-gray-400 group-hover:text-blue-600" />
                </button>
              ))}
            </div>
          </div>

          <div className="px-6 pb-24">
            <div className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 p-5">
              <h3 className="mb-3 font-semibold text-gray-900">How Voice Logging Works</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
                    1
                  </div>
                  <p>Speak naturally about your meal and ingredients</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
                    2
                  </div>
                  <p>Byte estimates nutrition from your words (edit text anytime)</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
                    3
                  </div>
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
