import { useMemo, useState } from 'react'
import { Eye, EyeOff, Search } from 'lucide-react'

import { useAdminPets } from '@/hooks/useAdmin'
import { formatAdminDate } from '@/services/admin'
import type { AdminPetRow } from '@/services/admin'

import {
  AdminBadge,
  AdminEmptyState,
  AdminNotice,
  AdminPageTitle,
  AdminTableSkeleton,
} from './ui'

export function AdminPetsScreen() {
  const { data: pets, loading, error, setVisibility } = useAdminPets()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('All Status')
  const [viewing, setViewing] = useState<AdminPetRow | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [notice, setNotice] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  const filtered = useMemo(
    () =>
      pets.filter(
        (pet) =>
          (status === 'All Status' || pet.status === status) &&
          `${pet.name} ${pet.breed} ${pet.species} ${pet.shelter_name}`
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [pets, search, status],
  )

  const toggleHidden = async (pet: AdminPetRow) => {
    setBusyId(pet.id)
    try {
      const nextHidden = !pet.is_hidden
      await setVisibility(pet.id, nextHidden)
      setNotice({
        type: 'success',
        message: nextHidden
          ? 'Listing hidden from public browse.'
          : 'Listing is visible again.',
      })
    } catch (toggleError) {
      setNotice({
        type: 'error',
        message:
          toggleError instanceof Error
            ? toggleError.message
            : 'Unable to update listing visibility.',
      })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <AdminNotice notice={notice} onClose={() => setNotice(null)} />
      <AdminPageTitle
        title="Pets & Listings"
        subtitle="Monitor shelter listings across the platform"
      />

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
          <div className="p-5">
            <AdminTableSkeleton />
          </div>
        ) : error ? (
          <div className="p-10 text-center">
            <p className="text-sm font-medium text-red-600" role="alert">
              {error}
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-6">
            <AdminEmptyState
              title="No pet listings found"
              text="Shelter pets will appear here once they are added."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="border-b border-[#E5E7EB] bg-[#F8FAFC]">
                <tr>
                  {[
                    'Pet',
                    'Shelter',
                    'Status',
                    'Created',
                    'Actions',
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="px-5 py-3 text-left text-xs font-semibold uppercase text-[#6B7280]"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {filtered.map((pet) => (
                  <tr key={pet.id} className="hover:bg-[#F8FAFC]">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {pet.image_url ? (
                          <img
                            src={pet.image_url}
                            alt={pet.name}
                            className="h-10 w-10 rounded-[8px] object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-[#F0FDF4] text-xs font-bold text-[#16A34A]">
                            {(pet.name || '?')[0]}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-[#111827]">
                            {pet.name}
                          </p>
                          <p className="text-xs text-[#9CA3AF]">
                            {pet.species} · {pet.breed}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-[#374151]">
                      {pet.shelter_name}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        <AdminBadge status={pet.status} />
                        {pet.is_hidden && <AdminBadge status="Hidden" />}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-[#374151]">
                      {formatAdminDate(pet.created_at)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setViewing(pet)}
                          className="rounded-[8px] border border-[#E5E7EB] px-2.5 py-1.5 text-xs font-medium text-[#6B7280] hover:bg-[#F8FAFC]"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          disabled={busyId === pet.id}
                          onClick={() => void toggleHidden(pet)}
                          className="inline-flex items-center gap-1 rounded-[8px] border border-[#E5E7EB] px-2.5 py-1.5 text-xs font-medium text-[#374151] hover:bg-[#F8FAFC] disabled:opacity-50"
                        >
                          {pet.is_hidden ? (
                            <>
                              <Eye size={14} /> Unhide
                            </>
                          ) : (
                            <>
                              <EyeOff size={14} /> Hide
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/35 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-lg rounded-[18px] border border-[#E5E7EB] bg-white p-6 shadow-xl">
            <div className="flex items-start gap-4">
              {viewing.image_url ? (
                <img
                  src={viewing.image_url}
                  alt={viewing.name}
                  className="h-24 w-24 rounded-[12px] object-cover"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-[12px] bg-[#F0FDF4] text-xl font-bold text-[#16A34A]">
                  {(viewing.name || '?')[0]}
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-lg font-bold text-[#111827]">
                  {viewing.name}
                </h3>
                <p className="mt-1 text-sm text-[#6B7280]">
                  {viewing.species} · {viewing.breed} · {viewing.gender}
                </p>
                <p className="mt-1 text-sm text-[#374151]">
                  Shelter: {viewing.shelter_name}
                </p>
                <div className="mt-2 flex gap-2">
                  <AdminBadge status={viewing.status} />
                  {viewing.is_hidden && <AdminBadge status="Hidden" />}
                </div>
              </div>
            </div>
            <div className="mt-4 space-y-2 text-sm text-[#374151]">
              <p>
                <span className="font-medium text-[#111827]">Age:</span>{' '}
                {viewing.age}
              </p>
              <p>
                <span className="font-medium text-[#111827]">Vaccinated:</span>{' '}
                {viewing.vaccinated ? 'Yes' : 'No'}
              </p>
              <p>
                <span className="font-medium text-[#111827]">Created:</span>{' '}
                {formatAdminDate(viewing.created_at)}
              </p>
              {viewing.health_notes && (
                <p>
                  <span className="font-medium text-[#111827]">Notes:</span>{' '}
                  {viewing.health_notes}
                </p>
              )}
            </div>
            <button
              onClick={() => setViewing(null)}
              className="mt-6 w-full rounded-[10px] bg-[#16A34A] py-2.5 text-sm font-semibold text-white hover:bg-[#15803D]"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
