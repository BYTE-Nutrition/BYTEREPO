import { Keyboard, Mic, X } from 'lucide-react'
import { MEAL_LABELS, MEAL_ORDER, type MealItem, type MealSlot } from '@/lib/types'

type Props = {
  slot: MealSlot
  onSlotChange: (s: MealSlot) => void
  transcript: string
  listening: boolean
  speechSupported: boolean
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

export function VoiceImmersiveCapture({
  slot,
  onSlotChange,
  transcript,
  listening,
  speechSupported,
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
  const scale = 1 + audioLevel * 0.14
  const ringOpacity = 0.12 + audioLevel * 0.28

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-neutral-950 text-white">
      <div className="flex shrink-0 items-center justify-between gap-3 px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="rounded-full p-2.5 text-white/75 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="h-5 w-5" strokeWidth={1.75} />
        </button>
        <select
          value={slot}
          onChange={(e) => onSlotChange(e.target.value as MealSlot)}
          aria-label="Meal"
          className="max-w-[11rem] rounded-xl border-0 bg-white/10 px-3 py-2 text-sm font-medium text-white ring-1 ring-white/15 focus:outline-none focus:ring-2 focus:ring-amber-200/40"
        >
          {MEAL_ORDER.map((s) => (
            <option key={s} value={s} className="bg-neutral-900 text-white">
              {MEAL_LABELS[s]}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={onUseKeyboard}
          className="rounded-full p-2.5 text-white/75 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Type with keyboard"
        >
          <Keyboard className="h-5 w-5" strokeWidth={1.75} />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-5 pb-4">
        <p className="text-center text-xs font-medium uppercase tracking-[0.2em] text-white/35">Voice capture</p>
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
          <div className="relative mb-8 flex h-[min(42vh,18rem)] w-full max-w-sm items-center justify-center">
            {listening && (
              <>
                <div
                  className="absolute rounded-full bg-amber-400/20 transition-[transform,opacity] duration-75"
                  style={{
                    width: '17rem',
                    height: '17rem',
                    transform: `scale(${1 + audioLevel * 0.35})`,
                    opacity: ringOpacity,
                  }}
                />
                <div
                  className="absolute rounded-full bg-amber-300/15 transition-[transform,opacity] duration-75"
                  style={{
                    width: '13rem',
                    height: '13rem',
                    transform: `scale(${scale})`,
                    opacity: 0.35 + audioLevel * 0.25,
                  }}
                />
              </>
            )}
            <button
              type="button"
              onClick={onToggleMic}
              disabled={!speechSupported}
              className="relative inline-flex items-center justify-center rounded-full focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-200/50 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 disabled:opacity-40"
            >
              <div
                className="flex h-36 w-36 items-center justify-center rounded-full bg-gradient-to-b from-neutral-700 to-black shadow-[0_28px_56px_-16px_rgba(0,0,0,0.65),0_0_0_1px_rgba(255,255,255,0.08)_inset] transition-transform duration-75"
                style={{ transform: `scale(${listening ? scale : 1})` }}
              >
                <Mic className="h-[3.75rem] w-[3.75rem] text-amber-100" strokeWidth={1.25} />
              </div>
            </button>
          </div>

          <p className="mb-2 text-center text-sm font-medium text-white/90">
            {listening ? 'Listening…' : speechSupported ? 'Tap the mic to speak' : 'Dictation unavailable'}
          </p>
          {micVizError && <p className="mb-2 max-w-xs text-center text-xs text-amber-200/80">{micVizError}</p>}
          {!speechSupported && (
            <p className="mb-4 max-w-[20rem] text-center text-sm text-white/45">
              Use Chrome or Edge, or open the keyboard to type.
            </p>
          )}

          <div className="w-full max-w-md px-1">
            <p
              className="line-clamp-4 min-h-[4.5rem] text-center text-[15px] leading-relaxed text-white/70"
              aria-live="polite"
            >
              {transcript.trim() ? transcript : 'Your words appear here as you speak…'}
            </p>
          </div>
        </div>

        <div className="mt-auto flex min-h-0 max-h-[46vh] flex-col gap-2">
          <div
            className="min-h-0 flex-1 overflow-hidden rounded-2xl bg-black/35 ring-1 ring-white/10 transition-transform duration-300 ease-out"
            style={{
              transform: liveItems.length > 0 ? 'translateY(0)' : 'translateY(4px)',
            }}
          >
            <div className="border-b border-white/10 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Ingredients</p>
            </div>
            <ul className="max-h-[min(22vh,180px)] space-y-0 overflow-y-auto overscroll-contain px-2 py-2">
              {liveItems.length === 0 ? (
                <li className="px-3 py-5 text-center text-sm text-white/35">Parsed items show up here</li>
              ) : (
                liveItems.map((item, index) => (
                  <li
                    key={`${item.name}-${index}`}
                    className="border-b border-white/[0.06] px-3 py-2.5 text-[15px] text-white/90 transition-opacity duration-300 last:border-0"
                  >
                    <span className="font-medium">{item.name}</span>
                    <span className="text-white/45"> — {item.calories} cal</span>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div
            className="shrink-0 rounded-2xl bg-amber-500/[0.08] ring-1 ring-amber-400/20"
            aria-live="polite"
            aria-label="Cooking tips"
          >
            <div className="border-b border-amber-400/15 px-4 py-2.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-200/80">While cooking</p>
            </div>
            <ul className="max-h-[min(18vh,140px)] space-y-2 overflow-y-auto overscroll-contain px-3 py-3">
              {cookingTips.map((tip, i) => (
                <li key={i} className="flex gap-2 text-[13px] leading-snug text-white/75">
                  <span className="mt-0.5 shrink-0 font-semibold text-amber-300/90" aria-hidden>
                    •
                  </span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {bottomError && <p className="mt-3 text-center text-sm text-red-400/90">{bottomError}</p>}

        <div className="mt-4 flex gap-3 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={onReview}
            className="flex-1 rounded-xl bg-white py-4 text-[15px] font-semibold text-neutral-950 shadow-lg transition-all hover:bg-white/95 active:scale-[0.99]"
          >
            Review
          </button>
        </div>
      </div>
    </div>
  )
}
