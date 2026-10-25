import { apiClient } from './client'
import type { AttendanceRecord } from '../types/attendance'

export interface MonitoringSessionItem {
  sessionId: number
  classId: number
  classCode: string
  className: string
  teacherId: number | null
  teacherName: string
  sessionDate: string
  startTime: string
  endTime: string
  room: string | null
  topic: string | null
  sessionStatus: string
  isMarked: boolean
  totalEnrolled: number
  presentCount: number
  lateCount: number
  absentCount: number
  excusedCount: number
}

export const attendanceMonitoringApi = {
  getMonitoringSessions: async (params?: {
    classId?: number
    teacherId?: number
    markedFilter?: string
    fromDate?: string
    toDate?: string
  }): Promise<MonitoringSessionItem[]> => {
    const query = new URLSearchParams()
    if (params?.classId) query.append('classId', params.classId.toString())
    if (params?.teacherId) query.append('teacherId', params.teacherId.toString())
    if (params?.markedFilter) query.append('markedFilter', params.markedFilter)
    if (params?.fromDate) query.append('fromDate', params.fromDate)
    if (params?.toDate) query.append('toDate', params.toDate)

    const res = await apiClient.get<MonitoringSessionItem[]>(`/admin/attendance-monitoring?${query.toString()}`)
    return res.data
  },

  getSessionDetails: async (sessionId: number): Promise<AttendanceRecord[]> => {
    const res = await apiClient.get<AttendanceRecord[]>(`/admin/attendance-monitoring/sessions/${sessionId}`)
    return res.data
  },
}
