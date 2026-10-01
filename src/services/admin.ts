import type { AppRole, VerificationStatus } from '@/lib/auth'
import { getCurrentProfile, getCurrentUser } from '@/lib/auth-utils'
import { supabase } from '@/lib/supabase'
import type { AdoptionApplication, AdoptionStatus } from '@/services/adoptions'
import type { Pet, PetStatus } from '@/services/pets'

export interface AdminStats {
  totalUsers: number
  totalShelters: number
  totalVeterinarians: number
  totalPets: number
  totalApplications: number
  totalAppointments: number
  pendingShelters: number
  pendingVeterinarians: number
}

export interface AdminUserRow {
  id: string
  full_name: string
  email: string
  phone: string
  role: AppRole
  verification_status: VerificationStatus
  created_at: string
}

export interface AdminUserDetails extends AdminUserRow {
  organization: string | null
  detail: string | null
}

export interface PendingVerification {
  id: string
  full_name: string
  email: string
  role: 'shelter' | 'vet'
  verification_status: VerificationStatus
  created_at: string
  organization: string
  detail: string
}

export interface AdminPetRow extends Pet {
  shelter_name: string
}

export interface MonthlyCount {
  month: string
  pets: number
  applications: number
  appointments: number
}

export interface AdminReportData {
  petsPerMonth: MonthlyCount[]
  applicationsPerMonth: MonthlyCount[]
  appointmentsPerMonth: MonthlyCount[]
}

export interface AdminActivityItem {
  id: string
  text: string
  time: string
  createdAt: string
}

export interface AppSettings {
  platform_name: string
  contact_email: string
  maintenance_mode: boolean
}

async function requireAdmin(): Promise<void> {
  const user = await getCurrentUser()
  if (!user) throw new Error('You must be signed in.')

  const profile = await getCurrentProfile(user.id)
  if (profile.role !== 'admin') {
    throw new Error('Admin access required.')
  }
}

async function countExact(query: {
  then: (
    onfulfilled?: (value: {
      count: number | null
      error: { message: string } | null
    }) => unknown,
  ) => unknown
}): Promise<number> {
  const { count, error } = await query
  if (error) throw error
  return count ?? 0
}

function formatRelativeTime(iso: string): string {
  const date = new Date(iso)
  const diffMs = Date.now() - date.getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(key: string): string {
  const [year, month] = key.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: 'short',
  })
}

function buildLastTwelveMonths(): string[] {
  const keys: string[] = []
  const now = new Date()
  for (let i = 11; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    keys.push(monthKey(d))
  }
  return keys
}

function aggregateByMonth(timestamps: string[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const ts of timestamps) {
    const key = monthKey(new Date(ts))
    counts[key] = (counts[key] ?? 0) + 1
  }
  return counts
}

export async function getAdminStats(): Promise<AdminStats> {
  await requireAdmin()

  const [
    totalUsers,
    totalShelters,
    totalVeterinarians,
    totalPets,
    totalApplications,
    totalAppointments,
    pendingShelters,
    pendingVeterinarians,
  ] = await Promise.all([
    countExact(supabase.from('profiles').select('*', { count: 'exact', head: true })),
    countExact(
      supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'shelter'),
    ),
    countExact(
      supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'vet'),
    ),
    countExact(supabase.from('pets').select('*', { count: 'exact', head: true })),
    countExact(
      supabase
        .from('adoption_applications')
        .select('*', { count: 'exact', head: true }),
    ),
    countExact(
      supabase.from('appointments').select('*', { count: 'exact', head: true }),
    ),
    countExact(
      supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'shelter')
        .eq('verification_status', 'pending'),
    ),
    countExact(
      supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'vet')
        .eq('verification_status', 'pending'),
    ),
  ])

  return {
    totalUsers,
    totalShelters,
    totalVeterinarians,
    totalPets,
    totalApplications,
    totalAppointments,
    pendingShelters,
    pendingVeterinarians,
  }
}

