export interface Guardian {
  id: number
  guardianCode: string
  fullName: string
  phone: string
  email?: string
  address?: string
  occupation?: string
}

export interface StudentGuardianLink {
  guardianId: number
  guardianCode: string
  fullName: string
  phone: string
  email?: string
  relationshipType: 'FATHER' | 'MOTHER' | 'GUARDIAN' | 'OTHER'
  isPrimaryContact: boolean
}

export interface Student {
  id: number
  studentCode: string
  fullName: string
  dateOfBirth?: string
  gender: 'MALE' | 'FEMALE' | 'OTHER'
  phone?: string
  email?: string
  address?: string
  targetType: 'KID' | 'ADULT'
  status: 'ACTIVE' | 'INACTIVE' | 'GRADUATED' | 'DROPPED'
  internalNotes?: string
  createdAt: string
  updatedAt: string
  guardians?: StudentGuardianLink[]

  // Automated course, tuition & account metadata
  hasUserAccount?: boolean
  username?: string
  enrolledCourseName?: string
  enrolledClassName?: string
  totalTuition?: number
  paidTuition?: number
  remainingTuition?: number
  tuitionStatus?: 'PAID' | 'PARTIALLY_PAID' | 'UNPAID' | 'NO_ENROLLMENT'
}

export interface AccountProvisionResponse {
  userId: number
  username: string
  plainPassword?: string
  emailSent: boolean
  message: string
}

export interface EnrollAndPayPayload {
  classId: number
  paidAmount?: number
  paymentMethod?: string
  referenceNumber?: string
  notes?: string
  provisionAccount?: boolean
}

export interface CreateStudentPayload {
  studentCode: string
  fullName: string
  dateOfBirth?: string
  gender: string
  phone?: string
  email?: string
  address?: string
  targetType: string
  status?: string
  internalNotes?: string
  guardians?: {
    guardianId: number
    relationshipType: string
    isPrimaryContact?: boolean
  }[]
}

export interface UpdateStudentPayload extends CreateStudentPayload {}

export interface StudentFilterParams {
  keyword?: string
  status?: string
  targetType?: string
  page?: number
  size?: number
  sortBy?: string
  direction?: 'asc' | 'desc'
}

export interface StudentStats {
  totalStudents: number
  activeStudents: number
  enrolledStudents: number
  kidStudents: number
  adultStudents: number
}

export interface StudentPortalSummary {
  student: Student
  enrollments: {
    id: number
    classId: number
    className: string
    courseName?: string
    enrollmentDate: string
    appliedTuitionFee: number
    status: string
  }[]
  receivables: {
    id: number
    code: string
    title: string
    className?: string
    totalAmount: number
    paidAmount: number
    remainingAmount: number
    status: string
    dueDate?: string
    createdAt: string
  }[]
  payments: {
    id: number
    paymentCode: string
    amount: number
    paymentMethod: string
    paymentDate: string
    referenceNumber?: string
    note?: string
    createdAt: string
  }[]
  totalTuition: number
  paidTuition: number
  remainingTuition: number
  tuitionStatus: 'PAID' | 'PARTIALLY_PAID' | 'UNPAID' | 'NO_ENROLLMENT' | string
  totalSessions: number
  presentSessions: number
  attendanceRate: number
}

export interface StudentMaterialItem {
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

export interface StudentSessionItem {
  id: number
  sessionDate: string
  startTime: string
  endTime: string
  room?: string
  topic?: string
  status: string
  attendanceStatus: 'PRESENT' | 'ABSENT' | 'LATE' | 'NOT_RECORDED' | string
  teacherNote?: string
  materials: StudentMaterialItem[]
}

export interface StudentClassDetail {
  id: number
  code: string
  name: string
  courseName?: string
  teacherName?: string
  room?: string
  startDate: string
  endDate?: string
  status: string
  sessions: StudentSessionItem[]
}

export interface StudentScheduleItem {
  sessionId: number
  classId: number
  classCode: string
  className: string
  courseName?: string
  teacherName?: string
  sessionDate: string
  startTime: string
  endTime: string
  room?: string
  topic?: string
  status: string
  attendanceStatus: string
  teacherNote?: string
}

export interface StudentAttendanceItem {
  id: number
  sessionId: number
  classId: number
  classCode: string
  className: string
  sessionDate: string
  startTime: string
  endTime: string
  topic?: string
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | string
  note?: string
  recordedAt: string
}

export interface StudentProfileData {
  id: number
  studentCode: string
  fullName: string
  dateOfBirth?: string
  gender: string
  phone?: string
  email?: string
  address?: string
  targetType: string
  status: string
  username?: string
  guardians: {
    id: number
    guardianCode: string
    fullName: string
    phone: string
    email?: string
    relationshipType: string
    isPrimaryContact: boolean
  }[]
}

