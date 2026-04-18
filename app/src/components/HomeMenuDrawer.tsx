import { useEffect } from 'react'
import { ChevronRight, TrendingUp, Utensils, User, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

type Props = {
  open: boolean
  onClose: () => void
}

const rows: { to: string; label: string; hint: string; icon: typeof User }[] = [
  { to: '/profile', label: 'Profile', hint: 'You & targets', icon: User },
  { to: '/progress', label: 'Rhythm', hint: 'This week', icon: TrendingUp },
  { to: '/meals', label: 'Meals', hint: 'Today’s plates', icon: Utensils },
]

export function HomeMenuDrawer({ open, onClose }: Props) {
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Menu">
      <button
        type="button"
        aria-label="Close menu"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />
      <div
        className="byte-noir absolute inset-y-0 right-0 flex w-[min(19rem,88vw)] flex-col border-l border-[var(--line)] bg-[var(--ink-2)] font-[family-name:Archivo] shadow-[0_0_48px_-12px_rgba(0,0,0,0.45)]"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
          <div>
            <p className="eyebrow text-[var(--paper)]/55">Menu</p>
            <p className="display-serif text-[15px] text-[var(--paper)]">Settings & more</p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded-full p-2 text-[var(--paper)]/70 hover:bg-[var(--paper)]/10"
          >
            <X className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-4" aria-label="Settings">
          <ul className="divide-y divide-[var(--line-soft)] border-y border-[var(--line)]">
            {rows.map(({ to, label, hint, icon: Icon }) => (
              <li key={to}>
                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    navigate(to)
                  }}
                  className="flex w-full items-center gap-3 py-4 pl-3 pr-2 text-left transition-colors active:bg-[var(--paper)]/5"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--ink-3)] text-[var(--paper)]/80">
                    <Icon className="h-5 w-5" strokeWidth={1.5} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-medium text-[var(--paper)]">{label}</span>
                    <span className="block text-sm text-[var(--paper)]/50">{hint}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-[var(--paper)]/35" strokeWidth={1.5} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <p className="border-t border-[var(--line)] px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-center font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--paper)]/40">
          Byte · cooking companion
        </p>
      </div>
    </div>
  )
}
