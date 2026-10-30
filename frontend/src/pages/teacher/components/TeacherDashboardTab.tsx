import React, { useState, useEffect } from 'react'
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
  MapPin
} from 'lucide-react'
import { teacherApi } from '../../../api/teacher'
import type { TeacherDashboardSummary } from '../../../types/teacher'

interface Props {
  onNavigateTab: (tab: string, filter?: string) => void
  onSelectSession?: (sessionId: number, classId: number) => void
}

export const TeacherDashboardTab: React.FC<Props> = ({ onNavigateTab, onSelectSession }) => {
  const [summary, setSummary] = useState<TeacherDashboardSummary | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const loadSummary = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await teacherApi.getDashboardSummary()
      if (res.data) {
        setSummary(res.data)
      }
    } catch (err: any) {
      setError(err?.message || 'Không thể tải dữ liệu tổng quan giảng viên.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSummary()
  }, [])

  if (loading) {
    return (
      <div className="p-12 text-center">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-500 dark:text-slate-400">Đang đồng bộ dữ liệu giảng dạy thời gian thực...</p>
      </div>
    )
  }

  if (error || !summary) {
    return (
      <div className="p-8 text-center text-rose-500 bg-rose-50 dark:bg-rose-950/30 rounded-2xl border border-rose-200 dark:border-rose-900/50">
        <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
        <p className="font-semibold">{error || 'Không có dữ liệu tổng quan'}</p>
        <button
          onClick={loadSummary}
          className="mt-3 px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 text-white hover:bg-rose-700"
        >
          Thử lại
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 8 INTERACTIVE STAT CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Classes */}
        <div
          onClick={() => onNavigateTab('classes')}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Lớp Phụ Trách
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {summary.totalClasses}
            </span>
            <span className="text-xs text-slate-500">lớp học</span>
          </div>
          <p className="mt-1 text-xs text-slate-400 flex items-center gap-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            Xem danh sách lớp <ChevronRight className="w-3.5 h-3.5" />
          </p>
        </div>

        {/* 2. Students */}
        <div
          onClick={() => onNavigateTab('students')}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tổng Học Viên
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {summary.totalStudents}
            </span>
            <span className="text-xs text-slate-500">học viên</span>
          </div>
          <p className="mt-1 text-xs text-slate-400 flex items-center gap-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            Theo dõi học viên <ChevronRight className="w-3.5 h-3.5" />
          </p>
        </div>

        {/* 3. Unmarked Sessions */}
        <div
          onClick={() => onNavigateTab('classes', 'attendance')}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Chưa Điểm Danh
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-3xl font-black ${summary.unmarkedAttendanceCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
              {summary.unmarkedAttendanceCount}
            </span>
            <span className="text-xs text-slate-500">buổi học</span>
          </div>
          <p className="mt-1 text-xs text-slate-400 flex items-center gap-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
            Cần cập nhật ngay <ChevronRight className="w-3.5 h-3.5" />
          </p>
        </div>

        {/* 4. Pending Review Exams */}
        <div
          onClick={() => onNavigateTab('exams', 'PENDING_REVIEW')}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-sky-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
              Đang Chờ Admin Duyệt
            </span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {summary.pendingReviewExamsCount}
            </span>
            <span className="text-xs text-slate-500">đề thi</span>
          </div>
          <p className="mt-1 text-xs text-slate-400 flex items-center gap-1 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
            Kiểm tra tiến độ <ChevronRight className="w-3.5 h-3.5" />
          </p>
        </div>

        {/* 5. Approved Exams (Ready to publish) */}
        <div
          onClick={() => onNavigateTab('exams', 'APPROVED')}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Đề Đã Duyệt (Có thể giao)
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {summary.approvedExamsCount}
            </span>
            <span className="text-xs text-slate-500">đề sẵn sàng</span>
          </div>
          <p className="mt-1 text-xs text-slate-400 flex items-center gap-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            Giao đề cho lớp ngay <ChevronRight className="w-3.5 h-3.5" />
          </p>
        </div>

        {/* 6. Changes Requested Exams */}
        <div
          onClick={() => onNavigateTab('exams', 'CHANGES_REQUESTED')}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Admin Yêu Cầu Sửa
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <RotateCcw className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-3xl font-black ${summary.changesRequestedExamsCount > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-900 dark:text-white'}`}>
              {summary.changesRequestedExamsCount}
            </span>
            <span className="text-xs text-slate-500">cần chỉnh</span>
          </div>
          <p className="mt-1 text-xs text-slate-400 flex items-center gap-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            Xem góp ý của Admin <ChevronRight className="w-3.5 h-3.5" />
          </p>
        </div>

        {/* 7. Draft Exams */}
        <div
          onClick={() => onNavigateTab('exams', 'DRAFT')}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-slate-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Đề Nháp Đang Soạn
            </span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {summary.draftExamsCount}
            </span>
            <span className="text-xs text-slate-500">bản nháp</span>
          </div>
          <p className="mt-1 text-xs text-slate-400 flex items-center gap-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            Tiếp tục soạn đề <ChevronRight className="w-3.5 h-3.5" />
          </p>
        </div>

        {/* 8. Pending Grading Attempts */}
        <div
          onClick={() => onNavigateTab('exam-results')}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-purple-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              Bài Làm Chờ Chấm
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckSquare className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-3xl font-black ${summary.pendingGradingCount > 0 ? 'text-purple-600 dark:text-purple-400' : 'text-slate-900 dark:text-white'}`}>
              {summary.pendingGradingCount}
            </span>
            <span className="text-xs text-slate-500">bài thi</span>
          </div>
          <p className="mt-1 text-xs text-slate-400 flex items-center gap-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
            Chấm bài tự luận <ChevronRight className="w-3.5 h-3.5" />
          </p>
        </div>
      </div>

      {/* PRIORITY ACTION CENTER ("VIỆC CẦN XỬ LÝ NGAY") */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/20 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white tracking-tight">
                Khu Vực Việc Cần Xử Lý Ngay (Action Center)
              </h3>
              <p className="text-xs text-slate-400">
                Các đầu việc ưu tiên cao giúp Thầy/Cô quản lý lớp học và thi cử mượt mà
              </p>
            </div>
          </div>
          <button
            onClick={loadSummary}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Cập nhật
          </button>
        </div>

        {summary.actionItems && summary.actionItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {summary.actionItems.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  if (item.type === 'ATTENDANCE') onNavigateTab('classes', 'attendance')
                  else if (item.type === 'EXAM_REVIEW') onNavigateTab('exams', item.id === 'CHANGES_REQ' ? 'CHANGES_REQUESTED' : item.id === 'APPROVED_EXAMS' ? 'APPROVED' : 'DRAFT')
                  else if (item.type === 'GRADING') onNavigateTab('exam-results')
                  else onNavigateTab('classes')
                }}
                className="p-4 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-indigo-500/50 transition-all cursor-pointer group flex items-start justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      item.priority === 'HIGH'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    }`}>
                      {item.badge}
                    </span>
                    <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                      {item.title}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-xl bg-slate-700/60 group-hover:bg-indigo-600 text-slate-300 group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-700/50 text-center text-xs text-slate-400">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            Tất cả công việc đã được xử lý chu đáo! Không có việc nào đang tồn đọng.
          </div>
        )}
      </div>

      {/* SCHEDULES: TODAY & UPCOMING SESSIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Lịch Dạy Hôm Nay ({summary.todaySessions?.length || 0})
              </h3>
            </div>
            <span className="text-xs font-semibold text-slate-400">
              {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
            </span>
          </div>

          {summary.todaySessions && summary.todaySessions.length > 0 ? (
            <div className="space-y-3">
              {summary.todaySessions.map((s) => (
                <div
                  key={s.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70 flex items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {s.topic}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                        {s.startTime || '08:00'} - {s.endTime || '10:00'}
                      </span>
                      {s.room && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                          {s.room}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (onSelectSession) onSelectSession(s.id, s.classId)
                      else onNavigateTab('classes', 'attendance')
                    }}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition active:scale-95 shrink-0"
                  >
                    Điểm danh ngay
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              Hôm nay Thầy/Cô không có lịch dạy nào. Thư giãn hoặc chuẩn bị giáo án nhé!
            </div>
          )}
        </div>

        {/* Upcoming Sessions (Next 7 Days) */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Lịch Dạy Sắp Tới (7 ngày tới: {summary.upcomingSessions?.length || 0})
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('classes')}
              className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
            >
              Xem toàn bộ
            </button>
          </div>

          {summary.upcomingSessions && summary.upcomingSessions.length > 0 ? (
            <div className="space-y-3">
              {summary.upcomingSessions.slice(0, 4).map((s) => (
                <div
                  key={s.id}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/50 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">
                      {s.topic}
                    </div>
                    <div className="text-slate-400 mt-0.5">
                      {s.sessionDate} • {s.startTime || '08:00'} - {s.endTime || '10:00'} {s.room ? `• Phòng ${s.room}` : ''}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    Sắp diễn ra
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              Không có buổi học nào được xếp lịch trong 7 ngày tới.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
export default TeacherDashboardTab
