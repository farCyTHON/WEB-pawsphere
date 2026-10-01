import type { User } from '@supabase/supabase-js'

import type { AppRole, Profile, PublicRole, VerificationStatus } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export const ROLE_HOME_PATHS: Record<AppRole, string> = {
  owner: '/dashboard',
  shelter: '/shelter/dashboard',
  vet: '/vet/dashboard',
  admin: '/admin/dashboard',
}

const PUBLIC_ROLES: PublicRole[] = ['owner', 'shelter', 'vet']

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

export async function getCurrentUser(): Promise<User | null> {
  const { data, error } = await supabase.auth.getUser()
  if (error) {
    if (error.name === 'AuthSessionMissingError') return null
    throw error
  }
  return data.user
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle<Profile>()

  if (error) throw error
  return data
}

export async function getCurrentProfile(userId: string): Promise<Profile> {
  const profile = await fetchProfile(userId)
  if (!profile) {
    throw new Error('Your account does not have a profile record yet.')
  }
  return profile
}

/**
 * Creates a profile (and shelter/vet row) from auth user metadata when missing.
 * Covers the signup race and older auth users created without a profile row.
 */
export async function ensureProfileForUser(user: User): Promise<Profile> {
  const existing = await fetchProfile(user.id)
  if (existing) return existing

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>
  const rawRole = typeof meta.role === 'string' ? meta.role : 'owner'
  const role: PublicRole = PUBLIC_ROLES.includes(rawRole as PublicRole)
    ? (rawRole as PublicRole)
    : 'owner'

  const fullName =
    (typeof meta.full_name === 'string' && meta.full_name.trim()) ||
    user.email?.split('@')[0] ||
    'User'
  const phone =
    (typeof meta.phone === 'string' && meta.phone.trim()) || ''
  const email = user.email?.trim() || ''

  const { error: rpcError } = await supabase.rpc('complete_signup', {
    p_user_id: user.id,
    p_role: role,
    p_full_name: fullName,
    p_phone: phone,
    p_email: email,
    p_shelter_name:
      typeof meta.shelter_name === 'string' ? meta.shelter_name : null,
    p_address: typeof meta.address === 'string' ? meta.address : null,
    p_registration_number:
      typeof meta.registration_number === 'string'
        ? meta.registration_number
        : null,
    p_clinic_name:
      typeof meta.clinic_name === 'string' ? meta.clinic_name : null,
    p_specialty: typeof meta.specialty === 'string' ? meta.specialty : null,
    p_license_number:
      typeof meta.license_number === 'string' ? meta.license_number : null,
  })

  if (rpcError) {
    // Fallback when RPC migration is not applied yet.
    console.warn(
      '[PawSphere auth] complete_signup RPC failed, trying direct insert',
      rpcError,
    )
    const verificationStatus: VerificationStatus =
      role === 'owner' ? 'approved' : 'pending'

    const { error: insertError } = await supabase.from('profiles').insert({
      id: user.id,
      email,
      full_name: fullName,
      phone,
      role,
      verification_status: verificationStatus,
    })

    if (insertError && insertError.code !== '23505') {
      throw insertError
    }

    if (role === 'shelter') {
      const { error } = await supabase.from('shelters').insert({
        id: user.id,
        shelter_name:
          (typeof meta.shelter_name === 'string' && meta.shelter_name) ||
          'Shelter',
        address:
          (typeof meta.address === 'string' && meta.address) ||
          'Address pending',
        registration_number:
          (typeof meta.registration_number === 'string' &&
            meta.registration_number) ||
          user.id,
      })
      if (error && error.code !== '23505') throw error
    }

    if (role === 'vet') {
      const { error } = await supabase.from('veterinarians').insert({
        id: user.id,
        clinic_name:
          (typeof meta.clinic_name === 'string' && meta.clinic_name) ||
          'Clinic',
        specialty:
          (typeof meta.specialty === 'string' && meta.specialty) || 'General',
        license_number:
          (typeof meta.license_number === 'string' && meta.license_number) ||
          user.id,
      })
      if (error && error.code !== '23505') throw error
    }
  }

  const profile = await fetchProfile(user.id)
  if (!profile) {
    throw new Error('Unable to create your profile record.')
  }
  return profile
}

/** Load profile with short retries (signup race) then auto-create if still missing. */
export async function resolveProfileForUser(user: User): Promise<Profile> {
  let profile = await fetchProfile(user.id)
  if (profile) return profile

  for (let attempt = 0; attempt < 5; attempt += 1) {
    await sleep(250)
    profile = await fetchProfile(user.id)
    if (profile) return profile
  }

  return ensureProfileForUser(user)
}

export async function isAuthenticated(): Promise<boolean> {
  return (await getCurrentUser()) !== null
}

export function requireRole(
  role: AppRole,
  allowedRoles: readonly AppRole[],
): string | null {
  return allowedRoles.includes(role) ? null : ROLE_HOME_PATHS[role]
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}
