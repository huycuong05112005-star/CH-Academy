import { apiFetch, type ApiResponse, setAuthToken } from './client'
import type { LoginPayload, LoginResponseData, User } from '../types/auth'

export const authApi = {
  login: async (payload: LoginPayload): Promise<ApiResponse<LoginResponseData>> => {
    const response = await apiFetch<ApiResponse<LoginResponseData>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    if (response.success && response.data?.accessToken) {
      setAuthToken(response.data.accessToken)
    }
    return response
  },

  getMe: async (): Promise<ApiResponse<User>> => {
    return apiFetch<ApiResponse<User>>('/auth/me')
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<ApiResponse<void>> => {
    return apiFetch<ApiResponse<void>>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    })
  },

  updateProfile: async (payload: {
    fullName: string
    phone?: string
    avatarUrl?: string
    specialization?: string
    bio?: string
  }): Promise<ApiResponse<User>> => {
    return apiFetch<ApiResponse<User>>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  },

  logout: async (): Promise<void> => {
    try {
      await apiFetch<ApiResponse<void>>('/auth/logout', { method: 'POST' })
    } finally {
      setAuthToken(null)
    }
  },
}
