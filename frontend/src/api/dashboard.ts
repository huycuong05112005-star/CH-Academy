import { apiClient } from './client'
import type { DashboardStats } from '../types/dashboard'

export const dashboardApi = {
  getStats: async (academicYear?: string): Promise<DashboardStats> => {
    const url = academicYear ? `/dashboard/stats?academicYear=${encodeURIComponent(academicYear)}` : '/dashboard/stats'
    const res = await apiClient.get<DashboardStats>(url)
    return res.data
  }
}
