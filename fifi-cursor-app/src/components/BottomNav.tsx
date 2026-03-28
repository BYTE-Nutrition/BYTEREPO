import { Plus, Target, TrendingUp, Utensils, User } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { cn } from '@/components/ui/utils'

const linkClass = (active: boolean) =>
  cn('flex flex-col items-center gap-1 min-w-[3.5rem]', active ? 'text-black' : 'text-gray-400')

export function BottomNav() {
  const navigate = useNavigate()

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto flex max-w-md justify-around">
        <NavLink to="/" end className={({ isActive }) => linkClass(isActive)}>
          <Target className="h-6 w-6" />
          <span className="text-xs">Home</span>
        </NavLink>
        <NavLink to="/progress" className={({ isActive }) => linkClass(isActive)}>
          <TrendingUp className="h-6 w-6" />
          <span className="text-xs">Progress</span>
        </NavLink>
        <button
          type="button"
          aria-label="Log meal with voice"
          onClick={() => navigate('/voice')}
          className="-mt-7 flex h-14 w-14 items-center justify-center rounded-full bg-black shadow-lg"
        >
          <Plus className="h-7 w-7 text-white" />
        </button>
        <NavLink to="/meals" className={({ isActive }) => linkClass(isActive)}>
          <Utensils className="h-6 w-6" />
          <span className="text-xs">Meals</span>
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => linkClass(isActive)}>
          <User className="h-6 w-6" />
          <span className="text-xs">Profile</span>
        </NavLink>
      </div>
    </div>
  )
}
