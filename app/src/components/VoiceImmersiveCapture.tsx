import { useEffect, useState } from 'react'
import { Keyboard, X } from 'lucide-react'
import { NoirMealSlotRail, NoirRollover, NoirStatusBar } from '@/components/noir/NoirPrimitives'
import type { MealItem, MealSlot } from '@/lib/types'

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

  const orbScale = 1 + audioLevel * 0.18
  const orbRingOpacity = 0.25 + audioLevel * 0.45
  const totalCals = liveItems.reduce((a, i) => a + i.calories, 0)

  return (
    <div className="byte-noir fixed inset-0 z-50 flex flex-col overflow-hidden bg-[var(--ink)] text-[var(--paper)]">
      <NoirStatusBar dark />

      <div className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between px-6 pt-14">
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="-ml-2 rounded-full p-2 text-[var(--paper)]/70 hover:text-[var(--paper)]"
        >
          <X className="h-[22px] w-[22px]" strokeWidth={1.75} />
        </button>
        <div className="eyebrow text-[var(--paper)]/50">Voice</div>
        <button
          type="button"
          onClick={onUseKeyboard}
          className="-mr-2 rounded-full p-2 text-[var(--paper)]/70"
          aria-label="Type with keyboard"
        >
          <Keyboard className="h-5 w-5" strokeWidth={1.75} />
        </button>
      </div>

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -left-32 top-1/3 h-[400px] w-[400px] rounded-full opacity-60"
          style={{
            background: 'radial-gradient(circle, rgba(216,200,156,0.18) 0%, rgba(216,200,156,0) 65%)',
            animation: 'noir-orb-float 6s ease-in-out infinite',
          }}
        />
        <div
          className="absolute -right-20 bottom-10 h-[360px] w-[360px] rounded-full opacity-60"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 65%)',
            animation: 'noir-orb-float 8s ease-in-out infinite reverse',
          }}
        />
      </div>

      <div className="noir-canvas-bg noir-grain relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="relative z-10 flex flex-col items-center pt-[90px]">
          <div className="absolute left-5 top-[170px] z-20">
            <NoirMealSlotRail slot={slot} onSlotChange={onSlotChange} />
          </div>

          <div className="relative h-[170px] w-[170px]">
            <div className="noir-ring rounded-full" style={{ opacity: orbRingOpacity }} />
            <div className="noir-ring delay-1 rounded-full" style={{ opacity: orbRingOpacity * 0.8 }} />
            <div className="noir-ring delay-2 rounded-full" style={{ opacity: orbRingOpacity * 0.6 }} />
            <button
              type="button"
              onClick={onToggleMic}
              disabled={!speechSupported}
              className="absolute inset-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--champagne)]/40 disabled:opacity-40"
              aria-label={listening ? 'Stop listening' : 'Start listening'}
            >
              <span className="sr-only">{listening ? 'Stop' : 'Speak'}</span>
            </button>
            <div
              className="pointer-events-none absolute inset-0 overflow-hidden rounded-full"
              style={{
                background: 'radial-gradient(circle at 35% 30%, #2a2a2a 0%, #141414 55%, #080808 100%)',
                boxShadow:
                  'inset 0 0 40px rgba(255,255,255,0.05), inset 0 -20px 50px rgba(0,0,0,0.5), 0 30px 60px -10px rgba(0,0,0,0.7)',
                transform: `scale(${orbScale})`,
                transition: 'transform 120ms ease-out',
              }}
            >
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background:
                    'radial-gradient(ellipse at 35% 28%, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 50%)',
                  animation: 'noir-orb-rotate 20s linear infinite',
                }}
              />
            </div>
          </div>

          <div className="mt-10 eyebrow text-[var(--paper)]/60">
            {transcript.trim() ? 'Byte is composing' : statusLine ?? 'Byte is listening'}
          </div>

          <div className="mt-5 flex h-8 items-center gap-[3px] text-[var(--paper)]">
            {Array.from({ length: 22 }).map((_, i) => (
              <span
                key={i}
                className="noir-wave-bar h-full w-[3px]"
                style={{
                  animationDelay: `${i * 60}ms`,
                  animationDuration: `${900 + (i % 5) * 100}ms`,
                  opacity: 0.4 + (i % 4) * 0.15,
                }}
              />
            ))}
          </div>
        </div>

        <div className="relative z-10 mt-10 space-y-4 px-6">
          <div className="flex flex-col items-end">
            <div className="eyebrow mb-1.5 pr-1 text-[var(--paper)]/40">You</div>
            <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-[var(--paper)] px-4 py-3 text-[var(--ink)]">
              <p className="display-serif min-h-[22px] text-lg leading-snug">
                {transcript.trim() ? (
                  <>
                    {transcript}
                    {listening ? (
                      <span className="ml-1 inline-block h-4 w-0.5 animate-pulse bg-[var(--ink)] align-middle" />
                    ) : null}
                  </>
                ) : (
                  <span className="text-[var(--ink)]/40">Describe what you&apos;re making…</span>
                )}
              </p>
            </div>
          </div>

          {micVizError ? (
            <p className="text-center text-xs text-amber-300/90">{micVizError}</p>
          ) : null}
          {!speechSupported ? (
            <p className="mx-auto max-w-[20rem] text-center text-sm text-[var(--paper)]/50">
              Use Chrome or Edge, or open the keyboard to type.
            </p>
          ) : null}

          {cookingTips.length > 0 && transcript.trim().length > 12 ? (
            <div className="flex flex-col items-start">
              <div className="mb-1.5 flex items-center gap-2 pl-1 eyebrow text-[var(--paper)]/40">
                <span className="inline-block h-1 w-1 rounded-full bg-[var(--paper)]/60" />
                Byte
              </div>
              <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-[var(--paper)]/15 bg-[var(--ink-2)] px-4 py-3 text-[var(--paper)]">
                <ul className="display-serif space-y-2 text-[17px] leading-snug">
                  {cookingTips.slice(0, 3).map((tip, i) => (
                    <li key={i}>{tip}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}
        </div>

        {liveItems.length > 0 && (
          <div className="relative z-10 mx-6 mt-8 rounded-2xl border border-[var(--paper)]/12 bg-[var(--ink-2)]/80 p-5 backdrop-blur">
            <div className="mb-3 flex items-baseline justify-between">
              <div className="eyebrow text-[var(--paper)]/55">Composing</div>
              <div className="display-serif text-[22px] text-[var(--paper)]">
                <NoirRollover value={totalCals} />
                <span className="ml-1 font-mono text-[10px] text-[var(--paper)]/50">kcal</span>
              </div>
            </div>
            <div className="divide-y divide-[var(--paper)]/10">
              {liveItems.map((it, i) => (
                <div key={it.id} className="flex items-baseline gap-3 py-2.5">
                  <span className="w-5 font-mono text-[10px] text-[var(--paper)]/40">0{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="display-serif text-[17px] leading-tight text-[var(--paper)]">{it.name}</div>
                    <div className="mt-0.5 font-mono text-[11px] text-[var(--paper)]/50">{it.amount}</div>
                  </div>
                  <div className="font-mono text-xs tabular-nums text-[var(--paper)]/80">{it.calories}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="h-40 shrink-0" aria-hidden />
      </div>

      <div
        className="pointer-events-auto fixed inset-x-0 bottom-0 z-30 border-t border-[var(--paper)]/10 bg-[var(--ink)]/95 px-6 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-4 backdrop-blur-md"
        style={{
          transform: sheetIn ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 520ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {bottomError ? <p className="mb-3 text-center text-sm text-red-400">{bottomError}</p> : null}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="noir-magnet flex-1 rounded-full border border-[var(--paper)]/20 py-4 font-mono text-xs uppercase tracking-[0.2em] text-[var(--paper)]/80"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onReview}
            disabled={!transcript.trim() && liveItems.length === 0}
            className="noir-magnet flex-1 rounded-full bg-[var(--paper)] py-4 font-mono text-xs uppercase tracking-[0.2em] text-[var(--ink)] disabled:opacity-40"
          >
            Review
          </button>
        </div>
        <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--paper)]/40">
          Tap orb to pause · Keyboard to type
        </p>
      </div>
    </div>
  )
}
