import { apiClient, type ApiResponse } from './client'
import type { PageResponse } from '../types/course'
import type {
  Receivable,
  Payment,
  Refund,
  FinanceOverview,
  CreateReceivableRequest,
  RecordPaymentRequest,
  ProcessRefundRequest,
} from '../types/finance'

export const financeApi = {
  getOverview: async (): Promise<ApiResponse<FinanceOverview>> => {
    return apiClient.get<FinanceOverview>('/finance/overview')
  },

  searchReceivables: async (params?: {
    keyword?: string;
    status?: string;
    studentId?: number;
    page?: number;
    size?: number;
  }): Promise<ApiResponse<PageResponse<Receivable>>> => {
    const query = new URLSearchParams()
    if (params?.keyword) query.append('keyword', params.keyword)
    if (params?.status) query.append('status', params.status)
    if (params?.studentId) query.append('studentId', params.studentId.toString())
    if (params?.page !== undefined) query.append('page', params.page.toString())
    if (params?.size !== undefined) query.append('size', params.size.toString())

    return apiClient.get<PageResponse<Receivable>>(`/finance/receivables?${query.toString()}`)
  },

  getReceivableById: async (id: number): Promise<ApiResponse<Receivable>> => {
    return apiClient.get<Receivable>(`/finance/receivables/${id}`)
  },

  createReceivable: async (data: CreateReceivableRequest): Promise<ApiResponse<Receivable>> => {
    return apiClient.post<Receivable>('/finance/receivables', data)
  },

  searchPayments: async (params?: {
    keyword?: string;
    method?: string;
    studentId?: number;
    page?: number;
    size?: number;
  }): Promise<ApiResponse<PageResponse<Payment>>> => {
    const query = new URLSearchParams()
    if (params?.keyword) query.append('keyword', params.keyword)
    if (params?.method) query.append('method', params.method)
    if (params?.studentId) query.append('studentId', params.studentId.toString())
    if (params?.page !== undefined) query.append('page', params.page.toString())
    if (params?.size !== undefined) query.append('size', params.size.toString())

    return apiClient.get<PageResponse<Payment>>(`/finance/payments?${query.toString()}`)
  },

  getPaymentById: async (id: number): Promise<ApiResponse<Payment>> => {
    return apiClient.get<Payment>(`/finance/payments/${id}`)
  },

  recordPayment: async (data: RecordPaymentRequest): Promise<ApiResponse<Payment>> => {
    return apiClient.post<Payment>('/finance/payments', data)
  },

  processRefund: async (data: ProcessRefundRequest): Promise<ApiResponse<Refund>> => {
    return apiClient.post<Refund>('/finance/refunds', data)
  },
}
