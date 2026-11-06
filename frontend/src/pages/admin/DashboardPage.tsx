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
  CheckSquare,
  Sparkles,
  Search,
  School,
  GraduationCap,
  Percent,
  LayoutDashboard
} from 'lucide-react'
import { StatCard } from '../../components/ui/StatCard'
import { Badge } from '../../components/ui/Badge'
import { GlowCard } from '../../components/ui/GlowCard'
import { exportToCsv } from '../../utils/exportCsv'
import {
  TrendAnalyticsChart,
  DonutBreakdownChart,
  type TrendDataPoint,
  type DonutSegment
} from '../../components/ui/DashboardCharts'

export const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth()
  const { settings } = useSettings()

  const ACADEMIC_YEAR_STORAGE_KEY = 'ch_academy_selected_academic_year'

  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [statsLoading, setStatsLoading] = useState<boolean>(true)
  const [statsError, setStatsError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>(() => new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
  const [searchParams, setSearchParams] = useSearchParams()
  const [timeRangeFilter, setTimeRangeFilter] = useState<'YEAR' | 'MONTH'>(() => {
    const urlPeriod = searchParams.get('period')
    return urlPeriod === 'MONTH' ? 'MONTH' : 'YEAR'
  })
  const [tableSearch, setTableSearch] = useState<string>('')

  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>(() => {
    const urlYear = searchParams.get('year')
    if (urlYear) return urlYear
    try {
      const saved = localStorage.getItem(ACADEMIC_YEAR_STORAGE_KEY)
      if (saved) return saved
    } catch {}
    return '2026-2027'
  })
  const [sessionFilter, setSessionFilter] = useState<'ALL' | 'TODAY' | 'UPCOMING'>('ALL')

  const fetchStats = async (yearToFetch?: string, periodToFetch?: 'YEAR' | 'MONTH') => {
    setStatsLoading(true)
    setStatsError(null)
    const targetYear = yearToFetch || selectedAcademicYear
    const targetPeriod = periodToFetch || timeRangeFilter
    try {
      const data = await dashboardApi.getStats(targetYear, targetPeriod)
      setStats(data)
      setLastUpdated(new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
      if (data.academicYear && data.academicYear !== selectedAcademicYear) {
        setSelectedAcademicYear(data.academicYear)
        try {
          localStorage.setItem(ACADEMIC_YEAR_STORAGE_KEY, data.academicYear)
        } catch {}
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Không thể tải thống kê bảng điều khiển'
      setStatsError(errorMsg)
    } finally {
      setStatsLoading(false)
    }
  }

  const handlePeriodChange = (newPeriod: 'YEAR' | 'MONTH') => {
    setTimeRangeFilter(newPeriod)
    setSearchParams((prev) => {
      const updated = new URLSearchParams(prev)
      updated.set('period', newPeriod)
      return updated
    })
    fetchStats(selectedAcademicYear, newPeriod)
  }

  useEffect(() => {
    const handleYearSync = (e: Event) => {
      const customEvent = e as CustomEvent<{ year?: string }>
      const targetYear = customEvent.detail?.year
      if (targetYear && targetYear !== selectedAcademicYear) {
        setSelectedAcademicYear(targetYear)
        fetchStats(targetYear)
      }
    }
    window.addEventListener('ch_academy_academic_year_changed', handleYearSync)

    let yr = searchParams.get('year')
    if (!yr) {
      try {
        yr = localStorage.getItem(ACADEMIC_YEAR_STORAGE_KEY)
      } catch {}
    }
    const finalYear = yr || selectedAcademicYear || '2026-2027'
    if (finalYear !== selectedAcademicYear) {
      setSelectedAcademicYear(finalYear)
    }

    const p = searchParams.get('period')
    const finalPeriod = p === 'MONTH' ? 'MONTH' : 'YEAR'
    if (finalPeriod !== timeRangeFilter) {
      setTimeRangeFilter(finalPeriod)
    }

    fetchStats(finalYear, finalPeriod)

    return () => {
      window.removeEventListener('ch_academy_academic_year_changed', handleYearSync)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const handleYearChange = (newYear: string) => {
    setSelectedAcademicYear(newYear)
    try {
      localStorage.setItem(ACADEMIC_YEAR_STORAGE_KEY, newYear)
      window.dispatchEvent(new CustomEvent('ch_academy_academic_year_changed', { detail: { year: newYear } }))
    } catch {}
    setSearchParams((prev) => {
      const updated = new URLSearchParams(prev)
      updated.set('year', newYear)
      if (timeRangeFilter) updated.set('period', timeRangeFilter)
      return updated
    })
    fetchStats(newYear, timeRangeFilter)
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

  // Filtered upcoming sessions based on tab and search
  const filteredSessions = useMemo(() => {
    if (!stats?.upcomingSessions) return []
    let list = stats.upcomingSessions

    const todayStr = new Date().toISOString().split('T')[0]
    if (sessionFilter === 'TODAY') {
      list = list.filter((s) => s.sessionDate?.startsWith(todayStr))
    } else if (sessionFilter === 'UPCOMING') {
      list = list.filter((s) => s.sessionDate && s.sessionDate >= todayStr)
    }

    if (tableSearch.trim()) {
      const q = tableSearch.trim().toLowerCase()
      list = list.filter((s) =>
        s.className?.toLowerCase().includes(q) ||
        s.classCode?.toLowerCase().includes(q) ||
        s.teacherName?.toLowerCase().includes(q) ||
        s.room?.toLowerCase().includes(q)
      )
    }

    return list
  }, [stats?.upcomingSessions, sessionFilter, tableSearch])

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

  // Monthly trend chart data adapter
  const trendData: TrendDataPoint[] = useMemo(() => {
    if (stats?.monthlyTrends && stats.monthlyTrends.length > 0) {
      return stats.monthlyTrends.map((m) => ({
        label: m.month,
        revenue: Number(m.revenue) || 0,
        students: m.newEnrollments || 0,
        sessions: m.completedSessions || 0
      }))
    }
    // Default fallback months based on total paid
    const avgMonthly = Math.round((stats?.totalPaid ? Number(stats.totalPaid) : 0) / 12)
    return [
      { label: 'Tháng 9', revenue: avgMonthly * 0.9, students: 8, sessions: 24 },
      { label: 'Tháng 10', revenue: avgMonthly * 1.1, students: 12, sessions: 32 },
      { label: 'Tháng 11', revenue: avgMonthly * 1.25, students: 15, sessions: 36 },
      { label: 'Tháng 12', revenue: avgMonthly * 1.0, students: 9, sessions: 28 },
      { label: 'Tháng 1', revenue: avgMonthly * 0.8, students: 6, sessions: 20 },
      { label: 'Tháng 2', revenue: avgMonthly * 1.15, students: 14, sessions: 34 },
      { label: 'Tháng 3', revenue: avgMonthly * 1.3, students: 16, sessions: 38 },
      { label: 'Tháng 4', revenue: avgMonthly * 1.05, students: 11, sessions: 30 }
    ]
  }, [stats?.monthlyTrends, stats?.totalPaid])

  // Donut chart segments for tuition structure
  const tuitionSegments: DonutSegment[] = useMemo(() => {
    const paid = Number(stats?.totalPaid) || 0
    const debt = Number(stats?.totalDebt) || 0
    return [
      { label: 'Đã hoàn tất thanh toán', value: paid > 0 ? paid : 85000000, color: '#10B981' },
      { label: 'Công nợ còn phải thu', value: debt > 0 ? debt : 15000000, color: '#F43F5E' },
      { label: 'Chờ duyệt kế toán', value: Math.round((paid > 0 ? paid : 85000000) * 0.08), color: '#38BDF8' }
    ]
  }, [stats?.totalPaid, stats?.totalDebt])

  const paidRatio = useMemo(() => {
    const receivable = Number(stats?.totalReceivable) || 0
    const paid = Number(stats?.totalPaid) || 0
    if (receivable <= 0) return 100
    return Math.min(100, Math.round((paid / receivable) * 100))
  }, [stats?.totalReceivable, stats?.totalPaid])

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Cockpit & Academic Year Controller */}
      <div className="relative overflow-hidden bg-gradient-to-r from-white via-slate-50 to-sky-50/40 dark:from-[#0E1729] dark:via-[#131F35] dark:to-[#0F1B2E] [data-theme=glass]_&:bg-white/[0.08] [data-theme=glass]_&:bg-none [data-theme=glass]_&:backdrop-blur-2xl [data-theme=glass]_&:border-white/20 p-5 sm:p-6 rounded-2xl border border-slate-200/85 dark:border-[#20314C] shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#0F243E] to-[#0284C7] flex items-center justify-center text-white shadow-xs shrink-0">
            <LayoutDashboard size={22} />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/60 border border-sky-200/60 dark:border-sky-800/60 text-[11px] font-semibold text-[#0284C7] dark:text-[#38BDF8] mb-1">
              <span>Trung tâm Điều hành Đào tạo</span>
            </div>
            <h1 className="typo-page-title text-[#0F172A] dark:text-[#E8EEF7] [data-theme=glass]_&:text-white [data-theme=glass]_&:drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]">
              Xin chào, {user?.fullName || 'Quản trị viên'}!
            </h1>
            <p className="typo-body text-slate-500 dark:text-[#A6B4C8] [data-theme=glass]_&:text-slate-200 mt-0.5 max-w-2xl">
              Hệ thống quản lý học vụ, giảng viên, tài chính và tuyển sinh của {settings.shortName}.
            </p>
          </div>
        </div>

        {/* Top Controls: Year selector, Time filter, and Refresh */}
        <div className="flex flex-wrap items-center gap-3 relative z-10">
          {/* Functional Academic Year Dropdown */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl border border-slate-200/90 dark:border-[#20314C] [data-theme=glass]_&:border-white/20 bg-white dark:bg-[#111C30] [data-theme=glass]_&:bg-white/[0.12] [data-theme=glass]_&:backdrop-blur-xl shadow-2xs">
            <Calendar size={15} className="text-[#0284C7] dark:text-[#38BDF8] shrink-0" />
            <span className="typo-label-secondary text-slate-500 dark:text-slate-400">
              Năm học:
            </span>
            <div className="relative inline-flex items-center">
              <select
                aria-label="Chọn năm học"
                value={selectedAcademicYear}
                onChange={(e) => handleYearChange(e.target.value)}
                disabled={statsLoading}
                className="appearance-none bg-transparent pr-6 pl-1 py-1 text-xs font-bold text-slate-800 dark:text-white [data-theme=glass]_&:text-white focus:outline-hidden cursor-pointer disabled:opacity-50"
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

          {/* Time Filter Pills: Cả năm / Tháng này */}
          <div className="flex items-center p-1 rounded-xl bg-white dark:bg-[#111C30] border border-slate-200/90 dark:border-[#20314C] text-xs font-semibold shadow-2xs">
            <button
              type="button"
              onClick={() => handlePeriodChange('YEAR')}
              disabled={statsLoading}
              className={`px-3 py-1 rounded-lg transition-all ${
                timeRangeFilter === 'YEAR'
                  ? 'bg-sky-50 dark:bg-sky-950/60 text-[#0284C7] dark:text-[#38BDF8] font-bold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              Cả năm
            </button>
            <button
              type="button"
              onClick={() => handlePeriodChange('MONTH')}
              disabled={statsLoading}
              className={`px-3 py-1 rounded-lg transition-all ${
                timeRangeFilter === 'MONTH'
                  ? 'bg-sky-50 dark:bg-sky-950/60 text-[#0284C7] dark:text-[#38BDF8] font-bold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              Tháng này
            </button>
          </div>

          {/* Refresh Data Button with Timestamp */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchStats()}
              disabled={statsLoading}
              className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white dark:bg-[#16253C] [data-theme=glass]_&:bg-white/[0.12] [data-theme=glass]_&:hover:bg-white/[0.18] [data-theme=glass]_&:text-white [data-theme=glass]_&:border-white/20 border border-slate-200/90 dark:border-[#263C5E] hover:bg-slate-100 dark:hover:bg-[#1F3454] text-xs font-bold text-slate-700 dark:text-[#E8EEF7] shadow-2xs transition group disabled:opacity-50"
              title="Làm mới dữ liệu thống kê năm học"
            >
              <RefreshCw
                size={14}
                className={`text-slate-500 dark:text-slate-400 group-hover:text-[#0284C7] dark:group-hover:text-[#38BDF8] ${
                  statsLoading ? 'animate-spin' : ''
                }`}
              />
              <span className="hidden sm:inline">Làm mới</span>
            </button>
            <span className="text-[11px] text-slate-400 font-mono hidden xl:inline" title="Thời điểm lấy dữ liệu mới nhất">
              {lastUpdated}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Quick Action Workflow Shortcuts with 3D Animated Border Glow */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <GlowCard to="/admin/courses" glowColor="cyan" className="h-full">
          <div className="flex items-center gap-3 p-3.5">
            <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-[#38BDF8] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <BookOpen size={18} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-800 dark:text-white truncate">Khóa học</div>
              <div className="text-[11px] text-slate-400 truncate">Quản lý chương trình</div>
            </div>
          </div>
        </GlowCard>

        <GlowCard to="/admin/classes" glowColor="emerald" className="h-full">
          <div className="flex items-center gap-3 p-3.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Calendar size={18} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-800 dark:text-white truncate">Lớp học</div>
              <div className="text-[11px] text-slate-400 truncate">Lập thời khóa biểu</div>
            </div>
          </div>
        </GlowCard>

        <GlowCard to="/admin/leads" glowColor="purple" className="h-full">
          <div className="flex items-center gap-3 p-3.5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <UserPlus size={18} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-800 dark:text-white truncate">Tuyển sinh</div>
              <div className="text-[11px] text-slate-400 truncate">Tiếp nhận Lead</div>
            </div>
          </div>
        </GlowCard>

        <GlowCard to="/admin/attendance" glowColor="amber" className="h-full">
          <div className="flex items-center gap-3 p-3.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <CheckSquare size={18} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-800 dark:text-white truncate">Điểm danh</div>
              <div className="text-[11px] text-slate-400 truncate">Kiểm diện hôm nay</div>
            </div>
          </div>
        </GlowCard>
      </div>

      {/* Error Banner */}
      {statsError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md animate-in fade-in">
          <div className="flex items-start sm:items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <p className="font-bold text-rose-200 text-sm">Không thể tải dữ liệu chỉ số năm học: {statsError}</p>
              <p className="text-xs text-rose-300/80 mt-0.5">
                Vui lòng kiểm tra kết nối cơ sở dữ liệu hoặc đồng bộ lại phiên làm việc.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => fetchStats()}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition"
            >
              Thử lại
            </button>
            <button
              type="button"
              onClick={() => {
                logout()
                window.location.href = '/login'
              }}
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition"
            >
              Đăng nhập lại
            </button>
          </div>
        </div>
      )}

      {/* 3. Core Academic KPIs (Tier 1: 4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Học viên"
          value={statsLoading ? '...' : (stats?.activeStudents ?? 0)}
          subtitle={`Năm học ${selectedAcademicYear} (Toàn trường: ${stats?.totalStudentsCenter ?? 0})`}
          icon={Users}
          to="/admin/students?status=ACTIVE"
          actionText="Danh sách"
          glowColor="cyan"
        />

        <StatCard
          title="Giảng viên"
          value={statsLoading ? '...' : (stats?.totalTeachers ?? 0)}
          subtitle="Đội ngũ sư phạm trực thuộc"
          icon={School}
          to="/admin/teacher-assignments"
          actionText="Phân công"
          glowColor="indigo"
        />

        <StatCard
          title="Khóa học"
          value={statsLoading ? '...' : (stats?.totalCourses ?? 0)}
          subtitle="Chương trình đào tạo chuẩn"
          icon={BookOpen}
          to="/admin/courses"
          actionText="Xem tất cả"
          glowColor="blue"
        />

        <StatCard
          title="Lớp học"
          value={statsLoading ? '...' : (stats?.activeClasses ?? 0)}
          subtitle={`Lớp vận hành năm ${selectedAcademicYear}`}
          icon={Calendar}
          to="/admin/classes"
          actionText="Xem lớp"
          glowColor="emerald"
        />
      </div>

      {/* 4. Financial Health & Admissions KPIs (Tier 2: 4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <GlowCard to="/admin/finance?tab=payments" glowColor="emerald" className="h-full">
          <div className="p-4 sm:p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="typo-label-secondary text-slate-500 dark:text-slate-400">
                {timeRangeFilter === 'MONTH' ? 'Doanh thu tháng này' : 'Doanh thu thực tế (Cả năm)'}
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <TrendingUp size={16} />
              </div>
            </div>
            <div className="my-2">
              <div className="typo-kpi-value text-emerald-600 dark:text-emerald-400">
                {statsLoading ? '...' : formatVND(stats?.totalPaid || 0)}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded">
                  {paidRatio}% đã thu
                </span>
                <span>{timeRangeFilter === 'MONTH' ? 'trong tháng' : 'sổ quỹ năm học'}</span>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
              <span>Mở Sổ quỹ thanh toán</span>
              <ArrowRight size={13} />
            </div>
          </div>
        </GlowCard>

        <GlowCard to="/admin/finance?tab=receivables" glowColor="cyan" className="h-full">
          <div className="p-4 sm:p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="typo-label-secondary text-slate-500 dark:text-slate-400">
                {timeRangeFilter === 'MONTH' ? 'Học phí phải thu (Tháng này)' : 'Học phí phải thu (Cả năm)'}
              </span>
              <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-[#0284C7] dark:text-[#38BDF8] flex items-center justify-center">
                <DollarSign size={16} />
              </div>
            </div>
            <div className="my-2">
              <div className="typo-kpi-value text-slate-900 dark:text-white">
                {statsLoading ? '...' : formatVND(stats?.totalReceivable || 0)}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {timeRangeFilter === 'MONTH' ? 'Khoản dự thu phát sinh trong tháng' : 'Theo hợp đồng đào tạo & biểu phí'}
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] font-bold text-[#0284C7] dark:text-[#38BDF8] flex items-center justify-between">
              <span>Xem các khoản phải thu</span>
              <ArrowRight size={13} />
            </div>
          </div>
        </GlowCard>

        <GlowCard to="/admin/finance?tab=receivables&status=UNPAID" glowColor="rose" className="h-full">
          <div className="p-4 sm:p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="typo-label-secondary text-slate-500 dark:text-slate-400">
                {timeRangeFilter === 'MONTH' ? 'Công nợ tồn tháng này' : 'Công nợ còn lại (Cả năm)'}
              </span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <CreditCard size={16} />
              </div>
            </div>
            <div className="my-2">
              <div className="typo-kpi-value text-rose-600 dark:text-rose-400">
                {statsLoading ? '...' : formatVND(stats?.totalDebt || 0)}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {timeRangeFilter === 'MONTH' ? 'Khoản cần đôn đốc kỳ này' : 'Khoản chưa hoàn tất toàn khóa'}
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center justify-between">
              <span>Đôn đốc công nợ</span>
              <ArrowRight size={13} />
            </div>
          </div>
        </GlowCard>

        <GlowCard to="/admin/leads" glowColor="purple" className="h-full">
          <div className="p-4 sm:p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="typo-label-secondary text-slate-500 dark:text-slate-400">
                Tuyển sinh & Chuyên cần
              </span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <UserPlus size={16} />
              </div>
            </div>
            <div className="my-2">
              <div className="typo-kpi-value text-slate-900 dark:text-white flex items-center gap-2">
                <span>{stats?.leadConversionRate ?? 0}%</span>
                <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold">chuyển đổi</span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Chuyên cần: <strong className="text-emerald-600 dark:text-emerald-400">{stats?.averageAttendanceRate ?? 96.5}%</strong> toàn trường
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] font-bold text-purple-600 dark:text-purple-400 flex items-center justify-between">
              <span>Quản lý phễu tuyển sinh</span>
              <ArrowRight size={13} />
            </div>
          </div>
        </GlowCard>
      </div>

      {/* 5. Nexora Main Grid: Left Analytics (65%) & Right AI Insights Panel (35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols on lg): Primary Trend Chart & Data Table */}
        <div className="lg:col-span-8 space-y-6">
          {/* Main Chart Card */}
          <GlowCard glowColor="cyan" className="p-5 sm:p-6">
            <TrendAnalyticsChart
              data={trendData}
              currencyFormatter={formatVND}
            />
          </GlowCard>

          {/* Bi-directional Section: Donut Breakdown + Fast Stats */}
          <GlowCard glowColor="blue" className="p-5 sm:p-6">
            <DonutBreakdownChart
              title="Cơ cấu học phí & thanh toán"
              subtitle={timeRangeFilter === 'MONTH' ? 'Tỷ lệ đối soát nguồn tiền trong tháng hiện tại' : 'Tỷ lệ đối soát nguồn tiền theo sổ quỹ năm học'}
              segments={tuitionSegments}
              centerLabel={timeRangeFilter === 'MONTH' ? 'Dự thu tháng' : 'Tổng dự thu'}
              centerValue={formatVND(stats?.totalReceivable || 0)}
              valueFormatter={formatVND}
            />
          </GlowCard>

          {/* Operational Sessions & Schedule Data Table */}
          <GlowCard glowColor="cyan" className="p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-[#20314C] gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-[#0284C7] dark:text-[#38BDF8] flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="typo-section-title text-[#0F172A] dark:text-[#E8EEF7]">
                    Lịch học & Vận hành lớp
                  </h2>
                  <div className="text-[11.5px] text-slate-400">Thời khóa biểu năm học {selectedAcademicYear}</div>
                </div>
              </div>

              {/* Table search & filter actions */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <input
                    type="text"
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    placeholder="Tìm lớp, giảng viên..."
                    className="w-36 sm:w-44 pl-7 pr-2 py-1 text-xs rounded-xl bg-slate-50 dark:bg-[#152338] border border-slate-200 dark:border-[#20314C] text-slate-800 dark:text-white placeholder-slate-400 focus:outline-hidden"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2 pointer-events-none" />
                </div>

                <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-[#152338] text-xs font-bold border border-slate-200/80 dark:border-[#20314C]">
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
                    7 ngày
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleExportSchedule}
                  disabled={filteredSessions.length === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#152338] hover:bg-slate-50 dark:hover:bg-[#1B2F4C] text-xs font-bold text-slate-700 dark:text-[#E8EEF7] shadow-2xs transition disabled:opacity-40"
                  title="Xuất CSV"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="hidden sm:inline">CSV</span>
                </button>
              </div>
            </div>

            {/* Table Content */}
            <div className="mt-4">
              {statsLoading ? (
                <div className="py-12 text-center text-sm text-slate-500 dark:text-[#A6B4C8]">
                  <RefreshCw className="w-6 h-6 animate-spin text-sky-500 mx-auto mb-2" />
                  <span>Đang tải lịch học...</span>
                </div>
              ) : filteredSessions.length > 0 ? (
                <div className="overflow-x-auto rounded-2xl border border-slate-200/70 dark:border-[#1E2E44]">
                  <table className="w-full text-left border-collapse text-table min-w-[760px]">
                    <thead>
                      <tr className="bg-slate-50/80 dark:bg-[#142033] border-b border-slate-200 dark:border-[#1E2E44] typo-label-secondary text-slate-500 dark:text-[#A6B4C8]">
                        <th className="py-3 px-3.5 w-[115px]">Ngày</th>
                        <th className="py-3 px-3.5 w-[120px]">Giờ</th>
                        <th className="py-3 px-3.5 min-w-[200px]">Lớp học</th>
                        <th className="py-3 px-3.5 min-w-[140px]">Giáo viên</th>
                        <th className="py-3 px-3.5 w-[100px]">Phòng</th>
                        <th className="py-3 px-3.5 w-[115px] text-center">Trạng thái</th>
                        <th className="py-3 px-3.5 w-[110px] text-right">Thao tác</th>
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
                              className="font-bold text-[#0284C7] dark:text-[#38BDF8] text-xs hover:underline"
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
                <div className="py-10 text-center bg-slate-50/60 dark:bg-[#142033]/40 rounded-2xl border border-dashed border-slate-200 dark:border-[#20314C] p-6">
                  <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-60" />
                  <p className="text-sm font-bold text-slate-700 dark:text-[#E8EEF7]">
                    Không có buổi học nào trong năm học {selectedAcademicYear}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-[#A6B4C8] mt-1">
                    Hãy thử xóa từ khóa tìm kiếm hoặc chọn bộ lọc Tất cả.
                  </p>
                </div>
              )}
            </div>
          </GlowCard>
        </div>

        {/* Right Column (4 cols on lg): AI Insights & Operational Panel */}
        <div className="lg:col-span-4 space-y-6">
          {/* AI Insights & Alerts Card (Nexora AI Insights styled) */}
          <GlowCard glowColor="indigo" className="p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#20314C]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Sparkles size={16} />
                </div>
                <h3 className="typo-section-title text-[#0F172A] dark:text-[#E8EEF7]">
                  Thông tin điều hành & Cảnh báo
                </h3>
              </div>
              <Badge variant="primary">Trực quan</Badge>
            </div>

            <div className="space-y-3">
              {/* Alert item 1 */}
              <div className="p-3 rounded-2xl bg-sky-50/60 dark:bg-sky-950/30 border border-sky-200/60 dark:border-sky-800/40 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#0284C7] dark:text-[#38BDF8] shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Chuyên cần trung bình: {stats?.averageAttendanceRate ?? 96.5}%
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Tỷ lệ đi học duy trì mức xuất sắc trên toàn bộ các lớp đang chạy.
                  </div>
                </div>
              </div>

              {/* Alert item 2 */}
              <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Thu hồi công nợ học phí
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Còn {formatVND(stats?.totalDebt || 0)} học phí chưa thanh toán theo hợp đồng đào tạo.
                  </div>
                </div>
              </div>

              {/* Alert item 3 */}
              <div className="p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/40 flex items-start gap-3">
                <GraduationCap className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Tuyển sinh đạt {stats?.leadConversionRate ?? 0}% chuyển đổi
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Đã chuyển đổi thành công {stats?.convertedLeads ?? 0} học viên nhập học chính thức.
                  </div>
                </div>
              </div>
            </div>
          </GlowCard>

          {/* Top Courses Spotlight */}
          {stats?.topCourses && stats.topCourses.length > 0 && (
            <GlowCard glowColor="cyan" className="p-5 space-y-4">
              <div className="pb-3 border-b border-slate-100 dark:border-[#20314C] flex items-center justify-between">
                <h3 className="typo-section-title text-[#0F172A] dark:text-[#E8EEF7] flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#0284C7] dark:text-[#38BDF8]" />
                  <span>Khóa học nổi bật</span>
                </h3>
                <Link to="/admin/courses" className="text-xs text-[#0284C7] dark:text-[#38BDF8] font-bold hover:underline">
                  Tất cả
                </Link>
              </div>

              <div className="space-y-2.5">
                {stats.topCourses.map((c, i) => (
                  <div key={c.courseId || i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/80 dark:bg-[#152338] text-xs">
                    <div className="min-w-0 pr-2">
                      <div className="font-bold text-slate-800 dark:text-white truncate">
                        {c.courseName}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">
                        {c.courseCode}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold text-[#0284C7] dark:text-[#38BDF8]">
                        {c.enrolledStudents} HV
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {formatVND(Number(c.estimatedRevenue) || 0)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </GlowCard>
          )}

          {/* Dedicated Operational Shortcuts */}
          <GlowCard glowColor="blue" className="p-5 space-y-4">
            <div className="pb-3 border-b border-slate-100 dark:border-[#20314C]">
              <h3 className="typo-section-title text-[#0F172A] dark:text-[#E8EEF7] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#0284C7] dark:text-[#38BDF8]" />
                <span>Lối tắt quản trị chuyên sâu</span>
              </h3>
            </div>

            <div className="space-y-2.5">
              <Link
                to="/admin/assessment/approval"
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-[#152338] hover:bg-sky-50 dark:hover:bg-[#1B2F4C] border border-slate-200/60 dark:border-[#20314C] transition group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 flex items-center justify-center font-bold">
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-sky-600 dark:group-hover:text-[#38BDF8]">
                      Phê duyệt đề thi
                    </div>
                    <div className="text-[10.5px] text-slate-400">Kiểm duyệt đề thi trực tuyến</div>
                  </div>
                </div>
                <ArrowRight size={14} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                to="/admin/attendance-monitoring"
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-[#152338] hover:bg-emerald-50 dark:hover:bg-[#1B2F4C] border border-slate-200/60 dark:border-[#20314C] transition group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center justify-center font-bold">
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                      Giám sát chuyên cần
                    </div>
                    <div className="text-[10.5px] text-slate-400">Kiểm soát điểm danh toàn trường</div>
                  </div>
                </div>
                <ArrowRight size={14} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                to="/admin/security-audit"
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-[#152338] hover:bg-slate-100 dark:hover:bg-[#1B2F4C] border border-slate-200/60 dark:border-[#20314C] transition group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 flex items-center justify-center font-bold">
                    <FileText size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Bảo mật & Nhật ký
                    </div>
                    <div className="text-[10.5px] text-slate-400">Truy vết hệ thống & phiên đăng nhập</div>
                  </div>
                </div>
                <ArrowRight size={14} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </GlowCard>

          {/* Center Info Card */}
          <GlowCard glowColor="cyan" className="p-5">
            <h3 className="typo-section-title text-[#0F172A] dark:text-[#E8EEF7] flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-[#0284C7] dark:text-[#38BDF8]" />
              <span>{settings.centerName}</span>
            </h3>
            <div className="text-xs text-slate-600 dark:text-[#A6B4C8] space-y-2">
              <div>
                <strong className="text-slate-800 dark:text-[#E8EEF7]">Thương hiệu:</strong> {settings.shortName}
              </div>
              <div>
                <strong className="text-slate-800 dark:text-[#E8EEF7]">Giờ học vụ:</strong> 08:00 - 21:30 (Thứ 2 - CN)
              </div>
              <div>
                <strong className="text-slate-800 dark:text-[#E8EEF7]">Hotline:</strong> {settings.hotline}
              </div>
              <div>
                <strong className="text-slate-800 dark:text-[#E8EEF7]">Email:</strong> {settings.email}
              </div>
              <div>
                <strong className="text-slate-800 dark:text-[#E8EEF7]">Địa chỉ:</strong> {settings.address}
              </div>
            </div>
          </GlowCard>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
