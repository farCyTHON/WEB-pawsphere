import { getCurrentProfile, getCurrentUser } from '@/lib/auth-utils'
import { supabase } from '@/lib/supabase'

export type PetStatus = 'Available' | 'Reserved' | 'Adopted'

export interface Pet {
  id: string
  shelter_id: string
  name: string
  species: string
  breed: string
  age: number
  gender: string
  vaccinated: boolean
  health_notes: string
  status: PetStatus
  image_url: string | null
  image_path: string | null
  is_hidden?: boolean
  created_at: string
  updated_at: string
}

export interface PetInput {
  name: string
  species: string
  breed: string
  age: number
  gender: string
  vaccinated: boolean
  health_notes: string
  status: PetStatus
  image_url?: string | null
  image_path?: string | null
}

export interface UploadedPetImage {
  imageUrl: string
  imagePath: string
}

export interface PublicPet {
  id: string
  name: string
  species: string
  breed: string
  age: number
  gender: string
  vaccinated: boolean
  health_notes: string
  status: string
  image_url: string | null
  image_urls: string[]
  personality: string[]
  shelter_id: string
  shelter_name: string
  shelter_address: string
}

export interface AvailablePetFilters {
  search?: string
  species?: string
  gender?: string
  vaccinated?: boolean | null
  minAge?: number | null
  maxAge?: number | null
}

export interface AvailablePetsResult {
  pets: PublicPet[]
  total: number
}

