import { apiClient, type ApiResponse } from './client'
import type {
  Course,
  CourseCategory,
  CreateCoursePayload,
  UpdateCoursePayload,
  CourseFilterParams,
  PageResponse
} from '../types/course'

export const coursesApi = {
  // Admin courses search
  searchCourses: async (params: CourseFilterParams): Promise<ApiResponse<PageResponse<Course>>> => {
    const query = new URLSearchParams()
    if (params.keyword) query.set('keyword', params.keyword)
    if (params.categoryId) query.set('categoryId', String(params.categoryId))
    if (params.targetAudience && params.targetAudience !== 'ALL') query.set('targetAudience', params.targetAudience)
    if (params.status && params.status !== 'ALL') query.set('status', params.status)
    if (params.page !== undefined) query.set('page', String(params.page))
    if (params.size !== undefined) query.set('size', String(params.size))
    if (params.sortBy) query.set('sortBy', params.sortBy)
    if (params.direction) query.set('direction', params.direction)

    return apiClient.get<PageResponse<Course>>(`/courses?${query.toString()}`)
  },

  getCourse: async (id: number): Promise<ApiResponse<Course>> => {
    return apiClient.get<Course>(`/courses/${id}`)
  },

  createCourse: async (payload: CreateCoursePayload): Promise<ApiResponse<Course>> => {
    return apiClient.post<Course>('/courses', payload)
  },

  updateCourse: async (id: number, payload: UpdateCoursePayload): Promise<ApiResponse<Course>> => {
    return apiClient.put<Course>(`/courses/${id}`, payload)
  },

  updateCourseStatus: async (id: number, status: string): Promise<ApiResponse<Course>> => {
    return apiClient.patch<Course>(`/courses/${id}/status`, { status })
  },

  deleteCourse: async (id: number): Promise<ApiResponse<void>> => {
    return apiClient.delete<void>(`/courses/${id}`)
  },

  // Categories
  getCategories: async (): Promise<ApiResponse<CourseCategory[]>> => {
    return apiClient.get<CourseCategory[]>('/course-categories')
  },

  getActiveCategories: async (): Promise<ApiResponse<CourseCategory[]>> => {
    return apiClient.get<CourseCategory[]>('/course-categories/active')
  },

  createCategory: async (payload: { code: string; name: string; description?: string; displayOrder?: number; isActive?: boolean }): Promise<ApiResponse<CourseCategory>> => {
    return apiClient.post<CourseCategory>('/course-categories', payload)
  }
}
