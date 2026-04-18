import { useEffect, useRef, useState } from 'react'
import { Battery, Signal, Wifi } from 'lucide-react'
import { MEAL_LABELS, MEAL_ORDER, type MealSlot } from '@/lib/types'

export function NoirByteMark({ className = '', size = 'md' as 'sm' | 'md' | 'lg' }) {
  const sz =
    size === 'lg' ? 'text-[56px]' : size === 'sm' ? 'text-[16px]' : 'text-[22px]'
  return (
    <span
      className={`inline-flex items-center leading-none ${sz} font-black tracking-[-0.02em] text-[var(--paper)] ${className}`}
      style={{ fontFamily: 'Archivo, system-ui, sans-serif' }}
      aria-label="BYTE"
    >
      BYTE
    </span>
  )
}

export function NoirStatusBar({ dark = true }: { dark?: boolean }) {
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
  )
  useEffect(() => {
    const id = window.setInterval(() => {
      setTime(new Date().toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }))
    }, 30_000)
    return () => window.clearInterval(id)
  }, [])
  return (
    <div className={`noir-status-bar ${dark ? 'on-dark' : ''}`}>
      <span className="font-mono tracking-tight">{time}</span>
      <span className="noir-status-icons">
        <Signal className="h-[15px] w-[15px]" strokeWidth={1.8} aria-hidden />
        <Wifi className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
        <Battery className="h-[22px] w-[22px]" strokeWidth={1.5} aria-hidden />
      </span>
    </div>
  )
}

export function NoirRollover({ value, className = '' }: { value: number; className?: string }) {
  const [displayed, setDisplayed] = useState(value)
  const raf = useRef<number | null>(null)
  useEffect(() => {
    const start = displayed
    const target = value
    const dur = 700
    const t0 = performance.now()
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / dur)
      const eased = 1 - (1 - p) ** 3
      const cur = Math.round(start + (target - start) * eased)
      setDisplayed(cur)
      if (p < 1) raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
    return () => {
      if (raf.current != null) cancelAnimationFrame(raf.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- roll from previous displayed toward `value`
  }, [value])
  return <span className={`tabular-nums ${className}`}>{displayed}</span>
}

export function NoirMealSlotRail({
  slot,
  onSlotChange,
}: {
  slot: MealSlot
  onSlotChange: (s: MealSlot) => void
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('pointerdown', onDown)
    return () => window.removeEventListener('pointerdown', onDown)
  }, [open])

  return (
    <div
      ref={rootRef}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      className="relative select-none"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`relative flex items-center gap-2 rounded-full border py-1.5 pl-2 pr-3 transition-all ${
          open
            ? 'border-[var(--paper)]/10 bg-transparent'
            : 'border-[var(--paper)]/18 bg-[var(--ink)]/50 backdrop-blur hover:border-[var(--paper)]/35'
        }`}
        aria-expanded={open}
        aria-label="Change meal slot"
      >
        <span className="relative grid h-[11px] w-[11px] place-items-center">
          <span className="absolute inset-0 rounded-full bg-[var(--champagne)]" />
          <span
            className="absolute -inset-[5px] rounded-full border border-[var(--champagne)]/35"
            style={{ animation: 'noir-ring-pulse 2.4s cubic-bezier(0.22,1,0.36,1) infinite' }}
          />
        </span>
        <span
          className={`font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--paper)] transition-opacity ${
            open ? 'opacity-0' : 'opacity-100'
          }`}
        >
          {MEAL_LABELS[slot]}
        </span>
      </button>

      <div
        className={`absolute left-0 top-0 pl-2 pt-1.5 transition-all duration-300 ${
          open
            ? 'pointer-events-auto translate-y-0 opacity-100'
            : 'pointer-events-none -translate-y-1 opacity-0'
        }`}
      >
        <div className="relative flex flex-col items-start gap-0 pt-1">
          <div className="absolute bottom-2 left-[5px] top-3 w-px bg-[var(--paper)]/15" aria-hidden />
          {MEAL_ORDER.map((s) => {
            const active = s === slot
            return (
              <button
                key={s}
                type="button"
                onClick={() => {
                  onSlotChange(s)
                  setOpen(false)
                }}
                className="group relative flex items-center gap-3 py-[7px] pl-0 pr-2 text-left"
                aria-pressed={active}
              >
                <span className="relative z-10 grid h-[11px] w-[11px] place-items-center rounded-full">
                  <span
                    className={`absolute inset-0 rounded-full border transition-all ${
                      active
                        ? 'scale-100 border-[var(--champagne)] bg-[var(--champagne)]'
                        : 'scale-[0.85] border-[var(--paper)]/35 bg-[var(--ink)]/60 group-hover:border-[var(--paper)]/70'
                    }`}
                  />
                </span>
                <span
                  className={`font-mono text-[10px] uppercase tracking-[0.22em] transition-all ${
                    active
                      ? 'text-[var(--paper)]'
                      : 'text-[var(--paper)]/50 group-hover:text-[var(--paper)]/90'
                  }`}
                >
                  {MEAL_LABELS[s]}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
