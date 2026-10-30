import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ClassListPage } from '../pages/admin/classes/ClassListPage'
import { classesApi } from '../api/classes'
import { coursesApi } from '../api/courses'
import { studentsApi } from '../api/students'

vi.mock('../api/classes', () => ({
  classesApi: {
    searchClasses: vi.fn(),
    getClassById: vi.fn(),
    createClass: vi.fn(),
    getActiveTeachers: vi.fn(),
    getEnrollments: vi.fn(),
    enrollStudent: vi.fn()
  }
}))

vi.mock('../api/courses', () => ({
  coursesApi: {
    searchCourses: vi.fn()
  }
}))

vi.mock('../api/students', () => ({
  studentsApi: {
    searchStudents: vi.fn()
  }
}))

describe('ClassListPage Component', () => {
  const mockClasses = [
    {
      id: 1,
      courseId: 1,
      courseCode: 'ENG-KID-01',
      courseName: 'Tiếng Anh Thiếu Nhi Starters',
      primaryTeacherId: 1,
      primaryTeacherName: 'Nguyễn Thị Minh Hạnh',
      code: 'CLS-ENG-KID01',
      name: 'Lớp Tiếng Anh Trẻ Em K01',
      maxCapacity: 12,
      enrolledCount: 1,
      room: 'Phòng 201',
      startDate: '2026-11-01',
      endDate: '2027-01-30',
      status: 'OPEN_FOR_ENROLLMENT' as const,
      createdAt: '2026-10-24T10:00:00Z',
      schedules: [
        {
          id: 1,
          classId: 1,
          dayOfWeek: 1,
          startTime: '18:00',
          endTime: '19:30',
          room: 'Phòng 201'
        }
      ]
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(coursesApi.searchCourses).mockResolvedValue({
      success: true,
      data: {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 100,
        number: 0,
        first: true,
        last: true,
        empty: true
      },
      message: 'OK',
      errorCode: null,
      errors: null,
      timestamp: '2026-10-24T10:00:00Z'
    })

    vi.mocked(classesApi.getActiveTeachers).mockResolvedValue({
      success: true,
      data: [
        {
          id: 1,
          teacherCode: 'GV2024001',
          fullName: 'Nguyễn Thị Minh Hạnh',
          status: 'ACTIVE',
          createdAt: '2026-10-24T10:00:00Z'
        }
      ],
      message: 'OK',
      errorCode: null,
      errors: null,
      timestamp: '2026-10-24T10:00:00Z'
    })

    vi.mocked(studentsApi.searchStudents).mockResolvedValue({
      success: true,
      data: {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 100,
        number: 0,
        first: true,
        last: true,
        empty: true
      },
      message: 'OK',
      errorCode: null,
      errors: null,
      timestamp: '2026-10-24T10:00:00Z'
    })

    vi.mocked(classesApi.searchClasses).mockResolvedValue({
      success: true,
      data: {
        content: mockClasses,
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

  it('hiển thị tiêu đề và bảng lớp học kèm lịch định kỳ', async () => {
    render(
      <MemoryRouter>
        <ClassListPage />
      </MemoryRouter>
    )

    expect(screen.getByText('Lớp học & Lịch học')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('CLS-ENG-KID01')).toBeInTheDocument()
      expect(screen.getByText('Lớp Tiếng Anh Trẻ Em K01')).toBeInTheDocument()
      expect(screen.getByText('Nguyễn Thị Minh Hạnh')).toBeInTheDocument()
    })
  })

  it('mở modal tạo lớp học mới khi click nút Tạo lớp học mới', async () => {
    render(
      <MemoryRouter>
        <ClassListPage />
      </MemoryRouter>
    )

    const addButton = screen.getByRole('button', { name: /Tạo lớp học mới/i })
    fireEvent.click(addButton)

    expect(screen.getByText('Tạo lớp học & Xếp lịch lặp lại')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('VD: CLS-ENG-01')).toBeInTheDocument()
  })

  it('tìm kiếm lớp học khi nhập từ khóa', async () => {
    render(
      <MemoryRouter>
        <ClassListPage />
      </MemoryRouter>
    )

    const searchInput = screen.getByPlaceholderText(/Tìm theo mã lớp, tên lớp, phòng/i)
    fireEvent.change(searchInput, { target: { value: 'CLS-ENG' } })

    const filterButton = screen.getByRole('button', { name: /^Lọc$/i })
    fireEvent.click(filterButton)

    await waitFor(() => {
      expect(classesApi.searchClasses).toHaveBeenCalledWith(
        expect.objectContaining({ keyword: 'CLS-ENG' })
      )
    })
  })
})
