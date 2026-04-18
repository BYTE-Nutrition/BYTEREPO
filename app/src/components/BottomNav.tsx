import type { LucideIcon } from 'lucide-react'
import { Clock, Flame, Leaf, Mic, Sparkles } from 'lucide-react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { cn } from '@/components/ui/utils'
import { useVoiceEntry } from '@/context/VoiceEntryContext'

export function BottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { primeMic } = useVoiceEntry()
  const voiceActive = pathname === '/voice'

  type Tab =
    | { key: string; primary: true }
    | { key: string; to: string; label: string; icon: LucideIcon }

  const tabs: Tab[] = [
    { key: 'home', to: '/home', label: 'Home', icon: Sparkles },
    { key: 'meals', to: '/meals', label: 'Meals', icon: Leaf },
    { key: 'voice', primary: true },
    { key: 'progress', to: '/progress', label: 'Rhythm', icon: Flame },
    { key: 'profile', to: '/profile', label: 'Profile', icon: Clock },
  ]

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2">
      <nav
        className="pointer-events-auto relative flex w-full max-w-sm items-center justify-between rounded-full bg-[color:rgb(0_0_0/0.92)] px-2 py-2 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.35)] backdrop-blur-xl"
        aria-label="Main navigation"
      >
        {tabs.map((t) => {
          if ('primary' in t && t.primary) {
            return (
              <button
                key={t.key}
                type="button"
                aria-label="Log meal with voice"
                aria-current={voiceActive ? 'page' : undefined}
                onClick={async () => {
                  await primeMic()
                  navigate('/voice?capture=1', { state: { autoStartVoice: true } })
                }}
                className="noir-magnet relative -mt-7 grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[var(--paper)] text-[var(--ink)] shadow-[0_14px_28px_-8px_rgba(0,0,0,0.55)]"
              >
                <span className="absolute inset-0 rounded-full ring-1 ring-[var(--champagne)]/40" aria-hidden />
                <Mic className="h-[22px] w-[22px]" strokeWidth={1.6} aria-hidden />
              </button>
            )
          }
          const link = t as { key: string; to: string; label: string; icon: LucideIcon }
          const { to, label, icon: Icon } = link
          const active = pathname === to
          return (
            <NavLink
              key={t.key}
              to={to}
              className={cn(
                'relative flex min-w-0 flex-1 flex-col items-center gap-0.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] transition-colors',
                active ? 'text-[var(--paper)]' : 'text-[#e8e4d8] hover:text-[var(--paper)]',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={active ? 2 : 1.7} aria-hidden />
              <span>{label}</span>
              {active ? (
                <span className="absolute -top-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[var(--champagne)]" />
              ) : null}
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}
