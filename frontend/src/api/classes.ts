import { apiClient, type ApiResponse } from './client'
import type { PageResponse } from '../types/course'
import type { ClassItem, Teacher, Enrollment, CreateClassRequest, CreateEnrollmentRequest, ClassSessionItem } from '../types/class'

export const classesApi = {
  getClassSessions: async (classId: number): Promise<ApiResponse<ClassSessionItem[]>> => {
    return apiClient.get<ClassSessionItem[]>(`/classes/${classId}/sessions`)
  },
  searchClasses: async (params?: {
    keyword?: string;
    status?: string;
    courseId?: number;
    teacherId?: number;
    page?: number;
    size?: number;
  }): Promise<ApiResponse<PageResponse<ClassItem>>> => {
    const query = new URLSearchParams()
    if (params?.keyword) query.append('keyword', params.keyword)
    if (params?.status) query.append('status', params.status)
    if (params?.courseId) query.append('courseId', params.courseId.toString())
    if (params?.teacherId) query.append('teacherId', params.teacherId.toString())
    if (params?.page !== undefined) query.append('page', params.page.toString())
    if (params?.size !== undefined) query.append('size', params.size.toString())

    return apiClient.get<PageResponse<ClassItem>>(`/classes?${query.toString()}`)
  },

  getClassById: async (id: number): Promise<ApiResponse<ClassItem>> => {
    return apiClient.get<ClassItem>(`/classes/${id}`)
  },

  createClass: async (data: CreateClassRequest): Promise<ApiResponse<ClassItem>> => {
    return apiClient.post<ClassItem>('/classes', data)
  },

  getActiveTeachers: async (): Promise<ApiResponse<Teacher[]>> => {
    return apiClient.get<Teacher[]>('/teachers/active')
  },

  getEnrollments: async (classId: number): Promise<ApiResponse<Enrollment[]>> => {
    return apiClient.get<Enrollment[]>(`/classes/${classId}/enrollments`)
  },

  enrollStudent: async (data: CreateEnrollmentRequest): Promise<ApiResponse<Enrollment>> => {
    return apiClient.post<Enrollment>('/classes/enrollments', data)
  },
}
