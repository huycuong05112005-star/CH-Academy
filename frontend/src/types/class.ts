export interface Teacher {
  id: number;
  userId?: number | null;
  teacherCode: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  specialization?: string | null;
  bio?: string | null;
  status: string;
  createdAt: string;
}

export interface ClassSchedule {
  id: number;
  classId: number;
  dayOfWeek: number; // 1: Thứ 2, ..., 7: CN
  startTime: string; // "18:00"
  endTime: string;   // "19:30"
  room?: string | null;
}

export interface ClassItem {
  id: number;
  courseId: number;
  courseCode?: string | null;
  courseName?: string | null;
  primaryTeacherId?: number | null;
  primaryTeacherName?: string | null;
  code: string;
  name: string;
  maxCapacity: number;
  enrolledCount: number;
  room?: string | null;
  startDate: string;
  endDate?: string | null;
  status: 'PLANNING' | 'OPEN_FOR_ENROLLMENT' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  schedules?: ClassSchedule[];
}

export interface ScheduleSlotRequest {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room?: string;
}

export interface CreateClassRequest {
  courseId: number;
  primaryTeacherId?: number;
  code: string;
  name: string;
  maxCapacity: number;
  room?: string;
  startDate: string;
  endDate?: string;
  status?: string;
  schedules?: ScheduleSlotRequest[];
}

export interface Enrollment {
  id: number;
  classId: number;
  classCode?: string | null;
  className?: string | null;
  studentId: number;
  studentCode?: string | null;
  studentFullName?: string | null;
  enrollmentDate: string;
  appliedTuitionFee: number;
  discountAmount: number;
  finalFee: number;
  status: 'ENROLLED' | 'DROPPED' | 'COMPLETED';
  notes?: string | null;
  createdAt: string;
}

export interface CreateEnrollmentRequest {
  classId: number;
  studentId: number;
  enrollmentDate?: string;
  appliedTuitionFee?: number;
  discountAmount?: number;
  notes?: string;
}
