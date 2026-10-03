import type { RealtimeChannel } from '@supabase/supabase-js'

import { supabase } from '@/lib/supabase'

export type NotificationType =
  | 'adoption'
  | 'appointment'
  | 'message'
  | 'vaccine'

export interface AppNotification {
  id: string
  type: NotificationType
  body: string
  read_at: string | null
  entity_type: string | null
  entity_id: string | null
  created_at: string
  unread: boolean
}

export async function getUserNotifications(): Promise<AppNotification[]> {
  const { data, error } = await supabase.rpc('get_user_notifications')
  if (error) throw error

  return ((data ?? []) as Omit<AppNotification, 'unread'>[]).map((row) => ({
    ...row,
    unread: row.read_at == null,
  }))
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  const { error } = await supabase.rpc('mark_notification_read', {
    target_notification_id: notificationId,
  })
  if (error) throw error
}

export async function markAllNotificationsRead(): Promise<void> {
  const { error } = await supabase.rpc('mark_all_notifications_read')
  if (error) throw error
}

const notificationListeners = new Map<string, Set<() => void>>()
const notificationChannels = new Map<string, RealtimeChannel>()

/**
 * One postgres_changes channel per user. Extra hook instances (header bell +
 * dashboard list) share that channel instead of calling .on() after subscribe().
 */
export function subscribeToNotifications(
  userId: string,
  onChange: () => void,
): () => void {
  let listeners = notificationListeners.get(userId)
  if (!listeners) {
    listeners = new Set()
    notificationListeners.set(userId, listeners)

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          notificationListeners.get(userId)?.forEach((listener) => listener())
        },
      )
      .subscribe((status, error) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('[PawSphere Notifications] Channel', status, error)
        }
      })

    notificationChannels.set(userId, channel)
  }

  listeners.add(onChange)

  return () => {
    const current = notificationListeners.get(userId)
    current?.delete(onChange)
    if (current && current.size > 0) return

    notificationListeners.delete(userId)
    const channel = notificationChannels.get(userId)
    notificationChannels.delete(userId)
    if (channel) void supabase.removeChannel(channel)
  }
}
