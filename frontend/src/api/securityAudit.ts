import { apiClient } from './client'

export interface PageResponse<T> {
  content: T[]
  totalPages: number
  totalElements: number
  size: number
  number: number
}

export interface SecurityOverviewData {
  totalAlerts: number
  newAlerts: number
  investigatingAlerts: number
  resolvedAlerts: number
  falsePositiveAlerts: number
  acceptedRiskAlerts: number
  unresolvedAlerts: number
  criticalAlerts: number
  highAlerts: number
  activeSessions: number
  zeroTrustPosture: string
  fieldLevelSecurityEnforced: boolean
  recentAlerts: SecurityAlertDto[]
}

export interface SecurityAlertDto {
  id: number
  alertCode?: string
  eventType: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  title: string
  description: string
  username?: string
  ipAddress?: string
  status: 'NEW' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED' | 'FALSE_POSITIVE' | 'ACCEPTED_RISK'
  endpoint?: string
  targetResource?: string
  correlationId?: string
  actionTaken?: string
  investigatedBy?: number
  investigatedAt?: string
  investigationNotes?: string
  resolvedBy?: number
  resolvedAt?: string
  resolutionNotes?: string
  createdAt: string
  updatedAt?: string
}

export interface UserSessionDto {
  id: number
  userId: number
  username: string
  fullName: string
  email: string
  ipAddress: string
  deviceName: string
  lastActivityAt: string
  createdAt: string
  isActive: boolean
}

export interface AuditLogDto {
  id: number
  actorUsername: string
  actorRole?: string
  action: string
  module: string
  resourceType: string
  resourceId?: string
  clientIp?: string
  userAgent?: string
  status?: string
  errorMessage?: string
  oldValue?: string
  newValue?: string
  createdAt: string
}

export const securityAuditApi = {
  getOverview: async () => {
    const res = await apiClient.get<SecurityOverviewData>('/admin/security/overview')
    return res.data
  },

  getAlerts: async (params?: { severity?: string; status?: string; keyword?: string }) => {
    const searchParams = new URLSearchParams()
    if (params?.severity && params.severity !== 'ALL') searchParams.append('severity', params.severity)
    if (params?.status && params.status !== 'ALL') searchParams.append('status', params.status)
    if (params?.keyword) searchParams.append('keyword', params.keyword)
    const qs = searchParams.toString()
    const res = await apiClient.get<SecurityAlertDto[]>(`/admin/security/alerts${qs ? `?${qs}` : ''}`)
    return res.data || []
  },

  updateAlertStatus: async (id: number, status: string, notes?: string) => {
    const res = await apiClient.put<SecurityAlertDto>(`/admin/security/alerts/${id}/status?status=${status}${notes ? `&notes=${encodeURIComponent(notes)}` : ''}`)
    return res.data
  },

  investigateAlert: async (id: number, notes?: string) => {
    const res = await apiClient.post<SecurityAlertDto>(`/admin/security/alerts/${id}/investigate`, { notes })
    return res.data
  },

  resolveAlert: async (id: number, status: string, notes?: string, actionTaken?: string) => {
    const res = await apiClient.post<SecurityAlertDto>(`/admin/security/alerts/${id}/resolve`, {
      status,
      notes,
      actionTaken
    })
    return res.data
  },

  remediateAlert: async (id: number, actionType: 'LOCK_USER' | 'REQUIRE_PASSWORD_CHANGE' | 'REVOKE_SESSIONS') => {
    const res = await apiClient.post<{ message: string; alertId: number }>(`/admin/security/alerts/${id}/remediate`, {
      actionType
    })
    return res.data
  },

  getSessions: async () => {
    const res = await apiClient.get<UserSessionDto[]>('/admin/security/sessions')
    return res.data || []
  },

  revokeSession: async (id: number, reason?: string) => {
    const res = await apiClient.delete<void>(`/admin/security/sessions/${id}${reason ? `?reason=${encodeURIComponent(reason)}` : ''}`)
    return res.success
  },

  getAuditLogs: async (params?: {
    actor?: string
    action?: string
    module?: string
    resourceType?: string
    page?: number
    size?: number
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.actor) searchParams.append('actor', params.actor)
    if (params?.action) searchParams.append('action', params.action)
    if (params?.module) searchParams.append('module', params.module)
    if (params?.resourceType) searchParams.append('resourceType', params.resourceType)
    if (params?.page !== undefined) searchParams.append('page', params.page.toString())
    if (params?.size !== undefined) searchParams.append('size', params.size.toString())
    const qs = searchParams.toString()
    const res = await apiClient.get<PageResponse<AuditLogDto>>(`/admin/audit-logs${qs ? `?${qs}` : ''}`)
    return res.data
  }
}
