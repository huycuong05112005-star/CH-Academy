import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import { LoginPage } from '../pages/auth/LoginPage'
import { authApi } from '../api/auth'

// Mock authApi
vi.mock('../api/auth', () => ({
  authApi: {
    login: vi.fn(),
    getMe: vi.fn(),
    logout: vi.fn(),
  },
}))

// Mock client
vi.mock('../api/client', () => ({
  getAuthToken: vi.fn(() => null),
  setAuthToken: vi.fn(),
  API_BASE_URL: 'http://localhost:8088/api/v1',
}))

describe('LoginPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('hiển thị đầy đủ form đăng nhập và nhận diện thương hiệu', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </BrowserRouter>
    )

    expect(screen.getByRole('heading', { name: /CH Academy/i })).not.toBeNull()
    expect(screen.getByLabelText(/Tên đăng nhập/i)).not.toBeNull()
    expect(screen.getByPlaceholderText(/Nhập mật khẩu/i)).not.toBeNull()
    expect(screen.getByRole('button', { name: /Đăng nhập/i })).not.toBeNull()
  })

  it('hiển thị lỗi khi bấm đăng nhập với form trống', async () => {
    const user = userEvent.setup()

    render(
      <BrowserRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </BrowserRouter>
    )

    const submitBtn = screen.getByRole('button', { name: /Đăng nhập/i })
    await user.click(submitBtn)

    const alert = await screen.findByRole('alert')
    expect(alert).not.toBeNull()
    expect(alert.textContent).toContain('Vui lòng điền đầy đủ')
  })

  it('gọi authApi.login khi nhập thông tin hợp lệ', async () => {
    const user = userEvent.setup()
    const mockUser = {
      id: 1,
      username: 'admin',
      fullName: 'Quản trị viên',
      email: 'admin@chacademy.vn',
      phone: '0901234567',
      status: 'ACTIVE' as const,
      roles: ['SUPER_ADMIN'],
      permissions: ['course:read'],
    }

    vi.mocked(authApi.login).mockResolvedValue({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        accessToken: 'mock_jwt_token',
        tokenType: 'Bearer',
        user: mockUser,
      },
    })

    render(
      <BrowserRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </BrowserRouter>
    )

    const usernameInput = screen.getByLabelText(/Tên đăng nhập/i)
    const passwordInput = screen.getByPlaceholderText(/Nhập mật khẩu/i)
    const submitBtn = screen.getByRole('button', { name: /Đăng nhập/i })

    await user.type(usernameInput, 'admin')
    await user.type(passwordInput, 'Admin@123456')
    await user.click(submitBtn)

    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalledWith({
        username: 'admin',
        password: 'Admin@123456',
      })
    })
  })
})
