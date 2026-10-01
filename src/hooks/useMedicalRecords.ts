import { useCallback, useEffect, useState } from 'react'

import {
  addVaccination,
  deleteVaccination,
  getMedicalTimeline,
  getOwnerMedicalRecords,
  getVaccinations,
  getVetMedicalRecords,
  getVetPatients,
  updateVaccination,
  type MedicalRecord,
  type TimelineEvent,
  type Vaccination,
  type VaccinationInput,
  type VetPatient,
} from '@/services/medical'

function useAsyncData<T>(loader: () => Promise<T>, fallback: T) {
  const [data, setData] = useState<T>(fallback)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await loader())
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load medical data.',
      )
    } finally {
      setLoading(false)
    }
  }, [loader])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { data, loading, error, refresh }
}

export function useOwnerMedicalRecords() {
  const { data, loading, error, refresh } = useAsyncData<MedicalRecord[]>(
    getOwnerMedicalRecords,
    [],
  )
  return { records: data, loading, error, refresh }
}

export function useVetMedicalRecords() {
  const { data, loading, error, refresh } = useAsyncData<MedicalRecord[]>(
    getVetMedicalRecords,
    [],
  )
  return { records: data, loading, error, refresh }
}

export function useVetPatients() {
  const { data, loading, error, refresh } = useAsyncData<VetPatient[]>(
    getVetPatients,
    [],
  )
  return { patients: data, loading, error, refresh }
}

export function useMedicalTimeline(petName?: string | null) {
  const loader = useCallback(() => getMedicalTimeline(petName), [petName])
  const { data, loading, error, refresh } = useAsyncData<TimelineEvent[]>(
    loader,
    [],
  )
  return { events: data, loading, error, refresh }
}

export function useVaccinations() {
  const { data, loading, error, refresh } = useAsyncData<Vaccination[]>(
    getVaccinations,
    [],
  )

  const add = useCallback(
    async (input: VaccinationInput) => {
      await addVaccination(input)
      await refresh()
    },
    [refresh],
  )

  const update = useCallback(
    async (vaccinationId: string, input: VaccinationInput) => {
      await updateVaccination(vaccinationId, input)
      await refresh()
    },
    [refresh],
  )

  const remove = useCallback(
    async (vaccinationId: string) => {
      await deleteVaccination(vaccinationId)
      await refresh()
    },
    [refresh],
  )

  return { vaccinations: data, loading, error, refresh, add, update, remove }
}
