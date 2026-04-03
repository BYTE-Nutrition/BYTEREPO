import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Mic, Pencil, Plus } from 'lucide-react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { AppScreenHeader } from '@/components/AppScreenHeader'
import { VoiceImmersiveCapture } from '@/components/VoiceImmersiveCapture'
import { useByte } from '@/context/useByte'
import { useMicLevel } from '@/hooks/useMicLevel'
import { useOpenAiRealtimeVoice } from '@/hooks/useOpenAiRealtimeVoice'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { getCookingTips } from '@/lib/cookingTips'
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

  const realtimeSessionUrl = import.meta.env.VITE_REALTIME_SESSION_URL
  const realtimeConfigured = Boolean(realtimeSessionUrl?.trim())
  const realtimeAudioRef = useRef<HTMLAudioElement>(null)
  const [fallbackSpeech, setFallbackSpeech] = useState(false)

  const speech = useSpeechRecognition({
    onError: (msg) => setError(msg),
  })

  const realtime = useOpenAiRealtimeVoice({
    sessionUrl: realtimeSessionUrl,
    audioRef: realtimeAudioRef,
    onError: (msg) => {
      setError(msg)
      setFallbackSpeech(true)
    },
  })

  useEffect(() => {
    if (showImmersive && realtimeConfigured) {
      setFallbackSpeech(false)
    }
  }, [showImmersive, realtimeConfigured])

  useEffect(() => {
    if (showImmersive) return
    const st = realtime.status
    if (st !== 'live' && st !== 'connecting') return
    if (st === 'live') {
      speech.setTranscriptManual(realtime.userTranscript)
    }
    realtime.disconnect()
  }, [showImmersive, realtime.disconnect, realtime.status, realtime.userTranscript, speech])

  const immersiveRealtimeOn =
    showImmersive && realtimeConfigured && !fallbackSpeech

  const immersiveListening = immersiveRealtimeOn
    ? realtime.status === 'live' || realtime.status === 'connecting'
    : speech.listening

  const { level: micLevel, error: micVizError } = useMicLevel(
    immersiveListening,
    immersiveRealtimeOn && realtime.status === 'live' ? realtime.localStream : null,
  )

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

  const transcriptForDisplay =
    immersiveRealtimeOn && realtime.status === 'live'
      ? realtime.userTranscript
      : speech.displayTranscript || speech.finalText

  const immersiveStatusLine = useMemo(() => {
    if (!immersiveRealtimeOn) return undefined
    if (realtime.status === 'connecting') return 'Connecting…'
    if (realtime.status === 'error') return 'Live coach unavailable — tap to try again or use the keyboard'
    if (realtime.status === 'live') {
      return realtime.assistantSpeaking ? 'Byte is speaking…' : 'Listening…'
    }
    return 'Tap for live coach'
  }, [immersiveRealtimeOn, realtime.assistantSpeaking, realtime.status])

  const immersiveSpeechSupported = speech.supported || immersiveRealtimeOn

  const toggleImmersiveMic = useCallback(() => {
    setError(null)
    if (immersiveRealtimeOn) {
      if (realtime.status === 'connecting') {
        const t = realtime.userTranscript
        realtime.disconnect()
        speech.setTranscriptManual(t)
        return
      }
      if (realtime.status === 'live') {
        const t = realtime.userTranscript
        realtime.disconnect()
        speech.setTranscriptManual(t)
        return
      }
      speech.setTranscriptManual('')
      void realtime.connect()
      return
    }
    speech.toggle()
  }, [immersiveRealtimeOn, realtime, speech])

  const exitImmersive = useCallback(() => {
    if (immersiveRealtimeOn && (realtime.status === 'live' || realtime.status === 'connecting')) {
      if (realtime.status === 'live') {
        speech.setTranscriptManual(realtime.userTranscript)
      }
      realtime.disconnect()
    }
    const next = new URLSearchParams(params)
    next.delete('capture')
    const qs = next.toString()
    navigate({ pathname: location.pathname, search: qs ? `?${qs}` : '' }, { replace: true, state: null })
  }, [immersiveRealtimeOn, location.pathname, navigate, params, realtime, speech])

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
    if (immersiveRealtimeOn && realtime.status !== 'idle' && realtime.status !== 'error') {
      const t = realtime.userTranscript
      realtime.disconnect()
      speech.setTranscriptManual(t.trim() || text)
    }
    if (wantsImmersive) exitImmersive()
    const apiItems = await parseMealWithApi(text)
    const items =
      apiItems && apiItems.length > 0 ? apiItems : parseMealFromTranscript(text)
    setPreviewItems(items)
    setStep('confirm')
  }, [exitImmersive, immersiveRealtimeOn, realtime, speech, transcriptForDisplay, wantsImmersive])

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

  const cookingTips = useMemo(
    () => getCookingTips(liveItems, transcriptForDisplay),
    [liveItems, transcriptForDisplay],
  )

  return (
    <div className="min-h-full bg-[#f7f6f3] text-stone-800">
      <audio ref={realtimeAudioRef} className="hidden" playsInline aria-hidden />
      {showImmersive && (
        <VoiceImmersiveCapture
          slot={slot}
          onSlotChange={setSlot}
          transcript={transcriptForDisplay}
          listening={immersiveListening}
          speechSupported={immersiveSpeechSupported}
          statusLine={immersiveStatusLine}
          onToggleMic={toggleImmersiveMic}
          liveItems={liveItems}
          cookingTips={cookingTips}
          audioLevel={micLevel}
          micVizError={micVizError}
          onClose={exitImmersive}
          onReview={() => void handleAnalyze()}
          onUseKeyboard={exitImmersive}
          bottomError={error}
        />
      )}

      <AppScreenHeader
        onBack={() => navigate(-1)}
        backIcon="close"
        eyebrow="Voice"
        title="Log this meal"
        subtitle="Speak or type—Byte listens either way."
      />

      <div className="px-6 pb-6 pt-4">
        <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">Slot</label>
        <select
          value={slot}
          onChange={(e) => setSlot(e.target.value as MealSlot)}
          className="mb-10 w-full rounded-xl border border-stone-200/80 bg-white/90 px-4 py-3.5 text-[15px] text-stone-900 shadow-sm focus:border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-400/25"
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
                    <div className="absolute h-[15rem] w-[15rem] rounded-full bg-amber-400/[0.12]" />
                    <div className="absolute h-[12rem] w-[12rem] rounded-full bg-stone-400/10" />
                  </>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setError(null)
                    speech.toggle()
                  }}
                  className="relative inline-flex items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f6f3]"
                >
                  <div
                    className={`relative flex h-36 w-36 items-center justify-center rounded-full bg-stone-900 shadow-[0_20px_50px_-18px_rgba(0,0,0,0.35)] ${!speech.supported ? 'opacity-45' : ''}`}
                  >
                    <Mic className="h-16 w-16 text-[#f5e6c8]" strokeWidth={1.35} />
                  </div>
                </button>
              </div>

              <h2 className="mb-3 max-w-[20rem] text-[17px] font-medium leading-snug tracking-tight text-stone-900">
                {speech.listening ? 'Listening…' : speech.supported ? 'Tap the mic to speak' : 'Dictation unavailable'}
              </h2>
              <p className="max-w-[19rem] text-sm leading-relaxed text-stone-500">
                {speech.supported
                  ? 'Describe ingredients and portions. Edit the text anytime.'
                  : 'Use Chrome or Edge, or type below.'}
              </p>
            </div>

            <div className="mb-6">
              <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">
                Description
              </label>
              <textarea
                value={transcriptForDisplay}
                onChange={(e) => speech.setTranscriptManual(e.target.value)}
                rows={5}
                placeholder="Grilled salmon, rice, and greens…"
                className="min-h-36 w-full rounded-2xl border border-stone-200/80 bg-white/90 p-5 text-[17px] leading-relaxed text-stone-900 shadow-sm placeholder:text-stone-400 focus:border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-400/25"
              />
            </div>

            {error && <p className="mb-6 text-sm leading-relaxed text-red-600/90">{error}</p>}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex-1 rounded-2xl border border-stone-300/80 bg-white/70 py-4 text-[15px] font-medium text-stone-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleAnalyze()}
                className="flex-1 rounded-2xl bg-stone-900 py-4 text-[15px] font-medium text-[#f5e6c8] transition-colors hover:bg-stone-800"
              >
                Review
              </button>
            </div>
          </>
        )}

        {step === 'confirm' && previewItems && (
          <div className="space-y-8">
            <div>
              <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">Almost there</p>
              <h3 className="text-[1.25rem] font-medium tracking-tight text-stone-900">Does this look right?</h3>
              <p className="mt-3 text-sm leading-relaxed text-stone-500">
                Estimates from your words—you can go back and adjust anytime.
              </p>
            </div>
            <ul className="divide-y divide-stone-200/80 border-y border-stone-200/80">
              {previewItems.map((i) => (
                <li key={i.id} className="py-3.5 text-[15px] text-stone-800">
                  <span className="font-medium">{i.name}</span>
                  <span className="text-stone-500"> — {i.calories} kcal</span>
                </li>
              ))}
            </ul>
            <div className="border-b border-stone-200/80 py-6 text-center">
              <p className="text-3xl font-light tabular-nums text-stone-900">
                {sumMealItems(previewItems).calories}
              </p>
              <p className="mt-1 text-sm text-stone-500">kcal total</p>
              <p className="mt-4 text-xs tabular-nums text-stone-400">
                P {sumMealItems(previewItems).protein}g · C {sumMealItems(previewItems).carbs}g · F{' '}
                {sumMealItems(previewItems).fat}g
              </p>
            </div>
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleConfirmLog}
                className="w-full rounded-2xl bg-stone-900 py-4 text-[15px] font-medium text-[#f5e6c8] hover:bg-stone-800"
              >
                Save to log
              </button>
              <button
                type="button"
                onClick={handleEditDescription}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-stone-300/80 bg-white/70 py-3.5 text-sm font-medium text-stone-700"
              >
                <Pencil className="h-4 w-4 text-stone-400" aria-hidden />
                Edit description
              </button>
            </div>
          </div>
        )}
      </div>

      {step === 'listen' && (
        <>
          <div className="px-6 pb-8">
            <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">Suggestions</p>
            <ul className="divide-y divide-stone-200/80 border-y border-stone-200/80">
              {QUICK_SUGGESTIONS.map((suggestion) => (
                <li key={suggestion}>
                  <button
                    type="button"
                    onClick={() => applySuggestion(suggestion)}
                    className="flex w-full items-center justify-between gap-3 py-4 text-left text-[15px] text-stone-800 transition-colors active:bg-stone-200/25"
                  >
                    <span className="min-w-0 flex-1 leading-snug">{suggestion}</span>
                    <Plus className="h-4 w-4 shrink-0 text-stone-300" strokeWidth={1.75} />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="px-6 pb-28">
            <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">How it works</p>
            <div className="space-y-4 text-sm leading-relaxed text-stone-600">
              <p>Speak like you’re texting a friend who’s helping in the kitchen.</p>
              <p>Byte turns that into ingredients and numbers—you stay in control.</p>
              <p>Review once, then it’s on your log.</p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
