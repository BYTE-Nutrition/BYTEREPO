import { Mic, Target, TrendingUp, Utensils, User } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { cn } from '@/components/ui/utils'

const navBtn = (active: boolean) =>
  cn(
    'flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-full py-2 transition-all duration-200',
    active ? 'bg-white text-neutral-950 shadow-md shadow-black/10' : 'text-white/50 hover:text-white/85',
  )

export function BottomNav() {
  const navigate = useNavigate()

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-5 pb-[max(0.85rem,env(safe-area-inset-bottom))]">
      <nav
        className="pointer-events-auto relative flex w-full max-w-sm items-end gap-0.5 rounded-full border border-white/10 bg-neutral-950 px-1.5 py-1.5 shadow-[0_-10px_40px_-6px_rgba(0,0,0,0.38)] ring-1 ring-black/20"
        aria-label="Main navigation"
      >
        <NavLink to="/home" className={({ isActive }) => cn(navBtn(isActive), 'pl-1')}>
          <Target className="h-5 w-5 shrink-0" strokeWidth={1.75} />
          <span className="text-[10px] font-semibold tracking-wide">Home</span>
        </NavLink>
        <NavLink to="/progress" className={({ isActive }) => navBtn(isActive)}>
          <TrendingUp className="h-5 w-5 shrink-0" strokeWidth={1.75} />
          <span className="text-[10px] font-semibold tracking-wide">Progress</span>
        </NavLink>

        <div className="relative flex w-[5.5rem] shrink-0 justify-center">
          <button
            type="button"
            aria-label="Log meal with voice"
            onClick={() => navigate('/voice')}
            className="absolute -top-[1.65rem] flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full bg-neutral-950 shadow-[0_14px_32px_-8px_rgba(0,0,0,0.5)] ring-[6px] ring-stone-100 transition-transform active:scale-95"
          >
            <Mic className="h-9 w-9 text-amber-200" strokeWidth={2} />
          </button>
        </div>

        <NavLink to="/meals" className={({ isActive }) => navBtn(isActive)}>
          <Utensils className="h-5 w-5 shrink-0" strokeWidth={1.75} />
          <span className="text-[10px] font-semibold tracking-wide">Meals</span>
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => cn(navBtn(isActive), 'pr-1')}>
          <User className="h-5 w-5 shrink-0" strokeWidth={1.75} />
          <span className="text-[10px] font-semibold tracking-wide">Profile</span>
        </NavLink>
      </nav>
    </div>
  )
}
