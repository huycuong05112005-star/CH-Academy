import { useState, useEffect } from 'react'
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  AlertCircle,
  RotateCcw,
  Receipt,
  CheckCircle,
  X,
  FileText,
  Download
} from 'lucide-react'
import { exportToCsv } from '../../../utils/exportCsv'
import { financeApi } from '../../../api/finance'
import { studentsApi } from '../../../api/students'
import type { Receivable, Payment, FinanceOverview } from '../../../types/finance'
import type { Student } from '../../../types/student'
import { StatCard } from '../../../components/ui/StatCard'
import { Badge } from '../../../components/ui/Badge'
import { TableSkeleton } from '../../../components/ui/LoadingSkeleton'
import { EmptyState } from '../../../components/ui/EmptyState'

export function FinancePage() {
  const [activeTab, setActiveTab] = useState<'receivables' | 'payments'>('receivables')
  const [overview, setOverview] = useState<FinanceOverview | null>(null)
  
  // Receivables state
  const [receivables, setReceivables] = useState<Receivable[]>([])
  const [recSearch, setRecSearch] = useState('')
  const [recStatus, setRecStatus] = useState('')
  const [recPage, setRecPage] = useState(0)
  const [recTotalPages, setRecTotalPages] = useState(1)

  // Payments state
  const [payments, setPayments] = useState<Payment[]>([])
  const [paySearch, setPaySearch] = useState('')
  const [payMethod, setPayMethod] = useState('')
  const [payPage, setPayPage] = useState(0)
  const [payTotalPages, setPayTotalPages] = useState(1)

  const [loading, setLoading] = useState(false)
  const [students, setStudents] = useState<Student[]>([])

  // Modal states
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isReceivableModalOpen, setIsReceivableModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Payment form state
  const [payStudentId, setPayStudentId] = useState<number | ''>('')
  const [payReceivableId, setPayReceivableId] = useState<number | ''>('')
  const [payAmount, setPayAmount] = useState<number | ''>('')
  const [payMethodSelect, setPayMethodSelect] = useState('BANK_TRANSFER')
  const [payRef, setPayRef] = useState('')
  const [payNote, setPayNote] = useState('')

  // Receivable form state
  const [recStudentId, setRecStudentId] = useState<number | ''>('')
  const [recTitle, setRecTitle] = useState('')
  const [recAmount, setRecAmount] = useState<number | ''>('')
  const [recDueDate, setRecDueDate] = useState('')
  const [recNote, setRecNote] = useState('')

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0)
  }

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 4000)
  }

  const loadOverview = async () => {
    try {
      const res = await financeApi.getOverview()
      if (res.data) setOverview(res.data)
    } catch (err) {
      console.error('Failed to load finance overview', err)
    }
  }

  const loadReceivables = async () => {
    setLoading(true)
    try {
      const res = await financeApi.searchReceivables({
        keyword: recSearch || undefined,
        status: recStatus || undefined,
        page: recPage,
        size: 10,
      })
      if (res.data) {
        setReceivables(res.data.content)
        setRecTotalPages(res.data.totalPages)
      }
    } catch (err) {
      console.error('Failed to load receivables', err)
    } finally {
      setLoading(false)
    }
  }

  const loadPayments = async () => {
    setLoading(true)
    try {
      const res = await financeApi.searchPayments({
        keyword: paySearch || undefined,
        method: payMethod || undefined,
        page: payPage,
        size: 10,
      })
      if (res.data) {
        setPayments(res.data.content)
        setPayTotalPages(res.data.totalPages)
      }
    } catch (err) {
      console.error('Failed to load payments', err)
    } finally {
      setLoading(false)
    }
  }

  const loadStudents = async () => {
    try {
      const res = await studentsApi.searchStudents({ size: 100 })
      if (res.data) setStudents(res.data.content)
    } catch (err) {
      console.error('Failed to load students', err)
    }
  }

  useEffect(() => {
    loadOverview()
    loadStudents()
  }, [])

  useEffect(() => {
    if (activeTab === 'receivables') {
      loadReceivables()
    } else {
      loadPayments()
    }
  }, [activeTab, recSearch, recStatus, recPage, paySearch, payMethod, payPage])

  const handleOpenPaymentModal = (rec?: Receivable) => {
    if (rec) {
      setPayStudentId(rec.studentId)
      setPayReceivableId(rec.id)
      setPayAmount(rec.remainingAmount)
    } else {
      setPayStudentId('')
      setPayReceivableId('')
      setPayAmount('')
    }
    setPayMethodSelect('BANK_TRANSFER')
    setPayRef('')
    setPayNote('')
    setFormError('')
    setIsPaymentModalOpen(true)
  }

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!payStudentId || !payAmount || Number(payAmount) <= 0) {
      setFormError('Vui lòng chọn học viên và nhập số tiền thanh toán hợp lệ')
      return
    }
    setSubmitting(true)
    setFormError('')
    try {
      await financeApi.recordPayment({
        studentId: Number(payStudentId),
        receivableId: payReceivableId ? Number(payReceivableId) : undefined,
        amount: Number(payAmount),
        paymentMethod: payMethodSelect,
        referenceNumber: payRef || undefined,
        note: payNote || undefined,
      })
      setIsPaymentModalOpen(false)
      showToast('Ghi nhận thanh toán thành công!')
      loadOverview()
      if (activeTab === 'receivables') loadReceivables()
      else loadPayments()
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Có lỗi xảy ra khi ghi nhận thanh toán')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreateReceivable = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!recStudentId || !recTitle || !recAmount || Number(recAmount) <= 0) {
      setFormError('Vui lòng điền đầy đủ các thông tin bắt buộc')
      return
    }
    setSubmitting(true)
    setFormError('')
    try {
      await financeApi.createReceivable({
        studentId: Number(recStudentId),
        title: recTitle,
        totalAmount: Number(recAmount),
        dueDate: recDueDate || undefined,
        note: recNote || undefined,
      })
      setIsReceivableModalOpen(false)
      showToast('Tạo khoản thu mới thành công!')
      loadOverview()
      loadReceivables()
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Có lỗi xảy ra khi tạo khoản thu')
    } finally {
      setSubmitting(false)
    }
  }

  const handleExportFinance = () => {
    if (activeTab === 'receivables') {
      const headers = [
        'Mã khoản thu',
        'Mã học viên',
        'Họ và tên',
        'Lớp học',
        'Nội dung khoản thu',
        'Tổng phải thu (VNĐ)',
        'Đã nộp (VNĐ)',
        'Còn thiếu (VNĐ)',
        'Hạn nộp',
        'Trạng thái'
      ]
      const statusMap: Record<string, string> = {
        PENDING: 'Chưa thanh toán',
        PARTIALLY_PAID: 'Thanh toán một phần',
        PAID: 'Đã hoàn tất',
        CANCELLED: 'Đã hủy'
      }
      const rows = receivables.map(r => [
        r.code,
        r.studentCode,
        r.studentFullName,
        r.className || '',
        r.title,
        r.totalAmount,
        r.paidAmount,
        r.remainingAmount,
        r.dueDate || '',
        statusMap[r.status] || r.status
      ])
      exportToCsv('Cong_no_khoan_thu', headers, rows)
    } else {
      const headers = [
        'Mã phiếu thu',
        'Mã học viên',
        'Họ và tên',
        'Số tiền (VNĐ)',
        'Phương thức',
        'Mã tham chiếu',
        'Ngày thanh toán',
        'Ghi chú'
      ]
      const methodMap: Record<string, string> = {
        CASH: 'Tiền mặt',
        BANK_TRANSFER: 'Chuyển khoản ngân hàng',
        POS: 'Quẹt thẻ POS'
      }
      const rows = payments.map(p => [
        p.paymentCode,
        p.studentCode,
        p.studentFullName,
        p.amount,
        methodMap[p.paymentMethod] || p.paymentMethod,
        p.referenceNumber || '',
        p.paymentDate || '',
        p.note || ''
      ])
      exportToCsv('Lich_su_thanh_toan', headers, rows)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-[#142B4A] dark:bg-[#151F31] text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-fade-in border border-slate-700 dark:border-[#2A3A50]">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span className="font-semibold text-sm">{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200 dark:border-[#2A3A50]">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-[#A6B4C8] uppercase tracking-wider mb-1">
            <span>Tài chính & Hệ thống</span>
            <span>/</span>
            <span className="text-[#142B4A] dark:text-[#38BDF8]">Học phí & Công nợ</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#142B4A] dark:text-[#E8EEF7] flex items-center gap-2.5">
            <CreditCard className="w-7 h-7 text-[#142B4A] dark:text-[#38BDF8]" />
            Học phí & Quản lý Tài chính
          </h1>
          <p className="text-slate-500 dark:text-[#A6B4C8] text-sm mt-1">
            Theo dõi khoản phải thu, ghi nhận thanh toán, quản lý công nợ và hoàn tiền minh bạch.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportFinance}
            className="flex items-center gap-2 px-3.5 py-2.5 border border-emerald-300 dark:border-emerald-700/60 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 text-sm font-semibold rounded-xl shadow-xs transition"
          >
            <Download className="w-4 h-4" />
            <span>Xuất file Excel (CSV)</span>
          </button>
          <button
            onClick={() => {
              setRecStudentId('')
              setRecTitle('')
              setRecAmount('')
              setRecDueDate('')
              setRecNote('')
              setFormError('')
              setIsReceivableModalOpen(true)
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#151F31] hover:bg-slate-50 dark:hover:bg-[#1C293D] text-slate-800 dark:text-[#E8EEF7] text-sm font-semibold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo khoản thu</span>
          </button>
          <button
            onClick={() => handleOpenPaymentModal()}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#142B4A] dark:bg-[#38BDF8] hover:bg-[#1D4168] dark:hover:bg-[#0284C7] text-white dark:text-[#0B1220] rounded-xl text-sm font-semibold shadow-sm transition"
          >
            <Receipt className="w-4 h-4" />
            <span>Ghi nhận thanh toán</span>
          </button>
        </div>
      </div>

      {/* Overview KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Tổng phải thu"
          value={formatVND(overview?.totalReceivables || 0)}
          icon={DollarSign}
          subtitle={`${overview?.totalReceivableCount || 0} khoản phải thu`}
        />
        <StatCard
          title="Đã thực thu"
          value={formatVND(overview?.totalPaid || 0)}
          icon={TrendingUp}
          subtitle={`${overview?.totalPaymentCount || 0} giao dịch`}
          badge={<Badge variant="success">Hoàn thành</Badge>}
        />
        <StatCard
          title="Còn nợ (Công nợ)"
          value={formatVND(overview?.totalDebt || 0)}
          icon={AlertCircle}
          subtitle="Cần đôn đốc thanh toán"
          badge={<Badge variant="warning">Công nợ</Badge>}
        />
        <StatCard
          title="Đã hoàn tiền"
          value={formatVND(overview?.totalRefunds || 0)}
          icon={RotateCcw}
          subtitle="Xử lý theo quy định"
        />
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-[#151F31] rounded-2xl border border-slate-200/80 dark:border-[#2A3A50] shadow-xs overflow-hidden">
        <div className="flex border-b border-slate-200 dark:border-[#2A3A50] px-4 pt-2 bg-slate-50/50 dark:bg-[#1C293D]/30">
          <button
            onClick={() => setActiveTab('receivables')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition ${
              activeTab === 'receivables'
                ? 'border-[#142B4A] dark:border-[#38BDF8] text-[#142B4A] dark:text-[#38BDF8] bg-white dark:bg-[#151F31] rounded-t-xl'
                : 'border-transparent text-slate-500 dark:text-[#A6B4C8] hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Khoản phải thu & Công nợ</span>
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition ${
              activeTab === 'payments'
                ? 'border-[#142B4A] dark:border-[#38BDF8] text-[#142B4A] dark:text-[#38BDF8] bg-white dark:bg-[#151F31] rounded-t-xl'
                : 'border-transparent text-slate-500 dark:text-[#A6B4C8] hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Lịch sử thanh toán</span>
          </button>
        </div>

        {/* Tab 1: Receivables */}
        {activeTab === 'receivables' && (
          <div className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo mã, học viên, tiêu đề..."
                  value={recSearch}
                  onChange={(e) => setRecSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-slate-50/50 dark:bg-[#1C293D] text-sm text-[#142B4A] dark:text-[#E8EEF7] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#142B4A] dark:focus:ring-[#38BDF8]"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-500" />
                <select
                  value={recStatus}
                  onChange={(e) => setRecStatus(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-sm text-[#142B4A] dark:text-[#E8EEF7] focus:outline-none focus:ring-2 focus:ring-[#142B4A] dark:focus:ring-[#38BDF8]"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="PENDING">Chờ nộp</option>
                  <option value="PARTIALLY_PAID">Nộp một phần</option>
                  <option value="PAID">Đã nộp đủ</option>
                  <option value="CANCELLED">Đã hủy</option>
                </select>
              </div>
            </div>

            {loading ? (
              <TableSkeleton rows={5} columns={9} />
            ) : receivables.length === 0 ? (
              <EmptyState
                title="Không tìm thấy khoản thu nào"
                description="Chưa có khoản thu học phí nào khớp với điều kiện lọc."
                icon={FileText}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-table">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-[#1C293D] border-b border-slate-200 dark:border-[#2A3A50] text-xs font-semibold text-slate-500 dark:text-[#A6B4C8] uppercase tracking-wider">
                      <th className="py-3.5 px-4">Mã</th>
                      <th className="py-3.5 px-4">Học viên</th>
                      <th className="py-3.5 px-4">Khoản thu</th>
                      <th className="py-3.5 px-4 text-right">Tổng tiền</th>
                      <th className="py-3.5 px-4 text-right">Đã nộp</th>
                      <th className="py-3.5 px-4 text-right">Còn nợ</th>
                      <th className="py-3.5 px-4">Hạn nộp</th>
                      <th className="py-3.5 px-4 text-center">Trạng thái</th>
                      <th className="py-3.5 px-4 text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#2A3A50]/60">
                    {receivables.map((r) => {
                      const isOverdue = r.dueDate && new Date(r.dueDate) < new Date() && r.status !== 'PAID'
                      return (
                        <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-[#1C293D]/40 transition">
                          <td className="py-3.5 px-4 font-mono font-bold text-xs text-[#142B4A] dark:text-[#38BDF8]">{r.code}</td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-[#142B4A] dark:text-[#E8EEF7]">{r.studentFullName}</div>
                            <div className="text-xs text-slate-500 dark:text-[#A6B4C8] font-mono mt-0.5">{r.studentCode}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-800 dark:text-[#E8EEF7]">{r.title}</div>
                            {r.className && <div className="text-xs text-slate-500 dark:text-[#A6B4C8] mt-0.5">Lớp: {r.className}</div>}
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-slate-800 dark:text-[#E8EEF7]">{formatVND(r.totalAmount)}</td>
                          <td className="py-3.5 px-4 text-right text-emerald-600 dark:text-emerald-400 font-bold">{formatVND(r.paidAmount)}</td>
                          <td className="py-3.5 px-4 text-right font-bold text-amber-600 dark:text-amber-400">{formatVND(r.remainingAmount)}</td>
                          <td className="py-3.5 px-4 text-xs">
                            <span className={isOverdue ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-slate-600 dark:text-[#A6B4C8]'}>
                              {r.dueDate || '---'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {r.status === 'PAID' && <Badge variant="success">Đã nộp đủ</Badge>}
                            {r.status === 'PARTIALLY_PAID' && <Badge variant="info">Nộp một phần</Badge>}
                            {r.status === 'PENDING' && <Badge variant="warning">Chờ nộp</Badge>}
                            {r.status === 'CANCELLED' && <Badge variant="neutral">Đã hủy</Badge>}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {r.status !== 'PAID' && r.status !== 'CANCELLED' && (
                              <button
                                onClick={() => handleOpenPaymentModal(r)}
                                className="px-3 py-1.5 bg-[#142B4A] dark:bg-[#38BDF8] hover:bg-[#1D4168] dark:hover:bg-[#0284C7] text-white dark:text-[#0B1220] rounded-lg text-xs font-semibold transition shadow-xs"
                              >
                                Thu tiền
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {recTotalPages > 1 && (
              <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-[#2A3A50] text-xs text-slate-600 dark:text-[#A6B4C8]">
                <span>Trang {recPage + 1} / {recTotalPages}</span>
                <div className="flex gap-2">
                  <button
                    disabled={recPage === 0}
                    onClick={() => setRecPage(p => Math.max(0, p - 1))}
                    className="px-3 py-1.5 border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#151F31] rounded-lg disabled:opacity-40 font-medium"
                  >
                    Trước
                  </button>
                  <button
                    disabled={recPage >= recTotalPages - 1}
                    onClick={() => setRecPage(p => p + 1)}
                    className="px-3 py-1.5 border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#151F31] rounded-lg disabled:opacity-40 font-medium"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Payments */}
        {activeTab === 'payments' && (
          <div className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm theo mã thanh toán, học viên, số tham chiếu..."
                  value={paySearch}
                  onChange={(e) => setPaySearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-slate-50/50 dark:bg-[#1C293D] text-sm text-[#142B4A] dark:text-[#E8EEF7] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#142B4A] dark:focus:ring-[#38BDF8]"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-500" />
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-sm text-[#142B4A] dark:text-[#E8EEF7] focus:outline-none focus:ring-2 focus:ring-[#142B4A] dark:focus:ring-[#38BDF8]"
                >
                  <option value="">Tất cả hình thức</option>
                  <option value="CASH">Tiền mặt</option>
                  <option value="BANK_TRANSFER">Chuyển khoản</option>
                  <option value="POS">Thẻ / POS</option>
                </select>
              </div>
            </div>

            {loading ? (
              <TableSkeleton rows={5} columns={7} />
            ) : payments.length === 0 ? (
              <EmptyState
                title="Chưa có giao dịch thanh toán nào"
                description="Chưa có khoản thu nào được ghi nhận."
                icon={Receipt}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-table">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-[#1C293D] border-b border-slate-200 dark:border-[#2A3A50] text-xs font-semibold text-slate-500 dark:text-[#A6B4C8] uppercase tracking-wider">
                      <th className="py-3.5 px-4">Mã GD</th>
                      <th className="py-3.5 px-4">Học viên</th>
                      <th className="py-3.5 px-4 text-right">Số tiền</th>
                      <th className="py-3.5 px-4">Phương thức</th>
                      <th className="py-3.5 px-4">Ngày nộp</th>
                      <th className="py-3.5 px-4">Mã tham chiếu</th>
                      <th className="py-3.5 px-4">Người thu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#2A3A50]/60">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-[#1C293D]/40 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-xs text-[#142B4A] dark:text-[#38BDF8]">{p.paymentCode}</td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-[#142B4A] dark:text-[#E8EEF7]">{p.studentFullName}</div>
                          <div className="text-xs text-slate-500 dark:text-[#A6B4C8] font-mono mt-0.5">{p.studentCode}</div>
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                          {formatVND(p.amount)}
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge variant="primary">
                            {p.paymentMethod === 'BANK_TRANSFER' ? 'Chuyển khoản' : p.paymentMethod === 'CASH' ? 'Tiền mặt' : 'Thẻ / POS'}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-[#A6B4C8]">{p.paymentDate}</td>
                        <td className="py-3.5 px-4 font-mono text-xs text-slate-500 dark:text-[#A6B4C8]">{p.referenceNumber || '---'}</td>
                        <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-[#A6B4C8]">{p.createdByName || 'Hệ thống'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {payTotalPages > 1 && (
              <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-[#2A3A50] text-xs text-slate-600 dark:text-[#A6B4C8]">
                <span>Trang {payPage + 1} / {payTotalPages}</span>
                <div className="flex gap-2">
                  <button
                    disabled={payPage === 0}
                    onClick={() => setPayPage(p => Math.max(0, p - 1))}
                    className="px-3 py-1.5 border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#151F31] rounded-lg disabled:opacity-40 font-medium"
                  >
                    Trước
                  </button>
                  <button
                    disabled={payPage >= payTotalPages - 1}
                    onClick={() => setPayPage(p => p + 1)}
                    className="px-3 py-1.5 border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#151F31] rounded-lg disabled:opacity-40 font-medium"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal: Ghi nhận thanh toán */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#151F31] rounded-2xl border border-slate-200 dark:border-[#2A3A50] shadow-2xl max-w-lg w-full p-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-[#2A3A50]">
              <h3 className="text-lg font-bold text-[#142B4A] dark:text-[#E8EEF7] flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>Ghi nhận thanh toán học phí</span>
              </h3>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm rounded-xl">
                {formError}
              </div>
            )}

            <form onSubmit={handleRecordPayment} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] mb-1">
                  Học viên nộp tiền <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={payStudentId}
                  onChange={(e) => setPayStudentId(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-sm text-[#142B4A] dark:text-[#E8EEF7]"
                >
                  <option value="">-- Chọn học viên --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.studentCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] mb-1">
                  Số tiền thanh toán (VND) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1000"
                  step="1000"
                  placeholder="Ví dụ: 3000000"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-sm text-[#142B4A] dark:text-[#E8EEF7]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] mb-1">
                    Hình thức
                  </label>
                  <select
                    value={payMethodSelect}
                    onChange={(e) => setPayMethodSelect(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-sm text-[#142B4A] dark:text-[#E8EEF7]"
                  >
                    <option value="BANK_TRANSFER">Chuyển khoản</option>
                    <option value="CASH">Tiền mặt</option>
                    <option value="POS">Thẻ / POS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] mb-1">
                    Số tham chiếu / Bill
                  </label>
                  <input
                    type="text"
                    placeholder="Mã giao dịch ngân hàng"
                    value={payRef}
                    onChange={(e) => setPayRef(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-sm text-[#142B4A] dark:text-[#E8EEF7]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] mb-1">
                  Ghi chú nội bộ
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Phụ huynh chuyển khoản qua Vietcombank"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-sm text-[#142B4A] dark:text-[#E8EEF7]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-[#2A3A50]">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] text-sm font-semibold text-slate-700 dark:text-[#E8EEF7] hover:bg-slate-100 dark:hover:bg-[#1C293D]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'Đang lưu...' : 'Xác nhận thu tiền'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Tạo khoản thu mới */}
      {isReceivableModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#151F31] rounded-2xl border border-slate-200 dark:border-[#2A3A50] shadow-2xl max-w-lg w-full p-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-[#2A3A50]">
              <h3 className="text-lg font-bold text-[#142B4A] dark:text-[#E8EEF7] flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#142B4A] dark:text-[#38BDF8]" />
                <span>Tạo khoản phải thu mới</span>
              </h3>
              <button
                onClick={() => setIsReceivableModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm rounded-xl">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateReceivable} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] mb-1">
                  Học viên <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={recStudentId}
                  onChange={(e) => setRecStudentId(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-sm text-[#142B4A] dark:text-[#E8EEF7]"
                >
                  <option value="">-- Chọn học viên --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.studentCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] mb-1">
                  Nội dung khoản thu <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Học phí khóa Tiếng Anh Giao Tiếp Q3/2026"
                  value={recTitle}
                  onChange={(e) => setRecTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-sm text-[#142B4A] dark:text-[#E8EEF7]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] mb-1">
                    Số tiền phải thu (VND) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1000"
                    step="1000"
                    placeholder="Ví dụ: 4500000"
                    value={recAmount}
                    onChange={(e) => setRecAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-sm text-[#142B4A] dark:text-[#E8EEF7]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] mb-1">
                    Hạn nộp
                  </label>
                  <input
                    type="date"
                    value={recDueDate}
                    onChange={(e) => setRecDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-sm text-[#142B4A] dark:text-[#E8EEF7]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] mb-1">
                  Ghi chú
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Đã áp dụng học bổng 10%"
                  value={recNote}
                  onChange={(e) => setRecNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-sm text-[#142B4A] dark:text-[#E8EEF7]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-[#2A3A50]">
                <button
                  type="button"
                  onClick={() => setIsReceivableModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] text-sm font-semibold text-slate-700 dark:text-[#E8EEF7] hover:bg-slate-100 dark:hover:bg-[#1C293D]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-[#142B4A] dark:bg-[#38BDF8] text-white dark:text-[#0B1220] text-sm font-semibold hover:bg-[#1D4168] dark:hover:bg-[#0284C7] shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Đang tạo...' : 'Tạo khoản thu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
