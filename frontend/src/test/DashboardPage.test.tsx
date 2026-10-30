import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { DashboardPage } from '../pages/admin/DashboardPage'
import { dashboardApi } from '../api/dashboard'
import { healthApi } from '../api/client'

vi.mock('../api/dashboard', () => ({
  dashboardApi: {
    getStats: vi.fn(),
  },
}))

vi.mock('../api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
  healthApi: {
    check: vi.fn(),
  },
}))

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { fullName: 'Nguyễn Quản Trị', role: 'SUPER_ADMIN' },
    isAuthenticated: true,
  }),
}))

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(healthApi.check).mockResolvedValue({
      status: 'UP',
      service: 'CH Academy Backend',
      version: '0.0.1-SNAPSHOT',
      timestamp: '2026-10-24T20:00:00Z',
    })
  })

  it('renders greeting and stat cards with fetched data', async () => {
    vi.mocked(dashboardApi.getStats).mockResolvedValue({
      totalStudents: 42,
      activeStudents: 38,
      totalCourses: 12,
      activeClasses: 5,
      totalLeads: 20,
      convertedLeads: 5,
      leadConversionRate: 25.0,
      totalReceivable: 50000000,
      totalPaid: 35000000,
      totalDebt: 15000000,
      upcomingSessions: [
        {
          id: 1,
          classId: 10,
          className: 'Lập trình Web Cơ bản',
          classCode: 'WEB-01',
          teacherName: 'Thầy Hoàng',
          sessionDate: '2026-10-25',
          startTime: '08:00:00',
          endTime: '10:00:00',
          room: 'Phòng 201',
          status: 'SCHEDULED',
        },
      ],
    })

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    )

    expect(screen.getByText(/Xin chào, Nguyễn Quản Trị!/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('38')).toBeInTheDocument()
      expect(screen.getByText('12')).toBeInTheDocument()
      expect(screen.getByText(/25% chuyển đổi/i)).toBeInTheDocument()
      expect(screen.getByText('Lập trình Web Cơ bản')).toBeInTheDocument()
      expect(screen.getByText('Thầy Hoàng')).toBeInTheDocument()
    })
  })

  it('renders empty upcoming sessions placeholder when no sessions available', async () => {
    vi.mocked(dashboardApi.getStats).mockResolvedValue({
      totalStudents: 0,
      activeStudents: 0,
      totalCourses: 0,
      activeClasses: 0,
      totalLeads: 0,
      convertedLeads: 0,
      leadConversionRate: 0,
      totalReceivable: 0,
      totalPaid: 0,
      totalDebt: 0,
      upcomingSessions: [],
    })

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/Không có buổi học nào trong năm học/i)).toBeInTheDocument()
    })
  })
})
