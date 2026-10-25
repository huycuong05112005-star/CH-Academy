import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { studentsApi } from '../../api/students'
import type {
  StudentPortalSummary,
  StudentClassDetail,
  StudentScheduleItem,
  StudentProfileData
} from '../../types/student'
import type { NotificationItem } from '../../types/notification'
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
  ShieldCheck,
  Sparkles,
  QrCode,
  FileText,
  ExternalLink,
  Bell,
  Lock,
  ChevronRight,
  Clock,
  UserCheck,
  User,
  MapPin
} from 'lucide-react'

export const StudentPortalPage: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [data, setData] = useState<StudentPortalSummary | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'classes' | 'schedule' | 'attendance' | 'finance' | 'notifications' | 'profile'>('classes')
  const [showQrModal, setShowQrModal] = useState<boolean>(false)

  // Schedule & Profile states
  const [schedules, setSchedules] = useState<StudentScheduleItem[]>([])
  const [profileData, setProfileData] = useState<StudentProfileData | null>(null)

  // Enrolled Class Details & Materials
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null)
  const [classDetail, setClassDetail] = useState<StudentClassDetail | null>(null)
  const [loadingClassDetail, setLoadingClassDetail] = useState<boolean>(false)
  const [classDetailError, setClassDetailError] = useState<string | null>(null)

  // Notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loadingNotifications, setLoadingNotifications] = useState<boolean>(false)

  // Password Change
  const [currentPassword, setCurrentPassword] = useState<string>('')
  const [newPassword, setNewPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')
  const [showPasswords, setShowPasswords] = useState<boolean>(false)
  const [passwordSubmitting, setPasswordSubmitting] = useState<boolean>(false)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPortal = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await studentsApi.getMyPortal()
        if (res.success && res.data) {
          setData(res.data)
          // If student has classes, automatically select the first class
          if (res.data.enrollments && res.data.enrollments.length > 0) {
            loadClassDetails(res.data.enrollments[0].classId)
          }
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
    loadNotifications()
    loadSchedules()
    loadProfile()

    // Sync active tab from pathname
    const path = location.pathname
    if (path.includes('/schedule')) setActiveTab('schedule')
    else if (path.includes('/attendance')) setActiveTab('attendance')
    else if (path.includes('/tuition') || path.includes('/finance')) setActiveTab('finance')
    else if (path.includes('/announcements') || path.includes('/notifications')) setActiveTab('notifications')
    else if (path.includes('/profile') || path.includes('/security')) setActiveTab('profile')
    else if (path.includes('/courses') || path.includes('/classes')) setActiveTab('classes')
  }, [location.pathname])

  const loadSchedules = async () => {
    try {
      const res = await studentsApi.getMySchedule()
      if (res.success && res.data) {
        setSchedules(res.data)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const loadProfile = async () => {
    try {
      const res = await studentsApi.getMyProfile()
      if (res.success && res.data) {
        setProfileData(res.data)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const loadNotifications = async () => {
    setLoadingNotifications(true)
    try {
      const res = await studentsApi.getMyNotifications()
      if (res.success && res.data) {
        setNotifications(res.data)
      }
    } catch {
      // Non-fatal
    } finally {
      setLoadingNotifications(false)
    }
  }

  const loadClassDetails = async (classId: number) => {
    setSelectedClassId(classId)
    setLoadingClassDetail(true)
    setClassDetailError(null)
    try {
      const res = await studentsApi.getClassDetails(classId)
      if (res.success && res.data) {
        setClassDetail(res.data)
      } else {
        setClassDetailError(res.message || 'Không thể tải chi tiết lớp học')
      }
    } catch (err: unknown) {
      const e = err as { message?: string }
      setClassDetailError(e.message || 'Không có quyền truy cập hoặc lỗi máy chủ')
    } finally {
      setLoadingClassDetail(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordSuccess(null)
    setPasswordError(null)

    if (!currentPassword || !newPassword) {
      setPasswordError('Vui lòng nhập đầy đủ thông tin mật khẩu')
      return
    }

    if (newPassword.length < 6) {
      setPasswordError('Mật khẩu mới phải có tối thiểu 6 ký tự')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Mật khẩu mới và xác nhận mật khẩu không trùng khớp')
      return
    }

    setPasswordSubmitting(true)
    try {
      const res = await studentsApi.changePassword({ currentPassword, newPassword })
      if (res.success) {
        setPasswordSuccess('Đổi mật khẩu thành công! Mật khẩu mới đã được cập nhật an toàn.')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setPasswordError(res.message || 'Đổi mật khẩu thất bại')
      }
    } catch (err: unknown) {
      const e = err as { message?: string }
      setPasswordError(e.message || 'Mật khẩu hiện tại không chính xác')
    } finally {
      setPasswordSubmitting(false)
    }
  }

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

  const renderMaterialBadge = (type: string) => {
    switch (type) {
      case 'SLIDE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">SLIDE</span>
      case 'EXERCISE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">BÀI TẬP</span>
      case 'VIDEO':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">VIDEO</span>
      case 'LINK':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300">LIÊN KẾT</span>
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">TÀI LIỆU</span>
    }
  }

  const renderAttendanceBadge = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1"><CheckCircle2 size={12} /> Có mặt</span>
      case 'LATE':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 flex items-center gap-1"><Clock size={12} /> Đi muộn</span>
      case 'ABSENT':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 flex items-center gap-1"><AlertTriangle size={12} /> Vắng mặt</span>
      default:
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">Chưa ghi nhận</span>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0B1220] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-[#142B4A] dark:border-[#38BDF8] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-600 dark:text-[#A6B4C8]">
            Đang tải dữ liệu Cổng học viên CH Academy...
          </p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0B1220] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-[#151F31] rounded-3xl p-8 border border-slate-200 dark:border-[#2A3A50] text-center shadow-xl">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-800 dark:text-[#E8EEF7] mb-2">
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
              className="px-5 py-2 bg-[#142B4A] dark:bg-[#38BDF8] text-white dark:text-[#0B1220] rounded-xl text-sm font-bold"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </div>
    )
  }

  const { student, enrollments, payments, totalTuition, paidTuition, remainingTuition, totalSessions, presentSessions, attendanceRate } = data
  const paymentPercentage = totalTuition > 0 ? Math.min(100, Math.round((paidTuition / totalTuition) * 100)) : 100

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1220] text-slate-800 dark:text-[#E8EEF7] font-sans pb-16">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#151F31]/80 backdrop-blur-md border-b border-slate-200/80 dark:border-[#2A3A50]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#142B4A] dark:bg-[#38BDF8] flex items-center justify-center text-white dark:text-[#0B1220] shadow-sm">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="text-base font-black tracking-tight text-[#142B4A] dark:text-[#E8EEF7] flex items-center gap-2">
                <span>CH Academy</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-[#38BDF8]">
                  CỔNG HỌC VIÊN
                </span>
              </div>
              <div className="text-xs text-slate-500 dark:text-[#A6B4C8]">
                Không gian học tập & tra cứu điện tử
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#2A3A50] text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
              title="Đăng xuất khỏi hệ thống"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Student Welcome Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#142B4A] via-[#1D4168] to-[#2B5D95] text-white p-6 sm:p-8 shadow-xl">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-cyan-200">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Chào mừng bạn quay trở lại học tập!</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {student.fullName}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-200">
                <span>Mã học viên: <strong className="font-mono text-white">{student.studentCode}</strong></span>
                <span>•</span>
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

            <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 sm:border-l border-white/15 pt-4 sm:pt-0 sm:pl-6 gap-2">
              <div className="text-left sm:text-right">
                <div className="text-[11px] uppercase tracking-wider text-slate-300">
                  Chuyên cần
                </div>
                <div className="text-lg font-black text-emerald-300 flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="w-5 h-5" />
                  <span>{attendanceRate}%</span>
                </div>
                <div className="text-[10px] text-slate-300">
                  {presentSessions} / {totalSessions} buổi tham gia
                </div>
              </div>
              <div className="text-left sm:text-right">
                <div className="text-[11px] uppercase tracking-wider text-slate-300">
                  Tài khoản đăng nhập
                </div>
                <div className="text-xs font-mono text-cyan-300 font-bold">
                  @{user?.username || student.username}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white/80 dark:bg-[#151F31]/80 backdrop-blur-sm p-1.5 rounded-2xl border border-slate-200/80 dark:border-[#2A3A50] shadow-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto scroll-smooth py-0.5 px-1">
            <button
              onClick={() => setActiveTab('classes')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'classes'
                  ? 'bg-[#142B4A] dark:bg-[#38BDF8] text-white dark:text-[#0B1220] shadow-sm font-bold'
                  : 'text-slate-600 dark:text-[#A6B4C8] hover:bg-slate-100 dark:hover:bg-[#1C293D]'
              }`}
            >
              <BookOpen className="w-4 h-4 shrink-0" />
              <span>Khóa học ({enrollments.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('schedule')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'schedule'
                  ? 'bg-[#142B4A] dark:bg-[#38BDF8] text-white dark:text-[#0B1220] shadow-sm font-bold'
                  : 'text-slate-600 dark:text-[#A6B4C8] hover:bg-slate-100 dark:hover:bg-[#1C293D]'
              }`}
            >
              <Clock className="w-4 h-4 shrink-0" />
              <span>Lịch học ({schedules.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('attendance')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'attendance'
                  ? 'bg-[#142B4A] dark:bg-[#38BDF8] text-white dark:text-[#0B1220] shadow-sm font-bold'
                  : 'text-slate-600 dark:text-[#A6B4C8] hover:bg-slate-100 dark:hover:bg-[#1C293D]'
              }`}
            >
              <UserCheck className="w-4 h-4 shrink-0" />
              <span>Chuyên cần ({attendanceRate}%)</span>
            </button>

            <button
              onClick={() => setActiveTab('finance')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'finance'
                  ? 'bg-[#142B4A] dark:bg-[#38BDF8] text-white dark:text-[#0B1220] shadow-sm font-bold'
                  : 'text-slate-600 dark:text-[#A6B4C8] hover:bg-slate-100 dark:hover:bg-[#1C293D]'
              }`}
            >
              <CreditCard className="w-4 h-4 shrink-0" />
              <span>Học phí</span>
            </button>

            <button
              onClick={() => setActiveTab('notifications')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'notifications'
                  ? 'bg-[#142B4A] dark:bg-[#38BDF8] text-white dark:text-[#0B1220] shadow-sm font-bold'
                  : 'text-slate-600 dark:text-[#A6B4C8] hover:bg-slate-100 dark:hover:bg-[#1C293D]'
              }`}
            >
              <Bell className="w-4 h-4 shrink-0" />
              <span>Thông báo ({notifications.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'profile'
                  ? 'bg-[#142B4A] dark:bg-[#38BDF8] text-white dark:text-[#0B1220] shadow-sm font-bold'
                  : 'text-slate-600 dark:text-[#A6B4C8] hover:bg-slate-100 dark:hover:bg-[#1C293D]'
              }`}
            >
              <User className="w-4 h-4 shrink-0" />
              <span>Hồ sơ & Đổi MK</span>
            </button>
          </div>
        </div>

        {/* TAB 1: LỚP HỌC & BÀI GIẢNG / TÀI LIỆU */}
        {activeTab === 'classes' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {enrollments.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-[#151F31] rounded-3xl border border-slate-200 dark:border-[#2A3A50]">
                <BookOpen className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-800 dark:text-[#E8EEF7]">
                  Bạn chưa đăng ký lớp học nào
                </h3>
                <p className="text-sm text-slate-500 dark:text-[#A6B4C8] mt-1 max-w-md mx-auto">
                  Học viên chỉ có thể vào học và xem tài liệu của các khóa học mà mình đã đăng ký. Vui lòng liên hệ ban quản trị để được hỗ trợ ghi danh.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Enrolled Classes List */}
                <div className="lg:col-span-1 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#A6B4C8]">
                    Lớp bạn đã đăng ký ({enrollments.length})
                  </h3>
                  {enrollments.map((e) => {
                    const isSelected = selectedClassId === e.classId
                    return (
                      <div
                        key={e.id}
                        onClick={() => loadClassDetails(e.classId)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-400 dark:border-blue-600 shadow-md ring-2 ring-blue-500/20'
                            : 'bg-white dark:bg-[#151F31] border-slate-200/80 dark:border-[#2A3A50] hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-[#38BDF8]">
                            {e.courseName || 'Khóa học tiêu chuẩn'}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                            {e.status === 'ENROLLED' ? 'Đang học' : e.status}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-[#E8EEF7] mt-1">
                          {e.className}
                        </h4>
                        <div className="text-[11px] text-slate-500 dark:text-[#A6B4C8] mt-2 flex items-center justify-between">
                          <span>Ghi danh: {formatDate(e.enrollmentDate)}</span>
                          <span className="font-bold text-[#142B4A] dark:text-[#38BDF8] flex items-center gap-1">
                            Xem bài giảng <ChevronRight size={12} />
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Right Column: Sessions, Attendance & Teacher Uploaded Materials */}
                <div className="lg:col-span-2 space-y-4">
                  {loadingClassDetail ? (
                    <div className="p-12 text-center bg-white dark:bg-[#151F31] rounded-3xl border border-slate-200 dark:border-[#2A3A50]">
                      <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <p className="text-xs text-slate-500">Đang tải tài liệu và lộ trình lớp học...</p>
                    </div>
                  ) : classDetailError ? (
                    <div className="p-8 text-center bg-rose-50 dark:bg-rose-950/30 rounded-3xl border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300">
                      <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm font-semibold">{classDetailError}</p>
                    </div>
                  ) : classDetail ? (
                    <div className="space-y-4">
                      {/* Class Header Card */}
                      <div className="p-5 rounded-2xl bg-white dark:bg-[#151F31] border border-slate-200 dark:border-[#2A3A50] shadow-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="text-xs font-bold text-blue-600 dark:text-[#38BDF8] uppercase tracking-wider">
                              {classDetail.courseName}
                            </div>
                            <h2 className="text-lg font-black text-slate-900 dark:text-[#E8EEF7] mt-0.5">
                              {classDetail.name} ({classDetail.code})
                            </h2>
                          </div>
                          <div className="text-xs text-slate-500 dark:text-[#A6B4C8] space-y-0.5 sm:text-right">
                            <div>Giảng viên: <strong className="text-slate-800 dark:text-slate-200">{classDetail.teacherName || 'Đang cập nhật'}</strong></div>
                            <div>Phòng học: <strong className="text-slate-800 dark:text-slate-200">{classDetail.room || 'Executive 302'}</strong></div>
                          </div>
                        </div>
                      </div>

                      {/* Sessions List */}
                      <div className="space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#A6B4C8]">
                          Lộ trình bài học & Tài liệu cô giáo đẩy lên ({classDetail.sessions.length} buổi)
                        </h3>

                        {classDetail.sessions.length === 0 ? (
                          <div className="p-8 text-center bg-white dark:bg-[#151F31] rounded-2xl border border-slate-200 dark:border-[#2A3A50] text-xs text-slate-500">
                            Chưa có buổi học nào được lên lịch cho lớp này.
                          </div>
                        ) : (
                          classDetail.sessions.map((session, index) => (
                            <div
                              key={session.id}
                              className="p-5 rounded-2xl bg-white dark:bg-[#151F31] border border-slate-200/80 dark:border-[#2A3A50] shadow-xs space-y-3"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-[#2A3A50]">
                                <div className="flex items-center gap-2">
                                  <span className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 font-bold text-xs flex items-center justify-center">
                                    {index + 1}
                                  </span>
                                  <h4 className="text-sm font-bold text-slate-800 dark:text-[#E8EEF7]">
                                    {session.topic || `Buổi ${index + 1}`}
                                  </h4>
                                </div>
                                <div className="flex items-center gap-2">
                                  {renderAttendanceBadge(session.attendanceStatus)}
                                  <span className="text-[11px] font-mono text-slate-500 dark:text-[#A6B4C8]">
                                    {formatDate(session.sessionDate)} ({session.startTime} - {session.endTime})
                                  </span>
                                </div>
                              </div>

                              {/* Teacher Note */}
                              {session.teacherNote && (
                                <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-300">
                                  <strong>Nhận xét của giáo viên:</strong> {session.teacherNote}
                                </div>
                              )}

                              {/* Materials Section */}
                              <div className="space-y-2 pt-1">
                                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                                  <FileText size={12} />
                                  <span>Tài liệu buổi học ({session.materials.length}):</span>
                                </div>

                                {session.materials.length === 0 ? (
                                  <p className="text-xs text-slate-400 italic pl-4">
                                    Chưa có tài liệu đính kèm cho buổi học này.
                                  </p>
                                ) : (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {session.materials.map((mat) => (
                                      <a
                                        key={mat.id}
                                        href={mat.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-3 rounded-xl bg-slate-50 dark:bg-[#1C293D]/60 border border-slate-200/80 dark:border-[#2A3A50] hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xs transition flex items-start justify-between group"
                                      >
                                        <div className="space-y-1 pr-2">
                                          <div className="flex items-center gap-1.5">
                                            {renderMaterialBadge(mat.materialType)}
                                            <span className="text-xs font-bold text-slate-800 dark:text-[#E8EEF7] line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-sky-400 transition">
                                              {mat.title}
                                            </span>
                                          </div>
                                          {mat.description && (
                                            <p className="text-[11px] text-slate-500 dark:text-[#A6B4C8] line-clamp-2">
                                              {mat.description}
                                            </p>
                                          )}
                                        </div>
                                        <div className="p-1.5 rounded-lg bg-white dark:bg-[#151F31] text-blue-600 dark:text-[#38BDF8] flex-shrink-0 group-hover:scale-105 transition">
                                          <ExternalLink size={14} />
                                        </div>
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: THÔNG BÁO TỪ TRUNG TÂM & GIÁO VIÊN */}
        {activeTab === 'notifications' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#A6B4C8]">
                Bảng tin & Thông báo quan trọng
              </h3>
              <span className="text-xs text-slate-400">
                Tự động cập nhật từ Ban quản trị và Giáo viên lớp học
              </span>
            </div>

            {loadingNotifications ? (
              <div className="p-12 text-center bg-white dark:bg-[#151F31] rounded-3xl border border-slate-200 dark:border-[#2A3A50]">
                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-500">Đang tải thông báo...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-[#151F31] rounded-3xl border border-slate-200 dark:border-[#2A3A50]">
                <Bell className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-600 dark:text-[#A6B4C8]">
                  Hiện tại không có thông báo mới nào
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`hover-lift p-6 rounded-2xl border transition-all duration-200 ${
                      n.priority === 'URGENT'
                        ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900 shadow-sm'
                        : n.priority === 'HIGH'
                        ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900 shadow-sm'
                        : 'bg-white dark:bg-[#151F31] border-slate-200/80 dark:border-[#2A3A50] shadow-xs hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          {n.priority === 'URGENT' && (
                            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase bg-rose-600 text-white shadow-xs">
                              KHẨN CẤP
                            </span>
                          )}
                          {n.priority === 'HIGH' && (
                            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase bg-amber-500 text-white shadow-xs">
                              QUAN TRỌNG
                            </span>
                          )}
                          {n.targetAudience === 'CLASS' && (
                            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                              LỚP HỌC
                            </span>
                          )}
                          <span className="text-xs font-mono text-slate-400 dark:text-slate-500">
                            {formatDate(n.createdAt)}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-slate-900 dark:text-[#E8EEF7] tracking-tight leading-snug">
                          {n.title}
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-[#A6B4C8] mt-2 whitespace-pre-line leading-relaxed">
                          {n.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: HỌC PHÍ & BIÊN LAI */}
        {activeTab === 'finance' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Tuition Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-[#151F31] border border-slate-200/80 dark:border-[#2A3A50] shadow-sm">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tổng học phí</span>
                <div className="text-2xl font-black text-[#142B4A] dark:text-[#E8EEF7] mt-1">
                  {formatVND(totalTuition)}
                </div>
                <div className="text-xs text-slate-400 mt-1">Khóa học đăng ký</div>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-[#151F31] border border-slate-200/80 dark:border-[#2A3A50] shadow-sm">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Đã thanh toán</span>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                  {formatVND(paidTuition)}
                </div>
                <div className="text-xs text-slate-400 mt-1">Hoàn thành {paymentPercentage}%</div>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-[#151F31] border border-slate-200/80 dark:border-[#2A3A50] shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Học phí còn thiếu</span>
                  <div className={`text-2xl font-black mt-1 ${remainingTuition > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600'}`}>
                    {formatVND(remainingTuition)}
                  </div>
                </div>
                {remainingTuition > 0 && (
                  <button
                    onClick={() => setShowQrModal(true)}
                    className="mt-3 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#142B4A] dark:bg-[#38BDF8] text-white dark:text-[#0B1220] font-bold text-xs shadow-sm hover:opacity-95"
                  >
                    <QrCode size={14} /> Chuyển khoản QR
                  </button>
                )}
              </div>
            </div>

            {/* Payments List */}
            <div className="bg-white dark:bg-[#151F31] rounded-2xl border border-slate-200/80 dark:border-[#2A3A50] shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-[#2A3A50]">
                <h3 className="text-sm font-bold text-slate-900 dark:text-[#E8EEF7]">
                  Lịch sử thanh toán học phí ({payments.length} phiếu thu)
                </h3>
              </div>

              {payments.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  Chưa có giao dịch thanh toán nào được ghi nhận.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 dark:bg-[#1C293D]/60 text-slate-600 dark:text-[#A6B4C8] border-b border-slate-200 dark:border-[#2A3A50]">
                        <th className="py-3 px-4 font-bold">Mã phiếu</th>
                        <th className="py-3 px-4 font-bold">Ngày thanh toán</th>
                        <th className="py-3 px-4 font-bold">Phương thức</th>
                        <th className="py-3 px-4 font-bold">Số tiền</th>
                        <th className="py-3 px-4 font-bold">Mã tham chiếu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#2A3A50]/60">
                      {payments.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-[#1C293D]/30">
                          <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-[#38BDF8]">{p.paymentCode}</td>
                          <td className="py-3 px-4">{formatDate(p.paymentDate)}</td>
                          <td className="py-3 px-4 font-medium">{p.paymentMethod}</td>
                          <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">{formatVND(p.amount)}</td>
                          <td className="py-3 px-4 font-mono text-slate-500">{p.referenceNumber || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: CHUYÊN CẦN & ĐIỂM DANH */}
        {activeTab === 'attendance' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="p-6 rounded-3xl bg-white dark:bg-[#151F31] border border-slate-200/80 dark:border-[#2A3A50] shadow-xs">
              <h3 className="text-base font-bold text-slate-900 dark:text-[#E8EEF7] mb-2">
                Tổng hợp chuyên cần học tập
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#A6B4C8] mb-6">
                Tỷ lệ chuyên cần đạt {attendanceRate}%, đã tham gia {presentSessions} trên tổng số {totalSessions} buổi học.
              </p>

              <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${attendanceRate}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB: LỊCH HỌC TUẦN & THÁNG */}
        {activeTab === 'schedule' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="p-6 rounded-3xl bg-white dark:bg-[#151F31] border border-slate-200/80 dark:border-[#2A3A50] shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#2A3A50] mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-[#E8EEF7] flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-600 dark:text-[#38BDF8]" />
                    Lịch học các khóa đã đăng ký ({schedules.length} buổi)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Chỉ hiển thị lịch học của các lớp mà bạn đã ghi danh và được kích hoạt.
                  </p>
                </div>
              </div>

              {schedules.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400">
                  Hiện chưa có lịch học nào được xếp cho khóa học của bạn.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {schedules.map((sc, idx) => (
                    <div
                      key={sc.sessionId || idx}
                      className="p-5 rounded-2xl bg-slate-50 dark:bg-[#1C293D]/60 border border-slate-200/80 dark:border-[#2A3A50] space-y-3 hover:shadow-md transition"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
                          {sc.className}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            sc.attendanceStatus === 'PRESENT'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : sc.attendanceStatus === 'LATE'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : sc.attendanceStatus === 'ABSENT'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                              : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {sc.attendanceStatus === 'PRESENT'
                            ? 'Đã có mặt'
                            : sc.attendanceStatus === 'LATE'
                            ? 'Đi muộn'
                            : sc.attendanceStatus === 'ABSENT'
                            ? 'Vắng mặt'
                            : 'Chưa diễn ra'}
                        </span>
                      </div>

                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-[#E8EEF7] line-clamp-2">
                          {sc.topic || 'Buổi học'}
                        </div>
                      </div>

                      <div className="space-y-1 text-xs text-slate-600 dark:text-[#A6B4C8] pt-2 border-t border-slate-200/60 dark:border-slate-700">
                        <div className="flex items-center gap-1.5 font-mono">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{sc.sessionDate}</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-mono">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{sc.startTime?.slice(0, 5)} - {sc.endTime?.slice(0, 5)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{sc.room || 'Executive Room 302'}</span>
                        </div>
                        {sc.teacherName && (
                          <div className="text-[11px] text-slate-500 mt-1">
                            GV: <strong>{sc.teacherName}</strong>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: HỒ SƠ CÁ NHÂN & ĐỔI MẬT KHẨU */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-150">
            {/* Student Profile Info */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#151F31] border border-slate-200/80 dark:border-[#2A3A50] shadow-sm space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-[#2A3A50]">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <User size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-[#E8EEF7]">
                    Thông tin học viên
                  </h3>
                  <p className="text-xs text-slate-500">
                    Hồ sơ định danh được lưu trữ bảo mật tại CH Academy
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1C293D]/60 border border-slate-100 dark:border-[#2A3A50]">
                  <div className="text-slate-400 font-medium">Mã học viên</div>
                  <div className="font-bold text-slate-900 dark:text-white mt-0.5 font-mono">{student.studentCode}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1C293D]/60 border border-slate-100 dark:border-[#2A3A50]">
                  <div className="text-slate-400 font-medium">Họ và tên</div>
                  <div className="font-bold text-slate-900 dark:text-white mt-0.5">{student.fullName}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1C293D]/60 border border-slate-100 dark:border-[#2A3A50]">
                  <div className="text-slate-400 font-medium">Số điện thoại</div>
                  <div className="font-bold text-slate-900 dark:text-white mt-0.5">{student.phone || '—'}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1C293D]/60 border border-slate-100 dark:border-[#2A3A50]">
                  <div className="text-slate-400 font-medium">Email</div>
                  <div className="font-bold text-slate-900 dark:text-white mt-0.5">{student.email || '—'}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1C293D]/60 border border-slate-100 dark:border-[#2A3A50]">
                  <div className="text-slate-400 font-medium">Ngày sinh</div>
                  <div className="font-bold text-slate-900 dark:text-white mt-0.5">{student.dateOfBirth || '—'}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1C293D]/60 border border-slate-100 dark:border-[#2A3A50]">
                  <div className="text-slate-400 font-medium">Tên đăng nhập portal</div>
                  <div className="font-bold text-cyan-600 dark:text-cyan-400 mt-0.5 font-mono">@{student.username || user?.username}</div>
                </div>
              </div>

              {/* Guardians section if exists */}
              {profileData?.guardians && profileData.guardians.length > 0 && (
                <div className="pt-3 border-t border-slate-100 dark:border-[#2A3A50] space-y-2">
                  <div className="text-xs font-bold text-slate-800 dark:text-white">Thông tin Người giám hộ / Phụ huynh:</div>
                  {profileData.guardians.map((g) => (
                    <div key={g.id} className="p-3 rounded-xl bg-slate-50 dark:bg-[#1C293D]/40 text-xs flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">{g.fullName} ({g.relationshipType})</div>
                        <div className="text-slate-400 font-mono text-[11px]">{g.phone} {g.email ? `• ${g.email}` : ''}</div>
                      </div>
                      {g.isPrimaryContact && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                          Liên hệ chính
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Change Password Form */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#151F31] border border-slate-200/80 dark:border-[#2A3A50] shadow-sm space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-[#2A3A50]">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-[#38BDF8] flex items-center justify-center">
                  <Lock size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-[#E8EEF7]">
                    Đổi mật khẩu bảo mật
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-[#A6B4C8]">
                    Mật khẩu mới tự động đồng bộ lên bảng quản trị Admin để hỗ trợ khi cần.
                  </p>
                </div>
              </div>

              {passwordSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              {passwordError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle size={16} />
                  <span>{passwordError}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] mb-1">
                    Mật khẩu hiện tại
                  </label>
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Nhập mật khẩu hiện tại"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-slate-50/50 dark:bg-[#1C293D] text-sm text-[#142B4A] dark:text-[#E8EEF7]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] mb-1">
                    Mật khẩu mới
                  </label>
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-slate-50/50 dark:bg-[#1C293D] text-sm text-[#142B4A] dark:text-[#E8EEF7]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] mb-1">
                    Xác nhận mật khẩu mới
                  </label>
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-slate-50/50 dark:bg-[#1C293D] text-sm text-[#142B4A] dark:text-[#E8EEF7]"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-[#A6B4C8] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showPasswords}
                      onChange={(e) => setShowPasswords(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span>Hiện mật khẩu</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={passwordSubmitting}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#142B4A] dark:bg-[#38BDF8] text-white dark:text-[#0B1220] font-bold text-xs shadow-md hover:opacity-90 disabled:opacity-50 transition"
                >
                  {passwordSubmitting ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* QR Bank Transfer Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#151F31] rounded-3xl border border-slate-200 dark:border-[#2A3A50] max-w-sm w-full p-6 text-center shadow-2xl relative">
            <h3 className="text-base font-bold text-[#142B4A] dark:text-[#E8EEF7] mb-1">
              Thanh toán chuyển khoản nhanh
            </h3>
            <p className="text-xs text-slate-500 dark:text-[#A6B4C8] mb-4">
              Quét mã QR bằng App ngân hàng để đóng học phí
            </p>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 inline-block shadow-inner mb-4">
              <img
                src={`https://api.vietqr.io/image/970422-0901234567-compact2.jpg?amount=${remainingTuition}&addInfo=${student.studentCode}+HOCPHI`}
                alt="QR Code Thanh Toán"
                className="w-48 h-48 object-contain mx-auto"
              />
            </div>

            <div className="text-xs text-left bg-slate-50 dark:bg-[#1C293D] p-3 rounded-xl space-y-1 mb-4 font-mono">
              <div>Ngân hàng: <strong>MBBank (Quân Đội)</strong></div>
              <div>STK: <strong>0901234567</strong></div>
              <div>Chủ TK: <strong>CH ACADEMY EDUCATION</strong></div>
              <div>Số tiền: <strong className="text-emerald-600">{formatVND(remainingTuition)}</strong></div>
              <div>Nội dung: <strong>{student.studentCode} HOCPHI</strong></div>
            </div>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-[#1C293D] text-slate-700 dark:text-[#E8EEF7] font-semibold text-xs hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            >
              Đóng cửa sổ
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default StudentPortalPage
