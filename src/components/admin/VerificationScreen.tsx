import { useState } from 'react'

import { usePendingVerifications } from '@/hooks/useAdmin'
import { formatAdminDate, type PendingVerification } from '@/services/admin'

import {
  AdminBadge,
  AdminConfirmDialog,
  AdminEmptyState,
  AdminNotice,
  AdminPageTitle,
  AdminSkeleton,
} from './ui'

export function AdminVerificationScreen() {
  const { data: pending, loading, error, approve, reject, refresh } =
    usePendingVerifications()
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
      setNotice({
        type: 'success',
        message:
          pendingAction.action === 'approve'
            ? 'Account approved successfully.'
            : 'Account rejected.',
      })
      setPendingAction(null)
    } catch (actionError) {
      setNotice({
        type: 'error',
        message:
          actionError instanceof Error
            ? actionError.message
            : 'Unable to update verification status.',
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
        title="Verification Center"
        subtitle="Review and verify shelters and veterinarians"
      />

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-[14px] border border-[#E5E7EB] bg-white p-5"
            >
              <AdminSkeleton className="h-16 w-full" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-[14px] border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm font-medium text-red-600" role="alert">
            {error}
          </p>
          <button
            onClick={() => void refresh()}
            className="mt-3 text-sm font-medium text-[#16A34A]"
          >
            Try again
          </button>
        </div>
      ) : pending.length === 0 ? (
        <AdminEmptyState
          title="No pending verifications"
          text="New shelter and veterinarian registrations will appear here for review."
        />
      ) : (
        <div className="space-y-4">
          {pending.map((user) => (
            <div
              key={user.id}
              className="flex flex-col gap-4 rounded-[14px] border border-[#E5E7EB] bg-white p-5 sm:flex-row sm:items-center"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F0FDF4] text-sm font-bold text-[#16A34A]">
                {(user.full_name || '?')[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-[#111827]">{user.full_name}</p>
                <p className="text-sm capitalize text-[#6B7280]">
                  {user.role} · Joined {formatAdminDate(user.created_at)}
                </p>
                <p className="text-xs text-[#9CA3AF]">{user.email}</p>
                <p className="mt-1 text-xs text-[#6B7280]">
                  {user.organization}
                  {user.detail ? ` · ${user.detail}` : ''}
                </p>
              </div>
              <AdminBadge status="Pending" />
              <div className="flex flex-wrap gap-2">
                <button
                  disabled={busy}
                  onClick={() =>
                    setPendingAction({ user, action: 'approve' })
                  }
                  className="rounded-[8px] border border-[#16A34A] px-3 py-1.5 text-sm font-medium text-[#16A34A] transition-colors hover:bg-[#F0FDF4] disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  disabled={busy}
                  onClick={() =>
                    setPendingAction({ user, action: 'reject' })
                  }
                  className="rounded-[8px] border border-red-200 px-3 py-1.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-50 disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