export async function getRecentActivity(): Promise<AdminActivityItem[]> {
  await requireAdmin()

  const [usersRes, petsRes, appsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, role, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('pets')
      .select('id, name, created_at, shelter_id')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('adoption_applications')
      .select('id, created_at, pet_id, owner_id')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  if (usersRes.error) throw usersRes.error
  if (petsRes.error) throw petsRes.error
  if (appsRes.error) throw appsRes.error

  const petRows = petsRes.data ?? []
  const appRows = appsRes.data ?? []
  const shelterIds = [...new Set(petRows.map((p) => p.shelter_id))]
  const petIds = [...new Set(appRows.map((a) => a.pet_id))]
  const ownerIds = [...new Set(appRows.map((a) => a.owner_id))]

  const [sheltersRes, namedPetsRes, ownersRes] = await Promise.all([
    shelterIds.length
      ? supabase.from('shelters').select('id, shelter_name').in('id', shelterIds)
      : Promise.resolve({ data: [], error: null }),
    petIds.length
      ? supabase.from('pets').select('id, name').in('id', petIds)
      : Promise.resolve({ data: [], error: null }),
    ownerIds.length
      ? supabase.from('profiles').select('id, full_name').in('id', ownerIds)
      : Promise.resolve({ data: [], error: null }),
  ])

  if (sheltersRes.error) throw sheltersRes.error
  if (namedPetsRes.error) throw namedPetsRes.error
  if (ownersRes.error) throw ownersRes.error

  const shelterNames = new Map(
    (sheltersRes.data ?? []).map((s) => [s.id, s.shelter_name]),
  )
  const petNames = new Map((namedPetsRes.data ?? []).map((p) => [p.id, p.name]))
  const ownerNames = new Map(
    (ownersRes.data ?? []).map((o) => [o.id, o.full_name]),
  )

  const items: AdminActivityItem[] = []

  for (const user of usersRes.data ?? []) {
    items.push({
      id: `user-${user.id}`,
      text: `New ${user.role}: ${user.full_name}`,
      time: formatRelativeTime(user.created_at),
      createdAt: user.created_at,
    })
  }

  for (const pet of petRows) {
    const shelterName = shelterNames.get(pet.shelter_id) ?? 'A shelter'
    items.push({
      id: `pet-${pet.id}`,
      text: `${shelterName} added ${pet.name}`,
      time: formatRelativeTime(pet.created_at),
      createdAt: pet.created_at,
    })
  }

  for (const app of appRows) {
    const petName = petNames.get(app.pet_id) ?? 'a pet'
    const ownerName = ownerNames.get(app.owner_id) ?? 'An owner'
    items.push({
      id: `app-${app.id}`,
      text: `New application: ${petName} ← ${ownerName}`,
      time: formatRelativeTime(app.created_at),
      createdAt: app.created_at,
    })
  }

  return items
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 8)
}

