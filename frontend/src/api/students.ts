import { apiClient, type ApiResponse } from './client'
import type { PageResponse } from '../types/course'
import type {
  Student,
  Guardian,
  CreateStudentPayload,
  UpdateStudentPayload,
  StudentFilterParams,
  StudentStats,
  StudentPortalSummary
} from '../types/student'

export const studentsApi = {
  // Stats
  getStats: async (): Promise<ApiResponse<StudentStats>> => {
    return apiClient.get<StudentStats>('/students/stats')
  },

  // Students
  searchStudents: async (params: StudentFilterParams): Promise<ApiResponse<PageResponse<Student>>> => {
    const query = new URLSearchParams()
    if (params.keyword) query.set('keyword', params.keyword)
    if (params.status && params.status !== 'ALL') query.set('status', params.status)
    if (params.targetType && params.targetType !== 'ALL') query.set('targetType', params.targetType)
    if (params.page !== undefined) query.set('page', String(params.page))
    if (params.size !== undefined) query.set('size', String(params.size))
    if (params.sortBy) query.set('sortBy', params.sortBy)
    if (params.direction) query.set('direction', params.direction)

    return apiClient.get<PageResponse<Student>>(`/students?${query.toString()}`)
  },

  getStudent: async (id: number): Promise<ApiResponse<Student>> => {
    return apiClient.get<Student>(`/students/${id}`)
  },

  createStudent: async (payload: CreateStudentPayload): Promise<ApiResponse<Student>> => {
    return apiClient.post<Student>('/students', payload)
  },

  updateStudent: async (id: number, payload: UpdateStudentPayload): Promise<ApiResponse<Student>> => {
    return apiClient.put<Student>(`/students/${id}`, payload)
  },

  updateStudentStatus: async (id: number, status: string): Promise<ApiResponse<Student>> => {
    return apiClient.patch<Student>(`/students/${id}/status`, { status })
  },

  deleteStudent: async (id: number): Promise<ApiResponse<void>> => {
    return apiClient.delete<void>(`/students/${id}`)
  },

  provisionAccount: async (id: number, password?: string): Promise<ApiResponse<import('../types/student').AccountProvisionResponse>> => {
    return apiClient.post(`/students/${id}/provision-account`, password ? { password } : {})
  },

  enrollAndPay: async (id: number, payload: import('../types/student').EnrollAndPayPayload): Promise<ApiResponse<Student>> => {
    return apiClient.post<Student>(`/students/${id}/enroll-and-pay`, payload)
  },

  getMyPortal: async (): Promise<ApiResponse<StudentPortalSummary>> => {
    return apiClient.get<StudentPortalSummary>('/student/portal/me')
  },

  getClassDetails: async (classId: number): Promise<ApiResponse<import('../types/student').StudentClassDetail>> => {
    return apiClient.get<import('../types/student').StudentClassDetail>(`/student/portal/classes/${classId}`)
  },

  getMyNotifications: async (): Promise<ApiResponse<import('../types/notification').NotificationItem[]>> => {
    return apiClient.get<import('../types/notification').NotificationItem[]>('/student/portal/notifications')
  },

  changePassword: async (payload: { currentPassword: string; newPassword: string }): Promise<ApiResponse<void>> => {
    return apiClient.post<void>('/student/portal/change-password', payload)
  },

  getMySchedule: async (): Promise<ApiResponse<import('../types/student').StudentScheduleItem[]>> => {
    return apiClient.get<import('../types/student').StudentScheduleItem[]>('/student/portal/schedule')
  },

  getMyAttendance: async (): Promise<ApiResponse<import('../types/student').StudentAttendanceItem[]>> => {
    return apiClient.get<import('../types/student').StudentAttendanceItem[]>('/student/portal/attendance')
  },

  getMyTuition: async (): Promise<ApiResponse<{
    totalTuition: number
    paidTuition: number
    remainingTuition: number
    tuitionStatus: string
    receivables: any[]
    payments: any[]
  }>> => {
    return apiClient.get('/student/portal/tuition')
  },

  getMyProfile: async (): Promise<ApiResponse<import('../types/student').StudentProfileData>> => {
    return apiClient.get<import('../types/student').StudentProfileData>('/student/portal/profile')
  },

  getMyCourses: async (): Promise<ApiResponse<any[]>> => {
    return apiClient.get<any[]>('/student/portal/courses')
  },

  // Guardians
  searchGuardians: async (keyword?: string, page = 0, size = 10): Promise<ApiResponse<PageResponse<Guardian>>> => {
    const query = new URLSearchParams()
    if (keyword) query.set('keyword', keyword)
    query.set('page', String(page))
    query.set('size', String(size))

    return apiClient.get<PageResponse<Guardian>>(`/guardians?${query.toString()}`)
  },

  getAllGuardians: async (): Promise<ApiResponse<Guardian[]>> => {
    return apiClient.get<Guardian[]>('/guardians/all')
  },

  createGuardian: async (payload: {
    guardianCode: string
    fullName: string
    phone: string
    email?: string
    address?: string
    occupation?: string
  }): Promise<ApiResponse<Guardian>> => {
    return apiClient.post<Guardian>('/guardians', payload)
  }
}
