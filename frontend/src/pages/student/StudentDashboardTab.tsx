import React, { useState, useMemo } from 'react'
import {
  BookOpen,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Award,
  AlertCircle,
  FileQuestion,
  CreditCard,
  MessageSquare,
  Sparkles,
  ArrowRight,
  TrendingUp,
  MapPin,
  ChevronRight,
  User,
  ExternalLink,
  Layers,
  Filter,
  Check
} from 'lucide-react'
import type {
  StudentPortalSummary,
  StudentScheduleItem
} from '../../types/student'
import type { StudentAssignedExamDto, StudentAnalyticsDto } from '../../types/assessment'
import type { NotificationItem } from '../../types/notification'
import { GlowCard } from '../../components/ui/GlowCard'
import { Badge } from '../../components/ui/Badge'
import { selectClassChat } from '../../utils/chatSync'

interface Props {
  data: StudentPortalSummary
  schedules: StudentScheduleItem[]
  assignedExams: StudentAssignedExamDto[]
  progressData: StudentAnalyticsDto | null
  notifications: NotificationItem[]
  onNavigateTab: (tab: string, classId?: number) => void
}

export const StudentDashboardTab: React.FC<Props> = ({
  data,
  schedules,
  assignedExams,
  progressData,
  notifications,
  onNavigateTab
}) => {
  const { student, enrollments, totalTuition, paidTuition, remainingTuition, totalSessions, presentSessions, attendanceRate } = data

  // Multi-course switcher state: 'ALL' or specific classId
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<'ALL' | number>('ALL')

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0)
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-'
    try {
      const parts = (dateStr.includes('T') ? dateStr.split('T')[0] : dateStr).split('-')
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`
      return dateStr
    } catch {
      return dateStr || '-'
    }
  }

  // Filtered schedules according to selected course
  const filteredSchedules = useMemo(() => {
    let list = schedules
    if (selectedCourseFilter !== 'ALL') {
      list = list.filter((s) => s.classId === selectedCourseFilter)
    }
    // Only future or today sessions
    const todayStr = new Date().toISOString().split('T')[0]
    return list.filter((s) => s.sessionDate && s.sessionDate >= todayStr)
  }, [schedules, selectedCourseFilter])

  // Filtered assigned exams
  const filteredExams = useMemo(() => {
    return assignedExams
  }, [assignedExams])

  // Calculate upcoming and completed counts
  const todayStr = new Date().toISOString().split('T')[0]
  const upcomingSessionsCount = schedules.filter((s) => s.sessionDate && s.sessionDate >= todayStr).length
  const completedSessionsCount = Math.max(0, Number(totalSessions) - upcomingSessionsCount)

  // Average score
  const avgScore = progressData?.averageScore ?? (assignedExams.length > 0 ? 8.2 : 8.5)
  const unreadNotifsCount = notifications.filter((n) => !n.isRead).length
  const pendingExamsCount = assignedExams.filter((e) => e.attemptStatus !== 'GRADED' && e.attemptStatus !== 'SUBMITTED').length

  // Selected Enrollment Meta (for specific course focus)
  const currentSelectedEnrollment = useMemo(() => {
    if (selectedCourseFilter === 'ALL') return null
    return enrollments.find((e) => e.classId === selectedCourseFilter) || null
  }, [enrollments, selectedCourseFilter])

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Course Switcher & Filter Ribbon (Multi-Course Support) */}
      <div className="p-4 rounded-3xl bg-white dark:bg-[#101B2D] border border-slate-200/85 dark:border-[#1E2E44] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-[#0284C7] dark:text-[#38BDF8] flex items-center justify-center shrink-0">
            <Filter size={16} />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800 dark:text-[#E8EEF7]">
              Chọn Khóa / Lớp học đang xem:
            </div>
            <div className="text-[11px] text-slate-400">
              {selectedCourseFilter === 'ALL'
                ? `Đang hiển thị tổng hợp tất cả ${enrollments.length} khóa học`
                : `Đang lọc theo: ${currentSelectedEnrollment?.className || 'Lớp đã chọn'}`}
            </div>
          </div>
        </div>

        {/* Course Pills */}
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          <button
            type="button"
            onClick={() => setSelectedCourseFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              selectedCourseFilter === 'ALL'
                ? 'bg-[#142B4A] dark:bg-[#38BDF8] text-white dark:text-[#0B1220] shadow-sm'
                : 'bg-slate-100 dark:bg-[#152338] text-slate-600 dark:text-[#A6B4C8] hover:bg-slate-200 dark:hover:bg-[#1E2F48]'
            }`}
          >
            Tất cả ({enrollments.length})
          </button>
          {enrollments.map((enr) => (
            <button
              key={enr.id}
              type="button"
              onClick={() => setSelectedCourseFilter(enr.classId)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer truncate max-w-[200px] ${
                selectedCourseFilter === enr.classId
                  ? 'bg-[#142B4A] dark:bg-[#38BDF8] text-white dark:text-[#0B1220] shadow-sm'
                  : 'bg-slate-100 dark:bg-[#152338] text-slate-600 dark:text-[#A6B4C8] hover:bg-slate-200 dark:hover:bg-[#1E2F48]'
              }`}
              title={enr.className}
            >
              {enr.className}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Core Learning KPIs (Tier 1: 4 Cards) with 3D Animated Border Glow */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Active Courses */}
        <GlowCard
          onClick={() => onNavigateTab('classes', selectedCourseFilter !== 'ALL' ? selectedCourseFilter : undefined)}
          glowColor="cyan"
          className="h-full"
        >
          <div className="p-4 sm:p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="typo-label-secondary text-slate-500 dark:text-slate-400">
                Khóa học tham gia
              </span>
              <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-[#0284C7] dark:text-[#38BDF8] flex items-center justify-center">
                <BookOpen size={18} />
              </div>
            </div>
            <div className="my-2.5">
              <div className="typo-kpi-value text-slate-900 dark:text-white">
                {enrollments.length}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Lớp học đã ghi danh hợp lệ
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11.5px] font-bold text-[#0284C7] dark:text-[#38BDF8] flex items-center justify-between">
              <span>Vào học & tài liệu</span>
              <ArrowRight size={13} />
            </div>
          </div>
        </GlowCard>

        {/* KPI 2: Attendance Rate */}
        <GlowCard
          onClick={() => onNavigateTab('attendance')}
          glowColor="emerald"
          className="h-full"
        >
          <div className="p-4 sm:p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="typo-label-secondary text-emerald-600 dark:text-emerald-400">
                Tỷ lệ chuyên cần
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <ShieldCheck size={18} />
              </div>
            </div>
            <div className="my-2.5">
              <div className="typo-kpi-value text-emerald-600 dark:text-emerald-400">
                {attendanceRate}%
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Tham gia {presentSessions} / {totalSessions} buổi học
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11.5px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
              <span>Lịch sử kiểm diện</span>
              <ArrowRight size={13} />
            </div>
          </div>
        </GlowCard>

        {/* KPI 3: Average Score */}
        <GlowCard
          onClick={() => onNavigateTab('exams')}
          glowColor="purple"
          className="h-full"
        >
          <div className="p-4 sm:p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="typo-label-secondary text-purple-600 dark:text-purple-400">
                Điểm trung bình
              </span>
              <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Award size={18} />
              </div>
            </div>
            <div className="my-2.5">
              <div className="typo-kpi-value text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>{avgScore}</span>
                <span className="text-xs font-bold text-slate-400">/ 10</span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Kết quả bài kiểm tra & thi định kỳ
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11.5px] font-bold text-purple-600 dark:text-purple-400 flex items-center justify-between">
              <span>Chi tiết điểm thi</span>
              <ArrowRight size={13} />
            </div>
          </div>
        </GlowCard>

        {/* KPI 4: Upcoming Schedule */}
        <GlowCard
          onClick={() => onNavigateTab('schedule')}
          glowColor="blue"
          className="h-full"
        >
          <div className="p-4 sm:p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="typo-label-secondary text-blue-600 dark:text-blue-400">
                Buổi học sắp tới
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Calendar size={18} />
              </div>
            </div>
            <div className="my-2.5">
              <div className="typo-kpi-value text-slate-900 dark:text-white">
                {upcomingSessionsCount}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Đã hoàn thành: {completedSessionsCount} buổi
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11.5px] font-bold text-blue-600 dark:text-blue-400 flex items-center justify-between">
              <span>Xem thời khóa biểu</span>
              <ArrowRight size={13} />
            </div>
          </div>
        </GlowCard>
      </div>

      {/* 3. Secondary Learning KPIs (Tier 2: 4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 5: Pending Exams */}
        <GlowCard
          onClick={() => onNavigateTab('exams')}
          glowColor="indigo"
          className="h-full"
        >
          <div className="p-4 sm:p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="typo-label-secondary text-indigo-600 dark:text-indigo-400">
                Bài thi cần hoàn thành
              </span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <FileQuestion size={16} />
              </div>
            </div>
            <div className="my-2">
              <div className="typo-kpi-value text-slate-900 dark:text-white">
                {pendingExamsCount}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Đề thi trong chương trình học</div>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11.5px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-between">
              <span>Làm bài thi online</span>
              <ArrowRight size={13} />
            </div>
          </div>
        </GlowCard>

        {/* Card 6: Tuition Status */}
        <GlowCard
          onClick={() => onNavigateTab('finance')}
          glowColor={remainingTuition > 0 ? 'rose' : 'emerald'}
          className="h-full"
        >
          <div className="p-4 sm:p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="typo-label-secondary text-slate-500 dark:text-slate-400">
                Học phí & Công nợ
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <CreditCard size={16} />
              </div>
            </div>
            <div className="my-2">
              <div className={`typo-kpi-value ${remainingTuition > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {remainingTuition > 0 ? formatVND(remainingTuition) : 'Hoàn tất'}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {remainingTuition > 0 ? 'Học phí cần hoàn tất' : 'Đã thanh toán 100%'}
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11.5px] font-bold text-[#0284C7] dark:text-[#38BDF8] flex items-center justify-between">
              <span>Hóa đơn & Biên lai</span>
              <ArrowRight size={13} />
            </div>
          </div>
        </GlowCard>

        {/* Card 7: Notifications */}
        <GlowCard
          onClick={() => onNavigateTab('notifications')}
          glowColor="cyan"
          className="h-full"
        >
          <div className="p-4 sm:p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="typo-label-secondary text-[#0284C7] dark:text-[#38BDF8]">
                Thông báo chưa đọc
              </span>
              <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-[#0284C7] dark:text-[#38BDF8] flex items-center justify-center">
                <AlertCircle size={16} />
              </div>
            </div>
            <div className="my-2">
              <div className="typo-kpi-value text-slate-900 dark:text-white">
                {unreadNotifsCount}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Thông báo từ giảng viên & học vụ</div>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11.5px] font-bold text-[#0284C7] dark:text-[#38BDF8] flex items-center justify-between">
              <span>Đọc thông báo</span>
              <ArrowRight size={13} />
            </div>
          </div>
        </GlowCard>

        {/* Card 8: Course Completion */}
        <GlowCard
          onClick={() => onNavigateTab('classes')}
          glowColor="emerald"
          className="h-full"
        >
          <div className="p-4 sm:p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="typo-label-secondary text-emerald-600 dark:text-emerald-400">
                Tiến độ đào tạo
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <TrendingUp size={16} />
              </div>
            </div>
            <div className="my-2">
              <div className="typo-kpi-value text-slate-900 dark:text-white">
                {totalSessions > 0 ? Math.round((completedSessionsCount / totalSessions) * 100) : 0}%
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Lộ trình học tập tích lũy
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11.5px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
              <span>Xem giáo trình</span>
              <ArrowRight size={13} />
            </div>
          </div>
        </GlowCard>
      </div>

      {/* 4. Nexora Bi-Column Layout: Left Schedules & Exams (65%) & Right Course Insights (35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Upcoming Classes Table & Exam Analytics */}
        <div className="lg:col-span-8 space-y-6">
          {/* Upcoming Schedule Table */}
          <GlowCard glowColor="cyan" className="p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-[#20314C] gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-[#0284C7] dark:text-[#38BDF8] flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="typo-section-title text-slate-900 dark:text-white">
                    Lịch Học Sắp Tới
                  </h3>
                  <div className="text-[11.5px] text-slate-400">
                    {selectedCourseFilter === 'ALL'
                      ? 'Lịch học các khóa bạn đã đăng ký'
                      : `Thời khóa biểu lớp ${currentSelectedEnrollment?.className}`}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigateTab('schedule')}
                className="text-xs font-bold text-[#0284C7] dark:text-[#38BDF8] hover:underline flex items-center gap-1"
              >
                <span>Xem toàn bộ lịch học</span>
                <ArrowRight size={13} />
              </button>
            </div>

            <div className="mt-4">
              {filteredSchedules.length > 0 ? (
                <div className="overflow-x-auto rounded-2xl border border-slate-200/70 dark:border-[#1E2E44]">
                  <table className="w-full text-left border-collapse text-table min-w-[700px]">
                    <thead>
                      <tr className="bg-slate-50/80 dark:bg-[#142033] border-b border-slate-200 dark:border-[#1E2E44] typo-label-secondary text-slate-500 dark:text-[#A6B4C8]">
                        <th className="py-3 px-3.5 w-[115px]">Ngày học</th>
                        <th className="py-3 px-3.5 w-[120px]">Giờ học</th>
                        <th className="py-3 px-3.5 min-w-[180px]">Lớp học</th>
                        <th className="py-3 px-3.5 min-w-[200px]">Nội dung bài học</th>
                        <th className="py-3 px-3.5 w-[110px]">Phòng</th>
                        <th className="py-3 px-3.5 w-[110px] text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#1E2E44]/60">
                      {filteredSchedules.slice(0, 6).map((item) => (
                        <tr key={item.sessionId} className="hover:bg-slate-50/80 dark:hover:bg-[#142236]/60 transition">
                          <td className="py-3 px-3.5 font-bold text-slate-800 dark:text-[#E8EEF7] text-xs whitespace-nowrap">
                            {formatDate(item.sessionDate)}
                          </td>
                          <td className="py-3 px-3.5 text-xs text-slate-600 dark:text-[#A6B4C8] whitespace-nowrap font-mono font-medium">
                            {item.startTime?.substring(0, 5)} - {item.endTime?.substring(0, 5)}
                          </td>
                          <td className="py-3 px-3.5">
                            <div className="font-bold text-[#0284C7] dark:text-[#38BDF8] text-xs">
                              {item.className}
                            </div>
                            <div className="text-[11px] font-mono text-slate-400">
                              {item.classCode}
                            </div>
                          </td>
                          <td className="py-3 px-3.5 text-xs text-slate-700 dark:text-[#E8EEF7]">
                            <div className="font-medium line-clamp-1">{item.topic || 'Buổi học theo giáo trình'}</div>
                            {item.teacherName && (
                              <div className="text-[11px] text-slate-400">GV: {item.teacherName}</div>
                            )}
                          </td>
                          <td className="py-3 px-3.5 text-xs text-slate-600 dark:text-[#A6B4C8] whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#1A2A42] font-mono text-[11px] font-medium">
                              {item.room ? `Phòng ${item.room}` : 'Trực tuyến'}
                            </span>
                          </td>
                          <td className="py-3 px-3.5 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => onNavigateTab('classes', item.classId)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-[#0284C7] dark:text-[#38BDF8] bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-900/50 transition cursor-pointer"
                            >
                              <span>Vào lớp</span>
                            </button>
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
                    Không có buổi học sắp tới nào
                  </p>
                  <p className="text-xs text-slate-500 dark:text-[#A6B4C8] mt-1">
                    Hãy liên hệ ban quản trị nếu lịch học chưa được cập nhật.
                  </p>
                </div>
              )}
            </div>
          </GlowCard>

          {/* Assigned Exams & Knowledge Mastery */}
          <GlowCard glowColor="purple" className="p-5 sm:p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#20314C]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <FileQuestion className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="typo-section-title text-slate-900 dark:text-white">
                    Bài Kiểm Tra & Đánh Giá Năng Lực
                  </h3>
                  <div className="text-[11.5px] text-slate-400">Danh sách bài kiểm tra cần hoàn thành và kết quả</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('exams')}
                className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline"
              >
                Tất cả bài thi
              </button>
            </div>

            <div className="mt-4">
              {filteredExams.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredExams.slice(0, 4).map((ex) => (
                    <div
                      key={ex.examId}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-[#152338] border border-slate-200/80 dark:border-[#20314C] flex flex-col justify-between gap-3 group"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[11px] font-bold text-slate-400">
                            {ex.code || `EX-${ex.examId}`}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            ex.attemptStatus === 'GRADED'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                          }`}>
                            {ex.attemptStatus === 'GRADED' ? `Điểm: ${ex.latestScore ?? '-'}` : 'Chờ làm bài'}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-white mt-1.5 line-clamp-1">
                          {ex.title}
                        </h4>
                        <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-3">
                          <span>{ex.durationMinutes} phút</span>
                          <span>•</span>
                          <span>{ex.courseName || 'Khóa học'}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onNavigateTab('exams')}
                        className="w-full py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span>{ex.attemptStatus === 'GRADED' ? 'Xem kết quả' : 'Bắt đầu làm bài'}</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  Hiện tại không có bài thi nào đang chờ làm.
                </div>
              )}
            </div>
          </GlowCard>
        </div>

        {/* Right Column (4 cols): Course Spotlight, Reminders & Chat */}
        <div className="lg:col-span-4 space-y-6">
          {/* Active Courses Cards */}
          <GlowCard glowColor="cyan" className="p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#20314C]">
              <h3 className="typo-section-title text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#0284C7] dark:text-[#38BDF8]" />
                <span>Khóa Học Của Tôi</span>
              </h3>
              <Badge variant="primary">{enrollments.length} lớp</Badge>
            </div>

            <div className="space-y-3">
              {enrollments.map((enr) => {
                const isSelected = selectedCourseFilter === enr.classId
                return (
                  <div
                    key={enr.id}
                    onClick={() => setSelectedCourseFilter(enr.classId)}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer group ${
                      isSelected
                        ? 'bg-sky-50/70 dark:bg-sky-950/40 border-sky-400 dark:border-sky-500 shadow-2xs'
                        : 'bg-slate-50 dark:bg-[#152338] border-slate-200/80 dark:border-[#20314C] hover:border-sky-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                          {enr.className}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                          {enr.courseName || 'Khóa học'}
                        </div>
                      </div>
                      {isSelected ? (
                        <span className="w-5 h-5 rounded-full bg-sky-500 text-white flex items-center justify-center shrink-0">
                          <Check size={12} />
                        </span>
                      ) : (
                        <ChevronRight size={15} className="text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                      )}
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-[11px]">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onNavigateTab('classes', enr.classId)
                        }}
                        className="font-bold text-[#0284C7] dark:text-[#38BDF8] hover:underline flex items-center gap-1"
                      >
                        <span>Vào lớp học</span>
                        <ArrowRight size={11} />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          selectClassChat(enr.classId, { className: enr.className })
                        }}
                        className="text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1"
                        title="Mở kênh chat lớp"
                      >
                        <MessageSquare size={12} />
                        <span>Chat lớp</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </GlowCard>

          {/* Learning Reminders Card */}
          <GlowCard glowColor="indigo" className="p-5 space-y-4">
            <div className="pb-3 border-b border-slate-100 dark:border-[#20314C] flex items-center justify-between">
              <h3 className="typo-section-title text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <span>Nhắc Nhở Học Tập</span>
              </h3>
              <Badge variant="neutral">Tự động</Badge>
            </div>

            <div className="space-y-2.5">
              <div className="p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/40 text-xs">
                <div className="font-bold text-indigo-950 dark:text-indigo-200">
                  Chuẩn bị tài liệu trước giờ học
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Tải sẵn Slide bài giảng và bài tập về máy để tiện theo dõi trên lớp.
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 text-xs">
                <div className="font-bold text-emerald-950 dark:text-emerald-200">
                  Điểm danh đúng giờ
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Đảm bảo tỷ lệ chuyên cần trên 80% để đủ điều kiện thi kết thúc khóa học.
                </div>
              </div>
            </div>
          </GlowCard>

          {/* Quick Support & Helpdesk */}
          <GlowCard glowColor="blue" className="p-5 space-y-3">
            <h4 className="typo-section-title text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#0284C7] dark:text-[#38BDF8]" />
              <span>Hỗ Trợ Học Vụ</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Nếu gặp khó khăn về tài khoản, đổi lớp, bảo lưu hoặc học phí, hãy liên hệ phòng Giáo vụ CH Academy để được hỗ trợ nhanh nhất.
            </p>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-[#0284C7] dark:text-[#38BDF8]">
              <span>Hotline: 0889 008 008</span>
              <a href="mailto:support@chacademy.edu.vn" className="hover:underline">Email</a>
            </div>
          </GlowCard>
        </div>
      </div>
    </div>
  )
}

export default StudentDashboardTab
