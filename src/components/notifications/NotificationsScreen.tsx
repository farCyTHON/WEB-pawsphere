import { Bell } from 'lucide-react'

import { useAuth } from '@/contexts/AuthContext'
import {
  formatNotificationTime,
  useNotifications,
} from '@/hooks/useNotifications'

function PageTitle({
  title,
  action,
}: {
  title: string
  action?: React.ReactNode
}) {
  return (
    <div className="mb-6 flex items-center justify-between gap-4">
      <h1 className="text-xl font-bold text-[#111827]">{title}</h1>
      {action}
    </div>
  )
}

export function NotificationsScreen() {
  const { user } = useAuth()
  const { notifications, loading, error, markRead, markAllRead } =
    useNotifications(user?.id)

  return (
    <div>
      <PageTitle
        title="Notifications"
        action={
          notifications.some((item) => item.unread) ? (
            <button
              onClick={() => void markAllRead()}
              className="text-sm font-medium text-[#16A34A] hover:underline"
            >
              Mark all as read
            </button>
          ) : null
        }
      />
      {loading ? (
        <div className="divide-y divide-[#F1F5F9] overflow-hidden rounded-[14px] border border-[#E5E7EB] bg-white">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="px-5 py-4">
              <div className="h-4 w-3/4 animate-pulse rounded bg-[#E5E7EB]" />
              <div className="mt-2 h-3 w-24 animate-pulse rounded bg-[#E5E7EB]" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-[14px] border border-[#E5E7EB] bg-white p-12 text-center">
          <Bell className="mx-auto text-[#16A34A]" size={28} />
          <h3 className="mt-3 font-semibold text-[#111827]">Unable to load notifications</h3>
          <p className="mt-1 text-sm text-[#6B7280]">{error}</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-[14px] border border-[#E5E7EB] bg-white p-12 text-center">
          <Bell className="mx-auto text-[#16A34A]" size={28} />
          <h3 className="mt-3 font-semibold text-[#111827]">You’re all caught up</h3>
          <p className="mt-1 text-sm text-[#6B7280]">
            New adoption updates, reminders, and messages will appear here.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[#F1F5F9] overflow-hidden rounded-[14px] border border-[#E5E7EB] bg-white">
          {notifications.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => {
                if (n.unread) void markRead(n.id)
              }}
              className={`flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-[#F8FAFC] ${
                n.unread ? 'bg-[#F0FDF4]' : ''
              }`}
            >
              <div
                className={`mt-2 h-2 w-2 flex-shrink-0 rounded-full ${
                  n.unread ? 'bg-[#16A34A]' : 'bg-transparent'
                }`}
              />
              <div className="flex-1">
                <p className="text-sm text-[#374151]">{n.body}</p>
                <p className="mt-1 text-xs text-[#9CA3AF]">
                  {formatNotificationTime(n.created_at)}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function RecentNotifications() {
  const { user } = useAuth()
  const { notifications } = useNotifications(user?.id)
  const recent = notifications.slice(0, 4)

  if (recent.length === 0) {
    return (
      <p className="text-sm text-[#6B7280]">
        Adoption updates, reminders, and messages will show up here.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {recent.map((n) => (
        <div key={n.id} className="flex items-start gap-3">
          <div
            className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${
              n.unread ? 'bg-[#16A34A]' : 'bg-[#E5E7EB]'
            }`}
          />
          <div>
            <p className="text-sm text-[#374151]">{n.body}</p>
            <p className="mt-0.5 text-xs text-[#9CA3AF]">
              {formatNotificationTime(n.created_at)}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
