import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useByte } from '@/context/useByte'

/**
 * Landing page for Google OAuth redirect.
 * Supabase automatically exchanges the code/token in the URL on client init,
 * so we just wait for onAuthStateChange to fire and then navigate the user.
 */
export function AuthCallbackPage() {
  const navigate = useNavigate()
  const { state } = useByte()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        navigate(state.onboardingComplete ? '/home' : '/onboarding', { replace: true })
      } else if (event === 'SIGNED_OUT' || (!session && event !== 'INITIAL_SESSION')) {
        navigate('/signin', { replace: true })
      }
    })

    // Also check for an already-resolved session (race: client exchanged code before this mounts)
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        navigate(state.onboardingComplete ? '/home' : '/onboarding', { replace: true })
      }
    })

    return () => subscription.unsubscribe()
  }, [navigate, state.onboardingComplete])

  return (
    <div className="noir-screen-root flex min-h-full items-center justify-center bg-[var(--ink)]">
      <p className="text-sm text-[var(--paper-muted)]">Signing you in…</p>
    </div>
  )
}
