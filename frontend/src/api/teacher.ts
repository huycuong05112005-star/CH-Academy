import { apiFetch, type ApiResponse } from './client'
import type {
  TeacherProfile,
  TeacherClassItem,
  TeacherSessionItem,
  AttendanceRecordItem,
  BulkAttendancePayload,
  CreateMaterialPayload,
  SessionMaterial,
  TeacherAdminItem,
  CreateTeacherPayload
} from '../types/teacher'
import type { NotificationItem } from '../types/notification'

export const teacherApi = {
  getProfile: () =>
    apiFetch<ApiResponse<TeacherProfile>>('/teacher/portal/profile'),

  getMyClasses: () =>
    apiFetch<ApiResponse<TeacherClassItem[]>>('/teacher/portal/classes'),

  getClassDetails: (classId: number) =>
    apiFetch<ApiResponse<TeacherClassItem>>(`/teacher/portal/classes/${classId}`),

  getSessionDetails: (sessionId: number) =>
    apiFetch<ApiResponse<TeacherSessionItem>>(`/teacher/portal/sessions/${sessionId}`),

  getSessionAttendance: (sessionId: number) =>
    apiFetch<ApiResponse<AttendanceRecordItem[]>>(`/teacher/portal/sessions/${sessionId}/attendance`),

  markAttendance: (sessionId: number, payload: BulkAttendancePayload) =>
    apiFetch<ApiResponse<AttendanceRecordItem[]>>(`/teacher/portal/sessions/${sessionId}/attendance`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  uploadMaterial: (sessionId: number, payload: CreateMaterialPayload) =>
    apiFetch<ApiResponse<SessionMaterial>>(`/teacher/portal/sessions/${sessionId}/materials`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  deleteMaterial: (materialId: number) =>
    apiFetch<ApiResponse<void>>(`/teacher/portal/materials/${materialId}`, {
      method: 'DELETE'
    }),

  getMyNotifications: () =>
    apiFetch<ApiResponse<NotificationItem[]>>('/teacher/portal/notifications'),

  createClassAnnouncement: (payload: { title: string; content: string; targetClassId: number; priority?: string }) =>
    apiFetch<ApiResponse<NotificationItem>>('/teacher/portal/announcements', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  getMySentAnnouncements: () =>
    apiFetch<ApiResponse<NotificationItem[]>>('/teacher/portal/announcements/my-sent'),

  deleteMyAnnouncement: (id: number) =>
    apiFetch<ApiResponse<void>>(`/teacher/portal/announcements/${id}`, {
      method: 'DELETE'
    }),

  getUnmarkedSessions: () =>
    apiFetch<ApiResponse<TeacherSessionItem[]>>('/teacher/portal/sessions/unmarked'),

  getAllTeachers: () =>
    apiFetch<ApiResponse<TeacherAdminItem[]>>('/teachers'),

  getActiveTeachers: () =>
    apiFetch<ApiResponse<TeacherAdminItem[]>>('/teachers/active'),

  createTeacher: (payload: CreateTeacherPayload) =>
    apiFetch<ApiResponse<TeacherAdminItem>>('/teachers', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
}
