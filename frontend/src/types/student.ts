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
