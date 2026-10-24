import { apiClient, type ApiResponse } from './client'
import type { PageResponse } from '../types/course'
import type { Lead, LeadActivity, CreateLeadRequest, PublicLeadRequest, AddActivityRequest, ConvertLeadRequest } from '../types/lead'

export const leadsApi = {
  searchLeads: async (params?: {
    keyword?: string;
    status?: string;
    source?: string;
    assignedStaffId?: number;
    page?: number;
    size?: number;
  }): Promise<ApiResponse<PageResponse<Lead>>> => {
    const query = new URLSearchParams()
    if (params?.keyword) query.append('keyword', params.keyword)
    if (params?.status) query.append('status', params.status)
    if (params?.source) query.append('source', params.source)
    if (params?.assignedStaffId) query.append('assignedStaffId', params.assignedStaffId.toString())
    if (params?.page !== undefined) query.append('page', params.page.toString())
    if (params?.size !== undefined) query.append('size', params.size.toString())

    return apiClient.get<PageResponse<Lead>>(`/leads?${query.toString()}`)
  },

  getLeadById: async (id: number): Promise<ApiResponse<Lead>> => {
    return apiClient.get<Lead>(`/leads/${id}`)
  },

  createLead: async (data: CreateLeadRequest): Promise<ApiResponse<Lead>> => {
    return apiClient.post<Lead>('/leads', data)
  },

  submitPublicLead: async (data: PublicLeadRequest): Promise<ApiResponse<Lead>> => {
    return apiClient.post<Lead>('/public/leads', data)
  },

  updateLeadStatus: async (id: number, status: string): Promise<ApiResponse<Lead>> => {
    return apiClient.patch<Lead>(`/leads/${id}/status?status=${encodeURIComponent(status)}`)
  },

  addActivity: async (id: number, data: AddActivityRequest): Promise<ApiResponse<LeadActivity>> => {
    return apiClient.post<LeadActivity>(`/leads/${id}/activities`, data)
  },

  convertLead: async (id: number, data: ConvertLeadRequest): Promise<ApiResponse<Lead>> => {
    return apiClient.post<Lead>(`/leads/${id}/convert`, data)
  },
}
