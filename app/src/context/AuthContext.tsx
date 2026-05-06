import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { analytics } from '@/lib/analytics'

interface AuthContextValue {
  session: Session | null
  user: User | null
  /** True while the initial session check is in flight. */
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      if (session?.user) {
        analytics.identify(session.user.id, session.user.email)
        if (event === 'SIGNED_IN') analytics.track('user_signed_in', { provider: 'google' })
      }
      if (event === 'SIGNED_OUT') analytics.reset()
    })

    return () => subscription.unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        skipBrowserRedirect: true,
      },
    })
    if (error) throw error
    if (!data.url) return

    // OAuth must run at the top level. Embedded previews (iframe) only change the
    // inner frame with the default redirect and Chrome reports a cross-frame error.
    const topWin = window.top ?? window
    try {
      topWin.location.assign(data.url)
    } catch {
      window.open(data.url, '_blank', 'noopener,noreferrer')
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
