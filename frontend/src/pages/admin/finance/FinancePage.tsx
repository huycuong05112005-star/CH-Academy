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
  FileText
} from 'lucide-react'
import { financeApi } from '../../../api/finance'
import { studentsApi } from '../../../api/students'
import type { Receivable, Payment, FinanceOverview } from '../../../types/finance'
import type { Student } from '../../../types/student'

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

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-[#142B4A] text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-fade-in border border-slate-700">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-[#142B4A] flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-[#142B4A]" />
            Học phí & Quản lý Tài chính
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Theo dõi khoản phải thu, ghi nhận thanh toán, quản lý công nợ và hoàn tiền minh bạch
          </p>
        </div>
        <div className="flex items-center gap-3">
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
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-sm font-semibold transition"
          >
            <Plus className="w-4 h-4" />
            Tạo khoản thu
          </button>
          <button
            onClick={() => handleOpenPaymentModal()}
            className="flex items-center gap-2 px-4 py-2 bg-[#142B4A] hover:bg-[#1b3860] text-white rounded-lg text-sm font-semibold shadow-sm transition"
          >
            <Receipt className="w-4 h-4" />
            Ghi nhận thanh toán
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng phải thu</p>
            <p className="text-xl font-bold text-[#142B4A] mt-1">
              {formatVND(overview?.totalReceivables || 0)}
            </p>
            <p className="text-xs text-slate-400 mt-1">{overview?.totalReceivableCount || 0} khoản phải thu</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-[#142B4A] rounded-xl flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Đã thực thu</p>
            <p className="text-xl font-bold text-emerald-600 mt-1">
              {formatVND(overview?.totalPaid || 0)}
            </p>
            <p className="text-xs text-slate-400 mt-1">{overview?.totalPaymentCount || 0} giao dịch</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Còn nợ (Công nợ)</p>
            <p className="text-xl font-bold text-amber-600 mt-1">
              {formatVND(overview?.totalDebt || 0)}
            </p>
            <p className="text-xs text-slate-400 mt-1">Cần đôn đốc thanh toán</p>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Đã hoàn tiền</p>
            <p className="text-xl font-bold text-rose-600 mt-1">
              {formatVND(overview?.totalRefunds || 0)}
            </p>
            <p className="text-xs text-slate-400 mt-1">Xử lý theo quy định</p>
          </div>
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
            <RotateCcw className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('receivables')}
            className={`flex items-center gap-2 px-6 py-3.5 text-sm font-semibold border-b-2 transition ${
              activeTab === 'receivables'
                ? 'border-[#142B4A] text-[#142B4A] bg-slate-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            Khoản phải thu & Công nợ
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`flex items-center gap-2 px-6 py-3.5 text-sm font-semibold border-b-2 transition ${
              activeTab === 'payments'
                ? 'border-[#142B4A] text-[#142B4A] bg-slate-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Receipt className="w-4 h-4" />
            Lịch sử thanh toán
          </button>
        </div>

        {/* Tab 1: Receivables */}
        {activeTab === 'receivables' && (
          <div className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo mã, học viên, tiêu đề..."
                  value={recSearch}
                  onChange={(e) => setRecSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#142B4A]"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-500" />
                <select
                  value={recStatus}
                  onChange={(e) => setRecStatus(e.target.value)}
                  className="border border-slate-300 rounded-lg text-sm px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#142B4A]"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="PENDING">Chưa thanh toán</option>
                  <option value="PARTIALLY_PAID">Thanh toán 1 phần</option>
                  <option value="PAID">Đã hoàn thành</option>
                  <option value="CANCELLED">Đã hủy</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-400">Đang tải dữ liệu khoản thu...</div>
            ) : receivables.length === 0 ? (
              <div className="py-12 text-center text-slate-400">Không tìm thấy khoản thu nào</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                      <th className="py-3 px-4">Mã</th>
                      <th className="py-3 px-4">Học viên</th>
                      <th className="py-3 px-4">Khoản thu</th>
                      <th className="py-3 px-4 text-right">Tổng tiền</th>
                      <th className="py-3 px-4 text-right">Đã nộp</th>
                      <th className="py-3 px-4 text-right">Còn nợ</th>
                      <th className="py-3 px-4">Hạn nộp</th>
                      <th className="py-3 px-4 text-center">Trạng thái</th>
                      <th className="py-3 px-4 text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {receivables.map((r) => {
                      const isOverdue = r.dueDate && new Date(r.dueDate) < new Date() && r.status !== 'PAID'
                      return (
                        <tr key={r.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4 font-mono font-medium text-slate-800">{r.code}</td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-slate-900">{r.studentFullName}</div>
                            <div className="text-xs text-slate-400 font-mono">{r.studentCode}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-slate-800">{r.title}</div>
                            {r.className && <div className="text-xs text-slate-500">Lớp: {r.className}</div>}
                          </td>
                          <td className="py-3 px-4 text-right font-medium text-slate-900">{formatVND(r.totalAmount)}</td>
                          <td className="py-3 px-4 text-right text-emerald-600 font-medium">{formatVND(r.paidAmount)}</td>
                          <td className="py-3 px-4 text-right font-bold text-amber-600">{formatVND(r.remainingAmount)}</td>
                          <td className="py-3 px-4">
                            <span className={isOverdue ? 'text-rose-600 font-medium' : 'text-slate-600'}>
                              {r.dueDate || '---'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {r.status === 'PAID' && (
                              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
                                Đã nộp đủ
                              </span>
                            )}
                            {r.status === 'PARTIALLY_PAID' && (
                              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                Nộp một phần
                              </span>
                            )}
                            {r.status === 'PENDING' && (
                              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">
                                Chờ nộp
                              </span>
                            )}
                            {r.status === 'CANCELLED' && (
                              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-600">
                                Đã hủy
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {r.status !== 'PAID' && r.status !== 'CANCELLED' && (
                              <button
                                onClick={() => handleOpenPaymentModal(r)}
                                className="px-3 py-1 bg-[#142B4A] hover:bg-[#1b3860] text-white rounded text-xs font-medium transition"
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
              <div className="flex justify-between items-center pt-4 border-t border-slate-100 text-sm">
                <span className="text-slate-500">Trang {recPage + 1} / {recTotalPages}</span>
                <div className="flex gap-2">
                  <button
                    disabled={recPage === 0}
                    onClick={() => setRecPage(p => Math.max(0, p - 1))}
                    className="px-3 py-1 border border-slate-300 rounded text-slate-700 disabled:opacity-40"
                  >
                    Trước
                  </button>
                  <button
                    disabled={recPage >= recTotalPages - 1}
                    onClick={() => setRecPage(p => p + 1)}
                    className="px-3 py-1 border border-slate-300 rounded text-slate-700 disabled:opacity-40"
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
          <div className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm theo mã thanh toán, học viên, số tham chiếu..."
                  value={paySearch}
                  onChange={(e) => setPaySearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#142B4A]"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-500" />
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="border border-slate-300 rounded-lg text-sm px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#142B4A]"
                >
                  <option value="">Tất cả hình thức</option>
                  <option value="CASH">Tiền mặt</option>
                  <option value="BANK_TRANSFER">Chuyển khoản</option>
                  <option value="POS">Thẻ / POS</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-400">Đang tải lịch sử thanh toán...</div>
            ) : payments.length === 0 ? (
              <div className="py-12 text-center text-slate-400">Chưa có giao dịch thanh toán nào</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                      <th className="py-3 px-4">Mã giao dịch</th>
                      <th className="py-3 px-4">Ngày nộp</th>
                      <th className="py-3 px-4">Học viên</th>
                      <th className="py-3 px-4 text-right">Số tiền</th>
                      <th className="py-3 px-4">Hình thức</th>
                      <th className="py-3 px-4">Mã tham chiếu</th>
                      <th className="py-3 px-4">Phân bổ khoản thu</th>
                      <th className="py-3 px-4">Người thu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 font-mono font-medium text-slate-800">{p.paymentCode}</td>
                        <td className="py-3 px-4 text-slate-600">{p.paymentDate}</td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-900">{p.studentFullName}</div>
                          <div className="text-xs text-slate-400 font-mono">{p.studentCode}</div>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-600">{formatVND(p.amount)}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 text-xs font-medium rounded bg-slate-100 text-slate-700">
                            {p.paymentMethod === 'BANK_TRANSFER' ? 'Chuyển khoản' : p.paymentMethod === 'CASH' ? 'Tiền mặt' : p.paymentMethod}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-slate-500">{p.referenceNumber || '---'}</td>
                        <td className="py-3 px-4 text-xs text-slate-600">
                          {p.allocations && p.allocations.length > 0 ? (
                            p.allocations.map(a => (
                              <div key={a.id}>
                                {a.receivableTitle} ({formatVND(a.allocatedAmount)})
                              </div>
                            ))
                          ) : (
                            <span className="text-slate-400">Tự động phân bổ</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600">{p.createdByName || 'Hệ thống'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {payTotalPages > 1 && (
              <div className="flex justify-between items-center pt-4 border-t border-slate-100 text-sm">
                <span className="text-slate-500">Trang {payPage + 1} / {payTotalPages}</span>
                <div className="flex gap-2">
                  <button
                    disabled={payPage === 0}
                    onClick={() => setPayPage(p => Math.max(0, p - 1))}
                    className="px-3 py-1 border border-slate-300 rounded text-slate-700 disabled:opacity-40"
                  >
                    Trước
                  </button>
                  <button
                    disabled={payPage >= payTotalPages - 1}
                    onClick={() => setPayPage(p => p + 1)}
                    className="px-3 py-1 border border-slate-300 rounded text-slate-700 disabled:opacity-40"
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
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 animate-scale-up">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-[#142B4A] flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                Ghi nhận thanh toán học phí
              </h3>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg">
                {formError}
              </div>
            )}

            <form onSubmit={handleRecordPayment} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Học viên nộp tiền <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={payStudentId}
                  onChange={(e) => setPayStudentId(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#142B4A]"
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
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
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
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#142B4A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Hình thức
                  </label>
                  <select
                    value={payMethodSelect}
                    onChange={(e) => setPayMethodSelect(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#142B4A]"
                  >
                    <option value="BANK_TRANSFER">Chuyển khoản</option>
                    <option value="CASH">Tiền mặt</option>
                    <option value="POS">Thẻ / POS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Số tham chiếu / Bill
                  </label>
                  <input
                    type="text"
                    placeholder="Mã giao dịch ngân hàng"
                    value={payRef}
                    onChange={(e) => setPayRef(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#142B4A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Ghi chú nội bộ
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Phụ huynh chuyển khoản qua Vietcombank"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#142B4A]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm transition disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 animate-scale-up">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-[#142B4A] flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#142B4A]" />
                Tạo khoản phải thu mới
              </h3>
              <button
                onClick={() => setIsReceivableModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateReceivable} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Học viên <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={recStudentId}
                  onChange={(e) => setRecStudentId(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#142B4A]"
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
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Nội dung khoản thu <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Học phí khóa Tiếng Anh Giao Tiếp Q3/2026"
                  value={recTitle}
                  onChange={(e) => setRecTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#142B4A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
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
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#142B4A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Hạn nộp
                  </label>
                  <input
                    type="date"
                    value={recDueDate}
                    onChange={(e) => setRecDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#142B4A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Ghi chú
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Đã áp dụng học bổng 10%"
                  value={recNote}
                  onChange={(e) => setRecNote(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#142B4A]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsReceivableModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#142B4A] hover:bg-[#1b3860] text-white rounded-lg text-sm font-semibold shadow-sm transition disabled:opacity-50"
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
