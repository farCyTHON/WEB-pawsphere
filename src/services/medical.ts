import { getCurrentUser } from '@/lib/auth-utils'
import { supabase } from '@/lib/supabase'

export {
  generatePrescriptionPDF,
  generateVaccinationPDF,
} from '@/services/pdf'

export interface MedicalRecord {
  id: string
  appointment_id: string | null
  owner_id: string
  vet_id: string
  pet_name: string
  diagnosis: string
  prescription: string
  follow_up_date: string | null
  created_at: string
  owner_name: string
  owner_email: string
  owner_phone: string
  vet_name: string
  clinic_name: string
  appointment_date: string | null
}

export interface Vaccination {
  id: string
  pet_name: string
  owner_id: string
  vet_id: string | null
  vaccine_name: string
  vaccination_date: string
  next_due_date: string | null
  veterinarian_name: string
  notes: string
  created_at: string
  owner_name: string
  owner_email: string
}

export interface VaccinationInput {
  petName: string
  ownerId: string
  vaccineName: string
  vaccinationDate: string
  nextDueDate: string | null
  veterinarianName: string
  notes: string
}

export interface VetPatient {
  owner_id: string
  pet_name: string
  owner_name: string
  owner_email: string
  owner_phone: string
  total_appointments: number
  last_visit: string | null
  next_visit: string | null
  last_diagnosis: string | null
  next_follow_up: string | null
  vaccination_count: number
}

export type TimelineEventType =
  | 'appointment_booked'
  | 'appointment_completed'
  | 'diagnosis_added'
  | 'prescription_issued'
  | 'vaccination_added'
  | 'follow_up_scheduled'

export interface TimelineEvent {
  event_type: TimelineEventType
  event_date: string
  pet_name: string
  title: string
  description: string
  actor: string
}

export interface MedicalRecordInput {
  appointmentId: string
  diagnosis: string
  prescription: string
  followUpDate: string | null
}

export async function createMedicalRecord(
  input: MedicalRecordInput,
): Promise<string> {
  if (!input.appointmentId) throw new Error('Select an appointment first.')
  if (!input.diagnosis.trim()) throw new Error('Diagnosis is required.')
  if (!input.prescription.trim()) throw new Error('Prescription is required.')

  const { data, error } = await supabase.rpc('create_medical_record', {
    target_appointment_id: input.appointmentId,
    record_diagnosis: input.diagnosis.trim(),
    record_prescription: input.prescription.trim(),
    record_follow_up_date: input.followUpDate || null,
  })

  if (error) throw error
  return data as string
}

export async function getOwnerMedicalRecords(): Promise<MedicalRecord[]> {
  const { data, error } = await supabase.rpc('get_owner_medical_records')
  if (error) throw error
  return (data ?? []) as MedicalRecord[]
}

export async function getVetMedicalRecords(): Promise<MedicalRecord[]> {
  const { data, error } = await supabase.rpc('get_vet_medical_records')
  if (error) throw error
  return (data ?? []) as MedicalRecord[]
}

export async function getVetPatients(): Promise<VetPatient[]> {
  const { data, error } = await supabase.rpc('get_vet_patients')
  if (error) throw error
  return (data ?? []) as VetPatient[]
}

export async function getMedicalTimeline(
  petName?: string | null,
): Promise<TimelineEvent[]> {
  const { data, error } = await supabase.rpc('get_medical_timeline', {
    filter_pet_name: petName || null,
  })
  if (error) throw error
  return (data ?? []) as TimelineEvent[]
}

export async function getVaccinations(): Promise<Vaccination[]> {
  const { data, error } = await supabase.rpc('get_vaccinations')
  if (error) throw error
  return (data ?? []) as Vaccination[]
}

function validateVaccination(input: VaccinationInput) {
  if (!input.ownerId) throw new Error('Select a patient first.')
  if (!input.petName.trim()) throw new Error('Pet name is required.')
  if (!input.vaccineName.trim()) throw new Error('Vaccine name is required.')
  if (!input.vaccinationDate) throw new Error('Vaccination date is required.')
  if (
    input.nextDueDate &&
    new Date(input.nextDueDate) < new Date(input.vaccinationDate)
  ) {
    throw new Error('Next due date must be after the vaccination date.')
  }
}

export async function addVaccination(input: VaccinationInput): Promise<void> {
  validateVaccination(input)

  const user = await getCurrentUser()
  if (!user) throw new Error('Sign in as a veterinarian to add vaccinations.')

  const { error } = await supabase.from('vaccinations').insert({
    pet_name: input.petName.trim(),
    owner_id: input.ownerId,
    vet_id: user.id,
    vaccine_name: input.vaccineName.trim(),
    vaccination_date: input.vaccinationDate,
    next_due_date: input.nextDueDate || null,
    veterinarian_name: input.veterinarianName.trim(),
    notes: input.notes.trim(),
  })

  if (error) throw error
}

export async function updateVaccination(
  vaccinationId: string,
  input: VaccinationInput,
): Promise<void> {
  validateVaccination(input)

  const { error } = await supabase
    .from('vaccinations')
    .update({
      pet_name: input.petName.trim(),
      owner_id: input.ownerId,
      vaccine_name: input.vaccineName.trim(),
      vaccination_date: input.vaccinationDate,
      next_due_date: input.nextDueDate || null,
      veterinarian_name: input.veterinarianName.trim(),
      notes: input.notes.trim(),
    })
    .eq('id', vaccinationId)

  if (error) throw error
}

export async function deleteVaccination(vaccinationId: string): Promise<void> {
  const { error } = await supabase
    .from('vaccinations')
    .delete()
    .eq('id', vaccinationId)

  if (error) throw error
}
