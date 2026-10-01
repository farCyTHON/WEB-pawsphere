import type { Session, User } from '@supabase/supabase-js'

import { supabase } from '@/lib/supabase'

export type AppRole = 'owner' | 'shelter' | 'vet' | 'admin'
export type PublicRole = Exclude<AppRole, 'admin'>
export type VerificationStatus = 'pending' | 'approved' | 'rejected'

export interface Profile {
  id: string
  email: string
  full_name: string
  phone: string
  role: AppRole
  verification_status: VerificationStatus
  created_at: string
  updated_at: string
}

export interface SignUpInput {
  role: PublicRole
  fullName: string
  email: string
  phone: string
  password: string
  shelterName?: string
  address?: string
  registrationNumber?: string
  clinicName?: string
  specialty?: string
  licenseNumber?: string
}

export interface SignUpResult {
  user: User
  session: Session | null
  emailConfirmationRequired: boolean
}

function logSignupError(stage: string, error: unknown) {
  console.error(`[PawSphere signup] ${stage}`, error)
  if (error && typeof error === 'object') {
    const err = error as {
      message?: string
      code?: string
      details?: string
      hint?: string
      status?: number
    }
    console.error('[PawSphere signup] details', {
      message: err.message,
      code: err.code,
      details: err.details,
      hint: err.hint,
      status: err.status,
    })
  }
}

function formatError(stage: string, error: { message?: string; code?: string; details?: string; hint?: string }) {
  if (
    error.code === 'over_email_send_rate_limit' ||
    /rate limit/i.test(error.message ?? '')
  ) {
    return (
      'Too many confirmation emails were sent from this project. ' +
      'Please wait about an hour, or sign in if you already created an account. ' +
      'For local development: Supabase Dashboard → Authentication → Providers → Email → turn off “Confirm email”.'
    )
  }

  const parts = [
    stage,
    error.message,
    error.code ? `code=${error.code}` : null,
    error.details ? `details=${error.details}` : null,
    error.hint ? `hint=${error.hint}` : null,
  ].filter(Boolean)
  return parts.join(' | ')
}

async function createAuthUser(
  input: SignUpInput,
): Promise<{ user: User; session: Session | null }> {
  const email = input.email.trim()

  // Prefer signing in when the account already exists so we do not burn the
  // project's tiny built-in email quota (2 confirmation emails / hour).
  const existing = await supabase.auth.signInWithPassword({
    email,
    password: input.password,
  })

  if (!existing.error && existing.data.user) {
    console.info(
      '[PawSphere signup] Account already exists — signed in instead of creating a new user.',
    )
    return { user: existing.data.user, session: existing.data.session }
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password: input.password,
    options: {
      emailRedirectTo: `${window.location.origin}/sign-in`,
      data: {
        role: input.role,
        full_name: input.fullName.trim(),
        phone: input.phone.trim(),
        shelter_name: input.shelterName?.trim() ?? null,
        address: input.address?.trim() ?? null,
        registration_number: input.registrationNumber?.trim() ?? null,
        clinic_name: input.clinicName?.trim() ?? null,
        specialty: input.specialty?.trim() ?? null,
        license_number: input.licenseNumber?.trim() ?? null,
      },
    },
  })

  if (error) {
    logSignupError('Auth signUp failed', error)
    throw new Error(formatError('Auth error', error))
  }

  if (!data.user) {
    const message = 'Auth succeeded but no user was returned.'
    console.error('[PawSphere signup]', message, data)
    throw new Error(message)
  }

  // Duplicate email: Supabase returns a user with empty identities and may
  // still attempt to send mail (which burns the rate limit).
  if (!data.session && (data.user.identities?.length ?? 0) === 0) {
    throw new Error(
      'An account with this email already exists. Please sign in instead.',
    )
  }

  return { user: data.user, session: data.session }
}

async function insertProfile(
  user: User,
  input: SignUpInput,
  verificationStatus: VerificationStatus,
) {
  const payload = {
    id: user.id,
    email: input.email.trim(),
    full_name: input.fullName.trim(),
    phone: input.phone.trim(),
    role: input.role,
    verification_status: verificationStatus,
  }

  const { error } = await supabase.from('profiles').insert(payload)

  if (error) {
    // Profile may already exist if a previous attempt partially succeeded.
    if (error.code === '23505') {
      console.warn('[PawSphere signup] Profile already exists, continuing.', error)
      return
    }
    logSignupError('Profile insert failed', error)
    throw new Error(formatError('Profile insert error', error))
  }
}

