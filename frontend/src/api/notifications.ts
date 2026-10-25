import { apiFetch, type ApiResponse } from './client'
import type { NotificationItem, CreateNotificationPayload } from '../types/notification'
import type { SessionMaterial } from '../types/teacher'

export const notificationsApi = {
  getAll: () =>
    apiFetch<ApiResponse<NotificationItem[]>>('/admin/notifications'),

  create: (payload: CreateNotificationPayload) =>
    apiFetch<ApiResponse<NotificationItem>>('/admin/notifications', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  delete: (id: number) =>
    apiFetch<ApiResponse<void>>(`/admin/notifications/${id}`, {
      method: 'DELETE'
    }),

  getTeacherMaterials: () =>
    apiFetch<ApiResponse<SessionMaterial[]>>('/admin/notifications/teacher-materials')
}
