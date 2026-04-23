import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Mic, Pencil, Plus } from 'lucide-react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { AppScreenHeader } from '@/components/AppScreenHeader'
import { VoiceImmersiveCapture } from '@/components/VoiceImmersiveCapture'
import { useByte } from '@/context/useByte'
import { useVoiceEntry } from '@/context/VoiceEntryContext'
import { useMicLevel } from '@/hooks/useMicLevel'
import { useOpenAiRealtimeVoice } from '@/hooks/useOpenAiRealtimeVoice'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { analytics } from '@/lib/analytics'
import { getCookingTips } from '@/lib/cookingTips'
import {
  getMealParseUrl,
  isMealParseStrict,
  parseMealWithApi,
  parseMealTranscriptBestEffort,
} from '@/lib/mealParseApi'
import { QUICK_SUGGESTIONS, parseMealFromTranscript, sumMealItems } from '@/lib/nutrition'
import { mealItemsHaveUsdaBacking } from '@/lib/realtimeMealContext'
import type { VoiceTranscriptMessage } from '@/lib/voiceTranscript'
import { MEAL_LABELS, MEAL_ORDER, type MealItem, type MealSlot, type VoiceLocationState } from '@/lib/types'

function parseSlot(s: string | null): MealSlot {
  if (s && MEAL_ORDER.includes(s as MealSlot)) return s as MealSlot
  return 'lunch'
}

/** Heuristic: user named several foods (comma / and / with) but preview may only show one row. */
function transcriptLooksMultiFood(s: string): boolean {
  const n = s.toLowerCase().trim()
  if (n.length < 8) return false
  const chunks = n.split(/\b(?:and|with|plus)\b|,/).map((p) => p.trim()).filter((p) => p.length > 2)
  return chunks.length >= 2
}

