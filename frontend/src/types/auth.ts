export interface User {
  id: number
  username: string
  fullName: string
  email: string
  phone: string
  status: 'ACTIVE' | 'INACTIVE' | 'LOCKED'
  avatarUrl?: string
  lastLoginAt?: string
  roles: string[]
  permissions: string[]
}

export interface LoginPayload {
  username: string
  password: string
}

export interface LoginResponseData {
  accessToken: string
  tokenType: string
  user: User
}

export interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (payload: LoginPayload) => Promise<User>
  logout: () => void
  hasRole: (role: string) => boolean
  hasAnyRole: (roles: string[]) => boolean
  hasPermission: (permission: string) => boolean
}
