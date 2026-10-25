export interface LeadActivity {
  id: number;
  leadId: number;
  staffId?: number | null;
  staffName?: string | null;
  actionType: 'CALL' | 'MESSAGE' | 'MEETING' | 'NOTE' | 'STATUS_CHANGE';
  content: string;
  activityTime: string;
  createdAt: string;
}

export interface Lead {
  id: number;
  leadCode: string;
  fullName: string;
  phone: string;
  email?: string | null;
  source: 'WEBSITE' | 'FACEBOOK' | 'REFERRAL' | 'WALK_IN' | 'HOTLINE' | 'OTHER';
  targetCourseId?: number | null;
  targetCourseName?: string | null;
  assignedStaffId?: number | null;
  assignedStaffName?: string | null;
  status: 'NEW' | 'CONTACTED' | 'CONSULTING' | 'APPOINTMENT' | 'CONVERTED' | 'LOST';
  notes?: string | null;
  convertedStudentId?: number | null;
  convertedStudentCode?: string | null;
  convertedStudentName?: string | null;
  createdAt: string;
  updatedAt: string;
  activities?: LeadActivity[];
}

export interface CreateLeadRequest {
  fullName: string;
  phone: string;
  email?: string;
  source: string;
  targetCourseId?: number;
  assignedStaffId?: number;
  notes?: string;
}

export interface PublicLeadRequest {
  fullName: string;
  phone: string;
  email?: string;
  targetCourseId?: number;
  notes?: string;
  websiteUrl?: string; // honeypot
}

export interface AddActivityRequest {
  actionType: 'CALL' | 'MESSAGE' | 'MEETING' | 'NOTE' | 'STATUS_CHANGE';
  content: string;
}

export interface ConvertLeadRequest {
  studentType: 'KID' | 'ADULT';
  dob?: string;
  gender?: string;
  address?: string;
  existingGuardianId?: number;
  guardianFullName?: string;
  guardianPhone?: string;
  guardianEmail?: string;
  guardianRelationship?: string;

  // Automated enrollment & tuition fields
  classId?: number;
  paidAmount?: number;
  paymentMethod?: string;
  referenceNumber?: string;
  provisionAccount?: boolean;
}
