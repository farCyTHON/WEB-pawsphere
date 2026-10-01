import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { RefreshCw } from 'lucide-react'

import { useAuth } from '@/contexts/AuthContext'
import type { AppRole } from '@/lib/auth'
import { ROLE_HOME_PATHS, requireRole } from '@/lib/auth-utils'

interface ProtectedRouteProps {
  children: ReactNode
  allowedRoles?: AppRole[]
  allowPending?: boolean
}

export function ProtectedRoute({
  children,
  allowedRoles,
  allowPending = false,
}: ProtectedRouteProps) {
  const { session, profile, loading, error, refreshProfile, signOut } =
    useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="text-center">
          <RefreshCw
            className="mx-auto animate-spin text-[#16A34A]"
            size={28}
          />
          <p className="mt-3 text-sm text-[#6B7280]">
            Loading your account...
          </p>
        </div>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/sign-in" replace state={{ from: location.pathname }} />
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] p-6">
        <div className="max-w-md rounded-2xl border border-[#E5E7EB] bg-white p-6 text-center shadow-sm">
          <h1 className="text-xl font-bold text-[#111827]">
            Setting up your profile
          </h1>
          <p className="mt-2 text-sm text-[#6B7280]">
            {error ??
              'Your account was created, but the profile record is still loading.'}
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => void refreshProfile()}
              className="rounded-[10px] bg-[#16A34A] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#15803D]"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={() => void signOut()}
              className="rounded-[10px] border border-[#E5E7EB] px-4 py-2.5 text-sm font-medium text-[#6B7280] hover:bg-[#F8FAFC]"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    )
  }

  const isProfessional = profile.role === 'shelter' || profile.role === 'vet'
  if (
    isProfessional &&
    profile.verification_status === 'pending' &&
    !allowPending
  ) {
    return <Navigate to="/verification-pending" replace />
  }

  if (
    isProfessional &&
    profile.verification_status !== 'pending' &&
    allowPending
  ) {
    return <Navigate to={ROLE_HOME_PATHS[profile.role]} replace />
  }

  if (allowedRoles) {
    const redirectTo = requireRole(profile.role, allowedRoles)
    if (redirectTo) {
      return <Navigate to={redirectTo} replace />
    }
  }

  return children
}
