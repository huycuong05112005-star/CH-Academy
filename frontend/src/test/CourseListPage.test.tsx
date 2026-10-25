import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CourseListPage } from '../pages/admin/courses/CourseListPage'
import { coursesApi } from '../api/courses'

vi.mock('../api/courses', () => ({
  coursesApi: {
    getCategories: vi.fn(),
    searchCourses: vi.fn(),
    createCourse: vi.fn(),
    updateCourse: vi.fn(),
    updateCourseStatus: vi.fn(),
    deleteCourse: vi.fn()
  }
}))

describe('CourseListPage Component', () => {
  const mockCategories = [
    { id: 1, code: 'ENG-KIDS', name: 'Tiếng Anh Thiếu Nhi', displayOrder: 1, isActive: true },
    { id: 2, code: 'ENG-COMM', name: 'Tiếng Anh Giao Tiếp', displayOrder: 2, isActive: true }
  ]

  const mockCourses = [
    {
      id: 1,
      categoryId: 1,
      categoryCode: 'ENG-KIDS',
      categoryName: 'Tiếng Anh Thiếu Nhi',
      code: 'ENG-KID-01',
      name: 'Tiếng Anh Khởi Động Cho Trẻ Em',
      description: 'Mô tả khóa học',
      targetAudience: 'KIDS' as const,
      level: 'BEGINNER' as const,
      durationHours: 36,
      defaultTuitionFee: 3500000,
      learningOutcomes: 'Đầu ra',
      maxStudents: 15,
      status: 'ACTIVE' as const,
      isPublic: true,
      createdAt: '2026-10-24T10:00:00Z',
      updatedAt: '2026-10-24T10:00:00Z'
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(coursesApi.getCategories).mockResolvedValue({
      success: true,
      data: mockCategories,
      message: 'OK',
      errorCode: null,
      errors: null,
      timestamp: '2026-10-24T10:00:00Z'
    })
    vi.mocked(coursesApi.searchCourses).mockResolvedValue({
      success: true,
      data: {
        content: mockCourses,
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

  it('hiển thị tiêu đề và danh sách khóa học thành công', async () => {
    render(<CourseListPage />)

    expect(screen.getByText('Quản lý Khóa học & Đào tạo')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('ENG-KID-01')).toBeInTheDocument()
      expect(screen.getByText('Tiếng Anh Khởi Động Cho Trẻ Em')).toBeInTheDocument()
      expect(screen.getAllByText('Đang mở').length).toBeGreaterThanOrEqual(1)
    })
  })

  it('mở modal thêm khóa học mới khi nhấn nút', async () => {
    render(<CourseListPage />)

    const addButton = screen.getByRole('button', { name: /Thêm khóa học mới/i })
    fireEvent.click(addButton)

    expect(screen.getByText('Thêm Khóa học Mới')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('VD: ENG-KID-01')).toBeInTheDocument()
  })

  it('lọc danh sách khi nhập từ khóa tìm kiếm', async () => {
    render(<CourseListPage />)

    const searchInput = screen.getByPlaceholderText(/Tìm theo mã hoặc tên/i)
    fireEvent.change(searchInput, { target: { value: 'ENG-KID' } })

    await waitFor(() => {
      expect(coursesApi.searchCourses).toHaveBeenCalledWith(
        expect.objectContaining({ keyword: 'ENG-KID' })
      )
    })
  })
})
