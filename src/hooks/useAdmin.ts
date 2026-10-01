import { useCallback, useEffect, useState } from 'react'

import {
  approveUser,
  getAdminStats,
  getAllAdoptions,
  getAllPets,
  getAppSettings,
  getPendingVerifications,
  getRecentActivity,
  getReportData,
  getUsers,
  rejectUser,
  togglePetVisibility,
  updateAppSettings,
  type AdminActivityItem,
  type AdminPetRow,
  type AdminReportData,
  type AdminStats,
  type AdminUserRow,
  type AppSettings,
  type PendingVerification,
} from '@/services/admin'
import type { AdoptionApplication, AdoptionStatus } from '@/services/adoptions'

function useAsyncResource<T>(loader: () => Promise<T>, initial: T) {
  const [data, setData] = useState<T>(initial)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true)
      setError(null)
    }
    try {
      setData(await loader())
      setError(null)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load admin data.',
      )
    } finally {
      if (!silent) setLoading(false)
    }
  }, [loader])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { data, loading, error, refresh, setData }
}

export function useAdminStats() {
  const loader = useCallback(() => getAdminStats(), [])
  return useAsyncResource(loader, {
    totalUsers: 0,
    totalShelters: 0,
    totalVeterinarians: 0,
    totalPets: 0,
    totalApplications: 0,
    totalAppointments: 0,
    pendingShelters: 0,
    pendingVeterinarians: 0,
  } satisfies AdminStats)
}

export function useAdminActivity() {
  const loader = useCallback(() => getRecentActivity(), [])
  return useAsyncResource<AdminActivityItem[]>(loader, [])
}

export function useAdminUsers(search: string) {
  const loader = useCallback(() => getUsers(search), [search])
  return useAsyncResource<AdminUserRow[]>(loader, [])
}

export function usePendingVerifications() {
  const result = useAsyncResource(
    useCallback(() => getPendingVerifications(), []),
    [] as PendingVerification[],
  )

  const approve = useCallback(
    async (userId: string) => {
      await approveUser(userId)
      await result.refresh(true)
    },
    [result.refresh],
  )

  const reject = useCallback(
    async (userId: string) => {
      await rejectUser(userId)
      await result.refresh(true)
    },
    [result.refresh],
  )

  return { ...result, approve, reject }
}

export function useAdminPets() {
  const result = useAsyncResource(
    useCallback(() => getAllPets(), []),
    [] as AdminPetRow[],
  )

  const setVisibility = useCallback(
    async (petId: string, isHidden: boolean) => {
      await togglePetVisibility(petId, isHidden)
      await result.refresh(true)
    },
    [result.refresh],
  )

  return { ...result, setVisibility }
}

export function useAdminAdoptions(status: AdoptionStatus | 'all') {
  const loader = useCallback(() => getAllAdoptions(status), [status])
  return useAsyncResource<AdoptionApplication[]>(loader, [])
}

export function useAdminReports() {
  const loader = useCallback(() => getReportData(), [])
  return useAsyncResource<AdminReportData>(loader, {
    petsPerMonth: [],
    applicationsPerMonth: [],
    appointmentsPerMonth: [],
  })
}

export function useAdminSettings() {
  const result = useAsyncResource(
    useCallback(() => getAppSettings(), []),
    {
      platform_name: 'PawSphere',
      contact_email: 'support@pawsphere.bd',
      maintenance_mode: false,
    } satisfies AppSettings,
  )

  const save = useCallback(
    async (settings: AppSettings) => {
      const next = await updateAppSettings(settings)
      result.setData(next)
      return next
    },
    [result.setData],
  )

  return { ...result, save }
}
