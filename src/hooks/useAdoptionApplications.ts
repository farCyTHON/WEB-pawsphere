import { useCallback, useEffect, useState } from 'react'

import {
  completeAdoption,
  getApplicationById,
  getOwnerApplications,
  getShelterApplications,
  updateApplicationStatus,
  type AdoptionApplication,
  type AdoptionStatus,
} from '@/services/adoptions'

function useApplications(
  loader: () => Promise<AdoptionApplication[]>,
) {
  const [applications, setApplications] = useState<AdoptionApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setApplications(await loader())
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load adoption applications.',
      )
    } finally {
      setLoading(false)
    }
  }, [loader])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { applications, loading, error, refresh }
}

export function useOwnerApplications() {
  return useApplications(getOwnerApplications)
}

export function useShelterApplications() {
  const result = useApplications(getShelterApplications)

  const changeStatus = useCallback(
    async (
      applicationId: string,
      status: AdoptionStatus,
      remarks?: string | null,
    ) => {
      await updateApplicationStatus(applicationId, status, remarks)
      await result.refresh()
    },
    [result.refresh],
  )

  const complete = useCallback(
    async (applicationId: string, remarks?: string | null) => {
      await completeAdoption(applicationId, remarks)
      await result.refresh()
    },
    [result.refresh],
  )

  return { ...result, changeStatus, complete }
}

export function useApplicationDetails(applicationId: string | null) {
  const [application, setApplication] = useState<AdoptionApplication | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    if (!applicationId) {
      setApplication(null)
      return
    }

    setLoading(true)
    setError(null)
    void getApplicationById(applicationId)
      .then((data) => {
        if (active) setApplication(data)
      })
      .catch((loadError: unknown) => {
        if (!active) return
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Unable to load application details.',
        )
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [applicationId])

  return { application, loading, error }
}
