import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
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
  AlertCircle
} from 'lucide-react'
import { StatCard } from '../../components/ui/StatCard'
import { Badge } from '../../components/ui/Badge'

export const DashboardPage: React.FC = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [statsLoading, setStatsLoading] = useState<boolean>(true)
  const [statsError, setStatsError] = useState<string | null>(null)

  const fetchStats = async () => {
    setStatsLoading(true)
    setStatsError(null)
    try {
      const data = await dashboardApi.getStats()
      setStats(data)
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Không thể tải thống kê bảng điều khiển'
      setStatsError(errorMsg)
    } finally {
      setStatsLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0)
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    const [y, m, d] = dateStr.split('-')
    return `${d}/${m}/${y}`
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Welcome Banner */}
      <div className="bg-white dark:bg-[#151F31] p-6 rounded-2xl border border-slate-200/80 dark:border-[#2A3A50] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-[#A6B4C8] uppercase tracking-wider mb-1">
            <span>Tổng quan vận hành</span>
            <span>/</span>
            <span className="text-[#142B4A] dark:text-[#38BDF8]">Dashboard</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#142B4A] dark:text-[#E8EEF7]">
            Xin chào, {user?.fullName || 'Quản trị viên'}! 👋
          </h1>
          <p className="text-slate-500 dark:text-[#A6B4C8] text-sm mt-1">
            Chào mừng bạn đến với trung tâm điều hành giáo dục CH Academy.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#1C293D] border border-slate-200 dark:border-[#2A3A50] text-xs font-semibold text-slate-600 dark:text-[#E8EEF7]">
            <Calendar className="w-4 h-4 text-[#142B4A] dark:text-[#38BDF8]" />
            <span>Năm học 2026 - 2027</span>
          </div>
          <button
            onClick={fetchStats}
            disabled={statsLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#151F31] hover:bg-slate-50 dark:hover:bg-[#1C293D] text-slate-700 dark:text-[#E8EEF7] text-sm font-semibold shadow-xs transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${statsLoading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Main KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Học viên"
          value={statsLoading ? '...' : (stats?.totalStudents ?? 0)}
          subtitle={
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              {stats?.activeStudents ?? 0} đang theo học
            </span>
          }
          icon={Users}
        />
        <StatCard
          title="Khóa học"
          value={statsLoading ? '...' : (stats?.totalCourses ?? 0)}
          subtitle="Chương trình đào tạo"
          icon={BookOpen}
        />
        <StatCard
          title="Lớp học"
          value={statsLoading ? '...' : (stats?.activeClasses ?? 0)}
          subtitle="Lớp đang vận hành"
          icon={Calendar}
        />
        <StatCard
          title="Tuyển sinh"
          value={statsLoading ? '...' : (stats?.totalLeads ?? 0)}
          subtitle={
            <span className="text-[#3977B8] dark:text-[#38BDF8] font-semibold">
              {stats?.leadConversionRate ?? 0}% chuyển đổi
            </span>
          }
          icon={UserPlus}
        />
      </div>

      {/* Finance Overview Banner */}
      <div className="bg-[#142B4A] dark:bg-[#101B2D] border border-slate-700/50 dark:border-[#2A3A50] rounded-2xl p-6 text-white shadow-md">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 dark:text-slate-400 uppercase tracking-wider mb-4">
          <CreditCard className="w-4 h-4 text-[#38BDF8]" />
          <span>Chỉ số tài chính trọng yếu</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-700/60">
          <div className="pt-2 md:pt-0 md:pr-4">
            <div className="text-xs text-slate-300 flex items-center gap-1.5 mb-1">
              <DollarSign className="w-4 h-4 text-[#38BDF8]" />
              <span>Tổng học phí phải thu</span>
            </div>
            <div className="text-2xl font-bold tracking-tight text-white">
              {statsLoading ? '...' : formatVND(stats?.totalReceivable ?? 0)}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Theo hợp đồng & biểu phí niêm yết
            </div>
          </div>

          <div className="pt-4 md:pt-0 md:px-6">
            <div className="text-xs text-slate-300 flex items-center gap-1.5 mb-1">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Thực thu (Đã thanh toán)</span>
            </div>
            <div className="text-2xl font-bold tracking-tight text-emerald-400">
              {statsLoading ? '...' : formatVND(stats?.totalPaid ?? 0)}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Đã ghi nhận giao dịch vào hệ thống
            </div>
          </div>

          <div className="pt-4 md:pt-0 md:pl-6">
            <div className="text-xs text-slate-300 flex items-center gap-1.5 mb-1">
              <CreditCard className="w-4 h-4 text-rose-400" />
              <span>Công nợ còn lại</span>
            </div>
            <div className="text-2xl font-bold tracking-tight text-rose-400">
              {statsLoading ? '...' : formatVND(stats?.totalDebt ?? 0)}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Các khoản chưa hoàn tất thanh toán
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Upcoming Sessions & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Upcoming Sessions */}
        <div className="lg:col-span-2 bg-white dark:bg-[#151F31] rounded-2xl border border-slate-200/80 dark:border-[#2A3A50] shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#2A3A50] mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#142B4A] dark:text-[#38BDF8]" />
                <h2 className="text-base font-bold text-[#142B4A] dark:text-[#E8EEF7]">
                  Lịch học sắp diễn ra
                </h2>
              </div>
              <Link
                to="/admin/attendance"
                className="text-xs font-semibold text-[#142B4A] dark:text-[#38BDF8] hover:underline flex items-center gap-1"
              >
                <span>Xem điểm danh</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {statsLoading ? (
              <div className="py-12 text-center text-sm text-slate-500 dark:text-[#A6B4C8]">
                Đang tải lịch học...
              </div>
            ) : statsError ? (
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{statsError}</span>
              </div>
            ) : stats?.upcomingSessions && stats.upcomingSessions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-table">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-[#1C293D] border-b border-slate-200 dark:border-[#2A3A50] text-xs font-semibold text-slate-500 dark:text-[#A6B4C8] uppercase tracking-wider">
                      <th className="py-3 px-3">Ngày</th>
                      <th className="py-3 px-3">Giờ</th>
                      <th className="py-3 px-3">Lớp học</th>
                      <th className="py-3 px-3">Giáo viên</th>
                      <th className="py-3 px-3">Phòng</th>
                      <th className="py-3 px-3 text-center">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#2A3A50]/60">
                    {stats.upcomingSessions.map((session) => (
                      <tr key={session.id} className="hover:bg-slate-50/60 dark:hover:bg-[#1C293D]/40 transition">
                        <td className="py-3 px-3 font-semibold text-slate-800 dark:text-[#E8EEF7] text-xs">
                          {formatDate(session.sessionDate)}
                        </td>
                        <td className="py-3 px-3 text-xs text-slate-600 dark:text-[#A6B4C8]">
                          {session.startTime?.substring(0, 5)} - {session.endTime?.substring(0, 5)}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-[#142B4A] dark:text-[#38BDF8] text-xs">{session.className}</div>
                          <div className="text-[11px] font-mono text-slate-500 dark:text-[#A6B4C8]">{session.classCode}</div>
                        </td>
                        <td className="py-3 px-3 text-xs text-slate-700 dark:text-[#E8EEF7]">
                          {session.teacherName}
                        </td>
                        <td className="py-3 px-3 text-xs text-slate-600 dark:text-[#A6B4C8]">
                          {session.room || 'Chưa xếp'}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <Badge variant={session.status === 'SCHEDULED' ? 'primary' : 'success'}>
                            {session.status === 'SCHEDULED' ? 'Đã lên lịch' : session.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center bg-slate-50/60 dark:bg-[#1C293D]/30 rounded-xl border border-dashed border-slate-200 dark:border-[#2A3A50] p-6">
                <Calendar className="w-8 h-8 text-slate-400 dark:text-slate-500 mx-auto mb-2 opacity-60" />
                <p className="text-sm font-semibold text-slate-700 dark:text-[#E8EEF7]">
                  Chưa có buổi học nào sắp tới trong 7 ngày tới
                </p>
                <p className="text-xs text-slate-500 dark:text-[#A6B4C8] mt-1">
                  Tạo thêm lớp hoặc lịch học trong phần Quản lý đào tạo
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Quick Actions & Center Info */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white dark:bg-[#151F31] rounded-2xl border border-slate-200/80 dark:border-[#2A3A50] shadow-xs p-5">
            <h3 className="text-sm font-bold text-[#142B4A] dark:text-[#E8EEF7] uppercase tracking-wider mb-3">
              Thao tác nhanh
            </h3>
            <div className="space-y-2">
              <Link
                to="/admin/students"
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/70 dark:bg-[#1C293D]/60 hover:bg-slate-100 dark:hover:bg-[#1C293D] border border-slate-200/60 dark:border-[#2A3A50] text-sm font-semibold text-[#142B4A] dark:text-[#E8EEF7] transition"
              >
                <Users className="w-4 h-4 text-amber-500" />
                <span>Quản lý học viên</span>
              </Link>
              <Link
                to="/admin/courses"
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/70 dark:bg-[#1C293D]/60 hover:bg-slate-100 dark:hover:bg-[#1C293D] border border-slate-200/60 dark:border-[#2A3A50] text-sm font-semibold text-[#142B4A] dark:text-[#E8EEF7] transition"
              >
                <BookOpen className="w-4 h-4 text-blue-500" />
                <span>Thêm khóa học mới</span>
              </Link>
              <Link
                to="/admin/classes"
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/70 dark:bg-[#1C293D]/60 hover:bg-slate-100 dark:hover:bg-[#1C293D] border border-slate-200/60 dark:border-[#2A3A50] text-sm font-semibold text-[#142B4A] dark:text-[#E8EEF7] transition"
              >
                <Calendar className="w-4 h-4 text-emerald-500" />
                <span>Mở lớp học & xếp lịch</span>
              </Link>
              <Link
                to="/admin/finance"
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/70 dark:bg-[#1C293D]/60 hover:bg-slate-100 dark:hover:bg-[#1C293D] border border-slate-200/60 dark:border-[#2A3A50] text-sm font-semibold text-[#142B4A] dark:text-[#E8EEF7] transition"
              >
                <DollarSign className="w-4 h-4 text-teal-500" />
                <span>Thu học phí & công nợ</span>
              </Link>
              <Link
                to="/admin/leads"
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/70 dark:bg-[#1C293D]/60 hover:bg-slate-100 dark:hover:bg-[#1C293D] border border-slate-200/60 dark:border-[#2A3A50] text-sm font-semibold text-[#142B4A] dark:text-[#E8EEF7] transition"
              >
                <UserPlus className="w-4 h-4 text-purple-500" />
                <span>Tư vấn tuyển sinh</span>
              </Link>
            </div>
          </div>

          {/* Center Info Card */}
          <div className="bg-white dark:bg-[#151F31] rounded-2xl border border-slate-200/80 dark:border-[#2A3A50] shadow-xs p-5">
            <h3 className="text-sm font-bold text-[#142B4A] dark:text-[#E8EEF7] flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-[#142B4A] dark:text-[#38BDF8]" />
              <span>Trung tâm Đào tạo CH Academy</span>
            </h3>
            <div className="text-xs text-slate-600 dark:text-[#A6B4C8] space-y-2">
              <div><strong className="text-slate-800 dark:text-[#E8EEF7]">Niên khóa:</strong> 2026 - 2027</div>
              <div><strong className="text-slate-800 dark:text-[#E8EEF7]">Giờ hoạt động:</strong> 08:00 - 21:30 (Thứ 2 - CN)</div>
              <div><strong className="text-slate-800 dark:text-[#E8EEF7]">Hotline học vụ:</strong> 0988 123 456</div>
              <div><strong className="text-slate-800 dark:text-[#E8EEF7]">Cơ sở:</strong> Cơ sở đào tạo chuẩn quốc tế</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
