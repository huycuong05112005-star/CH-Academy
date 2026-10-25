export interface TeacherProfile {
  id: number
  teacherCode: string
  fullName: string
  email?: string
  phone?: string
  specialization?: string
  bio?: string
  status: string
  totalClasses: number
  activeStudents: number
}

export interface SessionMaterial {
  id: number
  sessionId: number
  sessionTopic?: string
  title: string
  description?: string
  materialType: 'SLIDE' | 'DOCUMENT' | 'EXERCISE' | 'VIDEO' | 'LINK' | string
  fileUrl: string
  uploadedById?: number
  uploadedByName?: string
  createdAt: string
}

export interface CreateMaterialPayload {
  title: string
  description?: string
  materialType: string
  fileUrl: string
}

export interface TeacherStudentItem {
  studentId: number
  studentCode: string
  fullName: string
  email?: string
  phone?: string
  gender: string
  dateOfBirth?: string
  enrollmentDate: string
  status: string
}

export interface TeacherSessionItem {
  id: number
  classId: number
  sessionDate: string
  startTime: string
  endTime: string
  room?: string
  topic?: string
  status: string
  materials: SessionMaterial[]
}

export interface TeacherClassItem {
  id: number
  code: string
  name: string
  courseId?: number
  courseName?: string
  courseCode?: string
  room?: string
  startDate: string
  endDate?: string
  status: string
  totalSessions: number
  enrolledStudents: number
  students?: TeacherStudentItem[]
  sessions?: TeacherSessionItem[]
}

export interface AttendanceRecordItem {
  id?: number
  sessionId: number
  studentId: number
  studentCode?: string
  studentFullName?: string
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | string
  note?: string
  recordedAt?: string
}

export interface BulkAttendancePayload {
  records: {
    studentId: number
    status: string
    note?: string
  }[]
}
