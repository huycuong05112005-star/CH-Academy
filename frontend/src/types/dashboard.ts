export interface UpcomingSession {
  id: number
  classId: number
  className: string
  classCode: string
  teacherName: string
  sessionDate: string
  startTime: string
  endTime: string
  room: string
  status: string
}

export interface MonthlyStat {
  month: string
  revenue: number
  newEnrollments: number
  completedSessions: number
}

export interface CourseEnrollmentStat {
  courseId: number
  courseName: string
  courseCode: string
  enrolledStudents: number
  estimatedRevenue: number
}

export interface DashboardStats {
  academicYear?: string
  period?: 'YEAR' | 'MONTH' | string
  availableAcademicYears?: string[]
  totalStudents: number
  activeStudents: number
  totalStudentsCenter?: number
  totalTeachers?: number
  totalCourses: number
  activeClasses: number
  totalLeads: number
  convertedLeads: number
  leadConversionRate: number
  averageAttendanceRate?: number
  totalReceivable: number
  totalPaid: number
  totalDebt: number
  upcomingSessions: UpcomingSession[]
  monthlyTrends?: MonthlyStat[]
  topCourses?: CourseEnrollmentStat[]
}
