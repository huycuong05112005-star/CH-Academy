import { apiClient, type ApiResponse } from './client'
import type { PageResponse } from '../types/course'
import type {
  Student,
  Guardian,
  CreateStudentPayload,
  UpdateStudentPayload,
  StudentFilterParams,
  StudentStats
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
