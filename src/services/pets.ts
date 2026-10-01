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
    .single<{ id: string }>()

  if (error) throw error
  return data.id
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

  if (error) throw error

  const { data } = supabase.storage.from('pets').getPublicUrl(imagePath)
  return { imageUrl: data.publicUrl, imagePath }
}

export async function createPet(input: PetInput): Promise<Pet> {
  const shelterId = await getCurrentShelterId()
  const { data, error } = await supabase
    .from('pets')
    .insert({
      shelter_id: shelterId,
      ...input,
    })
    .select('*')
    .single<Pet>()

  if (error) throw error
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
  if (error) throw error
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
    .update(input)
    .eq('id', petId)
    .eq('shelter_id', shelterId)
    .select('*')
    .single<Pet>()

  if (error) throw error

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

  if (error) throw error

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
