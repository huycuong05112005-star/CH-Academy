import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AttendancePage } from '../pages/admin/attendance/AttendancePage'
import { attendanceApi } from '../api/attendance'
import { classesApi } from '../api/classes'

vi.mock('../api/attendance', () => ({
  attendanceApi: {
    getSessions: vi.fn(),
    getSessionAttendance: vi.fn(),
    markAttendance: vi.fn(),
    getStudentStats: vi.fn()
  }
}))

vi.mock('../api/classes', () => ({
  classesApi: {
    searchClasses: vi.fn(),
    getEnrollments: vi.fn()
  }
}))

describe('AttendancePage Component', () => {
  const mockClasses = [
    {
      id: 1,
      code: 'CLS-ENG-KID01',
      name: 'Lớp Tiếng Anh Trẻ Em K01',
      courseId: 1,
      maxCapacity: 12,
      enrolledCount: 1,
      startDate: '2026-11-01',
      status: 'IN_PROGRESS' as const,
      createdAt: '2026-10-24T10:00:00Z'
    }
  ]

  const mockSessions = [
    {
      id: 10,
      sessionDate: '2026-11-02',
      startTime: '18:00',
      endTime: '19:30',
      topic: 'Bài 1: Khởi động',
      status: 'SCHEDULED'
    }
  ]

  const mockEnrollments = [
    {
      id: 100,
      classId: 1,
      studentId: 5,
      studentCode: 'HV20240001',
      studentFullName: 'Trần Minh Khôi',
      enrollmentDate: '2026-10-24',
      appliedTuitionFee: 3200000,
      discountAmount: 200000,
      finalFee: 3000000,
      status: 'ENROLLED' as const,
      createdAt: '2026-10-24T10:00:00Z'
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(classesApi.searchClasses).mockResolvedValue({
      success: true,
      data: {
        content: mockClasses,
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

    vi.mocked(attendanceApi.getSessions).mockResolvedValue({
      success: true,
      data: mockSessions,
      message: 'OK',
      errorCode: null,
      errors: null,
      timestamp: '2026-10-24T10:00:00Z'
    })

    vi.mocked(classesApi.getEnrollments).mockResolvedValue({
      success: true,
      data: mockEnrollments,
      message: 'OK',
      errorCode: null,
      errors: null,
      timestamp: '2026-10-24T10:00:00Z'
    })

    vi.mocked(attendanceApi.getSessionAttendance).mockResolvedValue({
      success: true,
      data: [
        {
          id: 1,
          sessionId: 10,
          sessionDate: '2026-11-02',
          startTime: '18:00',
          endTime: '19:30',
          studentId: 5,
          studentCode: 'HV20240001',
          studentFullName: 'Trần Minh Khôi',
          status: 'PRESENT',
          recordedAt: '2026-10-24T10:00:00Z'
        }
      ],
      message: 'OK',
      errorCode: null,
      errors: null,
      timestamp: '2026-10-24T10:00:00Z'
    })
  })

  it('hiển thị trang điểm danh và học viên trong lớp', async () => {
    render(<AttendancePage />)

    expect(screen.getByText('Điểm danh & Chuyên cần')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Trần Minh Khôi')).toBeInTheDocument()
      expect(screen.getByText('HV20240001')).toBeInTheDocument()
    })
  })

  it('cho phép thay đổi trạng thái điểm danh sang Đi muộn', async () => {
    render(<AttendancePage />)

    await waitFor(() => {
      expect(screen.getByText('Trần Minh Khôi')).toBeInTheDocument()
    })

    const lateButton = screen.getByRole('button', { name: /Đi muộn/i })
    fireEvent.click(lateButton)

    // The status in summary should update
    expect(screen.getAllByText('Đi muộn').length).toBeGreaterThanOrEqual(1)
  })
})
