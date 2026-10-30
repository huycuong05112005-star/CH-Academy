import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { FinancePage } from '../pages/admin/finance/FinancePage'
import { financeApi } from '../api/finance'
import { studentsApi } from '../api/students'

vi.mock('../api/finance', () => ({
  financeApi: {
    getOverview: vi.fn(),
    searchReceivables: vi.fn(),
    searchPayments: vi.fn(),
    createReceivable: vi.fn(),
    recordPayment: vi.fn(),
    processRefund: vi.fn()
  }
}))

vi.mock('../api/students', () => ({
  studentsApi: {
    searchStudents: vi.fn()
  }
}))

describe('FinancePage Component', () => {
  const mockOverview = {
    totalReceivables: 50000000,
    totalPaid: 35000000,
    totalDebt: 15000000,
    totalRefunds: 1000000,
    totalReceivableCount: 10,
    totalPaymentCount: 8
  }

  const mockReceivables = [
    {
      id: 1,
      code: 'REC20240001',
      studentId: 5,
      studentCode: 'HV20240001',
      studentFullName: 'Trần Minh Khôi',
      title: 'Học phí Tiếng Anh Giao Tiếp Q3',
      totalAmount: 5000000,
      paidAmount: 2000000,
      remainingAmount: 3000000,
      status: 'PARTIALLY_PAID' as const,
      dueDate: '2026-11-15',
      createdAt: '2026-10-24T10:00:00Z'
    }
  ]

  const mockPayments = [
    {
      id: 1,
      paymentCode: 'PAY20240001',
      studentId: 5,
      studentCode: 'HV20240001',
      studentFullName: 'Trần Minh Khôi',
      amount: 2000000,
      paymentMethod: 'BANK_TRANSFER' as const,
      paymentDate: '2026-10-24',
      referenceNumber: 'VNPAY998877',
      createdByName: 'Kế toán viên',
      createdAt: '2026-10-24T10:00:00Z',
      allocations: []
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(financeApi.getOverview).mockResolvedValue({
      success: true,
      data: mockOverview,
      message: 'OK',
      timestamp: '2026-10-24T10:00:00Z'
    })
    vi.mocked(financeApi.searchReceivables).mockResolvedValue({
      success: true,
      data: {
        content: mockReceivables,
        page: 0,
        number: 0,
        first: true,
        empty: false,
        size: 10,
        totalElements: 1,
        totalPages: 1,
        last: true
      },
      message: 'OK',
      timestamp: '2026-10-24T10:00:00Z'
    })
    vi.mocked(financeApi.searchPayments).mockResolvedValue({
      success: true,
      data: {
        content: mockPayments,
        page: 0,
        number: 0,
        first: true,
        empty: false,
        size: 10,
        totalElements: 1,
        totalPages: 1,
        last: true
      },
      message: 'OK',
      timestamp: '2026-10-24T10:00:00Z'
    })
    vi.mocked(studentsApi.searchStudents).mockResolvedValue({
      success: true,
      data: {
        content: [
          {
            id: 5,
            studentCode: 'HV20240001',
            fullName: 'Trần Minh Khôi',
            gender: 'MALE',
            status: 'ACTIVE',
            targetType: 'KID',
            createdAt: '2026-10-24T10:00:00Z',
            updatedAt: '2026-10-24T10:00:00Z'
          }
        ],
        page: 0,
        number: 0,
        first: true,
        empty: false,
        size: 100,
        totalElements: 1,
        totalPages: 1,
        last: true
      },
      message: 'OK',
      timestamp: '2026-10-24T10:00:00Z'
    })
  })

  it('renders overview metrics and receivables table correctly', async () => {
    render(
      <MemoryRouter>
        <FinancePage />
      </MemoryRouter>
    )

    expect(screen.getByText(/Học phí & Quản lý Tài chính/i)).toBeInTheDocument()
    expect(screen.getByText(/Khoản phải thu & Công nợ/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('REC20240001')).toBeInTheDocument()
      expect(screen.getByText('Trần Minh Khôi')).toBeInTheDocument()
      expect(screen.getAllByText('Nộp một phần').length).toBeGreaterThanOrEqual(1)
    })
  })

  it('switches to payment history tab and shows payments', async () => {
    render(
      <MemoryRouter>
        <FinancePage />
      </MemoryRouter>
    )

    const paymentTab = screen.getByRole('button', { name: /Lịch sử thanh toán/i })
    fireEvent.click(paymentTab)

    await waitFor(() => {
      expect(screen.getByText('PAY20240001')).toBeInTheDocument()
      expect(screen.getByText('VNPAY998877')).toBeInTheDocument()
    })
  })

  it('opens and closes payment modal', async () => {
    render(
      <MemoryRouter>
        <FinancePage />
      </MemoryRouter>
    )

    const payBtn = screen.getByRole('button', { name: /Ghi nhận thanh toán/i })
    fireEvent.click(payBtn)

    expect(screen.getByText(/Ghi nhận thanh toán học phí/i)).toBeInTheDocument()

    const cancelBtn = screen.getByRole('button', { name: /Hủy/i })
    fireEvent.click(cancelBtn)

    await waitFor(() => {
      expect(screen.queryByText(/Ghi nhận thanh toán học phí/i)).not.toBeInTheDocument()
    })
  })
})
