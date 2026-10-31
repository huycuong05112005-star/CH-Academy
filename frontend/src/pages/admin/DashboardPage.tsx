import React, { useEffect, useState, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useSettings } from '../../context/SettingsContext'
import { dashboardApi } from '../../api/dashboard'
import type { DashboardStats } from '../../types/dashboard'
import {
  BookOpen,
  Users,
  Calendar,
  UserPlus,
  RefreshCw,
  DollarSign,
  TrendingUp,
  Clock,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  AlertCircle,
  Download,
  CheckCircle2,
  FileText,
  Layers,
  ChevronDown,
  CheckSquare
} from 'lucide-react'
import { StatCard } from '../../components/ui/StatCard'
import { Badge } from '../../components/ui/Badge'
import { exportToCsv } from '../../utils/exportCsv'
import { Tilt3DCard } from '../../components/3d/Tilt3DCard'
import { CyberOrb3D } from '../../components/3d/CyberOrb3D'

export const DashboardPage: React.FC = () => {
  const { user } = useAuth()
  const { settings } = useSettings()

  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [statsLoading, setStatsLoading] = useState<boolean>(true)
  const [statsError, setStatsError] = useState<string | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>(() => searchParams.get('year') || '2026-2027')
  const [sessionFilter, setSessionFilter] = useState<'ALL' | 'TODAY' | 'UPCOMING'>('ALL')

  const fetchStats = async (yearToFetch?: string) => {
    setStatsLoading(true)
    setStatsError(null)
    const targetYear = yearToFetch || selectedAcademicYear
    try {
      const data = await dashboardApi.getStats(targetYear)
      setStats(data)
      if (data.academicYear && data.academicYear !== selectedAcademicYear) {
        setSelectedAcademicYear(data.academicYear)
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Không thể tải thống kê bảng điều khiển'
      setStatsError(errorMsg)
    } finally {
      setStatsLoading(false)
    }
  }

  useEffect(() => {
    const yr = searchParams.get('year') || selectedAcademicYear
    if (yr !== selectedAcademicYear) {
      setSelectedAcademicYear(yr)
    }
    fetchStats(yr)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const handleYearChange = (newYear: string) => {
    setSelectedAcademicYear(newYear)
    setSearchParams((prev) => {
      const updated = new URLSearchParams(prev)
      updated.set('year', newYear)
      return updated
    })
    fetchStats(newYear)
  }

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0)
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-'
    try {
      const clean = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr
      const parts = clean.split('-')
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`
      return dateStr
    } catch {
      return dateStr || '-'
    }
  }

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '--:--'
    return timeStr.substring(0, 5)
  }

  // Filtered upcoming sessions based on tab
  const filteredSessions = useMemo(() => {
    if (!stats?.upcomingSessions) return []
    if (sessionFilter === 'ALL') return stats.upcomingSessions

    const todayStr = new Date().toISOString().split('T')[0]
    if (sessionFilter === 'TODAY') {
      return stats.upcomingSessions.filter((s) => s.sessionDate?.startsWith(todayStr))
    }
    if (sessionFilter === 'UPCOMING') {
      return stats.upcomingSessions.filter((s) => s.sessionDate && s.sessionDate >= todayStr)
    }
    return stats.upcomingSessions
  }, [stats?.upcomingSessions, sessionFilter])

  const handleExportSchedule = () => {
    if (!filteredSessions || filteredSessions.length === 0) return
    const headers = ['STT', 'Ngày học', 'Giờ học', 'Mã lớp', 'Tên lớp học', 'Giáo viên', 'Phòng học', 'Trạng thái']
    const rows = filteredSessions.map((s, idx) => [
      idx + 1,
      formatDate(s.sessionDate),
      `${formatTime(s.startTime)} - ${formatTime(s.endTime)}`,
      s.classCode || '',
      s.className || '',
      s.teacherName || '',
      s.room || 'Chưa xếp',
      s.status === 'SCHEDULED' ? 'Đã lên lịch' : s.status === 'COMPLETED' ? 'Đã hoàn thành' : s.status
    ])
    exportToCsv(`Lich_hoc_${selectedAcademicYear}`, headers, rows)
  }

  const getSessionStatusBadge = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return <Badge variant="primary">Đã lên lịch</Badge>
      case 'COMPLETED':
        return <Badge variant="success">Đã hoàn thành</Badge>
      case 'IN_PROGRESS':
        return <Badge variant="warning">Đang diễn ra</Badge>
      case 'CANCELLED':
        return <Badge variant="danger">Đã hủy</Badge>
      default:
        return <Badge variant="neutral">{status}</Badge>
    }
  }

  const availableYears = stats?.availableAcademicYears && stats.availableAcademicYears.length > 0
    ? stats.availableAcademicYears
    : ['2031-2032', '2030-2031', '2029-2030', '2028-2029', '2027-2028', '2026-2027', '2025-2026', '2024-2025', '2023-2024']

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Clean Professional Welcome Banner & Academic Year Cockpit */}
      <div className="relative overflow-hidden bg-gradient-to-r from-white via-slate-50 to-sky-50/40 dark:from-[#0E1729] dark:via-[#131F35] dark:to-[#0F1B2E] [data-theme=glass]_&:bg-white/[0.08] [data-theme=glass]_&:bg-none [data-theme=glass]_&:backdrop-blur-2xl [data-theme=glass]_&:border-white/20 [data-theme=glass]_&:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.22)] p-6 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-[#20314C] shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6 card-depth-3d">
        <div className="flex items-center gap-5 relative z-10">
          <div className="hidden sm:block shrink-0">
            <CyberOrb3D size={72} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A] dark:text-[#E8EEF7] [data-theme=glass]_&:text-white [data-theme=glass]_&:drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]">
              Xin chào, {user?.fullName || 'Quản trị viên'}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-[#A6B4C8] [data-theme=glass]_&:text-slate-200 mt-1.5 max-w-2xl font-normal leading-relaxed">
              Quản lý đào tạo, lớp học và hoạt động của trung tâm {settings.shortName}.
            </p>
          </div>
        </div>

        {/* Top Controls: Interactive Academic Year Selector & Refresh */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 relative z-10">
          {/* Functional Academic Year Dropdown */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl border border-slate-200/90 dark:border-[#20314C] [data-theme=glass]_&:border-white/20 bg-white dark:bg-[#111C30] [data-theme=glass]_&:bg-white/[0.12] [data-theme=glass]_&:backdrop-blur-xl shadow-xs">
            <Calendar size={15} className="text-[#0284C7] dark:text-[#38BDF8] shrink-0" />
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 [data-theme=glass]_&:text-slate-300">
              Năm học:
            </span>
            <div className="relative inline-flex items-center">
              <select
                aria-label="Chọn năm học"
                value={selectedAcademicYear}
                onChange={(e) => handleYearChange(e.target.value)}
                disabled={statsLoading}
                className="appearance-none bg-transparent pr-6 pl-1 py-1 text-xs font-bold text-slate-800 dark:text-white [data-theme=glass]_&:text-white focus:outline-none cursor-pointer disabled:opacity-50"
              >
                {availableYears.map((yr) => (
                  <option key={yr} value={yr} className="bg-white dark:bg-[#101B2D] text-slate-900 dark:text-white">
                    {yr}
                  </option>
                ))}
              </select>
              <ChevronDown size={13} className="absolute right-0 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Refresh Data Button */}
          <button
            onClick={() => fetchStats()}
            disabled={statsLoading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white dark:bg-[#16253C] [data-theme=glass]_&:bg-white/[0.12] [data-theme=glass]_&:hover:bg-white/[0.18] [data-theme=glass]_&:text-white [data-theme=glass]_&:border-white/20 border border-slate-200/90 dark:border-[#263C5E] hover:bg-slate-100 dark:hover:bg-[#1F3454] text-xs font-bold text-slate-700 dark:text-[#E8EEF7] shadow-xs transition group disabled:opacity-50"
            title="Làm mới dữ liệu thống kê năm học"
          >
            <RefreshCw
              size={14}
              className={`text-slate-500 dark:text-slate-400 group-hover:text-[#0284C7] dark:group-hover:text-[#38BDF8] ${
                statsLoading ? 'animate-spin' : ''
              }`}
            />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* 2. Quick Action Workflow Shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Link
          to="/admin/courses"
          className="flex items-center gap-3 p-3.5 rounded-2xl bg-white dark:bg-[#101B2D] [data-theme=glass]_&:bg-white/[0.08] [data-theme=glass]_&:hover:bg-white/[0.14] [data-theme=glass]_&:backdrop-blur-xl border border-slate-200/80 dark:border-[#1E2E44] [data-theme=glass]_&:border-white/15 hover:border-sky-400 dark:hover:border-sky-500 shadow-2xs hover:shadow-md transition-all group"
        >
          <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/50 [data-theme=glass]_&:bg-sky-500/20 text-sky-600 dark:text-[#38BDF8] [data-theme=glass]_&:text-[#38BDF8] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <BookOpen size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-800 dark:text-white truncate">Khóa học</div>
            <div className="text-[11px] text-slate-400 [data-theme=glass]_&:text-slate-300 truncate">Quản lý chương trình</div>
          </div>
        </Link>

        <Link
          to="/admin/classes"
          className="flex items-center gap-3 p-3.5 rounded-2xl bg-white dark:bg-[#101B2D] [data-theme=glass]_&:bg-white/[0.08] [data-theme=glass]_&:hover:bg-white/[0.14] [data-theme=glass]_&:backdrop-blur-xl border border-slate-200/80 dark:border-[#1E2E44] [data-theme=glass]_&:border-white/15 hover:border-emerald-400 dark:hover:border-emerald-500 shadow-2xs hover:shadow-md transition-all group"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 [data-theme=glass]_&:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 [data-theme=glass]_&:text-emerald-300 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <Calendar size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-800 dark:text-white truncate">Lớp học</div>
            <div className="text-[11px] text-slate-400 [data-theme=glass]_&:text-slate-300 truncate">Lập thời khóa biểu</div>
          </div>
        </Link>

        <Link
          to="/admin/leads"
          className="flex items-center gap-3 p-3.5 rounded-2xl bg-white dark:bg-[#101B2D] [data-theme=glass]_&:bg-white/[0.08] [data-theme=glass]_&:hover:bg-white/[0.14] [data-theme=glass]_&:backdrop-blur-xl border border-slate-200/80 dark:border-[#1E2E44] [data-theme=glass]_&:border-white/15 hover:border-purple-400 dark:hover:border-purple-500 shadow-2xs hover:shadow-md transition-all group"
        >
          <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/50 [data-theme=glass]_&:bg-purple-500/20 text-purple-600 dark:text-purple-400 [data-theme=glass]_&:text-purple-300 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <UserPlus size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-800 dark:text-white truncate">Tuyển sinh</div>
            <div className="text-[11px] text-slate-400 [data-theme=glass]_&:text-slate-300 truncate">Tiếp nhận Lead</div>
          </div>
        </Link>

        <Link
          to="/admin/attendance"
          className="flex items-center gap-3 p-3.5 rounded-2xl bg-white dark:bg-[#101B2D] [data-theme=glass]_&:bg-white/[0.08] [data-theme=glass]_&:hover:bg-white/[0.14] [data-theme=glass]_&:backdrop-blur-xl border border-slate-200/80 dark:border-[#1E2E44] [data-theme=glass]_&:border-white/15 hover:border-amber-400 dark:hover:border-amber-500 shadow-2xs hover:shadow-md transition-all group"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 [data-theme=glass]_&:bg-amber-500/20 text-amber-600 dark:text-amber-400 [data-theme=glass]_&:text-amber-300 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <CheckSquare size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-800 dark:text-white truncate">Điểm danh</div>
            <div className="text-[11px] text-slate-400 [data-theme=glass]_&:text-slate-300 truncate">Kiểm diện hôm nay</div>
          </div>
        </Link>
      </div>

      {/* 3. Standardized 4 Core KPI Stat Cards with Academic Year Context */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Tilt3DCard maxTilt={4} depth="sm">
          <StatCard
            title="Học viên"
            value={statsLoading ? '...' : (stats?.activeStudents ?? 0)}
            subtitle={
              <span>
                Trong năm học {selectedAcademicYear} (Toàn trường: {stats?.totalStudentsCenter ?? 0})
              </span>
            }
            icon={Users}
            to="/admin/students?status=ACTIVE"
            actionText="Xem danh sách"
          />
        </Tilt3DCard>

        <Tilt3DCard maxTilt={4} depth="sm">
          <StatCard
            title="Khóa học"
            value={statsLoading ? '...' : (stats?.totalCourses ?? 0)}
            subtitle="Chương trình đào tạo"
            icon={BookOpen}
            to="/admin/courses"
            actionText="Xem tất cả"
          />
        </Tilt3DCard>

        <Tilt3DCard maxTilt={4} depth="sm">
          <StatCard
            title="Lớp học"
            value={statsLoading ? '...' : (stats?.activeClasses ?? 0)}
            subtitle={`Lớp vận hành trong năm ${selectedAcademicYear}`}
            icon={Calendar}
            to="/admin/classes"
            actionText="Xem các lớp"
          />
        </Tilt3DCard>

        <Tilt3DCard maxTilt={4} depth="sm">
          <StatCard
            title="Tuyển sinh"
            value={statsLoading ? '...' : (stats?.totalLeads ?? 0)}
            subtitle={
              <span className="text-sky-600 dark:text-[#38BDF8] font-bold">
                {stats?.leadConversionRate ?? 0}% chuyển đổi ({stats?.convertedLeads ?? 0} nhập học)
              </span>
            }
            icon={UserPlus}
            to="/admin/leads"
            actionText="Xem Leads"
          />
        </Tilt3DCard>
      </div>

      {/* 4. Financial Health Strip — 3 Dedicated Independent Glass Cards (No Overlaps) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 [data-theme=glass]_&:text-slate-300 uppercase tracking-wider px-1">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#0284C7] dark:text-[#38BDF8]" />
            <span>Chỉ số tài chính năm học ({selectedAcademicYear})</span>
          </div>
          <Link
            to="/admin/finance"
            className="text-[#0284C7] dark:text-[#38BDF8] hover:underline flex items-center gap-1 normal-case text-xs font-bold"
          >
            <span>Mở Sổ quỹ & Học phí</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5">
          {/* Card 1: Học phí phải thu */}
          <Link
            to="/admin/finance?tab=receivables"
            className="group block rounded-2xl p-5 bg-white dark:bg-[#101B2D] [data-theme=glass]_&:bg-white/[0.08] [data-theme=glass]_&:hover:bg-white/[0.14] [data-theme=glass]_&:backdrop-blur-xl border border-slate-200/90 dark:border-[#1E2E44] [data-theme=glass]_&:border-white/20 hover:border-sky-400 dark:hover:border-sky-500 shadow-xs hover:shadow-md transition-all"
            title="Bấm để xem chi tiết danh sách học phí phải thu"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 [data-theme=glass]_&:text-slate-200 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-950/50 [data-theme=glass]_&:bg-sky-500/20 text-[#0284C7] dark:text-[#38BDF8] flex items-center justify-center">
                  <DollarSign size={16} />
                </div>
                Học phí phải thu
              </span>
              <ArrowRight size={14} className="text-slate-400 group-hover:text-sky-500 group-hover:translate-x-1 transition-all" />
            </div>
            <div className="text-2xl lg:text-3xl font-extrabold tracking-tight text-[#0F172A] dark:text-white [data-theme=glass]_&:text-white tabular-nums">
              {statsLoading ? '...' : formatVND(stats?.totalReceivable || 0)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 [data-theme=glass]_&:text-slate-300 mt-2 font-medium">
              Theo hợp đồng & biểu phí niêm yết
            </div>
          </Link>

          {/* Card 2: Đã thanh toán */}
          <Link
            to="/admin/finance?tab=payments"
            className="group block rounded-2xl p-5 bg-white dark:bg-[#101B2D] [data-theme=glass]_&:bg-white/[0.08] [data-theme=glass]_&:hover:bg-white/[0.14] [data-theme=glass]_&:backdrop-blur-xl border border-slate-200/90 dark:border-[#1E2E44] [data-theme=glass]_&:border-white/20 hover:border-emerald-400 dark:hover:border-emerald-500 shadow-xs hover:shadow-md transition-all"
            title="Bấm để xem toàn bộ giao dịch thanh toán thực thu"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 [data-theme=glass]_&:text-slate-200 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 [data-theme=glass]_&:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <TrendingUp size={16} />
                </div>
                Đã thanh toán
              </span>
              <ArrowRight size={14} className="text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
            </div>
            <div className="text-2xl lg:text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400 [data-theme=glass]_&:text-emerald-300 tabular-nums">
              {statsLoading ? '...' : formatVND(stats?.totalPaid || 0)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 [data-theme=glass]_&:text-slate-300 mt-2 font-medium">
              Đã ghi nhận giao dịch vào hệ thống
            </div>
          </Link>

          {/* Card 3: Công nợ còn lại */}
          <Link
            to="/admin/finance?tab=receivables&status=UNPAID"
            className="group block rounded-2xl p-5 bg-white dark:bg-[#101B2D] [data-theme=glass]_&:bg-white/[0.08] [data-theme=glass]_&:hover:bg-white/[0.14] [data-theme=glass]_&:backdrop-blur-xl border border-slate-200/90 dark:border-[#1E2E44] [data-theme=glass]_&:border-white/20 hover:border-rose-400 dark:hover:border-rose-500 shadow-xs hover:shadow-md transition-all"
            title="Bấm để lọc các khoản công nợ chưa hoàn tất"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 [data-theme=glass]_&:text-slate-200 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/50 [data-theme=glass]_&:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <CreditCard size={16} />
                </div>
                Công nợ còn lại
              </span>
              <ArrowRight size={14} className="text-slate-400 group-hover:text-rose-500 group-hover:translate-x-1 transition-all" />
            </div>
            <div className="text-2xl lg:text-3xl font-extrabold tracking-tight text-rose-600 dark:text-rose-400 [data-theme=glass]_&:text-rose-300 tabular-nums">
              {statsLoading ? '...' : formatVND(stats?.totalDebt || 0)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 [data-theme=glass]_&:text-slate-300 mt-2 font-medium">
              Các khoản chưa hoàn tất thanh toán
            </div>
          </Link>
        </div>
      </div>

      {/* 5. Main Grid: Upcoming Sessions & Operational Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Upcoming Sessions Table */}
        <div className="lg:col-span-2 bg-white dark:bg-[#101B2D] [data-theme=glass]_&:bg-white/[0.08] [data-theme=glass]_&:backdrop-blur-2xl rounded-3xl border border-slate-200/80 dark:border-[#1E2E44] [data-theme=glass]_&:border-white/15 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#20314C] mb-4 gap-2 flex-wrap">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-[#38BDF8] flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#0F172A] dark:text-[#E8EEF7]">
                    Lịch học sắp diễn ra
                  </h2>
                  <div className="text-[11px] text-slate-400">Thời khóa biểu năm học {selectedAcademicYear}</div>
                </div>
              </div>

              {/* Filter Pills & Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-[#152338] text-xs font-bold">
                  <button
                    onClick={() => setSessionFilter('ALL')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      sessionFilter === 'ALL'
                        ? 'bg-white dark:bg-[#20314C] text-[#0284C7] dark:text-[#38BDF8] shadow-2xs'
                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                    }`}
                  >
                    Tất cả
                  </button>
                  <button
                    onClick={() => setSessionFilter('TODAY')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      sessionFilter === 'TODAY'
                        ? 'bg-white dark:bg-[#20314C] text-[#0284C7] dark:text-[#38BDF8] shadow-2xs'
                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                    }`}
                  >
                    Hôm nay
                  </button>
                  <button
                    onClick={() => setSessionFilter('UPCOMING')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      sessionFilter === 'UPCOMING'
                        ? 'bg-white dark:bg-[#20314C] text-[#0284C7] dark:text-[#38BDF8] shadow-2xs'
                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                    }`}
                  >
                    7 ngày tới
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleExportSchedule}
                  disabled={filteredSessions.length === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#152338] hover:bg-slate-50 dark:hover:bg-[#1B2F4C] text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] shadow-2xs transition disabled:opacity-40"
                  title="Xuất file CSV mở trên Excel"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="hidden sm:inline">Xuất CSV</span>
                </button>
                <Link
                  to="/admin/attendance"
                  className="text-xs font-bold text-[#0284C7] dark:text-[#38BDF8] hover:underline flex items-center gap-1 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-[#152338] transition"
                >
                  <span>Điểm danh</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {statsLoading ? (
              <div className="py-12 text-center text-sm text-slate-500 dark:text-[#A6B4C8]">
                <RefreshCw className="w-6 h-6 animate-spin text-sky-500 mx-auto mb-2" />
                <span>Đang tải lịch học...</span>
              </div>
            ) : statsError ? (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{statsError}</span>
              </div>
            ) : filteredSessions.length > 0 ? (
              <div className="overflow-x-auto rounded-2xl border border-slate-200/70 dark:border-[#1E2E44]">
                <table className="w-full text-left border-collapse text-table min-w-[840px]">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-[#142033] border-b border-slate-200 dark:border-[#1E2E44] text-[11px] font-extrabold text-slate-500 dark:text-[#A6B4C8] uppercase tracking-wider">
                      <th className="py-3 px-3.5 w-[115px] whitespace-nowrap">Ngày</th>
                      <th className="py-3 px-3.5 w-[120px] whitespace-nowrap">Giờ</th>
                      <th className="py-3 px-3.5 min-w-[220px]">Lớp học</th>
                      <th className="py-3 px-3.5 min-w-[150px] whitespace-nowrap">Giáo viên</th>
                      <th className="py-3 px-3.5 min-w-[130px] whitespace-nowrap">Phòng</th>
                      <th className="py-3 px-3.5 w-[115px] text-center whitespace-nowrap">Trạng thái</th>
                      <th className="py-3 px-3.5 w-[110px] text-right whitespace-nowrap">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#1E2E44]/60">
                    {filteredSessions.map((session) => (
                      <tr key={session.id} className="hover:bg-slate-50/80 dark:hover:bg-[#142236]/60 transition">
                        <td className="py-3 px-3.5 font-bold text-slate-800 dark:text-[#E8EEF7] text-xs whitespace-nowrap">
                          {formatDate(session.sessionDate)}
                        </td>
                        <td className="py-3 px-3.5 text-xs text-slate-600 dark:text-[#A6B4C8] whitespace-nowrap font-mono font-medium">
                          {formatTime(session.startTime)} - {formatTime(session.endTime)}
                        </td>
                        <td className="py-3 px-3.5">
                          <Link
                            to={`/admin/classes?classId=${session.classId || ''}`}
                            className="font-bold text-[#0284C7] dark:text-[#38BDF8] text-xs leading-snug break-words hover:underline"
                            title="Xem chi tiết lớp học"
                          >
                            {session.className}
                          </Link>
                          <div className="text-[11px] font-mono text-slate-500 dark:text-[#A6B4C8] mt-0.5">
                            {session.classCode}
                          </div>
                        </td>
                        <td className="py-3 px-3.5 text-xs text-slate-700 dark:text-[#E8EEF7] whitespace-nowrap font-semibold">
                          {session.teacherName}
                        </td>
                        <td className="py-3 px-3.5 text-xs text-slate-600 dark:text-[#A6B4C8] whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#1A2A42] font-mono text-[11px] font-medium">
                            {session.room || 'Chưa xếp'}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-center whitespace-nowrap">
                          {getSessionStatusBadge(session.status)}
                        </td>
                        <td className="py-3 px-3.5 text-right whitespace-nowrap">
                          <Link
                            to={`/admin/attendance?classId=${session.classId || ''}&sessionId=${session.id || ''}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#0284C7] dark:text-[#38BDF8] bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-900/50 transition shadow-2xs"
                            title="Mở bảng điểm danh cho buổi học này"
                          >
                            <span>Điểm danh</span>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center bg-slate-50/60 dark:bg-[#142033]/40 rounded-2xl border border-dashed border-slate-200 dark:border-[#20314C] p-6">
                <Calendar className="w-8 h-8 text-slate-400 dark:text-slate-500 mx-auto mb-2 opacity-60" />
                <p className="text-sm font-bold text-slate-700 dark:text-[#E8EEF7]">
                  Không có buổi học nào trong năm học {selectedAcademicYear}
                </p>
                <p className="text-xs text-slate-500 dark:text-[#A6B4C8] mt-1">
                  Chọn năm học khác hoặc tạo thêm lớp học trong phần Quản lý đào tạo.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Business Shortcuts & Center Information */}
        <div className="space-y-6">
          {/* Business Shortcuts Widget */}
          <div className="bg-white dark:bg-[#101B2D] [data-theme=glass]_&:bg-white/[0.08] [data-theme=glass]_&:backdrop-blur-2xl rounded-3xl border border-slate-200/80 dark:border-[#1E2E44] [data-theme=glass]_&:border-white/15 shadow-sm p-5 space-y-4">
            <div className="pb-3 border-b border-slate-100 dark:border-slate-800 [data-theme=glass]_&:border-white/10">
              <h3 className="text-xs font-black text-[#0F172A] dark:text-[#E8EEF7] uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#0284C7] dark:text-[#38BDF8]" />
                <span>Lối tắt nghiệp vụ</span>
              </h3>
            </div>

            <div className="space-y-3">
              <Link
                to="/admin/assessment/approval"
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-[#152338] [data-theme=glass]_&:bg-white/[0.06] [data-theme=glass]_&:hover:bg-white/[0.12] hover:bg-sky-50 dark:hover:bg-[#1B2F4C] border border-slate-200/60 dark:border-[#20314C] [data-theme=glass]_&:border-white/10 transition group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 [data-theme=glass]_&:bg-indigo-500/20 [data-theme=glass]_&:text-indigo-300 flex items-center justify-center font-bold">
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-sky-600 dark:group-hover:text-[#38BDF8]">
                      Phê duyệt đề thi
                    </div>
                    <div className="text-[10px] text-slate-400">Kiểm duyệt đề thi online</div>
                  </div>
                </div>
                <ArrowRight size={14} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                to="/admin/attendance-monitoring"
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-[#152338] [data-theme=glass]_&:bg-white/[0.06] [data-theme=glass]_&:hover:bg-white/[0.12] hover:bg-emerald-50 dark:hover:bg-[#1B2F4C] border border-slate-200/60 dark:border-[#20314C] [data-theme=glass]_&:border-white/10 transition group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 [data-theme=glass]_&:bg-emerald-500/20 [data-theme=glass]_&:text-emerald-300 flex items-center justify-center font-bold">
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                      Giám sát chuyên cần
                    </div>
                    <div className="text-[10px] text-slate-400">Tỷ lệ đi học toàn trường</div>
                  </div>
                </div>
                <ArrowRight size={14} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                to="/admin/audit-logs"
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-[#152338] [data-theme=glass]_&:bg-white/[0.06] [data-theme=glass]_&:hover:bg-white/[0.12] hover:bg-slate-100 dark:hover:bg-[#1B2F4C] border border-slate-200/60 dark:border-[#20314C] [data-theme=glass]_&:border-white/10 transition group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 [data-theme=glass]_&:bg-slate-700/40 [data-theme=glass]_&:text-slate-200 flex items-center justify-center font-bold">
                    <FileText size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Nhật ký truy vết
                    </div>
                    <div className="text-[10px] text-slate-400">Kiểm tra an ninh dữ liệu</div>
                  </div>
                </div>
                <ArrowRight size={14} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Center Info Card */}
          <div className="bg-white dark:bg-[#101B2D] [data-theme=glass]_&:bg-white/[0.08] [data-theme=glass]_&:backdrop-blur-2xl rounded-3xl border border-slate-200/80 dark:border-[#1E2E44] [data-theme=glass]_&:border-white/15 shadow-sm p-5">
            <h3 className="text-xs font-extrabold text-[#0F172A] dark:text-[#E8EEF7] flex items-center gap-2 mb-3 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-[#0284C7] dark:text-[#38BDF8]" />
              <span>{settings.centerName}</span>
            </h3>
            <div className="text-xs text-slate-600 dark:text-[#A6B4C8] space-y-2 font-medium">
              <div>
                <strong className="text-slate-800 dark:text-[#E8EEF7]">Tên thương hiệu:</strong> {settings.shortName}
              </div>
              <div>
                <strong className="text-slate-800 dark:text-[#E8EEF7]">Giờ hoạt động:</strong> 08:00 - 21:30 (Thứ 2 - CN)
              </div>
              <div>
                <strong className="text-slate-800 dark:text-[#E8EEF7]">Hotline học vụ:</strong> {settings.hotline}
              </div>
              <div>
                <strong className="text-slate-800 dark:text-[#E8EEF7]">Email tiếp nhận:</strong> {settings.email}
              </div>
              <div>
                <strong className="text-slate-800 dark:text-[#E8EEF7]">Trụ sở:</strong> {settings.address}
              </div>
              {settings.website && (
                <div>
                  <strong className="text-slate-800 dark:text-[#E8EEF7]">Website:</strong>{' '}
                  <a
                    href={settings.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-600 dark:text-sky-400 hover:underline"
                  >
                    {settings.website}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
