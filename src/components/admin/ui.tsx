import type { ReactNode } from 'react'
import { AlertCircle, CheckCircle, PawPrint, X } from 'lucide-react'

export function AdminBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Pending: 'bg-amber-100 text-amber-700',
    pending: 'bg-amber-100 text-amber-700',
    Approved: 'bg-green-100 text-green-700',
    approved: 'bg-green-100 text-green-700',
    Rejected: 'bg-red-100 text-red-700',
    rejected: 'bg-red-100 text-red-700',
    Available: 'bg-green-100 text-green-700',
    Reserved: 'bg-amber-100 text-amber-700',
    Adopted: 'bg-blue-100 text-blue-700',
    Hidden: 'bg-gray-100 text-gray-600',
    review: 'bg-blue-100 text-blue-700',
    interview: 'bg-purple-100 text-purple-700',
    meet_and_greet: 'bg-teal-100 text-teal-700',
    completed: 'bg-green-100 text-green-700',
  }

  const label = status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())

  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${
        colors[status] || 'bg-gray-100 text-gray-600'
      }`}
    >
      {label}
    </span>
  )
}

export function AdminStatCard({
  label,
  value,
  sub,
  icon,
  color = 'green',
}: {
  label: string
  value: string | number
  sub?: string
  icon: ReactNode
  color?: string
}) {
  const bg =
    color === 'green'
      ? 'bg-[#DCFCE7] text-[#16A34A]'
      : color === 'amber'
        ? 'bg-amber-100 text-amber-600'
        : color === 'blue'
          ? 'bg-blue-100 text-blue-600'
          : 'bg-purple-100 text-purple-600'

  return (
    <div className="rounded-[14px] border border-[#E5E7EB] bg-white p-5">
      <div
        className={`mb-3 flex h-9 w-9 items-center justify-center rounded-[10px] ${bg}`}
      >
        {icon}
      </div>
      <p className="text-2xl font-bold text-[#111827]">{value}</p>
      <p className="mt-0.5 text-sm text-[#6B7280]">{label}</p>
      {sub && (
        <p className="mt-1 text-xs font-medium text-[#16A34A]">{sub}</p>
      )}
    </div>
  )
}

export function AdminPageTitle({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-6 flex items-start justify-between">
      <div>
        <h1 className="text-xl font-bold text-[#111827]">{title}</h1>
        {subtitle && (
          <p className="mt-0.5 text-sm text-[#6B7280]">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  )
}

export function AdminSkeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-gradient-to-r from-[#F1F5F9] via-[#EAF3EC] to-[#F1F5F9] bg-[length:200%_100%] ${className}`}
    />
  )
}

export function AdminStatSkeletons({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-3 2xl:grid-cols-6">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="rounded-[14px] border border-[#E5E7EB] bg-white p-5"
        >
          <AdminSkeleton className="h-9 w-9" />
          <AdminSkeleton className="mt-4 h-6 w-16" />
          <AdminSkeleton className="mt-2 h-3 w-24" />
        </div>
      ))}
    </div>
  )
}

export function AdminTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-[14px] border border-[#E5E7EB] bg-white p-5">
      <AdminSkeleton className="h-4 w-1/3" />
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="mt-5 grid grid-cols-5 gap-4">
          <AdminSkeleton className="h-4" />
          <AdminSkeleton className="h-4" />
          <AdminSkeleton className="h-4" />
          <AdminSkeleton className="h-4" />
          <AdminSkeleton className="h-4" />
        </div>
      ))}
    </div>
  )
}

export function AdminEmptyState({
  title = 'Nothing here yet',
  text,
}: {
  title?: string
  text: string
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[16px] border border-dashed border-[#D1D5DB] bg-white px-6 py-14 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F0FDF4] text-[#16A34A]">
        <PawPrint size={23} />
      </div>
      <p className="text-sm font-semibold text-[#111827]">{title}</p>
      <p className="mt-1 max-w-sm text-sm leading-6 text-[#6B7280]">{text}</p>
    </div>
  )
}

export function AdminNotice({
  notice,
  onClose,
}: {
  notice: { type: 'success' | 'error'; message: string } | null
  onClose: () => void
}) {
  if (!notice) return null

  if (notice.type === 'success') {
    return (
      <div className="fixed bottom-5 right-5 z-50 flex max-w-sm items-start gap-3 rounded-[14px] border border-[#BBF7D0] bg-white p-4 shadow-xl shadow-green-950/10">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#DCFCE7] text-[#16A34A]">
          <CheckCircle size={17} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-[#111827]">All set</p>
          <p className="mt-0.5 text-xs leading-5 text-[#6B7280]">
            {notice.message}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-[#9CA3AF] transition-colors hover:text-[#374151]"
          aria-label="Dismiss notification"
        >
          <X size={15} />
        </button>
      </div>
    )
  }

  return (
    <div
      role="alert"
      className="fixed right-5 top-5 z-[80] rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 shadow-lg"
    >
      {notice.message}
    </div>
  )
}

export function AdminConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  tone = 'danger',
  busy = false,
  onCancel,
  onConfirm,
}: {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  tone?: 'danger' | 'success'
  busy?: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  if (!open) return null

  const confirmClass =
    tone === 'success'
      ? 'bg-[#16A34A] hover:bg-[#15803D]'
      : 'bg-red-500 hover:bg-red-600'
  const iconClass =
    tone === 'success'
      ? 'bg-[#F0FDF4] text-[#16A34A]'
      : 'bg-red-50 text-red-500'

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#111827]/40 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-sm rounded-[18px] bg-white p-6 shadow-2xl shadow-slate-900/15"
      >
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-2xl ${iconClass}`}
        >
          {tone === 'success' ? (
            <CheckCircle size={20} />
          ) : (
            <AlertCircle size={20} />
          )}
        </div>
        <h2 className="mt-4 text-lg font-bold text-[#111827]">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-[#6B7280]">{description}</p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="flex-1 rounded-[14px] border border-[#E5E7EB] py-2.5 text-sm font-semibold text-[#374151] hover:bg-[#F8FAFC] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className={`flex-1 rounded-[14px] py-2.5 text-sm font-semibold text-white disabled:opacity-50 ${confirmClass}`}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