async function insertShelter(userId: string, input: SignUpInput) {
  const { error } = await supabase.from('shelters').insert({
    id: userId,
    shelter_name: input.shelterName?.trim() || 'Shelter',
    address: input.address?.trim() || 'Address pending',
    registration_number: input.registrationNumber?.trim() || userId,
  })

  if (error) {
    if (error.code === '23505') {
      console.warn('[PawSphere signup] Shelter already exists, continuing.', error)
      return
    }
    logSignupError('Shelter insert failed', error)
    throw new Error(formatError('Shelter insert error', error))
  }
}

async function insertVeterinarian(userId: string, input: SignUpInput) {
  const { error } = await supabase.from('veterinarians').insert({
    id: userId,
    clinic_name: input.clinicName?.trim() || 'Clinic',
    specialty: input.specialty?.trim() || 'General',
    license_number: input.licenseNumber?.trim() || userId,
  })

  if (error) {
    if (error.code === '23505') {
      console.warn('[PawSphere signup] Veterinarian already exists, continuing.', error)
      return
    }
    logSignupError('Veterinarian insert failed', error)
    throw new Error(formatError('Veterinarian insert error', error))
  }
}

async function completeSignupViaRpc(user: User, input: SignUpInput) {
  const { error } = await supabase.rpc('complete_signup', {
    p_user_id: user.id,
    p_role: input.role,
    p_full_name: input.fullName.trim(),
    p_phone: input.phone.trim(),
    p_email: input.email.trim(),
    p_shelter_name: input.shelterName?.trim() ?? null,
    p_address: input.address?.trim() ?? null,
    p_registration_number: input.registrationNumber?.trim() ?? null,
    p_clinic_name: input.clinicName?.trim() ?? null,
    p_specialty: input.specialty?.trim() ?? null,
    p_license_number: input.licenseNumber?.trim() ?? null,
  })

  if (error) {
    logSignupError('complete_signup RPC failed', error)
    throw new Error(formatError('Profile setup error', error))
  }
}

async function createRoleRecords(user: User, input: SignUpInput, hasSession: boolean) {
  // With a session, insert directly under RLS. Without one (email confirmation),
  // use the security-definer RPC so signup still completes.
  if (!hasSession) {
    await completeSignupViaRpc(user, input)
    return
  }

  const verificationStatus: VerificationStatus =
    input.role === 'owner' ? 'approved' : 'pending'

  await insertProfile(user, input, verificationStatus)

  if (input.role === 'shelter') {
    await insertShelter(user.id, input)
  } else if (input.role === 'vet') {
    await insertVeterinarian(user.id, input)
  }
}

async function signUpWithRole(input: SignUpInput): Promise<SignUpResult> {
  try {
    const { user, session } = await createAuthUser(input)
    await createRoleRecords(user, input, Boolean(session))

    return {
      user,
      session,
      emailConfirmationRequired: !session,
    }
  } catch (error) {
    logSignupError('Signup failed', error)
    throw error instanceof Error
      ? error
      : new Error('Unable to complete signup.')
  }
}

export async function signUpOwner(
  input: Omit<SignUpInput, 'role'>,
): Promise<SignUpResult> {
  return signUpWithRole({ ...input, role: 'owner' })
}

export async function signUpShelter(
  input: Omit<SignUpInput, 'role'> & {
    shelterName: string
    address: string
    registrationNumber: string
  },
): Promise<SignUpResult> {
  return signUpWithRole({ ...input, role: 'shelter' })
}

export async function signUpVet(
  input: Omit<SignUpInput, 'role'> & {
    clinicName: string
    specialty: string
    licenseNumber: string
  },
): Promise<SignUpResult> {
  return signUpWithRole({ ...input, role: 'vet' })
}

/** @deprecated Prefer signUpOwner / signUpShelter / signUpVet */
export { signUpWithRole }
