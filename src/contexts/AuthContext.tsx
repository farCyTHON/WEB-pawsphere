import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { AuthError, Session, User } from '@supabase/supabase-js'

import type { Profile } from '@/lib/auth'
import {
  getCurrentUser,
  resolveProfileForUser,
} from '@/lib/auth-utils'
import { supabase } from '@/lib/supabase'

interface AuthContextValue {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  error: string | null
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<Profile | null>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const resolveSession = useCallback(async (nextSession: Session | null) => {
    setSession(nextSession)

    if (!nextSession) {
      setProfile(null)
      setError(null)
      setLoading(false)
      return null
    }

    setLoading(true)
    setError(null)
    try {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        setSession(null)
        setProfile(null)
        setError(null)
        return null
      }

      const nextProfile = await resolveProfileForUser(currentUser)
      setProfile(nextProfile)
      setError(null)
      return nextProfile
    } catch (profileError) {
      console.error('[PawSphere auth] profile resolve failed', profileError)
      setProfile(null)
      setError(
        profileError instanceof Error
          ? profileError.message
          : 'Unable to load your profile.',
      )
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let mounted = true

    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!mounted) return
      if (sessionError) {
        console.warn('[PawSphere auth] getSession failed', sessionError)
        setSession(null)
        setProfile(null)
        setError(null)
        setLoading(false)
        return
      }
      void resolveSession(data.session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      window.setTimeout(() => {
        if (mounted) void resolveSession(nextSession)
      }, 0)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [resolveSession])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    return { error: signInError }
  }, [])

  const signOut = useCallback(async () => {
    const { error: signOutError } = await supabase.auth.signOut()
    if (signOutError) throw signOutError
    setSession(null)
    setProfile(null)
    setError(null)
  }, [])

  const refreshProfile = useCallback(async () => {
    const { data } = await supabase.auth.getSession()
    return resolveSession(data.session)
  }, [resolveSession])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      error,
      signIn,
      signOut,
      refreshProfile,
    }),
    [error, loading, profile, refreshProfile, session, signIn, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return context
}
