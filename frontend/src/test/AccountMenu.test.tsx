import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { AccountMenu } from '../components/account/AccountMenu'
import { ThemeProvider } from '../context/ThemeContext'
import { ExperienceProvider } from '../context/ExperienceContext'
import { SettingsProvider } from '../context/SettingsContext'
import { authApi } from '../api/auth'
import { filesApi } from '../api/files'
import type { User } from '../types/auth'

// Mock navigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/admin' }),
  }
})

// Mock authApi & filesApi
vi.mock('../api/auth', () => ({
  authApi: {
    updateProfile: vi.fn(),
    changePassword: vi.fn(),
    logout: vi.fn(),
    getMe: vi.fn(),
  },
}))

vi.mock('../api/files', () => ({
  filesApi: {
    uploadFile: vi.fn(),
  },
}))

// Mock useAuth
const mockLogout = vi.fn()
const mockUpdateUser = vi.fn()
let mockCurrentUser: User = {
  id: 1,
  username: 'admin',
  fullName: 'Nguyễn Quản Trị',
  email: 'admin@chacademy.edu.vn',
  phone: '0912345678',
  status: 'ACTIVE',
  avatarUrl: '',
  roles: ['SUPER_ADMIN', 'ADMIN'],
  permissions: ['ADMIN_FULL'],
  lastLoginAt: '2026-10-30T10:00:00Z',
  lastPasswordChangedAt: '2026-09-01T10:00:00Z',
}

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockCurrentUser,
    logout: mockLogout,
    updateUser: mockUpdateUser,
    isAuthenticated: true,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <ThemeProvider>
        <ExperienceProvider>
          <SettingsProvider>
            {ui}
          </SettingsProvider>
        </ExperienceProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

