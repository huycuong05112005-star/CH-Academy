import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { StudentListPage } from '../pages/admin/students/StudentListPage'
import { studentsApi } from '../api/students'

vi.mock('../api/students', () => ({
  studentsApi: {
    getStats: vi.fn().mockResolvedValue({
      success: true,
      data: {
        totalStudents: 1,
        activeStudents: 1,
        enrolledStudents: 1,
        kidStudents: 1,
        adultStudents: 0
      }
    }),
    getAllGuardians: vi.fn(),
    searchStudents: vi.fn(),
    createStudent: vi.fn(),
    updateStudent: vi.fn(),
    updateStudentStatus: vi.fn(),
    deleteStudent: vi.fn()
  }
}))

describe('StudentListPage Component', () => {
  const mockGuardians = [
    { id: 1, guardianCode: 'PH2024001', fullName: 'Trần Văn Dũng', phone: '0912345678' }
  ]

  const mockStudents = [
    {
      id: 1,
      studentCode: 'HV20240001',
      fullName: 'Trần Minh Khôi',
      dateOfBirth: '2016-05-15',
      gender: 'MALE' as const,
      phone: '',
      email: '',
      address: '12 Nguyễn Trãi',
      targetType: 'KID' as const,
      status: 'ACTIVE' as const,
      createdAt: '2026-10-24T10:00:00Z',
      updatedAt: '2026-10-24T10:00:00Z',
      guardians: [
        {
          guardianId: 1,
          guardianCode: 'PH2024001',
          fullName: 'Trần Văn Dũng',
          phone: '0912345678',
          relationshipType: 'FATHER' as const,
          isPrimaryContact: true
        }
      ]
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(studentsApi.getAllGuardians).mockResolvedValue({
      success: true,
      data: mockGuardians,
      message: 'OK',
      errorCode: null,
      errors: null,
      timestamp: '2026-10-24T10:00:00Z'
    })
    vi.mocked(studentsApi.searchStudents).mockResolvedValue({
      success: true,
      data: {
        content: mockStudents,
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

  it('hiển thị tiêu đề và danh sách học viên cùng người giám hộ liên kết', async () => {
    render(<StudentListPage />)

    expect(screen.getByText('Quản lý Học viên & Người giám hộ')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('HV20240001')).toBeInTheDocument()
      expect(screen.getByText('Trần Minh Khôi')).toBeInTheDocument()
      expect(screen.getByText('Trần Văn Dũng')).toBeInTheDocument()
    })
  })

  it('mở modal thêm học viên mới khi nhấn nút', async () => {
    render(<StudentListPage />)

    const addButton = screen.getByRole('button', { name: /Thêm học viên mới/i })
    fireEvent.click(addButton)

    expect(screen.getByText('Thêm Hồ sơ Học viên Mới')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('VD: HV20240001')).toBeInTheDocument()
  })

  it('lọc danh sách học viên khi tìm kiếm theo từ khóa', async () => {
    render(<StudentListPage />)

    const searchInput = screen.getByPlaceholderText(/Tìm theo mã học viên/i)
    fireEvent.change(searchInput, { target: { value: 'HV2024' } })

    await waitFor(() => {
      expect(studentsApi.searchStudents).toHaveBeenCalledWith(
        expect.objectContaining({ keyword: 'HV2024' })
      )
    })
  })
})
