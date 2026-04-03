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
  /** Main app: centered phone-sized column on desktop; `transform` traps `position:fixed` (nav, immersive voice). */
  const phoneFrame = !isLanding && !isOnboarding

  useEffect(() => {
    if (state.onboardingComplete) return
    const allowed = pathname === '/' || pathname === '/onboarding'
    if (!allowed) navigate('/onboarding', { replace: true })
  }, [state.onboardingComplete, pathname, navigate])

  return (
    <div
      className={cn(
        'min-h-svh',
        isLanding && 'bg-white',
        isOnboarding && 'bg-[#f7f6f3]',
        phoneFrame &&
          'bg-[#f7f6f3] md:flex md:min-h-svh md:items-center md:justify-center md:bg-neutral-400/45 md:p-5 md:pt-8 md:pb-8',
      )}
    >
      <div
        className={cn(
          'relative flex w-full flex-col',
          phoneFrame
            ? 'min-h-svh md:mx-auto md:h-[min(844px,90svh)] md:max-h-[90svh] md:min-h-0 md:max-w-[390px] md:overflow-hidden md:rounded-[2.75rem] md:bg-[#f7f6f3] md:shadow-[0_28px_90px_-24px_rgba(0,0,0,0.5)] md:ring-[10px] md:ring-neutral-950 md:[transform:translateZ(0)]'
            : 'min-h-svh',
        )}
      >
        <div
          className={cn(
            'mx-auto w-full min-h-0 flex-1 overflow-x-hidden overflow-y-auto',
            phoneFrame ? 'max-w-md md:max-w-none' : 'max-w-md',
            hideNav ? 'pb-8' : 'pb-32 md:pb-28',
          )}
        >
          {children}
        </div>
        {!hideNav && <BottomNav />}
      </div>
    </div>
  )
}
