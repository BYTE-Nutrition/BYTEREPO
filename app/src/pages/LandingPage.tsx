import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ByteLogo } from '@/components/ByteLogo'
import { useByte } from '@/context/useByte'

const SPLASH_MS = 2200

export function LandingPage() {
  const navigate = useNavigate()
  const { state } = useByte()

  useEffect(() => {
    const next = state.onboardingComplete ? '/home' : '/onboarding'
    const t = window.setTimeout(() => navigate(next, { replace: true }), SPLASH_MS)
    return () => window.clearTimeout(t)
  }, [navigate, state.onboardingComplete])

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-[#f7f6f3] px-8">
      <div className="landing-logo-reveal [animation-delay:120ms]">
        <ByteLogo className="[&>span:last-child]:px-4 [&>span:last-child]:py-2 [&>span:last-child]:text-[clamp(1.5rem,7vw,2.5rem)]" />
      </div>
    </div>
  )
}
