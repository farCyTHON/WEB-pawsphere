import { useEffect, useState } from 'react'

import {
  getAvailablePets,
  getPetById,
  getRelatedPets,
  type AvailablePetFilters,
  type PublicPet,
} from '@/services/pets'

export function useAvailablePets(
  filters: AvailablePetFilters,
  page: number,
  pageSize = 12,
) {
  const [pets, setPets] = useState<PublicPet[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const timer = window.setTimeout(() => {
      setLoading(true)
      setError(null)
      void getAvailablePets(filters, page, pageSize)
        .then((result) => {
          if (!active) return
          setPets(result.pets)
          setTotal(result.total)
        })
        .catch((loadError: unknown) => {
          if (!active) return
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load available pets.',
          )
        })
        .finally(() => {
          if (active) setLoading(false)
        })
    }, filters.search ? 250 : 0)

    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [
    filters.gender,
    filters.maxAge,
    filters.minAge,
    filters.search,
    filters.species,
    filters.vaccinated,
    page,
    pageSize,
  ])

  return {
    pets,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    loading,
    error,
  }
}

export function usePublicPet(petId: string) {
  const [pet, setPet] = useState<PublicPet | null>(null)
  const [relatedPets, setRelatedPets] = useState<PublicPet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    setNotFound(false)

    void getPetById(petId)
      .then(async (selectedPet) => {
        if (!active) return
        if (!selectedPet) {
          setPet(null)
          setRelatedPets([])
          setNotFound(true)
          return
        }
        setPet(selectedPet)
        const related = await getRelatedPets(selectedPet.id, selectedPet.species)
        if (active) setRelatedPets(related)
      })
      .catch((loadError: unknown) => {
        if (!active) return
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Unable to load this pet.',
        )
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [petId])

  return { pet, relatedPets, loading, error, notFound }
}
