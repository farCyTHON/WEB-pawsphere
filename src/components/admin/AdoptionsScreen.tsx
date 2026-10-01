import { useMemo, useState } from 'react'
import {
  AlertCircle,
  CheckCircle,
  ClipboardList,
  Clock,
} from 'lucide-react'

import { useAdminAdoptions } from '@/hooks/useAdmin'
import { formatAdminDate } from '@/services/admin'
import type { AdoptionStatus } from '@/services/adoptions'

import {
  AdminBadge,
  AdminEmptyState,
  AdminPageTitle,
  AdminStatCard,
  AdminTableSkeleton,
} from './ui'

const STATUS_OPTIONS: Array<AdoptionStatus | 'all'> = [
  'all',
  'pending',
  'review',
  'interview',
  'approved',
  'meet_and_greet',
  'rejected',
  'completed',
]

export function AdminAdoptionsScreen() {
  const [status, setStatus] = useState<AdoptionStatus | 'all'>('all')
  const { data: applications, loading, error } = useAdminAdoptions('all')

  const summary = useMemo(
    () => ({
      total: applications.length,
      inProgress: applications.filter(
        (app) => !['rejected', 'completed'].includes(app.status),
      ).length,
      completed: applications.filter((app) => app.status === 'completed')
        .length,
      rejected: applications.filter((app) => app.status === 'rejected')
        .length,
    }),
    [applications],
  )

  const filtered = useMemo(
    () =>
      status === 'all'
        ? applications
        : applications.filter((app) => app.status === status),
    [applications, status],
  )

  return (
    <div>
      <AdminPageTitle
        title="Adoptions"
        subtitle="Monitor all adoption applications across the platform"
      />

      <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <AdminStatCard
          label="Total Applications"
          value={loading ? '—' : summary.total}
          icon={<ClipboardList size={16} />}
          color="green"
        />
        <AdminStatCard
          label="In Progress"
          value={loading ? '—' : summary.inProgress}
          icon={<Clock size={16} />}
          color="amber"
        />
        <AdminStatCard
          label="Completed"
          value={loading ? '—' : summary.completed}
          icon={<CheckCircle size={16} />}
          color="blue"
        />
        <AdminStatCard
          label="Rejected"
          value={loading ? '—' : summary.rejected}
          icon={<AlertCircle size={16} />}
          color="purple"
        />
      </div>

      <div className="overflow-hidden rounded-[18px] border border-[#E5E7EB] bg-white">
        <div className="flex items-center gap-3 border-b border-[#E5E7EB] px-5 py-3">
          <label className="text-sm font-medium text-[#374151]">
            Status
          </label>
          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as AdoptionStatus | 'all')
            }
            className="rounded-[8px] border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#374151] outline-none"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option === 'all'
                  ? 'All statuses'
                  : option.replace(/_/g, ' ')}
              </option>
            ))}
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
              title="No adoption applications"
              text="Applications will appear here as owners apply for pets."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead className="border-b border-[#E5E7EB] bg-[#F8FAFC]">
                <tr>
                  {['Pet', 'Owner', 'Shelter', 'Status', 'Date'].map(
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
                {filtered.map((app) => (
                  <tr key={app.id} className="hover:bg-[#F8FAFC]">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        {app.pet_image ? (
                          <img
                            src={app.pet_image}
                            alt={app.pet_name}
                            className="h-8 w-8 rounded-[6px] object-cover"
                          />
                        ) : null}
                        <span className="text-sm font-medium text-[#111827]">
                          {app.pet_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-[#374151]">
                      {app.applicant_name}
                    </td>
                    <td className="px-5 py-4 text-sm text-[#374151]">
                      {app.shelter_name}
                    </td>
                    <td className="px-5 py-4">
                      <AdminBadge status={app.status} />
                    </td>
                    <td className="px-5 py-4 text-sm text-[#374151]">
                      {formatAdminDate(app.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
