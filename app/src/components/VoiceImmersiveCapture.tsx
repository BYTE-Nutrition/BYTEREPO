import { useEffect, useState } from 'react'
import { Keyboard, Mic, X } from 'lucide-react'
import { MEAL_LABELS, MEAL_ORDER, type MealItem, type MealSlot } from '@/lib/types'

type Props = {
  slot: MealSlot
  onSlotChange: (s: MealSlot) => void
  transcript: string
  listening: boolean
  speechSupported: boolean
  /** When set, replaces the default listening / mic hint line */
  statusLine?: string
  onToggleMic: () => void
  liveItems: MealItem[]
  cookingTips: string[]
  audioLevel: number
  micVizError: string | null
  onClose: () => void
  onReview: () => void
  onUseKeyboard: () => void
  bottomError: string | null
}

const sheetEase = 'cubic-bezier(0.22, 1, 0.36, 1)'

export function VoiceImmersiveCapture({
  slot,
  onSlotChange,
  transcript,
  listening,
  speechSupported,
  statusLine,
  onToggleMic,
  liveItems,
  cookingTips,
  audioLevel,
  micVizError,
  onClose,
  onReview,
  onUseKeyboard,
  bottomError,
}: Props) {
  const [sheetIn, setSheetIn] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setSheetIn(true))
    })
    return () => cancelAnimationFrame(id)
  }, [])

  const scale = 1 + audioLevel * 0.14
  const ringOpacity = 0.2 + audioLevel * 0.35

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-[#f7f6f3] text-stone-800">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-stone-200/80 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="rounded-full p-2.5 text-stone-500 transition-colors hover:bg-stone-200/50 hover:text-stone-800"
        >
          <X className="h-5 w-5" strokeWidth={1.75} />
        </button>
        <select
          value={slot}
          onChange={(e) => onSlotChange(e.target.value as MealSlot)}
          aria-label="Meal"
          className="max-w-[11rem] rounded-xl border border-stone-200/80 bg-white/90 px-3 py-2 text-sm font-medium text-stone-900 shadow-sm focus:outline-none focus:ring-1 focus:ring-stone-400/30"
        >
          {MEAL_ORDER.map((s) => (
            <option key={s} value={s}>
              {MEAL_LABELS[s]}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={onUseKeyboard}
          className="rounded-full p-2.5 text-stone-500 transition-colors hover:bg-stone-200/50 hover:text-stone-800"
          aria-label="Type with keyboard"
        >
          <Keyboard className="h-5 w-5" strokeWidth={1.75} />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-5">
        <p className="shrink-0 pt-2 text-center text-[11px] font-medium uppercase tracking-[0.2em] text-stone-400">
          Voice capture
        </p>

        <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
          <div className="relative mb-6 flex h-[min(38vh,16rem)] w-full max-w-sm items-center justify-center">
            {listening && (
              <>
                <div
                  className="absolute rounded-full bg-amber-400/25 transition-[transform,opacity] duration-75"
                  style={{
                    width: '17rem',
                    height: '17rem',
                    transform: `scale(${1 + audioLevel * 0.35})`,
                    opacity: ringOpacity,
                  }}
                />
                <div
                  className="absolute rounded-full bg-stone-400/15 transition-[transform,opacity] duration-75"
                  style={{
                    width: '13rem',
                    height: '13rem',
                    transform: `scale(${scale})`,
                    opacity: 0.4 + audioLevel * 0.2,
                  }}
                />
              </>
            )}
            <button
              type="button"
              onClick={onToggleMic}
              disabled={!speechSupported}
              className="relative inline-flex items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f6f3] disabled:opacity-40"
            >
              <div
                className="flex h-36 w-36 items-center justify-center rounded-full bg-stone-900 shadow-[0_20px_50px_-18px_rgba(0,0,0,0.35)] transition-transform duration-75"
                style={{ transform: `scale(${listening ? scale : 1})` }}
              >
                <Mic className="h-[3.75rem] w-[3.75rem] text-[#f5e6c8]" strokeWidth={1.25} />
              </div>
            </button>
          </div>

          <p className="mb-2 shrink-0 text-center text-sm font-medium text-stone-800">
            {statusLine ??
              (listening ? 'Listening…' : speechSupported ? 'Tap the mic to speak' : 'Dictation unavailable')}
          </p>
          {micVizError && (
            <p className="mb-2 max-w-xs shrink-0 text-center text-xs text-amber-800/90">{micVizError}</p>
          )}
          {!speechSupported && (
            <p className="mb-3 max-w-[20rem] shrink-0 text-center text-sm text-stone-500">
              Use Chrome or Edge, or open the keyboard to type.
            </p>
          )}

          <div className="w-full max-w-md shrink-0 px-1 pb-2">
            <p
              className="line-clamp-3 min-h-[3.5rem] text-center text-[15px] leading-relaxed text-stone-600"
              aria-live="polite"
            >
              {transcript.trim() ? transcript : 'Your words appear here as you speak…'}
            </p>
          </div>
        </div>

        <div
          className="mt-auto shrink-0 rounded-t-[1.75rem] border border-b-0 border-stone-200/70 bg-[#f2f0ec]/95 px-3 pt-3 shadow-[0_-16px_48px_-12px_rgba(0,0,0,0.1)] backdrop-blur-md motion-reduce:transition-none"
          style={{
            transform: sheetIn ? 'translateY(0)' : 'translateY(calc(100% + 1rem))',
            transition: `transform 520ms ${sheetEase}`,
          }}
        >
          <div className="mx-auto flex min-h-0 max-h-[min(42vh,320px)] flex-col gap-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
            <div
              className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-stone-200/80 bg-white/80 shadow-sm"
              style={{
                transform: liveItems.length > 0 ? 'translateY(0)' : undefined,
              }}
            >
              <div className="border-b border-stone-200/80 px-4 py-2.5">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">Ingredients</p>
              </div>
              <ul className="max-h-[min(18vh,150px)] space-y-0 overflow-y-auto overscroll-contain px-2 py-2">
                {liveItems.length === 0 ? (
                  <li className="px-3 py-4 text-center text-sm text-stone-400">Parsed items show up here</li>
                ) : (
                  liveItems.map((item, index) => (
                    <li
                      key={`${item.name}-${index}`}
                      className="border-b border-stone-200/60 px-3 py-2.5 text-[15px] text-stone-800 last:border-0"
                    >
                      <span className="font-medium">{item.name}</span>
                      <span className="text-stone-500"> — {item.calories} kcal</span>
                    </li>
                  ))
                )}
              </ul>
            </div>

            <div
              className="shrink-0 rounded-2xl border border-amber-200/50 bg-amber-50/50"
              aria-live="polite"
              aria-label="Cooking tips"
            >
              <div className="border-b border-amber-200/40 px-4 py-2">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-amber-900/60">
                  While cooking
                </p>
              </div>
              <ul className="max-h-[min(14vh,120px)] space-y-2 overflow-y-auto overscroll-contain px-3 py-2.5">
                {cookingTips.map((tip, i) => (
                  <li key={i} className="flex gap-2 text-[13px] leading-snug text-stone-700">
                    <span className="mt-0.5 shrink-0 font-medium text-amber-800/80" aria-hidden>
                      •
                    </span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {bottomError && <p className="text-center text-sm text-red-600/90">{bottomError}</p>}

            <button
              type="button"
              onClick={onReview}
              className="w-full rounded-2xl bg-stone-900 py-3.5 text-[15px] font-medium text-[#f5e6c8] transition-colors hover:bg-stone-800 active:scale-[0.99]"
            >
              Review
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
