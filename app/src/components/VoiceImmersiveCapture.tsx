import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Keyboard, X } from 'lucide-react'
import { NoirMealSlotRail, NoirRollover, NoirStatusBar } from '@/components/noir/NoirPrimitives'
import type { MealItem, MealSlot } from '@/lib/types'
import type { VoiceTranscriptMessage } from '@/lib/voiceTranscript'

type Props = {
  slot: MealSlot
  onSlotChange: (s: MealSlot) => void
  /** Full user text for meal-parse hints, Review, and cooking tips. */
  transcript: string
  /** Discrete turns for the chat transcript (Realtime or a single synthetic user line for Web Speech). */
  messages: VoiceTranscriptMessage[]
  assistantSpeaking: boolean
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
  /** Shown when remote WebRTC audio could not autoplay (browser policy). */
  soundUnlockHint?: string | null
  onSoundUnlock?: () => void
  /** Immersive flow uses OpenAI Realtime only — hide Web Speech “use Chrome” messaging. */
  hideBrowserSpeechHint?: boolean
}

const VoiceChatRow = memo(function VoiceChatRow({
  message,
  showUserCursor,
}: {
  message: VoiceTranscriptMessage
  showUserCursor: boolean
}) {
  const isUser = message.role === 'user'
  const streaming = message.status === 'streaming'
  const showText = message.text.trim().length > 0 || !streaming

  return (
    <div
      className={`noir-voice-msg-enter flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
      aria-live={message.role === 'assistant' && streaming ? 'polite' : undefined}
    >
      <div className={`eyebrow mb-1.5 ${isUser ? 'pr-1 text-[var(--paper)]/40' : 'pl-1 text-[var(--paper)]/40'}`}>
        {isUser ? 'You' : 'Byte'}
      </div>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'rounded-br-sm bg-[var(--paper)] text-[var(--ink)]'
            : 'rounded-bl-sm border border-[var(--paper)]/15 bg-[var(--ink-2)] text-[var(--paper)]'
        }`}
      >
        <p className="display-serif min-h-[22px] text-lg leading-snug">
          {showText ? (
            <>
              {message.text}
              {isUser && streaming && showUserCursor ? (
                <span className="ml-1 inline-block h-4 w-0.5 animate-pulse bg-[var(--ink)] align-middle" />
              ) : null}
              {!isUser && streaming && !message.text.trim() ? (
                <span className="text-[var(--paper)]/35">…</span>
              ) : null}
            </>
          ) : (
            <span className={isUser ? 'text-[var(--ink)]/40' : 'text-[var(--paper)]/35'}>
              {isUser ? 'Listening…' : '…'}
            </span>
          )}
        </p>
      </div>
    </div>
  )
})

