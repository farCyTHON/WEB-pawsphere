import { useCallback, useEffect, useState } from 'react'

import {
  cancelOwnerAppointment,
  completeAppointment,
  getAppointmentById,
  getAvailableVeterinarians,
  getOwnerAppointments,
  getVetAppointments,
  rescheduleAppointment,
  updateAppointmentStatus,
  type Appointment,
  type AppointmentStatus,
  type VeterinarianOption,
} from '@/services/appointments'

function useAppointmentList(loader: () => Promise<Appointment[]>) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setAppointments(await loader())
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load appointments.',
      )
    } finally {
      setLoading(false)
    }
  }, [loader])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { appointments, loading, error, refresh }
}

export function useOwnerAppointments() {
  const result = useAppointmentList(getOwnerAppointments)
  const cancel = useCallback(
    async (appointmentId: string) => {
      await cancelOwnerAppointment(appointmentId)
      await result.refresh()
    },
    [result.refresh],
  )
  return { ...result, cancel }
}

export function useVetAppointments() {
  const result = useAppointmentList(getVetAppointments)

  const changeStatus = useCallback(
    async (
      appointmentId: string,
      status: AppointmentStatus,
      remarks?: string | null,
    ) => {
      await updateAppointmentStatus(appointmentId, status, remarks)
      await result.refresh()
    },
    [result.refresh],
  )

  const reschedule = useCallback(
    async (appointmentId: string, appointmentDate: string) => {
      await rescheduleAppointment(appointmentId, appointmentDate)
      await result.refresh()
    },
    [result.refresh],
  )

  const complete = useCallback(
    async (appointmentId: string, remarks?: string | null) => {
      await completeAppointment(appointmentId, remarks)
      await result.refresh()
    },
    [result.refresh],
  )

  return { ...result, changeStatus, reschedule, complete }
}

export function useVeterinarianOptions() {
  const [veterinarians, setVeterinarians] = useState<VeterinarianOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void getAvailableVeterinarians()
      .then((data) => {
        if (active) setVeterinarians(data)
      })
      .catch((loadError: unknown) => {
        if (!active) return
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Unable to load veterinarians.',
        )
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  return { veterinarians, loading, error }
}

export function useAppointmentDetails(appointmentId: string | null) {
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    if (!appointmentId) {
      setAppointment(null)
      return
    }
    setLoading(true)
    setError(null)
    void getAppointmentById(appointmentId)
      .then((data) => {
        if (active) setAppointment(data)
      })
      .catch((loadError: unknown) => {
        if (!active) return
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Unable to load appointment details.',
        )
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [appointmentId])

  return { appointment, loading, error }
}
