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

export interface DashboardStats {
  academicYear?: string
  availableAcademicYears?: string[]
  totalStudents: number
  activeStudents: number
  totalStudentsCenter?: number
  totalCourses: number
  activeClasses: number
  totalLeads: number
  convertedLeads: number
  leadConversionRate: number
  totalReceivable: number
  totalPaid: number
  totalDebt: number
  upcomingSessions: UpcomingSession[]
}
