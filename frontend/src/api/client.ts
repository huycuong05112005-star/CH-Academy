/**
 * API Client tập trung cho CH Academy.
 *
 * Tất cả các request đến backend phải đi qua file này.
 * KHÔNG bao giờ hard-code URL API trực tiếp trong component.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8088/api/v1'

const TOKEN_KEY = 'ch_academy_token'

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setAuthToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token)
    } else {
      localStorage.removeItem(TOKEN_KEY)
    }
  } catch {
    // Ignore storage errors in non-browser/restricted environments
  }
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  errorCode?: string
  errors?: Record<string, string>
  timestamp?: string
}

export interface HealthResponse {
  status: string
  service: string
  version: string
  timestamp: string
  message: string
}

/**
 * Wrapper cho fetch, tự động gắn token Authorization và xử lý lỗi cơ bản
 */
export async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  const token = getAuthToken()

  const isFormData = typeof FormData !== 'undefined' && options?.body instanceof FormData

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options?.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (!response.ok) {
    let errorMessage = `API Error ${response.status}: ${response.statusText}`
    try {
      const errJson = await response.json()
      if (errJson && errJson.message) {
        errorMessage = errJson.message
      }
    } catch {
      // Body không phải JSON, dùng status text
    }
    throw new Error(errorMessage)
  }

  return response.json() as Promise<T>
}

export const healthApi = {
  check: (): Promise<HealthResponse> => apiFetch<HealthResponse>('/health'),
}

export const apiClient = {
  get: <T>(endpoint: string) => apiFetch<ApiResponse<T>>(endpoint, { method: 'GET' }),
  post: <T>(endpoint: string, body?: unknown) =>
    apiFetch<ApiResponse<T>>(endpoint, {
      method: 'POST',
      body: (typeof FormData !== 'undefined' && body instanceof FormData) ? body : (body ? JSON.stringify(body) : undefined),
    }),
  put: <T>(endpoint: string, body?: unknown) =>
    apiFetch<ApiResponse<T>>(endpoint, {
      method: 'PUT',
      body: (typeof FormData !== 'undefined' && body instanceof FormData) ? body : (body ? JSON.stringify(body) : undefined),
    }),
  patch: <T>(endpoint: string, body?: unknown) =>
    apiFetch<ApiResponse<T>>(endpoint, {
      method: 'PATCH',
      body: (typeof FormData !== 'undefined' && body instanceof FormData) ? body : (body ? JSON.stringify(body) : undefined),
    }),
  delete: <T>(endpoint: string) => apiFetch<ApiResponse<T>>(endpoint, { method: 'DELETE' }),
}

export { API_BASE_URL }
