export interface CourseCategory {
  id: number
  code: string
  name: string
  description?: string
  displayOrder: number
  isActive: boolean
  courseCount?: number
}

export interface Course {
  id: number
  categoryId: number
  categoryCode: string
  categoryName: string
  code: string
  name: string
  description?: string
  targetAudience: 'KIDS' | 'TEENS' | 'ADULTS' | 'ALL'
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ALL_LEVELS'
  durationHours: number
  defaultTuitionFee: number
  learningOutcomes?: string
  maxStudents: number
  status: 'DRAFT' | 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED'
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateCoursePayload {
  categoryId: number
  code: string
  name: string
  description?: string
  targetAudience: string
  level: string
  durationHours: number
  defaultTuitionFee: number
  learningOutcomes?: string
  maxStudents: number
  status?: string
  isPublic?: boolean
}

export interface UpdateCoursePayload extends CreateCoursePayload {}

export interface CourseFilterParams {
  keyword?: string
  categoryId?: number
  targetAudience?: string
  status?: string
  page?: number
  size?: number
  sortBy?: string
  direction?: 'asc' | 'desc'
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
  empty: boolean
}
