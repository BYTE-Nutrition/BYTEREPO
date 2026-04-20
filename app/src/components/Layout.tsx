import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { BottomNav } from '@/components/BottomNav'
import { useByte } from '@/context/useByte'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/components/ui/utils'

export function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { state } = useByte()
  const { session, loading } = useAuth()
  const isLanding = pathname === '/'
  const isOnboarding = pathname === '/onboarding'
  const isSignIn = pathname === '/signin'
  const isVoice = pathname === '/voice'
  const hideNav = isLanding || isOnboarding || isSignIn || isVoice
  /** Main app: centered phone-sized column on desktop; `transform` traps `position:fixed` (nav, immersive voice). */
  const phoneFrame = !isLanding && !isOnboarding && !isSignIn
  /** Landing + sign-in use the same noir phone chrome as the rest of the app. */
  const authSplashShell = isLanding || isSignIn
  const noirDeviceShell = phoneFrame || authSplashShell

  // Redirect to sign-in if not authenticated (after initial session check). Allow `/` so splash can run.
  useEffect(() => {
    if (loading) return
    if (!session && !isSignIn && pathname !== '/') navigate('/signin', { replace: true })
  }, [session, loading, isSignIn, pathname, navigate])

  useEffect(() => {
    if (state.onboardingComplete) return
    const allowed = pathname === '/' || pathname === '/onboarding' || pathname === '/signin'
    if (!allowed) navigate('/onboarding', { replace: true })
  }, [state.onboardingComplete, pathname, navigate])

  return (
    <div
      className={cn(
        'min-h-svh',
        isOnboarding && 'bg-[#f7f6f3]',
        noirDeviceShell &&
          'bg-[#0a0a0a] md:flex md:min-h-svh md:items-center md:justify-center md:bg-[#111] md:p-5 md:pt-8 md:pb-8',
      )}
    >
      <div
        className={cn(
          'relative flex w-full flex-col',
          noirDeviceShell &&
            'byte-noir min-h-svh bg-[var(--ink)] font-[family-name:Archivo] md:mx-auto md:h-[min(844px,90svh)] md:max-h-[90svh] md:min-h-0 md:max-w-[390px] md:overflow-hidden md:rounded-[2.75rem] md:shadow-[0_28px_90px_-24px_rgba(0,0,0,0.55)] md:ring-[10px] md:ring-[#050505] md:[transform:translateZ(0)]',
          !noirDeviceShell && 'min-h-svh',
        )}
      >
        <div
          className={cn(
            'scrollbar-none mx-auto w-full min-h-0 flex-1 overflow-x-hidden overflow-y-auto',
            noirDeviceShell ? 'max-w-md md:max-w-none' : 'max-w-md',
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
