import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { BottomNav } from '@/components/BottomNav'
import { useByte } from '@/context/useByte'
import { cn } from '@/components/ui/utils'

export function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { state } = useByte()
  const isLanding = pathname === '/'
  const isOnboarding = pathname === '/onboarding'
  const hideNav = isLanding || isOnboarding

  useEffect(() => {
    if (state.onboardingComplete) return
    const allowed = pathname === '/' || pathname === '/onboarding'
    if (!allowed) navigate('/onboarding', { replace: true })
  }, [state.onboardingComplete, pathname, navigate])

  return (
    <div
      className={cn(
        'min-h-svh',
        isLanding ? 'bg-white' : isOnboarding ? 'bg-[#fafaf9]' : 'bg-gradient-to-b from-stone-100/90 via-stone-50/80 to-white',
      )}
    >
      <div className={cn('mx-auto max-w-md', hideNav ? 'pb-8' : 'pb-32')}>{children}</div>
      {!hideNav && <BottomNav />}
    </div>
  )
}
