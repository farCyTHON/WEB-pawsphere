import { useState } from 'react'
import {
  Award,
  Calendar,
  ClipboardList,
  PawPrint,
  Stethoscope,
  Users,
} from 'lucide-react'

import {
  useAdminActivity,
  useAdminStats,
  usePendingVerifications,
} from '@/hooks/useAdmin'
import { formatAdminDate, type PendingVerification } from '@/services/admin'

import {
  AdminBadge,
  AdminConfirmDialog,
  AdminEmptyState,
  AdminNotice,
  AdminPageTitle,
  AdminSkeleton,
  AdminStatCard,
  AdminStatSkeletons,
} from './ui'

export function AdminDashboard() {
  const {
    data: stats,
    loading: statsLoading,
    error: statsError,
    refresh: refreshStats,
  } = useAdminStats()
  const {
    data: activity,
    loading: activityLoading,
    error: activityError,
    refresh: refreshActivity,
  } = useAdminActivity()
  const {
    data: pending,
    loading: pendingLoading,
    error: pendingError,
    approve,
    reject,
  } = usePendingVerifications()
  const [pendingAction, setPendingAction] = useState<{
    user: PendingVerification
    action: 'approve' | 'reject'
  } | null>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  const confirmAction = async () => {
    if (!pendingAction) return
    setBusy(true)
    try {
      if (pendingAction.action === 'approve') {
        await approve(pendingAction.user.id)
      } else {
        await reject(pendingAction.user.id)
      }
      await Promise.all([refreshStats(true), refreshActivity(true)])
      setNotice({
        type: 'success',
        message:
          pendingAction.action === 'approve'
            ? 'User approved successfully.'
            : 'User rejected.',
      })
      setPendingAction(null)
    } catch (error) {
      setNotice({
        type: 'error',
        message:
          error instanceof Error ? error.message : 'Unable to update user.',
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <AdminNotice notice={notice} onClose={() => setNotice(null)} />
      <AdminConfirmDialog
        open={Boolean(pendingAction)}
        title={
          pendingAction?.action === 'approve'
            ? `Approve ${pendingAction.user.full_name}?`
            : `Reject ${pendingAction?.user.full_name ?? 'this account'}?`
        }
        description={
          pendingAction?.action === 'approve'
            ? 'This shelter or veterinarian will be able to use their professional workspace.'
            : 'This account will remain signed in but cannot access professional features until reviewed again.'
        }
        confirmLabel={
          pendingAction?.action === 'approve' ? 'Approve' : 'Reject'
        }
        tone={pendingAction?.action === 'approve' ? 'success' : 'danger'}
        busy={busy}
        onCancel={() => {
          if (!busy) setPendingAction(null)
        }}
        onConfirm={() => void confirmAction()}
      />
      <AdminPageTitle
        title="Admin Dashboard"
        subtitle="Platform-wide overview"
      />

      {statsLoading ? (
        <AdminStatSkeletons count={6} />
      ) : statsError ? (
        <p className="mb-6 text-sm text-red-600" role="alert">
          {statsError}
        </p>
      ) : (
        <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-3 2xl:grid-cols-6">
          <AdminStatCard
            label="Total Users"
            value={stats.totalUsers}
            icon={<Users size={16} />}
            color="green"
          />
          <AdminStatCard
            label="Total Shelters"
            value={stats.totalShelters}
            sub={
              stats.pendingShelters
                ? `${stats.pendingShelters} pending`
                : undefined
            }
            icon={<PawPrint size={16} />}
            color="blue"
          />
          <AdminStatCard
            label="Total Veterinarians"
            value={stats.totalVeterinarians}
            sub={
              stats.pendingVeterinarians
                ? `${stats.pendingVeterinarians} pending`
                : undefined
            }
            icon={<Stethoscope size={16} />}
            color="amber"
          />
          <AdminStatCard
            label="Total Pets"
            value={stats.totalPets}
            icon={<Award size={16} />}
            color="purple"
          />
          <AdminStatCard
            label="Adoption Applications"
            value={stats.totalApplications}
            icon={<ClipboardList size={16} />}
            color="green"
          />
          <AdminStatCard
            label="Appointments"
            value={stats.totalAppointments}
            icon={<Calendar size={16} />}
            color="blue"
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-[14px] border border-[#E5E7EB] bg-white p-5">
          <h3 className="mb-4 font-semibold text-[#111827]">
            Pending Approvals
          </h3>
          {pendingLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <AdminSkeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : pendingError ? (
            <p className="text-sm text-red-600" role="alert">
              {pendingError}
            </p>
          ) : pending.length === 0 ? (
            <p className="text-sm text-[#6B7280]">No pending verifications.</p>
          ) : (
            <div className="space-y-2.5">
              {pending.slice(0, 5).map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-sm font-medium text-[#111827]">
                      {user.full_name}
                    </p>
                    <p className="text-xs capitalize text-[#9CA3AF]">
                      {user.role} · {formatAdminDate(user.created_at)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      disabled={busy}
                      onClick={() =>
                        setPendingAction({ user, action: 'approve' })
                      }
                      className="rounded-[6px] border border-[#16A34A] px-2.5 py-1 text-xs font-medium text-[#16A34A] disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      disabled={busy}
                      onClick={() =>
                        setPendingAction({ user, action: 'reject' })
                      }
                      className="rounded-[6px] border border-red-200 px-2.5 py-1 text-xs font-medium text-red-500 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[14px] border border-[#E5E7EB] bg-white p-5">
          <h3 className="mb-4 font-semibold text-[#111827]">Recent Activity</h3>
          {activityLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <AdminSkeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : activityError ? (
            <p className="text-sm text-red-600" role="alert">
              {activityError}
            </p>
          ) : activity.length === 0 ? (
            <AdminEmptyState
              title="No recent activity"
              text="New users, pets, and applications will show up here."
            />
          ) : (
            <div className="space-y-3">
              {activity.map((item) => (
                <div key={item.id} className="flex items-start gap-2.5">
                  <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#16A34A]" />
                  <div>
                    <p className="text-sm text-[#374151]">{item.text}</p>
                    <p className="text-xs text-[#9CA3AF]">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {pending.length > 0 && (
        <div className="mt-4 flex items-center gap-2 text-xs text-[#6B7280]">
          <AdminBadge status="Pending" />
          <span>
            {pending.length} verification
            {pending.length === 1 ? '' : 's'} awaiting review
          </span>
        </div>
      )}
    </div>
  )
}
