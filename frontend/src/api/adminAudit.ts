import { apiClient } from './client'

export interface AuditLogItem {
  id: number
  actorId: number | null
  actorUsername: string
  actorRole: string
  action: string
  resourceType: string
  resourceId: string | null
  details: string
  ipAddress: string | null
  createdAt: string
}

export interface PageResult<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

export const adminAuditApi = {
  getAuditLogs: async (params?: {
    actor?: string
    action?: string
    resourceType?: string
    page?: number
    size?: number
  }): Promise<PageResult<AuditLogItem>> => {
    const query = new URLSearchParams()
    if (params?.actor) query.append('actor', params.actor)
    if (params?.action) query.append('action', params.action)
    if (params?.resourceType) query.append('resourceType', params.resourceType)
    if (params?.page !== undefined) query.append('page', params.page.toString())
    if (params?.size !== undefined) query.append('size', params.size.toString())

    const res = await apiClient.get<PageResult<AuditLogItem>>(`/admin/audit-logs?${query.toString()}`)
    return res.data
  },

  getRecentLogs: async (): Promise<AuditLogItem[]> => {
    const res = await apiClient.get<AuditLogItem[]>('/admin/audit-logs/recent')
    return res.data
  },
}
