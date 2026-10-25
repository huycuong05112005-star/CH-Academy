import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { studentsApi } from '../../api/students'
import type { StudentPortalSummary } from '../../types/student'
import { ThemeSwitcher } from '../../components/ui/ThemeSwitcher'
import {
  GraduationCap,
  LogOut,
  CreditCard,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Phone,
  Mail,
  Receipt,
  User,
  ShieldCheck,
  Sparkles,
  QrCode
} from 'lucide-react'

export const StudentPortalPage: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [data, setData] = useState<StudentPortalSummary | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'classes' | 'finance' | 'attendance'>('overview')
  const [showQrModal, setShowQrModal] = useState<boolean>(false)

  useEffect(() => {
    const fetchPortal = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await studentsApi.getMyPortal()
        if (res.success && res.data) {
          setData(res.data)
        } else {
          setError(res.message || 'Không thể tải thông tin hồ sơ học viên')
        }
      } catch (err: unknown) {
        const e = err as { message?: string }
        setError(e.message || 'Lỗi kết nối máy chủ')
      } finally {
        setLoading(false)
      }
    }

    fetchPortal()
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const formatVND = (amount?: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0)
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—'
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    } catch {
      return dateStr
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0B1220] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-[#142B4A] dark:border-[#38BDF8] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-600 dark:text-[#A6B4C8]">
            Đang tải dữ liệu Cổng học viên...
          </p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0B1220] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-[#151F31] rounded-2xl p-6 border border-slate-200 dark:border-[#2A3A50] text-center shadow-lg">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-800 dark:text-[#E8EEF7] mb-1">
            Không tìm thấy hồ sơ học viên
          </h2>
          <p className="text-sm text-slate-500 dark:text-[#A6B4C8] mb-6">
            {error || 'Tài khoản của bạn chưa được liên kết với hồ sơ học viên nào trong hệ thống.'}
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-slate-100 dark:bg-[#1C293D] text-slate-700 dark:text-[#A6B4C8] rounded-xl text-sm font-medium hover:bg-slate-200"
            >
              Thử lại
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-[#142B4A] dark:bg-[#38BDF8] text-white dark:text-[#0B1220] rounded-xl text-sm font-medium"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </div>
    )
  }

  const { student, enrollments, payments, totalTuition, paidTuition, remainingTuition } = data
  const paymentPercentage = totalTuition > 0 ? Math.min(100, Math.round((paidTuition / totalTuition) * 100)) : 100

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1220] text-slate-800 dark:text-[#E8EEF7] font-sans antialiased pb-16">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-[#151F31]/80 backdrop-blur-md border-b border-slate-200/80 dark:border-[#2A3A50] px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#142B4A] to-[#1E3A8A] dark:from-[#38BDF8] dark:to-[#0284C7] flex items-center justify-center text-white dark:text-[#0B1220] shadow-sm">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-base sm:text-lg text-[#142B4A] dark:text-[#38BDF8]">
                CH ACADEMY
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300">
                Cổng Học Viên
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-[#A6B4C8]">
              Hệ thống theo dõi lộ trình & tài chính học tập
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeSwitcher />
          <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-[#2A3A50]">
            <div className="w-8 h-8 rounded-full bg-[#142B4A]/10 dark:bg-[#38BDF8]/20 text-[#142B4A] dark:text-[#38BDF8] flex items-center justify-center text-xs font-bold">
              {student.fullName ? student.fullName.charAt(0) : 'H'}
            </div>
            <div className="text-left">
              <div className="text-xs font-bold leading-none">{student.fullName}</div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">{student.studentCode}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Đăng xuất"
            className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6">
        {/* Welcome Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#142B4A] via-[#1D3557] to-[#1E3A8A] text-white p-6 sm:p-8 shadow-xl">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-[#38BDF8]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-medium text-[#38BDF8]">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Chào mừng bạn quay trở lại</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {student.fullName}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-200">
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-300" />
                  Mã HV: <strong className="font-mono text-white">{student.studentCode}</strong>
                </span>
                {student.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-300" />
                    {student.phone}
                  </span>
                )}
                {student.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-300" />
                    {student.email}
                  </span>
                )}
              </div>
            </div>

            {/* Quick Status Pill */}
            <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 sm:border-l border-white/15 pt-4 sm:pt-0 sm:pl-6 gap-2">
              <div className="text-left sm:text-right">
                <div className="text-[11px] uppercase tracking-wider text-slate-300">
                  Trạng thái học tập
                </div>
                <div className="text-sm font-bold text-emerald-300 flex items-center gap-1.5 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                  {student.status === 'ACTIVE' ? 'Đang theo học' : student.status}
                </div>
              </div>
              <div className="text-left sm:text-right">
                <div className="text-[11px] uppercase tracking-wider text-slate-300">
                  Tài khoản hệ thống
                </div>
                <div className="text-xs font-mono text-cyan-300">
                  @{user?.username || student.username || student.studentCode.toLowerCase()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Tuition Widget (Center of Automation) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Tổng học phí */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#151F31] border border-slate-200/80 dark:border-[#2A3A50] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#A6B4C8]">
                Tổng học phí khóa học
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-[#38BDF8] flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-[#142B4A] dark:text-[#E8EEF7]">
                {formatVND(totalTuition)}
              </div>
              <p className="text-xs text-slate-500 dark:text-[#A6B4C8] mt-1">
                {student.enrolledCourseName
                  ? `${student.enrolledCourseName} (${student.enrolledClassName || 'Chưa xếp lớp'})`
                  : 'Theo các khóa học đã ghi danh'}
              </p>
            </div>
          </div>

          {/* Card 2: Đã thanh toán */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#151F31] border border-slate-200/80 dark:border-[#2A3A50] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#A6B4C8]">
                Đã thanh toán
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {formatVND(paidTuition)}
              </div>
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Tiến độ hoàn tất</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{paymentPercentage}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-[#1C293D] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                    style={{ width: `${paymentPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Còn thiếu & Trạng thái */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#151F31] border border-slate-200/80 dark:border-[#2A3A50] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#A6B4C8]">
                Số tiền còn thiếu (Công nợ)
              </span>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                remainingTuition > 0
                  ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
                  : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
              }`}>
                {remainingTuition > 0 ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
              </div>
            </div>
            <div>
              <div className={`text-2xl font-black ${
                remainingTuition > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}>
                {formatVND(remainingTuition)}
              </div>
              <div className="mt-2 flex items-center justify-between">
                {remainingTuition <= 0 ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="w-3 h-3" /> Đã hoàn thành 100% học phí
                  </span>
                ) : (
                  <button
                    onClick={() => setShowQrModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#142B4A] dark:bg-[#38BDF8] text-white dark:text-[#0B1220] rounded-xl text-xs font-semibold shadow-xs hover:opacity-90 transition-all"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Nộp học phí còn thiếu</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-[#2A3A50] pb-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-[#142B4A] dark:bg-[#38BDF8] text-white dark:text-[#0B1220] shadow-sm'
                : 'text-slate-600 dark:text-[#A6B4C8] hover:bg-slate-100 dark:hover:bg-[#1C293D]'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Khóa học & Lớp học ({enrollments.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('finance')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'finance'
                ? 'bg-[#142B4A] dark:bg-[#38BDF8] text-white dark:text-[#0B1220] shadow-sm'
                : 'text-slate-600 dark:text-[#A6B4C8] hover:bg-slate-100 dark:hover:bg-[#1C293D]'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Biên lai thanh toán ({payments.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'attendance'
                ? 'bg-[#142B4A] dark:bg-[#38BDF8] text-white dark:text-[#0B1220] shadow-sm'
                : 'text-slate-600 dark:text-[#A6B4C8] hover:bg-slate-100 dark:hover:bg-[#1C293D]'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Chuyên cần & Điểm danh</span>
          </button>
        </div>

        {/* Tab 1: Khóa học & Lớp học */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {enrollments.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-[#151F31] rounded-2xl border border-slate-200 dark:border-[#2A3A50]">
                <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-600 dark:text-[#A6B4C8]">
                  Bạn chưa được ghi danh vào lớp học nào.
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Vui lòng liên hệ ban tuyển sinh CH Academy để được sắp xếp lớp phù hợp.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {enrollments.map((e) => (
                  <div
                    key={e.id}
                    className="p-5 rounded-2xl bg-white dark:bg-[#151F31] border border-slate-200/80 dark:border-[#2A3A50] shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[11px] font-bold text-[#142B4A] dark:text-[#38BDF8] uppercase tracking-wider">
                          {e.courseName || 'Khóa học tiêu chuẩn'}
                        </span>
                        <h3 className="text-base font-bold text-slate-800 dark:text-[#E8EEF7] mt-0.5">
                          {e.className}
                        </h3>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                        {e.status === 'ENROLLED' ? 'Đang theo học' : e.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-slate-100 dark:border-[#2A3A50]">
                      <div>
                        <span className="text-slate-400 block">Ngày ghi danh</span>
                        <span className="font-semibold">{formatDate(e.enrollmentDate)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Học phí niêm yết</span>
                        <span className="font-bold text-[#142B4A] dark:text-[#38BDF8]">
                          {formatVND(e.appliedTuitionFee)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Lịch sử Thanh toán & Phiếu thu */}
        {activeTab === 'finance' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-[#151F31] rounded-2xl border border-slate-200/80 dark:border-[#2A3A50] shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-[#2A3A50] flex items-center justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#142B4A] dark:text-[#E8EEF7]">
                    Lịch sử Giao dịch & Phiếu thu điện tử
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-[#A6B4C8]">
                    Biên nhận chính thức được đồng bộ tự động từ bộ phận kế toán
                  </p>
                </div>
                <button
                  onClick={() => setShowQrModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#142B4A] dark:bg-[#38BDF8] text-white dark:text-[#0B1220] rounded-xl text-xs font-semibold shadow-xs"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Hướng dẫn nộp học phí</span>
                </button>
              </div>

              {payments.length === 0 ? (
                <div className="p-8 text-center">
                  <Receipt className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-600 dark:text-[#A6B4C8]">
                    Chưa có giao dịch thanh toán nào được ghi nhận.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-slate-50/80 dark:bg-[#1C293D] border-b border-slate-200 dark:border-[#2A3A50] text-slate-500 dark:text-[#A6B4C8] uppercase tracking-wider text-[11px] font-semibold">
                        <th className="py-3 px-4">Mã biên lai</th>
                        <th className="py-3 px-4">Ngày thu</th>
                        <th className="py-3 px-4">Số tiền</th>
                        <th className="py-3 px-4">Phương thức</th>
                        <th className="py-3 px-4">Mã tham chiếu / Ghi chú</th>
                        <th className="py-3 px-4 text-right">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#2A3A50]/60">
                      {payments.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-[#1C293D]/40">
                          <td className="py-3 px-4 font-mono font-bold text-[#142B4A] dark:text-[#38BDF8]">
                            {p.paymentCode}
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                            {formatDate(p.paymentDate || p.createdAt)}
                          </td>
                          <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                            +{formatVND(p.amount)}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-[#1C293D] text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                              {p.paymentMethod === 'BANK_TRANSFER' ? 'Chuyển khoản' : p.paymentMethod === 'CASH' ? 'Tiền mặt' : p.paymentMethod}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500 dark:text-[#A6B4C8]">
                            {p.referenceNumber ? <span className="font-mono">{p.referenceNumber}</span> : p.note || '—'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Đã ghi nhận
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Chuyên cần */}
        {activeTab === 'attendance' && (
          <div className="p-6 rounded-2xl bg-white dark:bg-[#151F31] border border-slate-200/80 dark:border-[#2A3A50] shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-bold text-[#142B4A] dark:text-[#E8EEF7]">
                Theo dõi Chuyên cần & Điểm danh
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#A6B4C8]">
                Tỷ lệ tham gia các buổi học theo thời khóa biểu chính khóa
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#1C293D] border border-slate-200 dark:border-[#2A3A50]">
                <div className="text-xs text-slate-500">Tỷ lệ chuyên cần</div>
                <div className="text-3xl font-black text-[#142B4A] dark:text-[#38BDF8] mt-1">
                  {data.attendanceRate || 100}%
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#1C293D] border border-slate-200 dark:border-[#2A3A50]">
                <div className="text-xs text-slate-500">Tổng số buổi đã diễn ra</div>
                <div className="text-3xl font-black text-slate-800 dark:text-slate-200 mt-1">
                  {data.totalSessions || 0}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#1C293D] border border-slate-200 dark:border-[#2A3A50]">
                <div className="text-xs text-slate-500">Số buổi có mặt</div>
                <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                  {data.presentSessions || 0}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-blue-600 dark:text-[#38BDF8] flex-shrink-0 mt-0.5" />
              <div>
                <strong>Lưu ý chuyên cần:</strong> Học viên đạt tỷ lệ tham dự trên 80% sẽ đủ điều kiện tham gia kỳ thi sát hạch cuối khóa và được cấp chứng chỉ CH Academy.
              </div>
            </div>
          </div>
        )}
      </main>

      {/* QR / Banking Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#151F31] rounded-3xl border border-slate-200 dark:border-[#2A3A50] max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-[#142B4A] dark:text-[#E8EEF7] mb-2 flex items-center gap-2">
              <QrCode className="w-5 h-5 text-[#38BDF8]" />
              Thông tin chuyển khoản học phí
            </h3>
            <p className="text-xs text-slate-500 dark:text-[#A6B4C8] mb-4">
              Vui lòng chuyển khoản đúng cú pháp để hệ thống tự động đối soát và cập nhật công nợ tức thì.
            </p>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#1C293D] border border-slate-200 dark:border-[#2A3A50] space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Ngân hàng:</span>
                <strong className="text-slate-800 dark:text-white">MB Bank (Ngân hàng Quân Đội)</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Số tài khoản:</span>
                <strong className="font-mono text-sm text-[#142B4A] dark:text-[#38BDF8]">0988888888</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Chủ tài khoản:</span>
                <strong className="text-slate-800 dark:text-white">TRUNG TAM GD CH ACADEMY</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Số tiền cần nộp:</span>
                <strong className="text-sm font-bold text-rose-600 dark:text-rose-400">
                  {formatVND(remainingTuition)}
                </strong>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-[#2A3A50]">
                <span className="text-slate-500">Nội dung CK:</span>
                <span className="font-mono font-bold bg-white dark:bg-[#151F31] px-2 py-1 rounded border border-slate-200 dark:border-[#2A3A50] text-[#142B4A] dark:text-[#38BDF8]">
                  {student.studentCode} HOCPHI
                </span>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowQrModal(false)}
                className="px-4 py-2 bg-[#142B4A] dark:bg-[#38BDF8] text-white dark:text-[#0B1220] rounded-xl text-xs font-semibold"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default StudentPortalPage
