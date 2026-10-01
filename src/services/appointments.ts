import { getCurrentProfile, getCurrentUser } from '@/lib/auth-utils'
import { supabase } from '@/lib/supabase'

export type AppointmentStatus =
  | 'pending'
  | 'approved'
  | 'cancelled'
  | 'completed'

export interface VeterinarianOption {
  id: string
  full_name: string
  clinic_name: string
  specialty: string
}

export interface Appointment {
  id: string
  owner_id: string
  vet_id: string
  pet_name: string
  appointment_date: string
  reason: string
  status: AppointmentStatus
  remarks: string | null
  created_at: string
  owner_name: string
  owner_email: string
  owner_phone: string
  vet_name: string
  clinic_name: string
  specialty: string
}

export interface CreateAppointmentInput {
  vetId: string
  petName: string
  appointmentDate: string
  reason: string
}

export async function getAvailableVeterinarians(): Promise<
  VeterinarianOption[]
> {
  const { data, error } = await supabase.rpc('get_available_veterinarians')
  if (error) throw error
  return (data ?? []) as VeterinarianOption[]
}

export async function createAppointment(
  input: CreateAppointmentInput,
): Promise<void> {
  const user = await getCurrentUser()
  if (!user) throw new Error('Sign in as a pet owner to book an appointment.')

  const profile = await getCurrentProfile(user.id)
  if (profile.role !== 'owner') {
    throw new Error('Only pet owner accounts can book appointments.')
  }

  if (!input.petName.trim()) throw new Error('Pet name is required.')
  if (!input.reason.trim()) throw new Error('Reason for visit is required.')
  const scheduledAt = new Date(input.appointmentDate)
  if (Number.isNaN(scheduledAt.getTime()) || scheduledAt <= new Date()) {
    throw new Error('Choose a future appointment date and time.')
  }

  const { error } = await supabase.from('appointments').insert({
    owner_id: user.id,
    vet_id: input.vetId,
    pet_name: input.petName.trim(),
    appointment_date: scheduledAt.toISOString(),
    reason: input.reason.trim(),
    status: 'pending',
  })

  if (error) throw error
}

export async function getOwnerAppointments(): Promise<Appointment[]> {
  const { data, error } = await supabase.rpc('get_owner_appointments')
  if (error) throw error
  return (data ?? []) as Appointment[]
}

export async function getVetAppointments(): Promise<Appointment[]> {
  const { data, error } = await supabase.rpc('get_vet_appointments')
  if (error) throw error
  return (data ?? []) as Appointment[]
}

export async function getAppointmentById(
  appointmentId: string,
): Promise<Appointment | null> {
  const { data, error } = await supabase
    .rpc('get_appointment', { appointment_id: appointmentId })
    .maybeSingle<Appointment>()
  if (error) throw error
  return data
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: AppointmentStatus,
  remarks?: string | null,
): Promise<void> {
  const { error } = await supabase.rpc('update_appointment_status', {
    appointment_id: appointmentId,
    next_status: status,
    status_remarks: remarks?.trim() || null,
  })
  if (error) throw error
}

export async function rescheduleAppointment(
  appointmentId: string,
  appointmentDate: string,
): Promise<void> {
  const scheduledAt = new Date(appointmentDate)
  if (Number.isNaN(scheduledAt.getTime()) || scheduledAt <= new Date()) {
    throw new Error('Choose a future appointment date and time.')
  }

  const { error } = await supabase.rpc('reschedule_appointment', {
    appointment_id: appointmentId,
    new_appointment_date: scheduledAt.toISOString(),
  })
  if (error) throw error
}

export async function completeAppointment(
  appointmentId: string,
  remarks?: string | null,
): Promise<void> {
  await updateAppointmentStatus(appointmentId, 'completed', remarks)
}

export async function cancelOwnerAppointment(
  appointmentId: string,
): Promise<void> {
  const { error } = await supabase.rpc('cancel_owner_appointment', {
    appointment_id: appointmentId,
  })
  if (error) throw error
}