export const VoiceImmersiveCapture = memo(function VoiceImmersiveCapture({
  slot,
  onSlotChange,
  transcript,
  messages,
  assistantSpeaking,
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
  soundUnlockHint,
  onSoundUnlock,
  hideBrowserSpeechHint = false,
}: Props) {
  const [sheetIn, setSheetIn] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setSheetIn(true))
    })
    return () => cancelAnimationFrame(id)
  }, [])

  useEffect(() => {
    if (!listening) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== ' ' && e.key !== 'Spacebar' && e.key !== 'Enter') return
      const root = rootRef.current
      const active = document.activeElement as HTMLElement | null
      if (!root || !active) return
      if (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable) return
      if (active.tagName === 'BUTTON' && root.contains(active)) {
        e.preventDefault()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [listening])

  const [showAll, setShowAll] = useState(false)
  const prevMessagesLenRef = useRef(messages.length)
  useEffect(() => {
    if (messages.length > prevMessagesLenRef.current) {
      setShowAll(false)
    }
    prevMessagesLenRef.current = messages.length
  }, [messages.length])

  const { visibleMessages, hiddenCount, collapsibleCount } = useMemo(() => {
    const lastUserIdx = (() => {
      for (let i = messages.length - 1; i >= 0; i--) if (messages[i].role === 'user') return i
      return -1
    })()
    const lastAssistantIdx = (() => {
      for (let i = messages.length - 1; i >= 0; i--) if (messages[i].role === 'assistant') return i
      return -1
    })()
    const keepIdx = new Set<number>()
    if (lastUserIdx >= 0) keepIdx.add(lastUserIdx)
    if (lastAssistantIdx >= 0) keepIdx.add(lastAssistantIdx)
    const collapsible = messages.length - keepIdx.size
    if (showAll || messages.length <= 1 || collapsible <= 0) {
      return { visibleMessages: messages, hiddenCount: 0, collapsibleCount: collapsible }
    }
    const visible = messages.filter((_, i) => keepIdx.has(i))
    const hidden = messages.length - visible.length
    return { visibleMessages: visible, hiddenCount: hidden, collapsibleCount: collapsible }
  }, [messages, showAll])

  const scrollTailKey =
    visibleMessages.length === 0
      ? ''
      : `${visibleMessages[visibleMessages.length - 1]?.id}:${visibleMessages[visibleMessages.length - 1]?.text.length}:${visibleMessages[visibleMessages.length - 1]?.status}`

  useLayoutEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end', behavior: 'auto' })
  }, [scrollTailKey, visibleMessages.length])

  const orbScale = 1 + audioLevel * 0.18
  const orbRingOpacity = 0.25 + audioLevel * 0.45
  const totalCals = liveItems.reduce((a, i) => a + i.calories, 0)

  const last = messages[messages.length - 1]
  const composing =
    assistantSpeaking || (last?.role === 'assistant' && last.status === 'streaming')

  return (
    <div
      ref={rootRef}
      className="byte-noir fixed inset-0 z-50 flex flex-col overflow-hidden bg-[var(--ink)] text-[var(--paper)]"
    >
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

      <div className="noir-canvas-bg noir-grain relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="relative z-10 flex shrink-0 flex-col items-center pt-[90px]">
          <div className="absolute left-5 top-[170px] z-20">
            <NoirMealSlotRail slot={slot} onSlotChange={onSlotChange} />
          </div>

          <div className="relative h-[170px] w-[170px]">
            <div className="noir-ring rounded-full" style={{ opacity: orbRingOpacity }} />
            <div className="noir-ring delay-1 rounded-full" style={{ opacity: orbRingOpacity * 0.8 }} />
            <div className="noir-ring delay-2 rounded-full" style={{ opacity: orbRingOpacity * 0.6 }} />
            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur()
                onToggleMic()
              }}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Spacebar' || e.key === 'Enter') {
                  e.preventDefault()
                }
              }}
              tabIndex={-1}
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
            {composing ? 'Byte is composing' : transcript.trim() ? 'You’re on mic' : statusLine ?? 'Byte is listening'}
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

        <div className="relative z-10 mt-6 min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="space-y-4 pb-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-end">
                <div className="eyebrow mb-1.5 pr-1 text-[var(--paper)]/40">You</div>
                <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-[var(--paper)] px-4 py-3 text-[var(--ink)]">
                  <p className="display-serif min-h-[22px] text-lg leading-snug text-[var(--ink)]/40">
                    Describe what you&apos;re making…
                  </p>
                </div>
              </div>
            ) : (
              <>
                {hiddenCount > 0 && !showAll ? (
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.currentTarget.blur()
                        setShowAll(true)
                      }}
                      className="rounded-full border border-[var(--paper)]/20 bg-[var(--ink-2)]/80 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--paper)]/70 backdrop-blur hover:text-[var(--paper)]"
                    >
                      Show earlier ({hiddenCount})
                    </button>
                  </div>
                ) : null}
                {showAll && collapsibleCount > 0 ? (
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.currentTarget.blur()
                        setShowAll(false)
                      }}
                      className="rounded-full border border-[var(--paper)]/20 bg-[var(--ink-2)]/80 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--paper)]/70 backdrop-blur hover:text-[var(--paper)]"
                    >
                      Hide earlier
                    </button>
                  </div>
                ) : null}
                {visibleMessages.map((m) => (
                  <VoiceChatRow
                    key={m.id}
                    message={m}
                    showUserCursor={listening && m.role === 'user' && m.status === 'streaming'}
                  />
                ))}
              </>
            )}

            {micVizError ? (
              <p className="text-center text-xs text-amber-300/90">{micVizError}</p>
            ) : null}
            {!speechSupported && !hideBrowserSpeechHint ? (
              <p className="mx-auto max-w-[20rem] text-center text-sm text-[var(--paper)]/50">
                Use Chrome or Edge, or open the keyboard to type.
              </p>
            ) : null}

            {cookingTips.length > 0 && transcript.trim().length > 12 ? (
              <div className="flex flex-col items-start">
                <div className="mb-1.5 flex items-center gap-2 pl-1 eyebrow text-[var(--paper)]/40">
                  <span className="inline-block h-1 w-1 rounded-full bg-[var(--paper)]/60" />
                  Tips
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
            <div ref={endRef} className="h-px w-full shrink-0" aria-hidden />
          </div>
        </div>

        {liveItems.length > 0 && (
          <div className="relative z-10 mx-6 mt-4 shrink-0 rounded-2xl border border-[var(--paper)]/12 bg-[var(--ink-2)]/80 p-5 backdrop-blur">
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

        <div className="h-24 shrink-0" aria-hidden />
      </div>

      <div
        className="pointer-events-auto fixed inset-x-0 bottom-0 z-30 border-t border-[var(--paper)]/10 bg-[var(--ink)]/95 px-6 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-4 backdrop-blur-md"
        style={{
          transform: sheetIn ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 520ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {soundUnlockHint ? (
          <div className="mb-3 flex flex-col items-center gap-2 rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3">
            <p className="text-center text-sm text-amber-100/90">{soundUnlockHint}</p>
            {onSoundUnlock ? (
              <button
                type="button"
                onClick={onSoundUnlock}
                className="rounded-full border border-amber-400/50 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-amber-100/95"
              >
                Enable sound
              </button>
            ) : null}
          </div>
        ) : null}
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
})
