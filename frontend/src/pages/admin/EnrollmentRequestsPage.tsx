import React, { useState, useEffect, useCallback } from 'react'
import {
  UserCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  Search,
  RefreshCw,
  AlertCircle,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  DollarSign
} from 'lucide-react'
import { apiClient, type ApiResponse } from '../../api/client'
import { useAcademicYear } from '../../context/AcademicYearContext'

interface EnrollmentRequestItem {
  id: number
  studentId: number
  studentCode: string
  studentName: string
  studentEmail: string
  studentPhone: string
  classId: number
  classCode: string
  className: string
  courseId: number
  courseName: string
  academicYear: string
  requestDate: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
  appliedTuitionFee: number
  discountAmount: number
  finalFee: number
  reviewedById?: number
  reviewedByName?: string
  reviewedAt?: string
  reviewNotes?: string
  studentNotes?: string
  createdAt: string
}

export const EnrollmentRequestsPage: React.FC = () => {
  const { selectedAcademicYear, setSelectedAcademicYear, availableYears } = useAcademicYear()

  const [requests, setRequests] = useState<EnrollmentRequestItem[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [searchKeyword, setSearchKeyword] = useState('')

  // Modal Review
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<EnrollmentRequestItem | null>(null)
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT'>('APPROVE')
  const [reviewNotes, setReviewNotes] = useState('')
  const [discountAmount, setDiscountAmount] = useState<number>(0)
  const [submitting, setSubmitting] = useState(false)
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type })
    setTimeout(() => setToastMsg(null), 3500)
  }

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    try {
      const sp = new URLSearchParams()
      if (selectedAcademicYear) sp.append('academicYear', selectedAcademicYear)
      if (statusFilter !== 'ALL') sp.append('status', statusFilter)
      const q = sp.toString() ? `?${sp.toString()}` : ''

      const res = await apiClient.get<EnrollmentRequestItem[]>(`/admin/enrollment-requests${q}`)
      if (res?.success && res.data) {
        setRequests(res.data)
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Lỗi tải danh sách yêu cầu', 'error')
    } finally {
      setLoading(false)
    }
  }, [selectedAcademicYear, statusFilter])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const handleOpenReview = (req: EnrollmentRequestItem, type: 'APPROVE' | 'REJECT') => {
    setSelectedRequest(req)
    setActionType(type)
    setReviewNotes('')
    setDiscountAmount(0)
    setReviewModalOpen(true)
  }

  const handleExecuteReview = async () => {
    if (!selectedRequest) return
    setSubmitting(true)
    try {
      const endpoint = `/admin/enrollment-requests/${selectedRequest.id}/${actionType === 'APPROVE' ? 'approve' : 'reject'}`
      const body = {
        reviewNotes: reviewNotes.trim() || undefined,
        discountAmount: actionType === 'APPROVE' ? discountAmount : 0
      }

      const res = await apiClient.post<EnrollmentRequestItem>(endpoint, body)
      if (res?.success) {
        showToast(
          actionType === 'APPROVE'
            ? `Đã duyệt đăng ký cho học viên ${selectedRequest.studentName}!`
            : `Đã từ chối yêu cầu đăng ký của ${selectedRequest.studentName}`,
          'success'
        )
        setReviewModalOpen(false)
        fetchRequests()
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Lỗi xử lý yêu cầu', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredRequests = requests.filter((r) => {
    if (!searchKeyword.trim()) return true
    const kw = searchKeyword.toLowerCase()
    return (
      r.studentName?.toLowerCase().includes(kw) ||
      r.studentCode?.toLowerCase().includes(kw) ||
      r.className?.toLowerCase().includes(kw) ||
      r.classCode?.toLowerCase().includes(kw) ||
      r.courseName?.toLowerCase().includes(kw)
    )
  })

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold border animate-in slide-in-from-bottom-5 ${
            toastMsg.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-500'
              : 'bg-rose-600 text-white border-rose-500'
          }`}
        >
          {toastMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <UserCheck size={22} />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>Xét duyệt Đăng ký Khóa học Xuyên Năm</span>
              {pendingCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  {pendingCount} chờ duyệt
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Quy trình tiếp nhận và phê duyệt yêu cầu học viên đăng ký lớp mới theo từng năm học.
            </p>
          </div>
        </div>

        {/* Academic Year Selector & Refresh */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
            <Calendar size={14} className="text-indigo-500 shrink-0" />
            <span className="text-xs font-semibold text-slate-500">Năm học:</span>
            <select
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 dark:text-white outline-none cursor-pointer"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  {yr}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={fetchRequests}
            disabled={loading}
            className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer"
            title="Làm mới danh sách"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-x-auto">
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                statusFilter === st
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              {st === 'ALL' && 'Tất cả'}
              {st === 'PENDING' && 'Chờ duyệt'}
              {st === 'APPROVED' && 'Đã duyệt'}
              {st === 'REJECTED' && 'Từ chối'}
              {st === 'CANCELLED' && 'Đã hủy'}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên HV, mã lớp, khóa học..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-white outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400 animate-pulse">
          Đang tải danh sách yêu cầu đăng ký...
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center mb-3">
            <UserCheck size={24} />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">Không có yêu cầu đăng ký nào</h3>
          <p className="text-xs text-slate-400 mt-1">
            Không tìm thấy yêu cầu đăng ký khóa học nào trong năm {selectedAcademicYear} phù hợp với bộ lọc hiện tại.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRequests.map((req) => {
            const statusConfig = {
              PENDING: { label: 'Chờ duyệt', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
              APPROVED: { label: 'Đã phê duyệt', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
              REJECTED: { label: 'Từ chối', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' },
              CANCELLED: { label: 'Đã hủy', color: 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20' }
            }[req.status] || { label: req.status, color: 'bg-slate-100 text-slate-600' }

            return (
              <div
                key={req.id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-indigo-400/50 transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-indigo-600 dark:text-indigo-400">
                          {req.studentCode}
                        </span>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white">{req.studentName}</h3>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {req.studentEmail} • {req.studentPhone}
                      </p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusConfig.color}`}>
                      {statusConfig.label}
                    </span>
                  </div>

                  {/* Class Info Box */}
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Lớp học:</span>
                      <span className="font-bold text-slate-800 dark:text-white">{req.className} ({req.classCode})</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Khóa học:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{req.courseName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Năm học:</span>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">{req.academicYear}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/40 dark:border-slate-700/50">
                      <span className="text-slate-400">Học phí niêm yết:</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(req.appliedTuitionFee || 0)}
                      </span>
                    </div>
                    {req.discountAmount > 0 && (
                      <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                        <span>Học bổng / Ưu đãi:</span>
                        <span>- {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(req.discountAmount)}</span>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {req.studentNotes && (
                    <div className="mt-2.5 p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/15 text-[11px] text-amber-700 dark:text-amber-300">
                      <span className="font-bold block">Ghi chú của học viên:</span>
                      {req.studentNotes}
                    </div>
                  )}

                  {req.reviewNotes && (
                    <div className="mt-2.5 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-[11px] text-slate-600 dark:text-slate-300">
                      <span className="font-bold block">Phản hồi của Quản trị viên ({req.reviewedByName}):</span>
                      {req.reviewNotes}
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    Gửi lúc: {new Date(req.createdAt).toLocaleString('vi-VN')}
                  </span>

                  {req.status === 'PENDING' && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenReview(req, 'REJECT')}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-bold transition cursor-pointer"
                      >
                        Từ chối
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenReview(req, 'APPROVE')}
                        className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5"
                      >
                        <CheckCircle2 size={14} />
                        <span>Phê duyệt</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* MODAL PHÊ DUYỆT / TỪ CHỐI */}
      {reviewModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              {actionType === 'APPROVE' ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span>Xác nhận Phê duyệt Đăng ký</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-rose-500" />
                  <span>Từ chối Yêu cầu Đăng ký</span>
                </>
              )}
            </h3>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-xs space-y-1">
              <div className="font-bold text-slate-800 dark:text-white">
                Học viên: {selectedRequest.studentName} ({selectedRequest.studentCode})
              </div>
              <div className="text-slate-500">
                Lớp đăng ký: {selectedRequest.className} ({selectedRequest.academicYear})
              </div>
              <div className="text-indigo-600 dark:text-indigo-400 font-semibold">
                Học phí gốc: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedRequest.appliedTuitionFee || 0)}
              </div>
            </div>

            {actionType === 'APPROVE' && (
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Mức giảm giá / Học bổng (VNĐ):
                </label>
                <input
                  type="number"
                  min={0}
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Học phí phải đóng: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Math.max(0, selectedRequest.appliedTuitionFee - discountAmount))}
                </span>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Ghi chú gửi học viên:
              </label>
              <textarea
                rows={3}
                placeholder={actionType === 'APPROVE' ? 'Ví dụ: Đã duyệt hồ sơ, hẹn bạn buổi học đầu tiên...' : 'Lý do từ chối...'}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setReviewModalOpen(false)}
                disabled={submitting}
                className="px-4 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleExecuteReview}
                disabled={submitting}
                className={`px-4 py-2 rounded-2xl text-xs font-bold text-white shadow-md transition cursor-pointer ${
                  actionType === 'APPROVE'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {submitting ? 'Đang lưu...' : actionType === 'APPROVE' ? 'Xác nhận Duyệt' : 'Xác nhận Từ chối'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
