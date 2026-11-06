import { apiClient } from './client'
import type { DashboardStats } from '../types/dashboard'

export const dashboardApi = {
  getStats: async (academicYear?: string, period?: string): Promise<DashboardStats> => {
    const params = new URLSearchParams()
    if (academicYear) params.set('academicYear', academicYear)
    if (period) params.set('period', period)
    const queryString = params.toString()
    const url = queryString ? `/dashboard/stats?${queryString}` : '/dashboard/stats'
    const res = await apiClient.get<DashboardStats>(url)
    return res.data
  }
}