export async function getUsers(search = ''): Promise<AdminUserRow[]> {
  await requireAdmin()

  let query = supabase
    .from('profiles')
    .select('id, full_name, email, phone, role, verification_status, created_at')
    .order('created_at', { ascending: false })

  const term = search.trim().replace(/[%_,]/g, ' ')
  if (term) {
    query = query.or(`full_name.ilike.%${term}%,email.ilike.%${term}%`)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as AdminUserRow[]
}

export async function getPendingVerifications(): Promise<PendingVerification[]> {
  await requireAdmin()

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, verification_status, created_at')
    .in('role', ['shelter', 'vet'])
    .eq('verification_status', 'pending')
    .order('created_at', { ascending: true })

  if (error) throw error

  const rows = (profiles ?? []) as Array<
    Omit<PendingVerification, 'organization' | 'detail'> & {
      role: 'shelter' | 'vet'
    }
  >

  const shelterIds = rows.filter((r) => r.role === 'shelter').map((r) => r.id)
  const vetIds = rows.filter((r) => r.role === 'vet').map((r) => r.id)

  const [sheltersRes, vetsRes] = await Promise.all([
    shelterIds.length
      ? supabase
          .from('shelters')
          .select('id, shelter_name, registration_number')
          .in('id', shelterIds)
      : Promise.resolve({ data: [], error: null }),
    vetIds.length
      ? supabase
          .from('veterinarians')
          .select('id, clinic_name, license_number')
          .in('id', vetIds)
      : Promise.resolve({ data: [], error: null }),
  ])

  if (sheltersRes.error) throw sheltersRes.error
  if (vetsRes.error) throw vetsRes.error

  const shelterMap = new Map(
    (sheltersRes.data ?? []).map((s) => [
      s.id,
      { organization: s.shelter_name, detail: s.registration_number },
    ]),
  )
  const vetMap = new Map(
    (vetsRes.data ?? []).map((v) => [
      v.id,
      { organization: v.clinic_name, detail: v.license_number },
    ]),
  )

  return rows.map((row) => {
    const extra =
      row.role === 'shelter'
        ? shelterMap.get(row.id)
        : vetMap.get(row.id)
    return {
      ...row,
      organization: extra?.organization ?? '—',
      detail: extra?.detail ?? '—',
    }
  })
}

export async function getUserDetails(
  userId: string,
): Promise<AdminUserDetails> {
  await requireAdmin()

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, role, verification_status, created_at')
    .eq('id', userId)
    .maybeSingle<AdminUserRow>()

  if (error) throw error
  if (!data) throw new Error('User not found.')

  let organization: string | null = null
  let detail: string | null = null

  if (data.role === 'shelter') {
    const { data: shelter, error: shelterError } = await supabase
      .from('shelters')
      .select('shelter_name, registration_number, address')
      .eq('id', userId)
      .maybeSingle()
    if (shelterError) throw shelterError
    organization = shelter?.shelter_name ?? null
    detail = shelter
      ? [shelter.registration_number, shelter.address]
          .filter(Boolean)
          .join(' · ')
      : null
  } else if (data.role === 'vet') {
    const { data: vet, error: vetError } = await supabase
      .from('veterinarians')
      .select('clinic_name, license_number, specialty')
      .eq('id', userId)
      .maybeSingle()
    if (vetError) throw vetError
    organization = vet?.clinic_name ?? null
    detail = vet
      ? [vet.specialty, vet.license_number].filter(Boolean).join(' · ')
      : null
  }

  return { ...data, organization, detail }
}

export async function approveUser(userId: string): Promise<void> {
  await requireAdmin()
  const { data, error } = await supabase
    .from('profiles')
    .update({ verification_status: 'approved' })
    .eq('id', userId)
    .in('role', ['shelter', 'vet'])
    .eq('verification_status', 'pending')
    .select('id')
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error('Unable to approve this account.')
}

export async function rejectUser(userId: string): Promise<void> {
  await requireAdmin()
  const { data, error } = await supabase
    .from('profiles')
    .update({ verification_status: 'rejected' })
    .eq('id', userId)
    .in('role', ['shelter', 'vet'])
    .eq('verification_status', 'pending')
    .select('id')
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error('Unable to reject this account.')
}

export async function getAllPets(): Promise<AdminPetRow[]> {
  await requireAdmin()

  const { data, error } = await supabase
    .from('pets')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error

  const pets = (data ?? []) as Pet[]
  const shelterIds = [...new Set(pets.map((pet) => pet.shelter_id))]
  const shelterNames = new Map<string, string>()

  if (shelterIds.length > 0) {
    const { data: shelters, error: shelterError } = await supabase
      .from('shelters')
      .select('id, shelter_name')
      .in('id', shelterIds)
    if (shelterError) throw shelterError
    for (const shelter of shelters ?? []) {
      shelterNames.set(shelter.id, shelter.shelter_name)
    }
  }

  return pets.map((pet) => ({
    ...pet,
    is_hidden: Boolean(pet.is_hidden),
    shelter_name: shelterNames.get(pet.shelter_id) ?? 'Unknown shelter',
  }))
}

export async function togglePetVisibility(
  petId: string,
  isHidden: boolean,
): Promise<void> {
  await requireAdmin()
  const { data, error } = await supabase
    .from('pets')
    .update({ is_hidden: isHidden })
    .eq('id', petId)
    .select('id')
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error('Unable to update listing visibility.')
}

export async function getAllAdoptions(
  status?: AdoptionStatus | 'all',
): Promise<AdoptionApplication[]> {
  await requireAdmin()

  const { data, error } = await supabase.rpc('get_admin_applications')
  if (error) throw error

  const rows = (data ?? []) as AdoptionApplication[]
  if (!status || status === 'all') return rows
  return rows.filter((row) => row.status === status)
}

export async function getReportData(): Promise<AdminReportData> {
  await requireAdmin()

  const since = new Date()
  since.setMonth(since.getMonth() - 11)
  since.setDate(1)
  since.setHours(0, 0, 0, 0)
  const sinceIso = since.toISOString()

  const [petsRes, appsRes, apptsRes] = await Promise.all([
    supabase
      .from('pets')
      .select('created_at')
      .gte('created_at', sinceIso),
    supabase
      .from('adoption_applications')
      .select('created_at')
      .gte('created_at', sinceIso),
    supabase
      .from('appointments')
      .select('created_at')
      .gte('created_at', sinceIso),
  ])

  if (petsRes.error) throw petsRes.error
  if (appsRes.error) throw appsRes.error
  if (apptsRes.error) throw apptsRes.error

  const months = buildLastTwelveMonths()
  const petsCounts = aggregateByMonth(
    (petsRes.data ?? []).map((r) => r.created_at),
  )
  const appCounts = aggregateByMonth(
    (appsRes.data ?? []).map((r) => r.created_at),
  )
  const apptCounts = aggregateByMonth(
    (apptsRes.data ?? []).map((r) => r.created_at),
  )

  const chart = months.map((key) => ({
    month: monthLabel(key),
    pets: petsCounts[key] ?? 0,
    applications: appCounts[key] ?? 0,
    appointments: apptCounts[key] ?? 0,
  }))

  return {
    petsPerMonth: chart,
    applicationsPerMonth: chart,
    appointmentsPerMonth: chart,
  }
}

export async function getAppSettings(): Promise<AppSettings> {
  await requireAdmin()
  const { data, error } = await supabase
    .from('app_settings')
    .select('platform_name, contact_email, maintenance_mode')
    .eq('id', 1)
    .maybeSingle<AppSettings>()

  if (error) throw error
  return (
    data ?? {
      platform_name: 'PawSphere',
      contact_email: 'support@pawsphere.bd',
      maintenance_mode: false,
    }
  )
}

export async function updateAppSettings(
  settings: AppSettings,
): Promise<AppSettings> {
  await requireAdmin()
  const { data, error } = await supabase
    .from('app_settings')
    .update({
      platform_name: settings.platform_name.trim() || 'PawSphere',
      contact_email: settings.contact_email.trim(),
      maintenance_mode: settings.maintenance_mode,
    })
    .eq('id', 1)
    .select('platform_name, contact_email, maintenance_mode')
    .single<AppSettings>()

  if (error) throw error
  return data
}

export function formatAdminDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatVerificationLabel(
  status: VerificationStatus,
): string {
  if (status === 'approved') return 'Approved'
  if (status === 'rejected') return 'Rejected'
  return 'Pending'
}

export function formatPetStatusLabel(status: PetStatus | string): string {
  return status
}
