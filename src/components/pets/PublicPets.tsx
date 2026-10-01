import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Heart,
  MapPin,
  Search,
  ShieldCheck,
  Syringe,
} from 'lucide-react'

import { useAvailablePets, usePublicPet } from '@/hooks/usePublicPets'
import type { AvailablePetFilters, PublicPet } from '@/services/pets'

const PAGE_SIZE = 12

interface PublicBrowsePetsProps {
  onPetClick: (petId: string) => void
  onSignIn?: () => void
}

export function PublicBrowsePets({
  onPetClick,
  onSignIn,
}: PublicBrowsePetsProps) {
  const [search, setSearch] = useState('')
  const [species, setSpecies] = useState('')
  const [gender, setGender] = useState('')
  const [vaccinated, setVaccinated] = useState<boolean | null>(null)
  const [minAge, setMinAge] = useState<number | null>(null)
  const [maxAge, setMaxAge] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const [liked, setLiked] = useState<string[]>([])

  const filters = useMemo<AvailablePetFilters>(
    () => ({ search, species, gender, vaccinated, minAge, maxAge }),
    [gender, maxAge, minAge, search, species, vaccinated],
  )
  const { pets, total, totalPages, loading, error } = useAvailablePets(
    filters,
    page,
    PAGE_SIZE,
  )

  useEffect(() => setPage(1), [
    search,
    species,
    gender,
    vaccinated,
    minAge,
    maxAge,
  ])

  const clearFilters = () => {
    setSearch('')
    setSpecies('')
    setGender('')
    setVaccinated(null)
    setMinAge(null)
    setMaxAge(null)
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#111827]">Browse Pets</h1>
          <p className="mt-1 text-sm text-[#6B7280]">
            Find your perfect companion from verified shelters
          </p>
        </div>
        {onSignIn && (
          <button
            onClick={onSignIn}
            className="rounded-[10px] border border-[#16A34A] px-4 py-2 text-sm font-medium text-[#16A34A] hover:bg-[#F0FDF4]"
          >
            Sign In to Apply
          </button>
        )}
      </div>

      <div className="flex gap-6">
        <aside className="h-fit w-52 flex-shrink-0 rounded-[14px] border border-[#E5E7EB] bg-white p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
            Filters
          </p>
          <FilterSelect label="Species" value={species} onChange={setSpecies}>
            <option value="">All species</option>
            <option>Dog</option>
            <option>Cat</option>
            <option>Rabbit</option>
            <option>Other</option>
          </FilterSelect>
          <FilterSelect label="Gender" value={gender} onChange={setGender}>
            <option value="">All genders</option>
            <option>Male</option>
            <option>Female</option>
            <option>Unknown</option>
          </FilterSelect>
          <FilterSelect
            label="Vaccination"
            value={vaccinated === null ? '' : String(vaccinated)}
            onChange={(value) =>
              setVaccinated(value === '' ? null : value === 'true')
            }
          >
            <option value="">Any</option>
            <option value="true">Vaccinated</option>
            <option value="false">Not vaccinated</option>
          </FilterSelect>
          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-medium text-[#374151]">
              Age range
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                min="0"
                step="0.1"
                value={minAge ?? ''}
                onChange={(event) =>
                  setMinAge(event.target.value ? Number(event.target.value) : null)
                }
                placeholder="Min"
                className={filterInputClass}
              />
              <input
                type="number"
                min="0"
                step="0.1"
                value={maxAge ?? ''}
                onChange={(event) =>
                  setMaxAge(event.target.value ? Number(event.target.value) : null)
                }
                placeholder="Max"
                className={filterInputClass}
              />
            </div>
          </div>
          <button
            onClick={clearFilters}
            className="w-full rounded-[9px] border border-[#E5E7EB] py-2 text-xs font-medium text-[#6B7280] hover:bg-[#F8FAFC]"
          >
            Clear filters
          </button>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex flex-1 items-center gap-2 rounded-[10px] border border-[#E5E7EB] bg-white px-3 py-2.5">
              <Search size={15} className="text-[#9CA3AF]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name or breed..."
                className="flex-1 bg-transparent text-sm outline-none"
              />
            </div>
            {!loading && (
              <span className="text-xs text-[#9CA3AF]">
                {total} available {total === 1 ? 'pet' : 'pets'}
              </span>
            )}
          </div>

          {loading ? (
            <PetCardSkeletons />
          ) : error ? (
            <MessageState
              title="Unable to load pets"
              message={error}
            />
          ) : pets.length === 0 ? (
            <MessageState
              title="No pets found"
              message="Try changing your search or filters."
              action={<button onClick={clearFilters} className={greenButtonClass}>Clear filters</button>}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {pets.map((pet) => (
                  <article
                    key={pet.id}
                    onClick={() => onPetClick(pet.id)}
                    className="group cursor-pointer overflow-hidden rounded-[14px] border border-[#E5E7EB] bg-white transition-all hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="relative h-44 bg-[#F1F5F9]">
                      {pet.image_url ? (
                        <img
                          src={pet.image_url}
                          alt={pet.name}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-[#9CA3AF]">
                          No image
                        </div>
                      )}
                      <button
                        aria-label={`Save ${pet.name}`}
                        onClick={(event) => {
                          event.stopPropagation()
                          setLiked((current) =>
                            current.includes(pet.id)
                              ? current.filter((id) => id !== pet.id)
                              : [...current, pet.id],
                          )
                        }}
                        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm"
                      >
                        <Heart
                          size={15}
                          className={
                            liked.includes(pet.id)
                              ? 'fill-red-500 text-red-500'
                              : 'text-[#6B7280]'
                          }
                        />
                      </button>
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-[#111827]">{pet.name}</h3>
                        {pet.vaccinated && (
                          <span className="flex items-center gap-1 rounded-full bg-[#F0FDF4] px-2 py-1 text-[10px] font-semibold text-[#15803D]">
                            <Syringe size={10} /> Vaccinated
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-[#6B7280]">
                        {pet.breed} · {formatAge(pet.age)} · {pet.gender}
                      </p>
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-[#6B7280]">
                        <MapPin size={12} className="text-[#16A34A]" />
                        <span className="truncate">{pet.shelter_name}</span>
                        <ShieldCheck size={12} className="ml-auto text-[#16A34A]" />
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-7 flex items-center justify-center gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((current) => current - 1)}
                    className={pageButtonClass}
                  >
                    <ChevronLeft size={15} />
                  </button>
                  {Array.from({ length: totalPages }, (_, index) => index + 1)
                    .slice(Math.max(0, page - 3), Math.max(5, page + 2))
                    .map((pageNumber) => (
                      <button
                        key={pageNumber}
                        onClick={() => setPage(pageNumber)}
                        className={`${pageButtonClass} ${
                          page === pageNumber
                            ? 'border-[#16A34A] bg-[#16A34A] text-white'
                            : ''
                        }`}
                      >
                        {pageNumber}
                      </button>
                    ))}
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage((current) => current + 1)}
                    className={pageButtonClass}
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

interface PublicPetDetailsProps {
  petId: string
  onBack: () => void
  onPetClick: (petId: string) => void
  onApply: (pet: PublicPet) => void
}

export function PublicPetDetails({
  petId,
  onBack,
  onPetClick,
  onApply,
}: PublicPetDetailsProps) {
  const { pet, relatedPets, loading, error, notFound } = usePublicPet(petId)
  const [activeImage, setActiveImage] = useState(0)
  const [contactNotice, setContactNotice] = useState(false)

  useEffect(() => setActiveImage(0), [petId])

  if (loading) return <PetDetailsSkeleton />
  if (notFound)
    return (
      <MessageState
        title="Pet not found"
        message="This pet may have been adopted or the listing no longer exists."
        action={<button onClick={onBack} className={greenButtonClass}>Back to Browse Pets</button>}
      />
    )
  if (error || !pet)
    return <MessageState title="Unable to load this pet" message={error ?? 'Please try again.'} />

  const gallery = Array.from(
    new Set([pet.image_url, ...(pet.image_urls ?? [])].filter(Boolean)),
  ) as string[]
  const personality = pet.personality ?? []

  return (
    <div>
      {contactNotice && (
        <div className="fixed right-5 top-5 z-50 rounded-[12px] border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 shadow-lg">
          Contact requests will be available with adoption applications.
        </div>
      )}
      <button onClick={onBack} className="mb-5 flex items-center gap-2 text-sm font-medium text-[#6B7280] hover:text-[#111827]">
        <ArrowLeft size={15} /> Back to Browse Pets
      </button>

      <div className="grid grid-cols-1 gap-7 lg:grid-cols-2">
        <div>
          <div className="h-[420px] overflow-hidden rounded-[18px] bg-[#F1F5F9]">
            {gallery[activeImage] ? (
              <img src={gallery[activeImage]} alt={pet.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-[#9CA3AF]">No image available</div>
            )}
          </div>
          {gallery.length > 1 && (
            <div className="mt-3 grid grid-cols-4 gap-3">
              {gallery.map((image, index) => (
                <button
                  key={image}
                  onClick={() => setActiveImage(index)}
                  className={`h-20 overflow-hidden rounded-[10px] border-2 ${
                    activeImage === index ? 'border-[#16A34A]' : 'border-transparent'
                  }`}
                >
                  <img src={image} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-semibold text-[#15803D]">
              Available
            </span>
            <span className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
              pet.vaccinated ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
            }`}>
              <Syringe size={12} />
              {pet.vaccinated ? 'Vaccinated' : 'Not vaccinated'}
            </span>
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#111827]">{pet.name}</h1>
          <p className="mt-2 text-sm text-[#6B7280]">
            {pet.breed} · {formatAge(pet.age)} · {pet.gender}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <InfoCard label="Species" value={pet.species} />
            <InfoCard label="Age" value={formatAge(pet.age)} />
            <InfoCard label="Gender" value={pet.gender} />
            <InfoCard label="Vaccination" value={pet.vaccinated ? 'Complete' : 'Pending'} />
          </div>

          <section className="mt-6">
            <h2 className="text-sm font-semibold text-[#111827]">Personality</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {personality.length > 0 ? (
                personality.map((trait) => (
                  <span key={trait} className="rounded-full bg-[#F0FDF4] px-3 py-1.5 text-xs font-medium text-[#15803D]">
                    {trait}
                  </span>
                ))
              ) : (
                <p className="text-sm text-[#6B7280]">Ask the shelter about this pet&apos;s personality.</p>
              )}
            </div>
          </section>

          <section className="mt-6 rounded-[14px] border border-[#E5E7EB] bg-[#F8FAFC] p-4">
            <h2 className="text-sm font-semibold text-[#111827]">Health Notes</h2>
            <p className="mt-2 text-sm leading-6 text-[#6B7280]">
              {pet.health_notes || 'No special health notes have been provided.'}
            </p>
          </section>

          <section className="mt-4 rounded-[14px] border border-[#E5E7EB] bg-white p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#DCFCE7] text-[#16A34A]">
                <ShieldCheck size={19} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-[#111827]">{pet.shelter_name}</h2>
                <p className="mt-1 flex items-center gap-1 text-xs text-[#6B7280]">
                  <MapPin size={11} /> {pet.shelter_address || 'Location available from shelter'}
                </p>
              </div>
            </div>
          </section>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                setContactNotice(true)
                window.setTimeout(() => setContactNotice(false), 2500)
              }}
              className="rounded-[12px] border border-[#16A34A] py-3 text-sm font-semibold text-[#15803D] hover:bg-[#F0FDF4]"
            >
              Contact Shelter
            </button>
            <button onClick={() => onApply(pet)} className={`${greenButtonClass} py-3`}>
              Apply for Adoption
            </button>
          </div>
        </div>
      </div>

      {relatedPets.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-bold text-[#111827]">Related Pets</h2>
          <p className="mt-1 text-sm text-[#6B7280]">Other available {pet.species.toLowerCase()}s you may love</p>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {relatedPets.map((related) => (
              <button
                key={related.id}
                onClick={() => onPetClick(related.id)}
                className="overflow-hidden rounded-[14px] border border-[#E5E7EB] bg-white text-left transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="h-36 bg-[#F1F5F9]">
                  {related.image_url && <img src={related.image_url} alt={related.name} loading="lazy" className="h-full w-full object-cover" />}
                </div>
                <div className="p-3">
                  <p className="font-semibold text-[#111827]">{related.name}</p>
                  <p className="mt-1 text-xs text-[#6B7280]">{related.breed} · {formatAge(related.age)}</p>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  children: React.ReactNode
}) {
  return (
    <label className="mb-4 block">
      <span className="mb-1.5 block text-xs font-medium text-[#374151]">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className={filterInputClass}>
        {children}
      </select>
    </label>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-3">
      <p className="text-[11px] uppercase tracking-wide text-[#9CA3AF]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#111827]">{value}</p>
    </div>
  )
}

function MessageState({
  title,
  message,
  action,
}: {
  title: string
  message: string
  action?: React.ReactNode
}) {
  return (
    <div className="rounded-[14px] border border-[#E5E7EB] bg-white p-12 text-center">
      <CheckCircle className="mx-auto text-[#16A34A]" size={30} />
      <h2 className="mt-4 font-semibold text-[#111827]">{title}</h2>
      <p className="mt-2 text-sm text-[#6B7280]">{message}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

function PetCardSkeletons() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-[14px] border border-[#E5E7EB] bg-white">
          <div className="h-44 animate-pulse bg-[#E5E7EB]" />
          <div className="space-y-3 p-4">
            <div className="h-4 w-1/2 animate-pulse rounded bg-[#E5E7EB]" />
            <div className="h-3 w-3/4 animate-pulse rounded bg-[#E5E7EB]" />
            <div className="h-3 w-full animate-pulse rounded bg-[#E5E7EB]" />
          </div>
        </div>
      ))}
    </div>
  )
}

function PetDetailsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-7 lg:grid-cols-2">
      <div className="h-[420px] animate-pulse rounded-[18px] bg-[#E5E7EB]" />
      <div className="space-y-5">
        <div className="h-5 w-28 animate-pulse rounded bg-[#E5E7EB]" />
        <div className="h-9 w-1/2 animate-pulse rounded bg-[#E5E7EB]" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-[#E5E7EB]" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-16 animate-pulse rounded-[12px] bg-[#E5E7EB]" />
          ))}
        </div>
      </div>
    </div>
  )
}

function formatAge(age: number) {
  return `${age} ${age === 1 ? 'year' : 'years'}`
}

const filterInputClass =
  'w-full rounded-[8px] border border-[#E5E7EB] bg-white px-2.5 py-2 text-xs text-[#374151] outline-none focus:border-[#16A34A]'
const greenButtonClass =
  'rounded-[10px] bg-[#16A34A] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#15803D]'
const pageButtonClass =
  'flex h-9 min-w-9 items-center justify-center rounded-[9px] border border-[#E5E7EB] bg-white px-2 text-xs font-medium text-[#374151] disabled:opacity-40'
