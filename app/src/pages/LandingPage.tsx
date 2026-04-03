import { useEffect } from 'react'
import logo from '../assets/byte-logo.jpg'
import { useNavigate } from 'react-router-dom'
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
      <img
        src={logo}
        alt=""
        className="landing-logo-reveal h-[clamp(4.5rem,22vw,7.5rem)] w-auto max-w-[min(100%,420px)] object-contain [animation-delay:120ms]"
        decoding="async"
      />
    </div>
  )
}
