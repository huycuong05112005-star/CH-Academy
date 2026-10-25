import { apiClient } from './client'
import type { Course, CourseCategory, PageResponse } from '../types/course'

export interface PublicLeadPayload {
  fullName: string
  phone: string
  email?: string
  targetCourseId?: number
  notes?: string
  websiteUrl?: string
}

export const publicApi = {
  getFeaturedCourses: async (): Promise<Course[]> => {
    const res = await apiClient.get<Course[]>('/public/courses/featured')
    return res.data
  },

  getCourses: async (params?: { keyword?: string; categoryId?: number; targetAudience?: string; page?: number; size?: number }): Promise<PageResponse<Course>> => {
    const query = new URLSearchParams()
    if (params?.keyword) query.set('keyword', params.keyword)
    if (params?.categoryId) query.set('categoryId', String(params.categoryId))
    if (params?.targetAudience && params.targetAudience !== 'ALL') query.set('targetAudience', params.targetAudience)
    if (params?.page !== undefined) query.set('page', String(params.page))
    if (params?.size !== undefined) query.set('size', String(params.size))
    const res = await apiClient.get<PageResponse<Course>>(`/public/courses?${query.toString()}`)
    return res.data
  },

  getCategories: async (): Promise<CourseCategory[]> => {
    const res = await apiClient.get<CourseCategory[]>('/public/courses/categories')
    return res.data
  },

  getCourseDetail: async (id: number): Promise<Course> => {
    const res = await apiClient.get<Course>(`/public/courses/${id}`)
    return res.data
  },

  submitLead: async (payload: PublicLeadPayload): Promise<unknown> => {
    return apiClient.post('/public/leads', payload)
  }
}
