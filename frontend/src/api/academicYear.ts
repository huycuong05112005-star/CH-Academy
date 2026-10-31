import { apiClient, type ApiResponse } from './client'

export interface AcademicYearItem {
  id: number
  code: string
  name: string
  startDate: string
  endDate: string
  isCurrent: boolean
  status: 'ACTIVE' | 'UPCOMING' | 'COMPLETED' | 'CLOSED'
  createdAt?: string
  updatedAt?: string
}

export interface CreateAcademicYearPayload {
  code: string
  name: string
  startDate: string
  endDate: string
  isCurrent?: boolean
  status?: string
}

export const academicYearApi = {
  getAll: (): Promise<ApiResponse<AcademicYearItem[]>> =>
    apiClient.get<AcademicYearItem[]>('/academic-years'),

  getCurrent: (): Promise<ApiResponse<AcademicYearItem>> =>
    apiClient.get<AcademicYearItem>('/academic-years/current'),

  create: (data: CreateAcademicYearPayload): Promise<ApiResponse<AcademicYearItem>> =>
    apiClient.post<AcademicYearItem>('/academic-years', data),

  setCurrent: (id: number): Promise<ApiResponse<AcademicYearItem>> =>
    apiClient.put<AcademicYearItem>(`/academic-years/${id}/set-current`, {})
}

