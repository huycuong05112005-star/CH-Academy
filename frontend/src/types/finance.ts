export interface Receivable {
  id: number;
  code: string;
  studentId: number;
  studentCode: string;
  studentFullName: string;
  enrollmentId?: number;
  className?: string;
  title: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: 'PENDING' | 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED';
  dueDate?: string;
  createdAt: string;
}

export interface PaymentAllocation {
  id: number;
  paymentId: number;
  receivableId: number;
  receivableCode: string;
  receivableTitle: string;
  allocatedAmount: number;
  createdAt: string;
}

export interface Payment {
  id: number;
  paymentCode: string;
  studentId: number;
  studentCode: string;
  studentFullName: string;
  amount: number;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'POS' | string;
  paymentDate: string;
  referenceNumber?: string;
  note?: string;
  createdByName?: string;
  createdAt: string;
  allocations?: PaymentAllocation[];
}

export interface Refund {
  id: number;
  refundCode: string;
  paymentId: number;
  paymentCode: string;
  amount: number;
  reason: string;
  approvedByName?: string;
  refundDate: string;
  createdAt: string;
}

export interface FinanceOverview {
  totalReceivables: number;
  totalPaid: number;
  totalDebt: number;
  totalRefunds: number;
  totalReceivableCount: number;
  totalPaymentCount: number;
}

export interface CreateReceivableRequest {
  studentId: number;
  enrollmentId?: number;
  title: string;
  totalAmount: number;
  dueDate?: string;
  note?: string;
}

export interface RecordPaymentRequest {
  studentId: number;
  receivableId?: number;
  amount: number;
  paymentMethod: string;
  paymentDate?: string;
  referenceNumber?: string;
  note?: string;
}

export interface ProcessRefundRequest {
  paymentId: number;
  amount: number;
  reason: string;
}
