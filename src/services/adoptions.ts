import { getCurrentProfile, getCurrentUser } from '@/lib/auth-utils'
import { supabase } from '@/lib/supabase'
import { getPetById } from '@/services/pets'

export type AdoptionStatus =
  | 'pending'
  | 'review'
  | 'interview'
  | 'approved'
  | 'meet_and_greet'
  | 'rejected'
  | 'completed'

export interface ApplicationAnswers {
  housingType: string
  hasYard: boolean
  otherPets: string
  adoptionExperience: string
  notes: string
}

export interface AdoptionApplication {
  id: string
  pet_id: string
  owner_id: string
  shelter_id: string
  status: AdoptionStatus
  remarks: string | null
  housing_type: string
  has_yard: boolean
  other_pets: string
  adoption_experience: string
  notes: string
  created_at: string
  pet_name: string
  pet_image: string | null
  shelter_name: string
  applicant_name: string
  applicant_email: string
  applicant_phone: string
}

export class DuplicateApplicationError extends Error {
  constructor() {
    super('You already have an active application for this pet.')
    this.name = 'DuplicateApplicationError'
  }
}

export async function submitApplication(
  petId: string,
  answers: ApplicationAnswers,
): Promise<void> {
  const user = await getCurrentUser()
  if (!user) throw new Error('Sign in as a pet owner to apply.')

  const profile = await getCurrentProfile(user.id)
  if (profile.role !== 'owner') {
    throw new Error('Only pet owner accounts can submit applications.')
  }

  const pet = await getPetById(petId)
  if (!pet) throw new Error('This pet is no longer available.')

  const { error } = await supabase.from('adoption_applications').insert({
    pet_id: pet.id,
    owner_id: user.id,
    shelter_id: pet.shelter_id,
    status: 'pending',
    remarks: null,
    housing_type: answers.housingType,
    has_yard: answers.hasYard,
    other_pets: answers.otherPets,
    adoption_experience: answers.adoptionExperience,
    notes: answers.notes,
  })

  if (error?.code === '23505') throw new DuplicateApplicationError()
  if (error) throw error
}

export async function getOwnerApplications(): Promise<AdoptionApplication[]> {
  const { data, error } = await supabase.rpc('get_owner_applications')
  if (error) throw error
  return (data ?? []) as AdoptionApplication[]
}

export async function getShelterApplications(): Promise<AdoptionApplication[]> {
  const { data, error } = await supabase.rpc('get_shelter_applications')
  if (error) throw error
  return (data ?? []) as AdoptionApplication[]
}

export async function getApplicationById(
  applicationId: string,
): Promise<AdoptionApplication | null> {
  const { data, error } = await supabase
    .rpc('get_adoption_application', { application_id: applicationId })
    .maybeSingle<AdoptionApplication>()

  if (error) throw error
  return data
}

function toAppError(error: unknown, fallback: string): Error {
  if (error instanceof Error && error.message.trim()) return error

  if (typeof error === 'object' && error !== null) {
    const err = error as {
      message?: string
      details?: string
      hint?: string
      error?: string
    }
    const message = [err.message, err.error, err.details, err.hint]
      .filter((part): part is string => Boolean(part && part.trim()))
      .join(' — ')
    if (message) return new Error(message)
  }

  if (typeof error === 'string' && error.trim()) return new Error(error)
  return new Error(fallback)
}

export async function updateApplicationStatus(
  applicationId: string,
  status: AdoptionStatus,
  remarks?: string | null,
): Promise<void> {
  const { error } = await supabase.rpc('update_adoption_application_status', {
    application_id: applicationId,
    next_status: status,
    status_remarks: remarks?.trim() || null,
  })
  if (error) throw toAppError(error, 'Unable to update application.')
}

export async function completeAdoption(
  applicationId: string,
  remarks?: string | null,
): Promise<void> {
  await updateApplicationStatus(applicationId, 'completed', remarks)
}
