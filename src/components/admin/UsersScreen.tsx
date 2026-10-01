import { useEffect, useState } from 'react'
import { Eye, Search } from 'lucide-react'

import { useAdminUsers } from '@/hooks/useAdmin'
import {
  formatAdminDate,
  formatVerificationLabel,
  getUserDetails,
  type AdminUserDetails,
  type AdminUserRow,
} from '@/services/admin'

import {
  AdminBadge,
  AdminEmptyState,
  AdminPageTitle,
  AdminTableSkeleton,
} from './ui'

const roleBadge: Record<string, string> = {
  owner: 'bg-blue-100 text-blue-700',
  shelter: 'bg-purple-100 text-purple-700',
  vet: 'bg-amber-100 text-amber-700',
  admin: 'bg-green-100 text-green-700',
}

export function AdminUsersScreen() {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewing, setViewing] = useState<AdminUserDetails | null>(null)
  const [viewError, setViewError] = useState<string | null>(null)
  const [viewLoading, setViewLoading] = useState(false)
  const { data: users, loading, error } = useAdminUsers(search)

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput), 300)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  const filtered = users.filter((user) => {
    const roleOk = roleFilter === 'all' || user.role === roleFilter
    const statusOk =
      statusFilter === 'all' || user.verification_status === statusFilter
    return roleOk && statusOk
  })

  const openDetails = async (user: AdminUserRow) => {
    setViewError(null)
    setViewLoading(true)
    setViewing({
      ...user,
      phone: user.phone ?? '',
      organization: null,
      detail: null,
    })
    try {
      const details = await getUserDetails(user.id)
      setViewing(details)
    } catch (loadError) {
      setViewError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load user details.',
      )
    } finally {
      setViewLoading(false)
    }
  }

  return (
    <div>
      <AdminPageTitle
        title="Users"
        subtitle="Manage all registered users"
      />
      <div className="overflow-hidden rounded-[14px] border border-[#E5E7EB] bg-white">
        <div className="flex flex-wrap items-center gap-3 border-b border-[#E5E7EB] px-5 py-3">
          <div className="flex max-w-xs flex-1 items-center gap-2 rounded-[8px] border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2">
            <Search size={13} className="text-[#9CA3AF]" />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#9CA3AF]"
              placeholder="Search by name or email..."
            />
          </div>
          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            className="rounded-[8px] border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#374151] outline-none"
          >
            <option value="all">All Roles</option>
            <option value="owner">owner</option>
            <option value="shelter">shelter</option>
            <option value="vet">vet</option>
            <option value="admin">admin</option>
          </select>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-[8px] border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#374151] outline-none"
          >
            <option value="all">All statuses</option>
            <option value="pending">pending</option>
            <option value="approved">approved</option>
            <option value="rejected">rejected</option>
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
              title="No users found"
              text={
                search || roleFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters.'
                  : 'Registered users will appear here.'
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead className="border-b border-[#E5E7EB] bg-[#F8FAFC]">
                <tr>
                  {[
                    'Name',
                    'Email',
                    'Role',
                    'Verification',
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
                {filtered.map((user) => (
                  <tr key={user.id} className="hover:bg-[#F8FAFC]">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E5E7EB] text-[10px] font-bold text-[#6B7280]">
                          {(user.full_name || '?')[0].toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-[#111827]">
                          {user.full_name || '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-[#374151]">
                      {user.email}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${
                          roleBadge[user.role] || 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <AdminBadge
                        status={formatVerificationLabel(
                          user.verification_status,
                        )}
                      />
                    </td>
                    <td className="px-5 py-4 text-sm text-[#374151]">
                      {formatAdminDate(user.created_at)}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => void openDetails(user)}
                        className="rounded-[8px] border border-[#E5E7EB] px-2.5 py-1.5 text-xs font-medium text-[#6B7280] hover:bg-[#F8FAFC]"
                        aria-label={`View ${user.full_name}`}
                      >
                        <Eye size={14} />
                      </button>
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
            <h3 className="text-lg font-bold text-[#111827]">
              {viewing.full_name || 'User details'}
            </h3>
            <p className="mt-1 text-sm capitalize text-[#6B7280]">
              {viewing.role}
            </p>
            {viewError ? (
              <p className="mt-4 text-sm text-red-600" role="alert">
                {viewError}
              </p>
            ) : (
              <div className="mt-4 space-y-2 text-sm text-[#374151]">
                <p>
                  <span className="font-medium text-[#111827]">Email:</span>{' '}
                  {viewing.email}
                </p>
                <p>
                  <span className="font-medium text-[#111827]">Phone:</span>{' '}
                  {viewLoading ? 'Loading…' : viewing.phone || '—'}
                </p>
                <p>
                  <span className="font-medium text-[#111827]">
                    Verification:
                  </span>{' '}
                  <AdminBadge
                    status={formatVerificationLabel(
                      viewing.verification_status,
                    )}
                  />
                </p>
                <p>
                  <span className="font-medium text-[#111827]">Created:</span>{' '}
                  {formatAdminDate(viewing.created_at)}
                </p>
                {viewing.organization && (
                  <p>
                    <span className="font-medium text-[#111827]">
                      Organization:
                    </span>{' '}
                    {viewing.organization}
                  </p>
                )}
                {viewing.detail && (
                  <p>
                    <span className="font-medium text-[#111827]">Details:</span>{' '}
                    {viewing.detail}
                  </p>
                )}
              </div>
            )}
            <button
              type="button"
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
