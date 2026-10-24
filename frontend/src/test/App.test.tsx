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

  it('hiển thị trạng thái UP khi backend trả lời thành công', async () => {
    const mockResponse = {
      status: 'UP',
      service: 'CH Academy Backend',
      version: '0.0.1-SNAPSHOT',
      timestamp: new Date().toISOString(),
      message: 'Hệ thống đang hoạt động bình thường',
    }
    vi.mocked(healthApi.check).mockResolvedValue(mockResponse)

    render(<App />)

    // Chờ status element hiển thị nội dung "UP"
    const statusEl = screen.getByRole('status')
    await waitFor(() => {
      expect(statusEl.textContent).toContain('Hoạt động bình thường')
    })
  })

  it('hiển thị thông báo lỗi khi backend không kết nối được', async () => {
    vi.mocked(healthApi.check).mockRejectedValue(
      new Error('API Error 503: Service Unavailable')
    )

    render(<App />)

    // Alert phải xuất hiện khi có lỗi
    const alert = await screen.findByRole('alert')
    expect(alert).not.toBeNull()
    expect(alert.textContent).toContain('API Error 503')
  })

  it('gọi lại health API khi click nút "Kiểm tra lại"', async () => {
    const user = userEvent.setup()
    vi.mocked(healthApi.check).mockRejectedValue(new Error('Connection failed'))

    render(<App />)

    // Chờ lỗi xuất hiện từ lần gọi đầu
    await screen.findByRole('alert')

    // Verify API đã được gọi 1 lần
    expect(healthApi.check).toHaveBeenCalledTimes(1)

    // Click nút kiểm tra lại
    const btn = screen.getByRole('button', { name: /kiểm tra/i })
    await user.click(btn)

    // Verify API được gọi lần 2
    expect(healthApi.check).toHaveBeenCalledTimes(2)
  })
})
