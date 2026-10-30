import { apiFetch, type ApiResponse } from './client'

export interface UserSecurityItem {
  id: number
  username: string
  fullName: string
  email: string
  phone?: string
  role: string
  lastPasswordChangedAt?: string
  mustChangePassword: boolean
  passwordResetSource?: string
  failedLoginAttempts: number
  lockedAt?: string
  isLocked: boolean
}

export interface ResetPasswordResult {
  userId: number
  username: string
  resetToken: string
  resetUrl: string
  expiresAt: string
}

export interface SecurityAuditItem {
  id: number
  userId?: number
  username?: string
  action: string
  details?: string
  ipAddress?: string
  createdAt: string
}

export const securityApi = {
  getUsers: async (params?: { keyword?: string; role?: string; status?: string }): Promise<ApiResponse<UserSecurityItem[]>> => {
    const query = new URLSearchParams()
    if (params?.keyword) query.set('keyword', params.keyword)
    if (params?.role) query.set('role', params.role)
    if (params?.status) query.set('status', params.status)
    const qs = query.toString()
    return apiFetch<ApiResponse<UserSecurityItem[]>>(`/admin/security/users${qs ? '?' + qs : ''}`)
  },

  requirePasswordChange: async (userId: number): Promise<ApiResponse<void>> => {
    return apiFetch<ApiResponse<void>>(`/admin/security/users/${userId}/require-password-change`, {
      method: 'POST'
    })
  },

  resetPassword: async (userId: number): Promise<ApiResponse<ResetPasswordResult>> => {
    return apiFetch<ApiResponse<ResetPasswordResult>>(`/admin/security/users/${userId}/reset-password`, {
      method: 'POST'
    })
  },

  toggleLock: async (userId: number): Promise<ApiResponse<void>> => {
    return apiFetch<ApiResponse<void>>(`/admin/security/users/${userId}/toggle-lock`, {
      method: 'POST'
    })
  },

  getSecurityAudit: async (): Promise<ApiResponse<SecurityAuditItem[]>> => {
    return apiFetch<ApiResponse<SecurityAuditItem[]>>('/admin/security/audit')
  }
}

