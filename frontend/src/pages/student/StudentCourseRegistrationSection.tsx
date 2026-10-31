import React, { useState, useEffect, useCallback } from 'react'
import {
  UserPlus,
  RefreshCw,
  CheckCircle2,
  Clock,
  Calendar,
  AlertCircle,
  XCircle,
  BookOpen
} from 'lucide-react'
import { apiClient } from '../../api/client'
import { useAcademicYear } from '../../context/AcademicYearContext'

export const StudentCourseRegistrationSection: React.FC = () => {
  const { selectedAcademicYear, availableYears } = useAcademicYear()
  const [activeYear, setActiveYear] = useState<string>(selectedAcademicYear || '2026-2027')
  const [classes, setClasses] = useState<any[]>([])
  const [myRequests, setMyRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Registration modal state
  const [selectedClass, setSelectedClass] = useState<any | null>(null)
  const [studentNotes, setStudentNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type })
    setTimeout(() => setToastMsg(null), 3500)
  }

  const loadData = useCallback(async (yearToLoad?: string) => {
    setLoading(true)
    const yr = yearToLoad || activeYear
    try {
      const [clsRes, reqRes] = await Promise.all([
        apiClient.get<any[]>(`/student/available-classes?academicYear=${encodeURIComponent(yr)}`).catch(() => ({ success: false, data: [] })),
        apiClient.get<any[]>('/student/enrollment-requests').catch(() => ({ success: false, data: [] }))
      ])

      if (clsRes?.success && clsRes.data) setClasses(clsRes.data)
      if (reqRes?.success && reqRes.data) setMyRequests(reqRes.data)
    } finally {
      setLoading(false)
    }
  }, [activeYear])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleRegister = async () => {
    if (!selectedClass) return
    setSubmitting(true)
    try {
      const res = await apiClient.post<any>('/student/enrollment-requests', {
        classId: selectedClass.id,
        studentNotes: studentNotes.trim() || undefined
      })
      if (res?.success) {
        showToast('Gửi yêu cầu đăng ký khóa học thành công! Vui lòng chờ xét duyệt.', 'success')
        setSelectedClass(null)
        setStudentNotes('')
        loadData()
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Lỗi đăng ký khóa học', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancelRequest = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn hủy yêu cầu đăng ký này?')) return
    try {
      const res = await apiClient.post(`/student/enrollment-requests/${id}/cancel`)
      if (res?.success) {
        showToast('Đã hủy yêu cầu đăng ký', 'success')
        loadData()
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Lỗi hủy yêu cầu', 'error')
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
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

      {/* Header & Year Selector */}
      <div className="p-5 rounded-2xl bg-white/80 dark:bg-[#151F31]/80 border border-slate-200/80 dark:border-[#2A3A50] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-sky-500" />
            <span>Đăng ký Lớp học Mới Xuyên Năm</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Duy trì 1 hồ sơ học viên duy nhất, tự do đăng ký các lớp mở theo từng năm học.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Năm học:</span>
          <select
            value={activeYear}
            onChange={(e) => {
              setActiveYear(e.target.value)
              loadData(e.target.value)
            }}
            className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
          >
            {availableYears.map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => loadData()}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Available Open Classes */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Các lớp mở nhận đăng ký trong năm {activeYear} ({classes.length})
        </h4>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400 animate-pulse">
            Đang tải danh sách lớp học mở...
          </div>
        ) : classes.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-400">
            Hiện chưa có lớp học nào mở nhận đăng ký cho năm {activeYear}.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {classes.map((cls) => {
              const pendingReq = myRequests.find((r) => r.classId === cls.id && r.status === 'PENDING')

              return (
                <div
                  key={cls.id}
                  className="p-5 rounded-2xl bg-white/80 dark:bg-[#151F31]/80 border border-slate-200/80 dark:border-[#2A3A50] shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <span className="font-mono text-[11px] font-bold text-sky-600 dark:text-sky-400">
                          {cls.code}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{cls.name}</h4>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        Đang mở
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">
                      Khóa: <strong>{cls.courseName}</strong> ({cls.courseCode})
                    </p>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs space-y-1 mb-3">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Giảng viên:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {cls.primaryTeacherName || 'Đang phân công'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Thời gian:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {cls.startDate} → {cls.endDate || 'Dài hạn'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Phòng học:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{cls.room || 'Phòng học trung tâm'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Năm học: {cls.academicYear || activeYear}</span>
                    {pendingReq ? (
                      <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
                        <Clock size={14} />
                        <span>Đang chờ duyệt</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedClass(cls)
                          setStudentNotes('')
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                      >
                        Đăng ký lớp này
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Bảng yêu cầu đã gửi của học viên */}
      <div className="pt-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Yêu cầu đăng ký của bạn ({myRequests.length})
        </h4>

        {myRequests.length === 0 ? (
          <div className="p-6 text-center rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-400">
            Bạn chưa gửi yêu cầu đăng ký nào.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-[#151F31]/80">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Lớp học</th>
                  <th className="p-3">Khóa học</th>
                  <th className="p-3">Năm học</th>
                  <th className="p-3">Ngày gửi</th>
                  <th className="p-3">Trạng thái</th>
                  <th className="p-3">Ghi chú phản hồi</th>
                  <th className="p-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {myRequests.map((req) => {
                  const statusBadge =
                    (req.status &&
                      ({
                        PENDING: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
                        APPROVED: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
                        REJECTED: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
                        CANCELLED: 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                      } as Record<string, string>)[req.status]) || 'bg-slate-100 text-slate-600'

                  return (
                    <tr key={req.id}>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">
                        {req.className} ({req.classCode})
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-300">{req.courseName}</td>
                      <td className="p-3 font-semibold text-sky-600">{req.academicYear}</td>
                      <td className="p-3 text-slate-400">{new Date(req.createdAt).toLocaleDateString('vi-VN')}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge}`}>
                          {req.status === 'PENDING' && 'Chờ duyệt'}
                          {req.status === 'APPROVED' && 'Đã duyệt'}
                          {req.status === 'REJECTED' && 'Từ chối'}
                          {req.status === 'CANCELLED' && 'Đã hủy'}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 max-w-xs truncate">{req.reviewNotes || '—'}</td>
                      <td className="p-3 text-right">
                        {req.status === 'PENDING' && (
                          <button
                            type="button"
                            onClick={() => handleCancelRequest(req.id)}
                            className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 text-rose-600 text-[11px] font-bold transition cursor-pointer"
                          >
                            Hủy yêu cầu
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
      </div>

      {/* MODAL XÁC NHẬN ĐĂNG KÝ */}
      {selectedClass && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-sky-500" />
              <span>Xác nhận Đăng ký Khóa học</span>
            </h3>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-xs space-y-1">
              <div className="font-bold text-slate-800 dark:text-white">
                Lớp: {selectedClass.name} ({selectedClass.code})
              </div>
              <div className="text-slate-500">Khóa học: {selectedClass.courseName}</div>
              <div className="text-sky-600 dark:text-sky-400 font-semibold">
                Năm học: {selectedClass.academicYear || activeYear}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Ghi chú hoặc nguyện vọng (nếu có):
              </label>
              <textarea
                rows={3}
                placeholder="Ví dụ: Mong muốn xếp lớp ca tối, đề xuất học bổng..."
                value={studentNotes}
                onChange={(e) => setStudentNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-sky-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedClass(null)}
                disabled={submitting}
                className="px-4 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleRegister}
                disabled={submitting}
                className="px-4 py-2 rounded-2xl bg-sky-600 hover:bg-sky-700 text-xs font-bold text-white shadow-md transition cursor-pointer"
              >
                {submitting ? 'Đang gửi...' : 'Xác nhận Gửi yêu cầu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
