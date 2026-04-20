import { useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { SplashScreen } from '@/components/noir/SplashScreen'
import { useAuth } from '@/context/AuthContext'
import { useByte } from '@/context/useByte'

export function LandingPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const { state } = useByte()
  const sessionRef = useRef(session)
  const onboardingRef = useRef(state.onboardingComplete)
  sessionRef.current = session
  onboardingRef.current = state.onboardingComplete

  const onSplashDone = useCallback(() => {
    if (!sessionRef.current) {
      navigate('/signin', { replace: true })
      return
    }
    navigate(onboardingRef.current ? '/home' : '/onboarding', { replace: true })
  }, [navigate])

  return (
    <div className="noir-page-enter relative min-h-svh w-full">
      <SplashScreen onDone={onSplashDone} />
    </div>
  )
}