function toAppError(error: unknown, fallback: string): Error {
  if (error instanceof Error && error.message.trim()) return error

  if (typeof error === 'object' && error !== null) {
    const err = error as {
      message?: string
      details?: string
      hint?: string
      code?: string
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

function buildPetPayload(input: PetInput) {
  const payload: Record<string, unknown> = {
    name: input.name.trim(),
    species: input.species.trim(),
    breed: input.breed.trim(),
    age: input.age,
    gender: input.gender.trim(),
    vaccinated: Boolean(input.vaccinated),
    health_notes: input.health_notes ?? '',
    status: input.status,
  }

  if (input.image_url) {
    payload.image_url = input.image_url
    payload.image_urls = [input.image_url]
  }

  if (input.image_path) {
    payload.image_path = input.image_path
  }

  return payload
}

async function getCurrentShelterId(): Promise<string> {
  const user = await getCurrentUser()
  if (!user) throw new Error('You must be signed in as a shelter.')

  const profile = await getCurrentProfile(user.id)
  if (profile.role !== 'shelter') {
    throw new Error('Only shelter accounts can manage pet listings.')
  }

  const { data, error } = await supabase
    .from('shelters')
    .select('id')
    .eq('id', user.id)
    .maybeSingle<{ id: string }>()

  if (error) throw toAppError(error, 'Unable to load your shelter profile.')
  if (data?.id) return data.id

  const { error: insertError } = await supabase.from('shelters').insert({
    id: user.id,
    shelter_name: profile.full_name?.trim() || 'Shelter',
    address: 'Address pending',
    registration_number: user.id,
  })

  if (insertError && insertError.code !== '23505') {
    throw toAppError(
      insertError,
      'Unable to create your shelter profile. Please try publishing again.',
    )
  }

  return user.id
}

export async function uploadPetImage(file: File): Promise<UploadedPetImage> {
  const shelterId = await getCurrentShelterId()
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const imagePath = `${shelterId}/${crypto.randomUUID()}.${extension}`

  const { error } = await supabase.storage
    .from('pets')
    .upload(imagePath, file, {
      cacheControl: '3600',
      contentType: file.type,
      upsert: false,
    })

  if (error) {
    throw toAppError(error, 'Unable to upload the pet photo. You can publish without a photo.')
  }

  const { data } = supabase.storage.from('pets').getPublicUrl(imagePath)
  return { imageUrl: data.publicUrl, imagePath }
}

export async function createPet(input: PetInput): Promise<Pet> {
  const shelterId = await getCurrentShelterId()
  const { data, error } = await supabase
    .from('pets')
    .insert({
      shelter_id: shelterId,
      ...buildPetPayload(input),
    })
    .select('*')
    .single<Pet>()

  if (error) throw toAppError(error, 'Unable to save the pet listing.')
  if (!data) throw new Error('Unable to save the pet listing.')
  return data
}

export async function getShelterPets(): Promise<Pet[]> {
  const user = await getCurrentUser()
  if (!user) throw new Error('You must be signed in to view pet listings.')

  const profile = await getCurrentProfile(user.id)
  let query = supabase.from('pets').select('*').order('created_at', {
    ascending: false,
  })

  if (profile.role === 'shelter') {
    const shelterId = await getCurrentShelterId()
    query = query.eq('shelter_id', shelterId)
  } else if (profile.role !== 'admin') {
    throw new Error('Only shelter and admin accounts can view these listings.')
  }

  const { data, error } = await query
  if (error) throw toAppError(error, 'Unable to load pet listings.')
  return (data ?? []) as Pet[]
}

export async function updatePet(
  petId: string,
  input: PetInput,
  replacedImagePath?: string | null,
): Promise<Pet> {
  const shelterId = await getCurrentShelterId()
  const { data, error } = await supabase
    .from('pets')
    .update(buildPetPayload(input))
    .eq('id', petId)
    .eq('shelter_id', shelterId)
    .select('*')
    .single<Pet>()

  if (error) throw toAppError(error, 'Unable to update the pet listing.')
  if (!data) throw new Error('Unable to update the pet listing.')

  if (
    replacedImagePath &&
    input.image_path &&
    replacedImagePath !== input.image_path
  ) {
    const { error: storageError } = await supabase.storage
      .from('pets')
      .remove([replacedImagePath])
    if (storageError) console.error('Unable to remove old pet image:', storageError)
  }

  return data
}

export async function deletePet(pet: Pet): Promise<void> {
  const shelterId = await getCurrentShelterId()
  const { error } = await supabase
    .from('pets')
    .delete()
    .eq('id', pet.id)
    .eq('shelter_id', shelterId)

  if (error) throw toAppError(error, 'Unable to delete the pet listing.')

  if (pet.image_path) {
    const { error: storageError } = await supabase.storage
      .from('pets')
      .remove([pet.image_path])
    if (storageError) throw storageError
  }
}

export async function getAvailablePets(
  filters: AvailablePetFilters = {},
  page = 1,
  pageSize = 12,
): Promise<AvailablePetsResult> {
  const { data, error } = await supabase.rpc('get_available_pets', {
    search_query: filters.search?.trim() || null,
    species_filter: filters.species || null,
    gender_filter: filters.gender || null,
    vaccinated_filter: filters.vaccinated ?? null,
    min_age: filters.minAge ?? null,
    max_age: filters.maxAge ?? null,
    page_number: page,
    page_size: pageSize,
  })

  if (error) throw error
  const rows = (data ?? []) as Array<PublicPet & { total_count: number | string }>
  return {
    pets: rows.map(({ total_count: _totalCount, ...pet }) => pet),
    total: rows.length > 0 ? Number(rows[0].total_count) : 0,
  }
}

export async function getPetById(petId: string): Promise<PublicPet | null> {
  const { data, error } = await supabase
    .rpc('get_public_pet', { pet_id: petId })
    .maybeSingle<PublicPet>()

  if (error) throw error
  return data
}

/** Shelter/admin-accessible pet lookup, including adopted pets. */
export async function getManagedPetById(petId: string): Promise<Pet | null> {
  const { data, error } = await supabase
    .from('pets')
    .select('*')
    .eq('id', petId)
    .maybeSingle<Pet>()

  if (error) throw error
  return data
}

export async function getRelatedPets(
  petId: string,
  species: string,
): Promise<PublicPet[]> {
  const { data, error } = await supabase.rpc('get_related_pets', {
    current_pet_id: petId,
    species_filter: species,
    result_limit: 4,
  })

  if (error) throw error
  return (data ?? []) as PublicPet[]
}
