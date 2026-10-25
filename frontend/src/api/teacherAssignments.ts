import { apiClient } from './client'

export interface TeacherAssignmentItem {
  id: number
  classId: number
  classCode: string
  className: string
  teacherId: number
  teacherCode: string
  teacherName: string
  role: string
  status: string
  startDate: string
  endDate: string | null
  assignedByName: string
  notes: string | null
  createdAt: string
}

export interface AssignTeacherPayload {
  classId: number
  teacherId: number
  role?: string
  startDate?: string
  notes?: string
}

export const teacherAssignmentsApi = {
  getAllAssignments: async (params?: { classId?: number; teacherId?: number }): Promise<TeacherAssignmentItem[]> => {
    const query = new URLSearchParams()
    if (params?.classId) query.append('classId', params.classId.toString())
    if (params?.teacherId) query.append('teacherId', params.teacherId.toString())

    const res = await apiClient.get<TeacherAssignmentItem[]>(`/admin/teacher-assignments?${query.toString()}`)
    return res.data
  },

  assignTeacher: async (payload: AssignTeacherPayload): Promise<TeacherAssignmentItem> => {
    const res = await apiClient.post<TeacherAssignmentItem>('/admin/teacher-assignments', payload)
    return res.data
  },

  endAssignment: async (id: number, reason?: string): Promise<TeacherAssignmentItem> => {
    const query = reason ? `?reason=${encodeURIComponent(reason)}` : ''
    const res = await apiClient.put<TeacherAssignmentItem>(`/admin/teacher-assignments/${id}/end${query}`)
    return res.data
  },
}
