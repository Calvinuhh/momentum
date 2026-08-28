import { apiFetch } from './client'

export type Notification = {
  id: string
  type: 'WORKSPACE_INVITATION'
  invitationId: string
  title: string
  body: string
  readAt: string | null
  createdAt: string
}

export type NotificationsPage = {
  notifications: Notification[]
  unreadCount: number
  nextCursor: string | null
}

export function listNotifications(limit = 20, cursor?: string) {
  const query = new URLSearchParams({ limit: String(limit) })
  if (cursor) query.set('cursor', cursor)
  return apiFetch<NotificationsPage>(`/api/v1/notifications?${query}`)
}

export function markNotificationRead(id: string) {
  return apiFetch<void>(`/api/v1/notifications/${id}/read`, { method: 'PATCH' })
}

export function markAllNotificationsRead() {
  return apiFetch<void>('/api/v1/notifications/read-all', { method: 'PATCH' })
}
