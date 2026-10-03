import { useCallback, useEffect, useState } from 'react'

import {
  getUserNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeToNotifications,
  type AppNotification,
} from '@/services/notifications'

export function useNotifications(userId?: string | null) {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setError(null)
    try {
      setNotifications(await getUserNotifications())
    } catch (loadError) {
      if (!silent) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Unable to load notifications.',
        )
      }
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!userId) {
      setNotifications([])
      setLoading(false)
      return
    }

    let active = true
    void refresh()
    const unsubscribe = subscribeToNotifications(userId, () => {
      if (active) void refresh(true)
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [refresh, userId])

  const markRead = useCallback(async (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((item) =>
        item.id === notificationId
          ? { ...item, read_at: item.read_at ?? new Date().toISOString(), unread: false }
          : item,
      ),
    )
    try {
      await markNotificationRead(notificationId)
    } catch (readError) {
      console.warn('[PawSphere] Unable to mark notification read:', readError)
      void refresh(true)
    }
  }, [refresh])

  const markAllRead = useCallback(async () => {
    setNotifications((prev) =>
      prev.map((item) => ({
        ...item,
        read_at: item.read_at ?? new Date().toISOString(),
        unread: false,
      })),
    )
    try {
      await markAllNotificationsRead()
    } catch (readError) {
      console.warn('[PawSphere] Unable to mark notifications read:', readError)
      void refresh(true)
    }
  }, [refresh])

  const unreadCount = notifications.filter((item) => item.unread).length

  return {
    notifications,
    loading,
    error,
    unreadCount,
    refresh,
    markRead,
    markAllRead,
  }
}

export function formatNotificationTime(value: string) {
  const date = new Date(value)
  const diffMs = Date.now() - date.getTime()
  const minutes = Math.max(0, Math.round(diffMs / 60000))
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.round(hours / 24)
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
  }).format(date)
}
