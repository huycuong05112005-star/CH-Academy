import { apiClient, type ApiResponse } from './client'
import type { AttendanceRecord, AttendanceStats, BulkAttendancePayload, ClassSessionItem } from '../types/attendance'

export const attendanceApi = {
  getSessions: async (params?: {
    classId?: number;
    teacherId?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<ClassSessionItem[]>> => {
    const query = new URLSearchParams()
    if (params?.classId) query.append('classId', params.classId.toString())
    if (params?.teacherId) query.append('teacherId', params.teacherId.toString())
    if (params?.startDate) query.append('startDate', params.startDate)
    if (params?.endDate) query.append('endDate', params.endDate)

    return apiClient.get<ClassSessionItem[]>(`/attendance/sessions?${query.toString()}`)
  },

  getSessionAttendance: async (sessionId: number): Promise<ApiResponse<AttendanceRecord[]>> => {
    return apiClient.get<AttendanceRecord[]>(`/attendance/sessions/${sessionId}`)
  },

  markAttendance: async (sessionId: number, data: BulkAttendancePayload): Promise<ApiResponse<AttendanceRecord[]>> => {
    return apiClient.post<AttendanceRecord[]>(`/attendance/sessions/${sessionId}`, data)
  },

  getStudentStats: async (studentId: number): Promise<ApiResponse<AttendanceStats>> => {
    return apiClient.get<AttendanceStats>(`/attendance/students/${studentId}/stats`)
  },
}
