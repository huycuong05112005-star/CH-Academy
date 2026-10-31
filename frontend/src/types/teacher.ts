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

export interface TeacherAdminItem {
  id: number
  userId?: number
  username?: string
  teacherCode: string
  fullName: string
  email?: string
  phone?: string
  specialization?: string
  bio?: string
  status: string
  createdAt?: string
}

export interface CreateTeacherPayload {
  teacherCode: string
  fullName: string
  email?: string
  phone?: string
  specialization?: string
  bio?: string
}

export interface TeacherActionItem {
  id: string
  type: 'ATTENDANCE' | 'EXAM_REVIEW' | 'GRADING' | 'GENERAL' | string
  title: string
  description: string
  linkUrl: string
  priority: 'HIGH' | 'MEDIUM' | 'LOW' | 'NORMAL' | string
  badge: string
}

export interface TeacherDashboardSummary {
  totalClasses: number
  totalStudents: number
  todaySessionsCount: number
  upcomingSessionsCount: number
  unmarkedAttendanceCount: number
  draftExamsCount: number
  pendingReviewExamsCount: number
  approvedExamsCount: number
  changesRequestedExamsCount: number
  publishedExamsCount: number
  pendingGradingCount: number
  actionItems: TeacherActionItem[]
  todaySessions: TeacherSessionItem[]
  upcomingSessions: TeacherSessionItem[]
}

export interface StudentExamResultSummary {
  studentId: number
  studentCode: string
  fullName: string
  email?: string
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED' | string
  score?: number | null
  maxScore?: number | null
  isPassed?: boolean | null
  attemptCount: number
  submittedAt?: string | null
}

export interface ClassExamResultItem {
  examId: number
  examTitle: string
  examCode: string
  classId: number
  className: string
  durationMinutes: number
  totalPoints: number
  totalStudents: number
  completedCount: number
  inProgressCount: number
  unattemptedCount: number
  averageScore?: number | null
  passRate?: number | null
  studentResults: StudentExamResultSummary[]
}
