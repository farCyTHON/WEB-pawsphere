import { useCallback, useEffect, useState } from 'react'

import {
  deletePet,
  getShelterPets,
  type Pet,
} from '@/services/pets'

export function useShelterPets() {
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setPets(await getShelterPets())
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load pet listings.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const removePet = useCallback(async (pet: Pet) => {
    await deletePet(pet)
    setPets((current) => current.filter((item) => item.id !== pet.id))
  }, [])

  return {
    pets,
    loading,
    error,
    refresh,
    removePet,
  }
}
