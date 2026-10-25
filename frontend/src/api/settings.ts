import { apiClient, type ApiResponse } from './client'

export interface SystemSettings {
  centerName: string
  shortName: string
  hotline: string
  email: string
  address: string
  website?: string
  notifyNewLead?: boolean
  notifyTuitionDue?: boolean
  notifyAbsence?: boolean
  appVersion?: string
  dbVersion?: string
  activeProfile?: string
  timezone?: string
}

export const settingsApi = {
  getSettings: (): Promise<ApiResponse<SystemSettings>> => {
    return apiClient.get<SystemSettings>('/admin/settings')
  },

  updateSettings: (payload: SystemSettings): Promise<ApiResponse<SystemSettings>> => {
    return apiClient.put<SystemSettings>('/admin/settings', payload)
  },

  getPublicSettings: (): Promise<ApiResponse<SystemSettings>> => {
    return apiClient.get<SystemSettings>('/public/settings')
  },
}