export function VoicePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const prefillApplied = useRef(false)
  const liveParseSeq = useRef(0)
  const autoStartConsumedRef = useRef(false)
  const beginImmersiveListeningRef = useRef<() => void>(() => {})
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
  /** `local` = offline keyword matcher (tiny food list), not USDA meal-parse. */
  const [previewSource, setPreviewSource] = useState<'api' | 'local' | null>(null)
  const [liveItems, setLiveItems] = useState<MealItem[]>([])

  const wantsImmersive =
    params.get('capture') === '1' ||
    (location.state as VoiceLocationState | null)?.immersive === true
  const showImmersive = wantsImmersive && step === 'listen'

  const { logMeal, goals } = useByte()
  const { takePrimedStream, releasePrimedMic } = useVoiceEntry()

  const realtimeGoalsHeader = useMemo(
    () =>
      `User's daily goals: ${goals.calorieGoal} kcal, ${goals.proteinGoal}g protein, ${goals.carbsGoal}g carbs, ${goals.fatGoal}g fat.`,
    [goals.calorieGoal, goals.carbsGoal, goals.fatGoal, goals.proteinGoal],
  )

  const realtimeSessionUrl = import.meta.env.VITE_REALTIME_SESSION_URL
  const realtimeConfigured = Boolean(realtimeSessionUrl?.trim())
  const realtimeAudioRef = useRef<HTMLAudioElement>(null)
  const [fallbackSpeech, setFallbackSpeech] = useState(false)

  const speech = useSpeechRecognition({
    onError: (msg) => setError(msg),
  })

  const coachTranscriptFallback = speech.displayTranscript || speech.finalText

  const realtime = useOpenAiRealtimeVoice({
    sessionUrl: realtimeSessionUrl,
    audioRef: realtimeAudioRef,
    takePrimedStream,
    goalsHeader: realtimeGoalsHeader,
    mealLiveItems: liveItems,
    coachTranscriptFallback,
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
    const st = location.state as VoiceLocationState | null
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

  const beginImmersiveListening = useCallback(() => {
    setError(null)
    analytics.track('voice_session_started', { mode: immersiveRealtimeOn ? 'realtime' : 'speech' })
    if (immersiveRealtimeOn) {
      speech.setTranscriptManual('')
      void realtime.connect()
      return
    }
    const primed = takePrimedStream()
    primed?.getTracks().forEach((t) => t.stop())
    speech.start()
  }, [immersiveRealtimeOn, realtime, speech, takePrimedStream])

  beginImmersiveListeningRef.current = beginImmersiveListening

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
      beginImmersiveListening()
      return
    }
    speech.toggle()
  }, [beginImmersiveListening, immersiveRealtimeOn, realtime, speech])

  const exitImmersive = useCallback(() => {
    releasePrimedMic()
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
  }, [immersiveRealtimeOn, location.pathname, navigate, params, realtime, releasePrimedMic, speech])

  useLayoutEffect(() => {
    if (!showImmersive) {
      autoStartConsumedRef.current = false
      return
    }
    const st = location.state as VoiceLocationState | null
    if (!st?.autoStartVoice || st.prefillTranscript?.trim()) return
    if (autoStartConsumedRef.current) return
    autoStartConsumedRef.current = true

    navigate(
      { pathname: location.pathname, search: location.search, hash: location.hash },
      { replace: true, state: null },
    )

    queueMicrotask(() => {
      beginImmersiveListeningRef.current()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- avoid re-running after navigate clears state
  }, [showImmersive, location.pathname, location.search, location.hash, navigate])

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
    if (isMealParseStrict() && !getMealParseUrl()) {
      setError('API-only mode: set VITE_MEAL_PARSE_URL in .env and restart the dev server.')
      return
    }
    const { items: apiItems, hint } = await parseMealWithApi(text)
    if (isMealParseStrict() && (!apiItems || apiItems.length === 0)) {
      setError(
        hint?.trim() ||
          'Meal-parse returned nothing or failed (timeout, network, or HTTP error). Check the meal-parse service and try Review again.',
      )
      return
    }
    const usedApi = Boolean(apiItems?.length)
    const items = usedApi ? apiItems : parseMealFromTranscript(text)
    setPreviewSource(usedApi ? 'api' : 'local')
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
    analytics.track('meal_logged', { slot, item_count: previewItems.length, calories: t.calories })
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
    setPreviewSource(null)
    setStep('listen')
    setError(null)
  }, [committedTranscript, speech])

  const cookingTips = useMemo(
    () => getCookingTips(liveItems, transcriptForDisplay),
    [liveItems, transcriptForDisplay],
  )

  /** Rows for the noir immersive transcript rail (Realtime uses hook transcript; Web Speech uses local dictation). */
  const immersiveChatMessages = useMemo((): VoiceTranscriptMessage[] => {
    if (immersiveRealtimeOn && realtime.status === 'live') {
      const t = realtime.userTranscript.trim()
      if (!t) return []
      return [
        {
          id: 'immersive-rt-user',
          role: 'user',
          text: realtime.userTranscript,
          status: 'streaming',
          createdAt: Date.now(),
        },
      ]
    }
    if (!immersiveRealtimeOn) {
      const t = transcriptForDisplay.trim()
      if (!t) return []
      return [
        {
          id: 'immersive-local-user',
          role: 'user',
          text: t,
          status: 'streaming',
          createdAt: Date.now(),
        },
      ]
    }
    return []
  }, [immersiveRealtimeOn, realtime.status, realtime.userTranscript, transcriptForDisplay])

  const previewTotals = useMemo(
    () => (previewItems?.length ? sumMealItems(previewItems) : null),
    [previewItems],
  )

  const previewMultiFoodMismatch = Boolean(
    previewSource === 'local' &&
      previewItems?.length === 1 &&
      committedTranscript &&
      transcriptLooksMultiFood(committedTranscript),
  )

  return (
    <div className="noir-page-enter noir-screen-root noir-surface relative min-h-full text-[var(--paper)]">
      <audio ref={realtimeAudioRef} className="hidden" playsInline autoPlay aria-hidden />
      {showImmersive && (
        <VoiceImmersiveCapture
          slot={slot}
          onSlotChange={setSlot}
          transcript={transcriptForDisplay}
          messages={immersiveChatMessages}
          assistantSpeaking={immersiveRealtimeOn ? realtime.assistantSpeaking : false}
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
        <label className="eyebrow mb-2 block text-[var(--paper)]/55">Slot</label>
        <select
          value={slot}
          onChange={(e) => setSlot(e.target.value as MealSlot)}
          className="mb-10 w-full rounded-xl border border-[var(--line)] bg-[var(--ink-2)] px-4 py-3.5 text-[15px] text-[var(--paper)] shadow-sm focus:border-[var(--champagne)]/40 focus:outline-none focus:ring-1 focus:ring-[var(--champagne)]/25"
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
                    <div className="absolute h-[15rem] w-[15rem] rounded-full bg-[var(--champagne)]/15" />
                    <div className="absolute h-[12rem] w-[12rem] rounded-full bg-[var(--paper)]/10" />
                  </>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setError(null)
                    speech.toggle()
                  }}
                  className="relative inline-flex items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--champagne)]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ink)]"
                >
                  <div
                    className={`relative flex h-36 w-36 items-center justify-center rounded-full bg-[var(--paper)] text-[var(--ink)] shadow-[0_20px_50px_-18px_rgba(0,0,0,0.45)] ${!speech.supported ? 'opacity-45' : ''}`}
                  >
                    <Mic className="h-16 w-16" strokeWidth={1.35} />
                  </div>
                </button>
              </div>

              <h2 className="mb-3 max-w-[20rem] text-[17px] font-medium leading-snug tracking-tight text-[var(--paper)]">
                {speech.listening ? 'Listening…' : speech.supported ? 'Tap the mic to speak' : 'Dictation unavailable'}
              </h2>
              <p className="max-w-[19rem] text-sm leading-relaxed text-[var(--paper)]/55">
                {speech.supported
                  ? 'Describe ingredients and portions. Edit the text anytime.'
                  : 'Use Chrome or Edge, or type below.'}
              </p>
            </div>

            <div className="mb-6">
              <label className="eyebrow mb-2 block text-[var(--paper)]/55">Description</label>
              <textarea
                value={transcriptForDisplay}
                onChange={(e) => speech.setTranscriptManual(e.target.value)}
                rows={5}
                placeholder="Grilled salmon, rice, and greens…"
                className="min-h-36 w-full rounded-2xl border border-[var(--line)] bg-[var(--ink-2)] p-5 text-[17px] leading-relaxed text-[var(--paper)] shadow-sm placeholder:text-[var(--paper)]/35 focus:border-[var(--champagne)]/40 focus:outline-none focus:ring-1 focus:ring-[var(--champagne)]/25"
              />
            </div>

            {error && <p className="mb-6 text-sm leading-relaxed text-red-400">{error}</p>}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="noir-magnet flex-1 rounded-full border border-[var(--line-strong)] py-4 font-mono text-xs uppercase tracking-[0.18em] text-[var(--paper)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleAnalyze()}
                className="noir-magnet flex-1 rounded-full bg-[var(--paper)] py-4 font-mono text-xs uppercase tracking-[0.18em] text-[var(--ink)]"
              >
                Review
              </button>
            </div>
          </>
        )}

        {step === 'confirm' && previewItems && (
          <div className="space-y-8">
            <div>
              <p className="eyebrow mb-2 text-[var(--paper)]/55">Almost there</p>
              <h3 className="display-serif text-[1.35rem] tracking-tight text-[var(--paper)]">
                Does this <span className="noir-shimmer-on-dark">look right?</span>
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--paper)]/55">
                {previewSource === 'local'
                  ? 'These numbers use Byte’s offline keyword list—not the full USDA meal parser—unless meal-parse is connected and succeeds.'
                  : mealItemsHaveUsdaBacking(previewItems)
                    ? 'Calories scale to each portion below. USDA-backed lines use official reference servings—if the portion is wrong, edit your description to be more specific (cups, bowls, or “whole can”).'
                    : 'Meal-parse returned these lines, but they are not USDA FoodData Central rows—macros are model estimates unless you use the USDA-backed meal-parse server.'}
              </p>
              {previewSource === 'local' ? (
                <div className="mt-4 rounded-xl border border-[var(--champagne)]/35 bg-[var(--ink-2)] px-4 py-3 text-[13px] leading-relaxed text-[var(--paper)]/90">
                  <p className="font-medium text-[var(--champagne)]">USDA meal-parse did not supply this breakdown</p>
                  <p className="mt-1 text-[var(--paper)]/80">
                    {getMealParseUrl()
                      ? 'The server may be down, timed out, or returned no items—so only foods that match a short built-in list appear.'
                      : 'Point the app at your meal-parse server (VITE_MEAL_PARSE_URL, e.g. /meal-parse via Vite proxy) so every ingredient can be extracted and scaled.'}
                  </p>
                  {previewMultiFoodMismatch ? (
                    <p className="mt-2 font-medium text-[var(--paper)]">
                      Your description sounds like several foods, but only one line matched locally. Edit the text or fix meal-parse, then tap Review again.
                    </p>
                  ) : null}
                </div>
              ) : null}
              {previewSource === 'api' && !mealItemsHaveUsdaBacking(previewItems) ? (
                <div className="mt-4 rounded-xl border border-[var(--champagne)]/35 bg-[var(--ink-2)] px-4 py-3 text-[13px] leading-relaxed text-[var(--paper)]/90">
                  <p className="font-medium text-[var(--champagne)]">Not USDA-backed data</p>
                  <p className="mt-1 text-[var(--paper)]/80">
                    Your current meal-parse URL (for example <code className="rounded bg-[var(--ink-3)] px-1 font-mono text-[11px]">/meal-parse</code> via{' '}
                    <code className="rounded bg-[var(--ink-3)] px-1 font-mono text-[11px]">realtime-proxy</code> or Netlify) uses OpenAI estimates. USDA rows show a
                    database tag and an FDC id when the Python meal-parse service is configured—see{' '}
                    <span className="whitespace-nowrap font-mono text-[11px] text-[var(--paper)]/70">docs/NETLIFY_DEPLOY.md</span>.
                  </p>
                </div>
              ) : null}
              {committedTranscript ? (
                <p className="mt-3 rounded-xl border border-[var(--line)] bg-[var(--ink-2)] px-4 py-3 text-[13px] leading-relaxed text-[var(--paper)]/80">
                  <span className="font-medium text-[var(--paper)]/50">You described </span>
                  <span className="text-[var(--paper)]">&ldquo;{committedTranscript}&rdquo;</span>
                </p>
              ) : null}
            </div>
            <ul className="divide-y divide-[var(--line-soft)] border-y border-[var(--line)]">
              {previewItems.map((i) => {
                const usdaBacked = i.nutritionSource === 'usda' || (typeof i.fdcId === 'number' && i.fdcId > 0)
                return (
                  <li key={i.id} className="space-y-1 py-3.5 text-[15px] text-[var(--paper)]">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
                      <span className="display-serif min-w-0 text-lg leading-snug">{i.name}</span>
                      <span className="shrink-0 font-mono tabular-nums text-[var(--paper)]/55">{i.calories} kcal</span>
                    </div>
                    {i.amount ? <p className="font-mono text-[13px] leading-snug text-[var(--paper)]/50">{i.amount}</p> : null}
                    {usdaBacked && typeof i.fdcId === 'number' && i.fdcId > 0 ? (
                      <p className="text-[12px] text-[var(--paper)]/40">
                        <a
                          href={`https://fdc.nal.usda.gov/food-details/${i.fdcId}/nutrients`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-[var(--champagne)] underline decoration-[var(--line)] underline-offset-2 hover:text-[var(--paper)]"
                        >
                          USDA FoodData Central
                        </a>
                        <span> · reference #{i.fdcId}</span>
                      </p>
                    ) : usdaBacked ? (
                      <p className="text-[12px] text-[var(--paper)]/40">USDA-backed estimate</p>
                    ) : null}
                  </li>
                )
              })}
            </ul>
            <div className="border-b border-[var(--line)] py-6 text-center">
              <p className="display-serif text-4xl tabular-nums text-[var(--paper)]">
                {previewTotals?.calories ?? 0}
                <span className="ml-2 font-mono text-sm font-normal tracking-normal text-[var(--paper)]/50">
                  kcal total
                </span>
              </p>
              <p className="mt-4 font-mono text-xs tabular-nums text-[var(--paper)]/45">
                P {previewTotals?.protein ?? 0}g · C {previewTotals?.carbs ?? 0}g · F {previewTotals?.fat ?? 0}g
              </p>
            </div>
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleConfirmLog}
                className="noir-magnet w-full rounded-full bg-[var(--paper)] py-5 font-mono text-xs uppercase tracking-[0.22em] text-[var(--ink)]"
              >
                Plate it · save to log
              </button>
              <button
                type="button"
                onClick={handleEditDescription}
                className="noir-magnet flex w-full items-center justify-center gap-2 rounded-full border border-[var(--line-strong)] py-4 font-mono text-xs uppercase tracking-[0.2em] text-[var(--paper)]"
              >
                <Pencil className="h-4 w-4 text-[var(--paper)]/50" aria-hidden />
                Re-describe
              </button>
            </div>
          </div>
        )}
      </div>

      {step === 'listen' && (
        <>
          <div className="px-6 pb-8">
            <p className="eyebrow mb-4 text-[var(--paper)]/55">Suggestions</p>
            <ul className="divide-y divide-[var(--line-soft)] border-y border-[var(--line)]">
              {QUICK_SUGGESTIONS.map((suggestion) => (
                <li key={suggestion}>
                  <button
                    type="button"
                    onClick={() => applySuggestion(suggestion)}
                    className="flex w-full items-center justify-between gap-3 py-4 text-left text-[15px] text-[var(--paper)] transition-colors active:bg-[var(--paper)]/5"
                  >
                    <span className="min-w-0 flex-1 leading-snug">{suggestion}</span>
                    <Plus className="h-4 w-4 shrink-0 text-[var(--paper)]/30" strokeWidth={1.75} />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="px-6 pb-28">
            <p className="eyebrow mb-4 text-[var(--paper)]/55">How it works</p>
            <div className="space-y-4 text-sm leading-relaxed text-[var(--paper)]/55">
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
