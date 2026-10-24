import { apiClient } from './client'
import type { DashboardStats } from '../types/dashboard'

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const res = await apiClient.get<DashboardStats>('/dashboard/stats')
    return res.data
  }
}
