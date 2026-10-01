import { useMemo, useState } from 'react'
import { Edit, Plus, Search, Trash2 } from 'lucide-react'

import { useShelterPets } from '@/hooks/useShelterPets'
import type { Pet } from '@/services/pets'

interface PetListingsProps {
  canManage?: boolean
  onAdd?: () => void
  onEdit?: (pet: Pet) => void
}

export function ShelterPetListings({
  canManage = false,
  onAdd,
  onEdit,
}: PetListingsProps) {
  const { pets, loading, error, removePet } = useShelterPets()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('All Status')
  const [deleteTarget, setDeleteTarget] = useState<Pet | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [notice, setNotice] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  const filteredPets = useMemo(
    () =>
      pets.filter(
        (pet) =>
          (status === 'All Status' || pet.status === status) &&
          `${pet.name} ${pet.breed} ${pet.species}`
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [pets, search, status],
  )

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await removePet(deleteTarget)
      setNotice({ type: 'success', message: 'Pet listing deleted successfully.' })
      setDeleteTarget(null)
    } catch (deleteError) {
      setNotice({
        type: 'error',
        message:
          deleteError instanceof Error
            ? deleteError.message
            : 'Unable to delete the pet listing.',
      })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      {notice && (
        <div
          role="status"
          className={`fixed right-5 top-5 z-[80] rounded-[12px] border px-4 py-3 text-sm font-medium shadow-lg ${
            notice.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-red-200 bg-red-50 text-red-600'
          }`}
        >
          {notice.message}
        </div>
      )}

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#111827]">Pet Listings</h1>
          <p className="mt-1 text-sm text-[#6B7280]">
            Manage your shelter&apos;s pets
          </p>
        </div>
        {canManage && (
          <button
            onClick={onAdd}
            className="flex items-center gap-2 rounded-[10px] bg-[#16A34A] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#15803D]"
          >
            <Plus size={14} /> Add Pet
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-[14px] border border-[#E5E7EB] bg-white">
        <div className="flex items-center gap-3 border-b border-[#E5E7EB] px-5 py-3">
          <div className="flex max-w-xs flex-1 items-center gap-2 rounded-[8px] border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2">
            <Search size={13} className="text-[#9CA3AF]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#9CA3AF]"
              placeholder="Search pets..."
            />
          </div>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="rounded-[8px] border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#374151] outline-none"
          >
            <option>All Status</option>
            <option>Available</option>
            <option>Reserved</option>
            <option>Adopted</option>
          </select>
        </div>

        {loading ? (
          <TableLoadingSkeleton />
        ) : error ? (
          <div className="p-10 text-center">
            <p className="text-sm font-medium text-red-600">{error}</p>
          </div>
        ) : filteredPets.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#F0FDF4] text-[#16A34A]">
              <Plus size={20} />
            </div>
            <h3 className="mt-4 font-semibold text-[#111827]">
              No pet listings found
            </h3>
            <p className="mt-1 text-sm text-[#6B7280]">
              {pets.length === 0
                ? 'Add your first pet to begin accepting adoption applications.'
                : 'Try changing your search or status filter.'}
            </p>
            {canManage && pets.length === 0 && (
              <button onClick={onAdd} className="mt-5 rounded-[10px] bg-[#16A34A] px-4 py-2 text-sm font-medium text-white">
                Add Pet
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-[#E5E7EB] bg-[#F8FAFC]">
                <tr>
                  {['Pet', 'Breed', 'Age', 'Gender', 'Status', 'Actions'].map(
                    (heading) => (
                      <th
                        key={heading}
                        className="px-5 py-3 text-left text-xs font-semibold uppercase text-[#6B7280]"
                      >
                        {heading}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {filteredPets.map((pet) => (
                  <tr key={pet.id} className="transition-colors hover:bg-[#F8FAFC]">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {pet.image_url ? (
                          <img
                            src={pet.image_url}
                            alt={pet.name}
                            className="h-9 w-9 rounded-[8px] object-cover"
                          />
                        ) : (
                          <div className="h-9 w-9 rounded-[8px] bg-[#E5E7EB]" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-[#111827]">
                            {pet.name}
                          </p>
                          <p className="text-xs text-[#9CA3AF]">{pet.species}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-[#374151]">{pet.breed}</td>
                    <td className="px-5 py-4 text-sm text-[#374151]">{pet.age}</td>
                    <td className="px-5 py-4 text-sm text-[#374151]">{pet.gender}</td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-[#F0FDF4] px-2.5 py-1 text-xs font-medium text-[#15803D]">
                        {pet.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {canManage ? (
                        <div className="flex items-center gap-2">
                          <button
                            aria-label={`Edit ${pet.name}`}
                            onClick={() => onEdit?.(pet)}
                            className="flex h-7 w-7 items-center justify-center text-[#6B7280] transition-colors hover:text-[#16A34A]"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            aria-label={`Delete ${pet.name}`}
                            onClick={() => setDeleteTarget(pet)}
                            className="flex h-7 w-7 items-center justify-center text-[#6B7280] transition-colors hover:text-red-500"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-[#9CA3AF]">View only</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#111827]/40 p-4 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-[18px] bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-[#111827]">Delete this pet?</h2>
            <p className="mt-2 text-sm leading-6 text-[#6B7280]">
              {deleteTarget.name} and its uploaded image will be permanently removed.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                className="rounded-[10px] border border-[#E5E7EB] px-4 py-2 text-sm font-medium text-[#374151]"
              >
                Cancel
              </button>
              <button
                disabled={deleting}
                onClick={() => void confirmDelete()}
                className="rounded-[10px] bg-red-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {deleting ? 'Deleting...' : 'Delete Pet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function TableLoadingSkeleton() {
  return (
    <div className="space-y-3 p-5">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex items-center gap-4">
          <div className="h-10 w-10 animate-pulse rounded-[8px] bg-[#E5E7EB]" />
          <div className="h-4 flex-1 animate-pulse rounded bg-[#E5E7EB]" />
          <div className="h-4 w-24 animate-pulse rounded bg-[#E5E7EB]" />
          <div className="h-4 w-20 animate-pulse rounded bg-[#E5E7EB]" />
        </div>
      ))}
    </div>
  )
}
