import React, { createContext, useContext, useEffect, useState } from 'react'
import type { AuthContextType, LoginPayload, User } from '../types/auth'
import { authApi } from '../api/auth'
import { getAuthToken, setAuthToken } from '../api/client'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setTokenState] = useState<string | null>(getAuthToken())
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    let isCurrent = true

    const initAuth = async () => {
      const storedToken = getAuthToken()
      if (storedToken) {
        try {
          const res = await authApi.getMe()
          if (!isCurrent) return

          // Bảo vệ chống race condition: chỉ cập nhật nếu token trong storage chưa bị ghi đè bởi phiên đăng nhập mới
          if (getAuthToken() === storedToken) {
            if (res.success && res.data) {
              setUser(res.data)
              setTokenState(storedToken)
            } else {
              setAuthToken(null)
              setTokenState(null)
              setUser(null)
            }
          }
        } catch {
          if (!isCurrent) return
          if (getAuthToken() === storedToken) {
            setAuthToken(null)
            setTokenState(null)
            setUser(null)
          }
        }
      }
      if (isCurrent) {
        setIsLoading(false)
      }
    }

    initAuth()

    const handleUnauthorized = () => {
      setAuthToken(null)
      setTokenState(null)
      setUser(null)
    }
    window.addEventListener('ch_academy_auth_unauthorized', handleUnauthorized)

    // Đồng bộ trạng thái xác thực giữa các Tab trình duyệt (chống xung đột token Đăng nhập chéo)
    const handleStorageChange = async (event: StorageEvent) => {
      if (event.key === 'ch_academy_token') {
        const newToken = event.newValue
        if (!newToken) {
          setTokenState(null)
          setUser(null)
        } else if (newToken !== token) {
          try {
            const res = await authApi.getMe()
            if (res.success && res.data) {
              setTokenState(newToken)
              setUser(res.data)
            } else {
              setAuthToken(null)
              setTokenState(null)
              setUser(null)
            }
          } catch {
            setAuthToken(null)
            setTokenState(null)
            setUser(null)
          }
        }
      }
    }
    window.addEventListener('storage', handleStorageChange)

    return () => {
      isCurrent = false
      window.removeEventListener('ch_academy_auth_unauthorized', handleUnauthorized)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  const login = async (payload: LoginPayload): Promise<User> => {
    setIsLoading(true)
    try {
      const res = await authApi.login(payload)
      if (res.success && res.data) {
        setTokenState(res.data.accessToken)
        setUser(res.data.user)
        return res.data.user
      } else {
        throw new Error(res.message || 'Đăng nhập không thành công')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    authApi.logout()
    setAuthToken(null)
    setTokenState(null)
    setUser(null)
  }

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser)
  }

  const refreshUser = async () => {
    try {
      const res = await authApi.getMe()
      if (res.success && res.data) {
        setUser(res.data)
      }
    } catch {
      // Ignore background refresh failure
    }
  }

  const hasRole = (role: string): boolean => {
    if (!user || !user.roles) return false
    return user.roles.includes(role)
  }

  const hasAnyRole = (roles: string[]): boolean => {
    if (!user || !user.roles) return false
    return roles.some((r) => user.roles.includes(r))
  }

  const hasPermission = (permission: string): boolean => {
    if (!user || !user.permissions) return false
    if (user.roles?.includes('SUPER_ADMIN')) return true
    return user.permissions.includes(permission)
  }

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    logout,
    updateUser,
    refreshUser,
    hasRole,
    hasAnyRole,
    hasPermission,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
