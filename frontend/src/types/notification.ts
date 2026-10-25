export interface NotificationItem {
  id: number
  title: string
  content: string
  targetAudience: 'ALL' | 'TEACHERS' | 'STUDENTS' | 'CLASS' | string
  targetClassId?: number
  targetClassName?: string
  priority: 'NORMAL' | 'HIGH' | 'URGENT' | string
  createdById?: number
  createdByName?: string
  createdAt: string
}

export interface CreateNotificationPayload {
  title: string
  content: string
  targetAudience: string
  targetClassId?: number
  priority: string
}