describe('AccountMenu & Profile Components', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCurrentUser = {
      id: 1,
      username: 'admin',
      fullName: 'Nguyễn Quản Trị',
      email: 'admin@chacademy.edu.vn',
      phone: '0912345678',
      status: 'ACTIVE',
      avatarUrl: '',
      roles: ['SUPER_ADMIN', 'ADMIN'],
      permissions: ['ADMIN_FULL'],
      lastLoginAt: '2026-10-30T10:00:00Z',
      lastPasswordChangedAt: '2026-09-01T10:00:00Z',
    }
  })

  it('1. Hiển thị đúng avatar chữ cái đầu, tên người dùng và vai trò trên trigger button', () => {
    renderWithProviders(<AccountMenu portalRole="admin" userCode="AD-01" />)

    const triggerBtn = screen.getByRole('button', { name: /Mở menu tài khoản/i })
    expect(triggerBtn).toBeInTheDocument()
    expect(screen.getByText('Nguyễn Quản Trị')).toBeInTheDocument()
    expect(screen.getByText('Quản trị viên')).toBeInTheDocument()
    expect(screen.getByText('AD-01')).toBeInTheDocument()
    expect(screen.getByText('N')).toBeInTheDocument() // Initials avatar
  })

  it('2. Mở dropdown menu khi click vào avatar trigger button', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AccountMenu portalRole="admin" userCode="AD-01" />)

    const triggerBtn = screen.getByRole('button', { name: /Mở menu tài khoản/i })
    await user.click(triggerBtn)

    // Check dropdown content
    expect(screen.getByText('Thông tin tài khoản')).toBeInTheDocument()
    expect(screen.getByText('Đổi mật khẩu')).toBeInTheDocument()
    expect(screen.getByText('Giao diện (Theme)')).toBeInTheDocument()
    expect(screen.getByText('Cài đặt thông báo')).toBeInTheDocument()
    expect(screen.getByText('Bảo mật tài khoản')).toBeInTheDocument()
    expect(screen.getByText('Trợ giúp & Liên hệ')).toBeInTheDocument()
    expect(screen.getByText('Đăng xuất khỏi hệ thống')).toBeInTheDocument()
  })

  it('3. Đóng dropdown menu khi bấm Escape hoặc click ra ngoài', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <div>
        <div data-testid="outside-element">Bên ngoài</div>
        <AccountMenu portalRole="admin" />
      </div>
    )

    const triggerBtn = screen.getByRole('button', { name: /Mở menu tài khoản/i })
    await user.click(triggerBtn)
    expect(screen.getByText('Thông tin tài khoản')).toBeInTheDocument()

    // Press Escape
    fireEvent.keyDown(window, { key: 'Escape' })
    await waitFor(() => {
      expect(screen.queryByText('Thông tin tài khoản')).not.toBeInTheDocument()
    })

    // Re-open and click outside
    await user.click(triggerBtn)
    expect(screen.getByText('Thông tin tài khoản')).toBeInTheDocument()

    fireEvent.mouseDown(screen.getByTestId('outside-element'))
    await waitFor(() => {
      expect(screen.queryByText('Thông tin tài khoản')).not.toBeInTheDocument()
    })
  })

  it('4. Mở modal Thông tin tài khoản và cập nhật họ tên, số điện thoại thành công', async () => {
    const user = userEvent.setup()
    vi.mocked(authApi.updateProfile).mockResolvedValue({
      success: true,
      message: 'Thành công',
      data: {
        ...mockCurrentUser,
        fullName: 'Nguyễn Quản Trị Cấp Cao',
        phone: '0987654321',
      },
    })

    renderWithProviders(<AccountMenu portalRole="admin" />)

    // Open dropdown
    await user.click(screen.getByRole('button', { name: /Mở menu tài khoản/i }))

    // Click "Thông tin tài khoản"
    await user.click(screen.getByText('Thông tin tài khoản'))

    // Profile modal should appear
    expect(screen.getByRole('heading', { name: /Hồ sơ tài khoản cá nhân/i })).toBeInTheDocument()

    const nameInput = screen.getByPlaceholderText('Nhập họ và tên đầy đủ')
    expect(nameInput).toHaveValue('Nguyễn Quản Trị')

    // Change name and phone
    await user.clear(nameInput)
    await user.type(nameInput, 'Nguyễn Quản Trị Cấp Cao')

    const phoneInput = screen.getByPlaceholderText('09xx xxx xxx')
    await user.clear(phoneInput)
    await user.type(phoneInput, '0987654321')

    // Submit form
    const saveBtn = screen.getByRole('button', { name: /Lưu thay đổi/i })
    await user.click(saveBtn)

    await waitFor(() => {
      expect(authApi.updateProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: 'Nguyễn Quản Trị Cấp Cao',
          phone: '0987654321',
        })
      )
      expect(mockUpdateUser).toHaveBeenCalled()
      expect(screen.getByText(/Đã lưu thông tin tài khoản thành công/i)).toBeInTheDocument()
    })
  })

  it('5. Mở modal Đổi mật khẩu, kiểm tra checklist và gọi authApi.changePassword', async () => {
    const user = userEvent.setup()
    vi.mocked(authApi.changePassword).mockResolvedValue({
      success: true,
      message: 'Đổi mật khẩu thành công',
      data: undefined as any,
    })

    renderWithProviders(<AccountMenu portalRole="admin" />)

    // Open dropdown
    await user.click(screen.getByRole('button', { name: /Mở menu tài khoản/i }))

    // Click "Đổi mật khẩu"
    await user.click(screen.getByText('Đổi mật khẩu'))

    // Modal appears
    expect(screen.getByRole('heading', { name: /Đổi mật khẩu tài khoản/i })).toBeInTheDocument()

    const curPwdInput = screen.getByPlaceholderText(/Nhập mật khẩu đang dùng/i)
    const newPwdInput = screen.getByPlaceholderText(/Tối thiểu 8 ký tự/i)
    const confirmPwdInput = screen.getByPlaceholderText(/Nhập lại mật khẩu mới vừa đặt/i)
    const submitBtn = screen.getByRole('button', { name: /Cập nhật mật khẩu/i })

    // Button should be disabled initially
    expect(submitBtn).toBeDisabled()

    // Type invalid short password
    await user.type(curPwdInput, 'oldPassword123')
    await user.type(newPwdInput, 'short')
    await user.type(confirmPwdInput, 'short')
    expect(submitBtn).toBeDisabled()

    // Type valid complex password meeting all criteria
    await user.clear(newPwdInput)
    await user.type(newPwdInput, 'AdminSecure@2026')
    await user.clear(confirmPwdInput)
    await user.type(confirmPwdInput, 'AdminSecure@2026')

    await waitFor(() => {
      expect(submitBtn).not.toBeDisabled()
    })

    await user.click(submitBtn)

    await waitFor(() => {
      expect(authApi.changePassword).toHaveBeenCalledWith('oldPassword123', 'AdminSecure@2026')
      expect(screen.getByText(/Đổi mật khẩu thành công/i)).toBeInTheDocument()
    })
  })

  it('6. Mở modal Cài đặt và chuyển đổi qua lại giữa các tab (Giao diện, Thông báo, Bảo mật, Trợ giúp)', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AccountMenu portalRole="admin" />)

    // Open dropdown
    await user.click(screen.getByRole('button', { name: /Mở menu tài khoản/i }))

    // Click "Cài đặt thông báo"
    await user.click(screen.getByText('Cài đặt thông báo'))

    expect(screen.getByRole('heading', { name: /Cài đặt & Trải nghiệm hệ thống/i })).toBeInTheDocument()
    expect(screen.getByText('Tùy chọn nhận thông báo cá nhân')).toBeInTheDocument()

    // Switch to Appearance tab
    await user.click(screen.getByRole('button', { name: /Giao diện & Trải nghiệm/i }))
    expect(screen.getByText('Phong cách giao diện (Theme)')).toBeInTheDocument()
    expect(screen.getByText('Giao diện Sáng')).toBeInTheDocument()
    expect(screen.getByText('Giao diện Tối')).toBeInTheDocument()
    expect(screen.getByText('Kính trong suốt')).toBeInTheDocument()

    // Switch to Security tab
    await user.click(screen.getByRole('button', { name: /Bảo mật/i }))
    expect(screen.getByText('Thông tin phiên & Trạng thái tài khoản')).toBeInTheDocument()
    expect(screen.getByText('HOẠT ĐỘNG (ACTIVE)')).toBeInTheDocument()

    // Switch to Help tab
    await user.click(screen.getByRole('button', { name: /Trợ giúp & Hỗ trợ/i }))
    expect(screen.getByText('Đường dây nóng Hỗ trợ')).toBeInTheDocument()
    expect(screen.getByText('Hộp thư điện tử Học vụ')).toBeInTheDocument()
  })

  it('7. Phân quyền vai trò: Admin thấy liên kết Cấu hình & Audit Logs; Giảng viên & Học viên không thấy', async () => {
    const user = userEvent.setup()

    // 1. Admin Portal
    const { unmount: unmountAdmin } = renderWithProviders(<AccountMenu portalRole="admin" />)
    await user.click(screen.getByRole('button', { name: /Mở menu tài khoản/i }))
    expect(screen.getByText('Cấu hình trung tâm')).toBeInTheDocument()
    expect(screen.getByText('Nhật ký hệ thống & Bảo mật')).toBeInTheDocument()
    unmountAdmin()

    // 2. Teacher Portal
    const { unmount: unmountTeacher } = renderWithProviders(
      <AccountMenu
        portalRole="teacher"
        userCode="GV2026-001"
        extraProfile={{ specialization: 'Tiếng Anh', bio: 'Kinh nghiệm 5 năm' }}
      />
    )
    await user.click(screen.getByRole('button', { name: /Mở menu tài khoản/i }))
    expect(screen.getAllByText('Giảng viên').length).toBeGreaterThanOrEqual(1)
    expect(screen.queryByText('Cấu hình trung tâm')).not.toBeInTheDocument()
    expect(screen.queryByText('Nhật ký hệ thống & Bảo mật')).not.toBeInTheDocument()
    unmountTeacher()

    // 3. Student Portal
    renderWithProviders(
      <AccountMenu
        portalRole="student"
        userCode="HV2026-001"
        extraProfile={{ targetType: 'KID' }}
      />
    )
    await user.click(screen.getByRole('button', { name: /Mở menu tài khoản/i }))
    expect(screen.getAllByText('Học viên').length).toBeGreaterThanOrEqual(1)
    expect(screen.queryByText('Cấu hình trung tâm')).not.toBeInTheDocument()
    expect(screen.queryByText('Nhật ký hệ thống & Bảo mật')).not.toBeInTheDocument()
  })

  it('8. Xử lý Đăng xuất: gọi logout() và chuyển hướng về /login', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AccountMenu portalRole="admin" />)

    await user.click(screen.getByRole('button', { name: /Mở menu tài khoản/i }))

    const logoutBtn = screen.getByRole('button', { name: /Đăng xuất khỏi hệ thống/i })
    await user.click(logoutBtn)

    expect(mockLogout).toHaveBeenCalled()
    expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true })
  })
})
