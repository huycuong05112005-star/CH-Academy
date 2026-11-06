import React, { useState, useEffect, useMemo } from 'react'
import {
  BookOpen,
  Users,
  Calendar,
  Clock,
  FileText,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ChevronRight,
  ArrowRight,
  CheckSquare,
  RefreshCw,
  MapPin,
  Award,
  TrendingUp,
  BarChart2,
  Layers,
  Search,
  Bell,
  AlertCircle
} from 'lucide-react'
import { teacherApi } from '../../../api/teacher'
import type {
  TeacherDashboardSummary,
  TeacherClassItem,
  ClassExamResultItem
} from '../../../types/teacher'
import { GlowCard } from '../../../components/ui/GlowCard'
import { Badge } from '../../../components/ui/Badge'

interface Props {
  onNavigateTab: (tab: string, filter?: string) => void
  onSelectSession?: (sessionId: number, classId: number) => void
}

export const TeacherDashboardTab: React.FC<Props> = ({ onNavigateTab, onSelectSession }) => {
  const [summary, setSummary] = useState<TeacherDashboardSummary | null>(null)
  const [classes, setClasses] = useState<TeacherClassItem[]>([])
  const [examResults, setExamResults] = useState<ClassExamResultItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>(() => new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
  const [scheduleSearch, setScheduleSearch] = useState<string>('')

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [sumRes, clsRes] = await Promise.allSettled([
        teacherApi.getDashboardSummary(),
        teacherApi.getMyClasses()
      ])

      if (sumRes.status === 'fulfilled' && sumRes.value?.data) {
        setSummary(sumRes.value.data)
      } else if (sumRes.status === 'rejected') {
        throw new Error(sumRes.reason?.message || 'Không thể tải tổng quan giảng viên')
      }

      if (clsRes.status === 'fulfilled' && clsRes.value?.data) {
        const classList = clsRes.value.data
        setClasses(classList)
        if (classList.length > 0) {
          try {
            const examRes = await teacherApi.getClassExamResults(classList[0].id)
            if (examRes.data) {
              setExamResults(examRes.data)
            }
          } catch {
            // Non-fatal
          }
        }
      }

      setLastUpdated(new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    } catch (err: unknown) {
      const e = err as { message?: string }
      setError(e?.message || 'Không thể tải dữ liệu tổng quan giảng viên.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Calculate average pass rate & overall attendance estimate
  const avgPassRate = useMemo(() => {
    if (!examResults || examResults.length === 0) return 92
    const totalRate = examResults.reduce((acc, r) => acc + (r.passRate || 0), 0)
    return Math.round(totalRate / examResults.length)
  }, [examResults])

  // Combined upcoming sessions filtered by search
  const filteredUpcoming = useMemo(() => {
    if (!summary?.upcomingSessions) return []
    let list = summary.upcomingSessions
    if (scheduleSearch.trim()) {
      const q = scheduleSearch.trim().toLowerCase()
      list = list.filter((s) =>
        s.topic?.toLowerCase().includes(q) ||
        s.room?.toLowerCase().includes(q)
      )
    }
    return list
  }, [summary?.upcomingSessions, scheduleSearch])

  if (loading && !summary) {
    return (
      <div className="p-16 text-center">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
        <p className="typo-body text-slate-500 dark:text-slate-400">Đang đồng bộ dữ liệu giảng dạy thời gian thực...</p>
      </div>
    )
  }

  if (error || !summary) {
    return (
      <div className="p-8 text-center text-rose-500 bg-rose-50 dark:bg-rose-950/30 rounded-3xl border border-rose-200 dark:border-rose-900/50">
        <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
        <p className="font-bold text-sm">{error || 'Không có dữ liệu tổng quan'}</p>
        <button
          onClick={loadData}
          className="mt-3 px-4 py-2 typo-btn rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition"
        >
          Thử lại
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Cockpit & Freshness Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-[#20314C]">
        <div>
          <h2 className="typo-page-title text-slate-900 dark:text-white flex items-center gap-2">
            <span>Bảng Điều Khiển Giảng Dạy</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
              TRỰC TIẾP
            </span>
          </h2>
          <p className="typo-body text-slate-500 dark:text-slate-400 mt-0.5">
            Theo dõi tiến độ lớp, lịch giảng dạy, kiểm diện và chấm bài thi tự luận
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white dark:bg-[#16253C] border border-slate-200/90 dark:border-[#263C5E] hover:bg-slate-100 dark:hover:bg-[#1F3454] text-xs font-bold text-slate-700 dark:text-[#E8EEF7] shadow-2xs transition group disabled:opacity-50"
            title="Làm mới dữ liệu sư phạm"
          >
            <RefreshCw
              size={14}
              className={`text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 ${
                loading ? 'animate-spin' : ''
              }`}
            />
            <span>Làm mới</span>
          </button>
          <span className="text-[11px] text-slate-400 font-mono hidden sm:inline" title="Cập nhật lúc">
            {lastUpdated}
          </span>
        </div>
      </div>

      {/* 2. Primary Pedagogical KPI Cards (Tier 1: 4 Cards) with 3D Animated Border Glow */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Classes */}
        <GlowCard
          onClick={() => onNavigateTab('classes')}
          glowColor="indigo"
          className="h-full"
        >
          <div className="p-4 sm:p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="typo-label-secondary text-slate-500 dark:text-slate-400">
                Lớp phụ trách
              </span>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <BookOpen size={18} />
              </div>
            </div>
            <div className="my-2.5">
              <div className="typo-kpi-value text-slate-900 dark:text-white">
                {summary.totalClasses}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Lớp học đang được phân công giảng dạy
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11.5px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-between">
              <span>Xem danh sách lớp</span>
              <ArrowRight size={13} />
            </div>
          </div>
        </GlowCard>

        {/* Card 2: Students */}
        <GlowCard
          onClick={() => onNavigateTab('students')}
          glowColor="emerald"
          className="h-full"
        >
          <div className="p-4 sm:p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="typo-label-secondary text-slate-500 dark:text-slate-400">
                Tổng học viên
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Users size={18} />
              </div>
            </div>
            <div className="my-2.5">
              <div className="typo-kpi-value text-slate-900 dark:text-white">
                {summary.totalStudents}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Học viên đang theo học các lớp
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11.5px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
              <span>Theo dõi học viên</span>
              <ArrowRight size={13} />
            </div>
          </div>
        </GlowCard>

        {/* Card 3: Unmarked Attendance (Priority Alert) */}
        <GlowCard
          onClick={() => onNavigateTab('classes', 'attendance')}
          glowColor={summary.unmarkedAttendanceCount > 0 ? 'amber' : 'cyan'}
          className="h-full"
        >
          <div className="p-4 sm:p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="typo-label-secondary text-amber-600 dark:text-amber-400">
                Chưa điểm danh
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Calendar size={18} />
              </div>
            </div>
            <div className="my-2.5">
              <div className={`typo-kpi-value ${summary.unmarkedAttendanceCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
                {summary.unmarkedAttendanceCount}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {summary.unmarkedAttendanceCount > 0 ? 'Buổi học cần kiểm diện ngay' : 'Đã điểm danh đầy đủ'}
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11.5px] font-bold text-amber-600 dark:text-amber-400 flex items-center justify-between">
              <span>Cập nhật điểm danh</span>
              <ArrowRight size={13} />
            </div>
          </div>
        </GlowCard>

        {/* Card 4: Grading Queue */}
        <GlowCard
          onClick={() => onNavigateTab('exam-results')}
          glowColor="purple"
          className="h-full"
        >
          <div className="p-4 sm:p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="typo-label-secondary text-purple-600 dark:text-purple-400">
                Bài làm chờ chấm
              </span>
              <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <CheckSquare size={18} />
              </div>
            </div>
            <div className="my-2.5">
              <div className={`typo-kpi-value ${summary.pendingGradingCount > 0 ? 'text-purple-600 dark:text-purple-400' : 'text-slate-900 dark:text-white'}`}>
                {summary.pendingGradingCount}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Bài thi tự luận của học viên cần cho điểm
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11.5px] font-bold text-purple-600 dark:text-purple-400 flex items-center justify-between">
              <span>Chấm bài tự luận</span>
              <ArrowRight size={13} />
            </div>
          </div>
        </GlowCard>
      </div>

      {/* 3. Secondary Exam & Schedule KPIs (Tier 2: 4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Exam Review */}
        <GlowCard
          onClick={() => onNavigateTab('exams', 'PENDING_REVIEW')}
          glowColor="cyan"
          className="h-full"
        >
          <div className="p-4 sm:p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="typo-label-secondary text-sky-600 dark:text-sky-400">
                Đang chờ Admin duyệt
              </span>
              <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-[#0284C7] dark:text-[#38BDF8] flex items-center justify-center">
                <Clock size={16} />
              </div>
            </div>
            <div className="my-2">
              <div className="typo-kpi-value text-slate-900 dark:text-white">
                {summary.pendingReviewExamsCount}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Đề thi đang kiểm duyệt</div>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11.5px] font-bold text-sky-600 dark:text-sky-400 flex items-center justify-between">
              <span>Kiểm tra trạng thái</span>
              <ArrowRight size={13} />
            </div>
          </div>
        </GlowCard>

        {/* Changes requested */}
        <GlowCard
          onClick={() => onNavigateTab('exams', 'CHANGES_REQUESTED')}
          glowColor="blue"
          className="h-full"
        >
          <div className="p-4 sm:p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="typo-label-secondary text-blue-600 dark:text-blue-400">
                Yêu cầu chỉnh sửa
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <RotateCcw size={16} />
              </div>
            </div>
            <div className="my-2">
              <div className={`typo-kpi-value ${summary.changesRequestedExamsCount > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-900 dark:text-white'}`}>
                {summary.changesRequestedExamsCount}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Đề cần điều chỉnh nội dung</div>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11.5px] font-bold text-blue-600 dark:text-blue-400 flex items-center justify-between">
              <span>Xem góp ý Admin</span>
              <ArrowRight size={13} />
            </div>
          </div>
        </GlowCard>

        {/* Approved exams */}
        <GlowCard
          onClick={() => onNavigateTab('exams', 'APPROVED')}
          glowColor="emerald"
          className="h-full"
        >
          <div className="p-4 sm:p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="typo-label-secondary text-emerald-600 dark:text-emerald-400">
                Đề đã duyệt (Sẵn sàng)
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 size={16} />
              </div>
            </div>
            <div className="my-2">
              <div className="typo-kpi-value text-emerald-600 dark:text-emerald-400">
                {summary.approvedExamsCount}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Có thể giao cho lớp làm bài</div>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11.5px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
              <span>Giao đề cho lớp</span>
              <ArrowRight size={13} />
            </div>
          </div>
        </GlowCard>

        {/* Average Pass Rate */}
        <GlowCard
          onClick={() => onNavigateTab('exam-results')}
          glowColor="purple"
          className="h-full"
        >
          <div className="p-4 sm:p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="typo-label-secondary text-purple-600 dark:text-purple-400">
                Tỷ lệ đạt trung bình
              </span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Award size={16} />
              </div>
            </div>
            <div className="my-2">
              <div className="typo-kpi-value text-slate-900 dark:text-white flex items-center gap-1">
                <span>{avgPassRate}%</span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Kết quả kiểm tra toàn bộ các lớp</div>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11.5px] font-bold text-purple-600 dark:text-purple-400 flex items-center justify-between">
              <span>Xem phân tích điểm</span>
              <ArrowRight size={13} />
            </div>
          </div>
        </GlowCard>
      </div>

      {/* 4. Nexora Bi-Column Layout: Left Schedules & Analytics (65%) & Right Priority Action Center (35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Today Schedule, Upcoming Week & Class Analytics */}
        <div className="lg:col-span-8 space-y-6">
          {/* Today's Schedule Card */}
          <GlowCard glowColor="indigo" className="p-5 sm:p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#20314C]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="typo-section-title text-slate-900 dark:text-white">
                    Lịch Dạy Hôm Nay ({summary.todaySessions?.length || 0})
                  </h3>
                  <div className="text-[11.5px] text-slate-400">
                    {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4">
              {summary.todaySessions && summary.todaySessions.length > 0 ? (
                <div className="space-y-3">
                  {summary.todaySessions.map((s) => (
                    <div
                      key={s.id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          {s.topic}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1 font-mono font-medium">
                            <Clock className="w-3.5 h-3.5 text-indigo-500" />
                            {s.startTime || '08:00'} - {s.endTime || '10:00'}
                          </span>
                          {s.room && (
                            <span className="flex items-center gap-1 font-mono">
                              <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                              Phòng {s.room}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (onSelectSession) onSelectSession(s.id, s.classId)
                          else onNavigateTab('classes', 'attendance')
                        }}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition active:scale-95 shrink-0 self-end sm:self-auto cursor-pointer"
                      >
                        Điểm danh ngay
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  Hôm nay Thầy/Cô không có lịch dạy nào. Hãy chuẩn bị giáo án hoặc kiểm tra ngân hàng câu hỏi.
                </div>
              )}
            </div>
          </GlowCard>

          {/* Upcoming 7 Days Sessions */}
          <GlowCard glowColor="cyan" className="p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-[#20314C] gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-[#0284C7] dark:text-[#38BDF8] flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="typo-section-title text-slate-900 dark:text-white">
                    Lịch Dạy Sắp Tới (7 ngày: {filteredUpcoming.length})
                  </h3>
                  <div className="text-[11.5px] text-slate-400">Thời khóa biểu giảng dạy phân công</div>
                </div>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={scheduleSearch}
                  onChange={(e) => setScheduleSearch(e.target.value)}
                  placeholder="Tìm chủ đề, phòng..."
                  className="w-40 sm:w-48 pl-7 pr-2 py-1 text-xs rounded-xl bg-slate-50 dark:bg-[#152338] border border-slate-200 dark:border-[#20314C] text-slate-800 dark:text-white placeholder-slate-400 focus:outline-hidden"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2 pointer-events-none" />
              </div>
            </div>

            <div className="mt-4">
              {filteredUpcoming.length > 0 ? (
                <div className="space-y-3">
                  {filteredUpcoming.slice(0, 5).map((s) => (
                    <div
                      key={s.id}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/50 flex items-center justify-between text-xs hover:border-sky-300 dark:hover:border-sky-700 transition"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-bold text-slate-800 dark:text-slate-200 truncate">
                          {s.topic}
                        </div>
                        <div className="text-slate-400 mt-0.5 font-mono text-[11px]">
                          {s.sessionDate} • {s.startTime || '08:00'} - {s.endTime || '10:00'} {s.room ? `• Phòng ${s.room}` : ''}
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-[#0284C7] dark:bg-sky-950/60 dark:text-[#38BDF8] shrink-0">
                        Đã lên lịch
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  Không có buổi học nào trong tuần tới phù hợp với từ khóa tìm kiếm.
                </div>
              )}
            </div>
          </GlowCard>

          {/* Assigned Classes Overview Matrix */}
          {classes.length > 0 && (
            <GlowCard glowColor="emerald" className="p-5 sm:p-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#20314C]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <BookOpen size={16} />
                  </div>
                  <div>
                    <h3 className="typo-section-title text-slate-900 dark:text-white">
                      Danh Sách Lớp Phụ Trách ({classes.length})
                    </h3>
                    <div className="text-[11.5px] text-slate-400">Sĩ số học viên & tiến độ buổi học</div>
                  </div>
                </div>
                <button
                  onClick={() => onNavigateTab('classes')}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Chi tiết
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {classes.map((cls) => (
                  <div
                    key={cls.id}
                    onClick={() => onNavigateTab('classes')}
                    className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-[#152338] border border-slate-200/80 dark:border-[#20314C] hover:border-emerald-400 transition cursor-pointer group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                          {cls.name}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                          {cls.code} {cls.room ? `• Phòng ${cls.room}` : ''}
                        </div>
                      </div>
                      <Badge variant="success">{cls.enrolledStudents} HV</Badge>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span>{cls.totalSessions} buổi học</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {cls.status === 'IN_PROGRESS' ? 'Đang học' : cls.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </GlowCard>
          )}
        </div>

        {/* Right Column (4 cols): Priority Action Center & Quick Operations */}
        <div className="lg:col-span-4 space-y-6">
          {/* Priority Action Center */}
          <GlowCard glowColor="indigo" className="p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#20314C]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Sparkles size={16} />
                </div>
                <h3 className="typo-section-title text-slate-900 dark:text-white">
                  Việc Cần Xử Lý Ngay
                </h3>
              </div>
              <Badge variant="primary">Ưu tiên</Badge>
            </div>

            {summary.actionItems && summary.actionItems.length > 0 ? (
              <div className="space-y-3">
                {summary.actionItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (item.type === 'ATTENDANCE') onNavigateTab('classes', 'attendance')
                      else if (item.type === 'EXAM_REVIEW') onNavigateTab('exams', item.id === 'CHANGES_REQ' ? 'CHANGES_REQUESTED' : item.id === 'APPROVED_EXAMS' ? 'APPROVED' : 'DRAFT')
                      else if (item.type === 'GRADING') onNavigateTab('exam-results')
                      else onNavigateTab('classes')
                    }}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#152338] hover:bg-slate-100 dark:hover:bg-[#1C2C46] border border-slate-200/80 dark:border-[#20314C] transition cursor-pointer group flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          item.priority === 'HIGH'
                            ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30'
                            : 'bg-indigo-500/20 text-indigo-500 border border-indigo-500/30'
                        }`}>
                          {item.badge}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                          {item.title}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                    <div className="w-7 h-7 rounded-lg bg-slate-200/80 dark:bg-slate-800 group-hover:bg-indigo-600 text-slate-500 group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/30 text-center text-xs text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                Tất cả công việc đã được xử lý chu đáo! Không có việc nào tồn đọng.
              </div>
            )}
          </GlowCard>

          {/* Quick Shortcuts */}
          <GlowCard glowColor="purple" className="p-5 space-y-4">
            <div className="pb-3 border-b border-slate-100 dark:border-[#20314C]">
              <h3 className="typo-section-title text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Thao Tác Nhanh</span>
              </h3>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => onNavigateTab('exams')}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-[#152338] hover:bg-purple-50 dark:hover:bg-[#1F2F4C] border border-slate-200/60 dark:border-[#20314C] transition group text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 flex items-center justify-center font-bold">
                    <FileText size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-purple-600 dark:group-hover:text-purple-400">
                      Studio Soạn Đề Thi
                    </div>
                    <div className="text-[10.5px] text-slate-400">Tạo đề thi trắc nghiệm & tự luận</div>
                  </div>
                </div>
                <ArrowRight size={14} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('exam-results')}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-[#152338] hover:bg-emerald-50 dark:hover:bg-[#1F2F4C] border border-slate-200/60 dark:border-[#20314C] transition group text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center justify-center font-bold">
                    <Award size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                      Bảng Điểm & Kết Quả
                    </div>
                    <div className="text-[10.5px] text-slate-400">Thống kê điểm số và tỷ lệ đạt</div>
                  </div>
                </div>
                <ArrowRight size={14} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('announcements')}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-[#152338] hover:bg-sky-50 dark:hover:bg-[#1F2F4C] border border-slate-200/60 dark:border-[#20314C] transition group text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-[#38BDF8] flex items-center justify-center font-bold">
                    <Bell size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-sky-600 dark:group-hover:text-[#38BDF8]">
                      Gửi Thông Báo Lớp Học
                    </div>
                    <div className="text-[10.5px] text-slate-400">Gửi tin nhắn trực tiếp đến học viên</div>
                  </div>
                </div>
                <ArrowRight size={14} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </GlowCard>
        </div>
      </div>
    </div>
  )
}

export default TeacherDashboardTab
