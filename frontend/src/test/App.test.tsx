import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'

// ----- Mock API Client -----
vi.mock('../api/client', () => ({
  healthApi: {
    check: vi.fn(),
  },
  API_BASE_URL: 'http://localhost:8088/api/v1',
  getAuthToken: vi.fn(() => null),
  setAuthToken: vi.fn(),
}))

import { healthApi } from '../api/client'

// ----- Test Suite -----
describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('hiển thị navbar với logo CH Academy', () => {
    vi.mocked(healthApi.check).mockReturnValue(new Promise(() => {}))

    render(<App />)

    // Navbar phải tồn tại
    const nav = screen.getByRole('navigation', { name: /điều hướng chính/i })
    expect(nav).not.toBeNull()

    // Link logo trong navbar phải có aria-label chứa tên trung tâm
    const logoLink = screen.getByRole('link', { name: /CH Academy - Trang chủ/i })
    expect(logoLink).not.toBeNull()
  })

  it('hiển thị tiêu đề chính trong hero section', () => {
    vi.mocked(healthApi.check).mockReturnValue(new Promise(() => {}))

    render(<App />)

    // H1 phải tồn tại và chứa tên thương hiệu
    const heading = screen.getByRole('heading', { level: 1, name: /CH Academy/i })
    expect(heading).not.toBeNull()
  })

  it('hiển thị phần tính năng với các card', () => {
    vi.mocked(healthApi.check).mockReturnValue(new Promise(() => {}))

    render(<App />)

    // Các heading H3 của feature cards
    expect(screen.getByRole('heading', { name: 'Quản lý Khóa học' })).not.toBeNull()
    expect(screen.getByRole('heading', { name: 'Hồ sơ Học sinh' })).not.toBeNull()
    expect(screen.getByRole('heading', { name: 'Quản lý Học phí' })).not.toBeNull()
  })

  it('hiển thị form đăng ký tư vấn tuyển sinh', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: /Đăng ký Nhận Tư vấn & Lộ trình Học/i })).not.toBeNull()
    expect(screen.getByPlaceholderText(/Nguyễn Văn A/i)).not.toBeNull()
    expect(screen.getByPlaceholderText(/0987654321/i)).not.toBeNull()
    expect(screen.getByRole('button', { name: /Gửi đăng ký tư vấn ngay/i })).not.toBeNull()
  })

  it('hiển thị danh mục câu hỏi thường gặp FAQ', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: /Giải đáp Thắc mắc của Quý Phụ huynh & Học viên/i })).not.toBeNull()
    expect(screen.getByText(/CH Academy nhận đào tạo những đối tượng học viên nào\?/i)).not.toBeNull()
  })

  it('hiển thị footer với thông tin bản quyền và liên hệ', () => {
    render(<App />)

    expect(screen.getByText(/Nền tảng vận hành giáo dục chuyên nghiệp/i)).not.toBeNull()
    expect(screen.getByText(/contact@chacademy.edu.vn/i)).not.toBeNull()
  })
})
