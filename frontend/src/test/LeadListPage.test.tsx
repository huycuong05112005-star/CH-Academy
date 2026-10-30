import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LeadListPage } from '../pages/admin/leads/LeadListPage'
import { leadsApi } from '../api/leads'
import { coursesApi } from '../api/courses'

vi.mock('../api/leads', () => ({
  leadsApi: {
    searchLeads: vi.fn(),
    getLeadById: vi.fn(),
    createLead: vi.fn(),
    submitPublicLead: vi.fn(),
    updateLeadStatus: vi.fn(),
    addActivity: vi.fn(),
    convertLead: vi.fn()
  }
}))

vi.mock('../api/courses', () => ({
  coursesApi: {
    searchCourses: vi.fn()
  }
}))

describe('LeadListPage Component', () => {
  const mockLeads = [
    {
      id: 1,
      leadCode: 'LEAD20240001',
      fullName: 'Hoàng Minh Tuấn',
      phone: '0909112233',
      email: 'tuan.hoang@gmail.com',
      source: 'WEBSITE' as const,
      targetCourseId: 1,
      targetCourseName: 'Tiếng Anh Giao Tiếp Công Sở',
      assignedStaffId: 1,
      assignedStaffName: 'Admin Tuyển Sinh',
      status: 'NEW' as const,
      notes: 'Khách quan tâm khóa giao tiếp công sở buổi tối',
      createdAt: '2026-10-24T10:00:00Z',
      updatedAt: '2026-10-24T10:00:00Z',
      activities: []
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(coursesApi.searchCourses).mockResolvedValue({
      success: true,
      data: {
        content: [
          {
            id: 1,
            code: 'ENG-COMM-PRO',
            name: 'Tiếng Anh Giao Tiếp Công Sở',
            categoryId: 1,
            categoryCode: 'ENG',
            categoryName: 'Tiếng Anh',
            targetAudience: 'ADULTS',
            level: 'BEGINNER',
            durationHours: 48,
            defaultTuitionFee: 4500000,
            maxStudents: 20,
            status: 'ACTIVE',
            isPublic: true,
            createdAt: '2026-10-24T10:00:00Z',
            updatedAt: '2026-10-24T10:00:00Z'
          }
        ],
        totalElements: 1,
        totalPages: 1,
        size: 100,
        number: 0,
        first: true,
        last: true,
        empty: false
      },
      message: 'OK',
      errorCode: null,
      errors: null,
      timestamp: '2026-10-24T10:00:00Z'
    })

    vi.mocked(leadsApi.searchLeads).mockResolvedValue({
      success: true,
      data: {
        content: mockLeads,
        totalElements: 1,
        totalPages: 1,
        size: 10,
        number: 0,
        first: true,
        last: true,
        empty: false
      },
      message: 'OK',
      errorCode: null,
      errors: null,
      timestamp: '2026-10-24T10:00:00Z'
    })
  })

  it('hiển thị tiêu đề và danh sách khách hàng tiềm năng', async () => {
    render(
      <MemoryRouter>
        <LeadListPage />
      </MemoryRouter>
    )

    expect(screen.getByText('Tuyển sinh & Khách hàng tiềm năng')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('LEAD20240001')).toBeInTheDocument()
      expect(screen.getByText('Hoàng Minh Tuấn')).toBeInTheDocument()
      expect(screen.getByText('0909112233')).toBeInTheDocument()
    })
  })

  it('mở modal thêm khách hàng tiềm năng khi bấm nút', async () => {
    render(
      <MemoryRouter>
        <LeadListPage />
      </MemoryRouter>
    )

    const addButton = screen.getByRole('button', { name: /Thêm khách hàng tiềm năng/i })
    fireEvent.click(addButton)

    expect(screen.getByText('Thêm khách hàng tiềm năng', { selector: 'h2' })).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Ví dụ: Nguyễn Văn An/i)).toBeInTheDocument()
  })

  it('lọc danh sách khách hàng khi tìm kiếm từ khóa', async () => {
    render(
      <MemoryRouter>
        <LeadListPage />
      </MemoryRouter>
    )

    const searchInput = screen.getByPlaceholderText(/Tìm theo mã, tên, SĐT, email/i)
    fireEvent.change(searchInput, { target: { value: 'Minh Tuấn' } })

    const filterButton = screen.getByRole('button', { name: /^Lọc$/i })
    fireEvent.click(filterButton)

    await waitFor(() => {
      expect(leadsApi.searchLeads).toHaveBeenCalledWith(
        expect.objectContaining({ keyword: 'Minh Tuấn' })
      )
    })
  })
})
