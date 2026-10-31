import React, { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Calendar,
  Users,
  CreditCard,
  Settings,
  Search,
  RotateCcw,
  FileQuestion,
  BookOpen,
  UserCheck,
  UserPlus
} from 'lucide-react'
import { academicYearApi, type AcademicYearItem } from '../../api/academicYear'

interface DesktopWorkspaceBarProps {
  onOpenCommandPalette: () => void
  onRefreshData?: () => void
}

export const DesktopWorkspaceBar: React.FC<DesktopWorkspaceBarProps> = ({
  onOpenCommandPalette,
  onRefreshData
}) => {
  const [activeYear, setActiveYear] = useState('2026-2027')
  const [years, setYears] = useState<AcademicYearItem[]>([])
  const location = useLocation()

  useEffect(() => {
    academicYearApi.getAll()
      .then((res) => {
        if (res.success && res.data && res.data.length > 0) {
          setYears(res.data)
          const current = res.data.find((y) => y.isCurrent)
          if (current) setActiveYear(current.code)
        }
      })
      .catch(() => {
        // Fallback danh sách dài hạn nếu API chưa sẵn sàng
        setYears([
          { id: 1, code: '2026-2027', name: 'Năm học 2026 - 2027', startDate: '2026-09-01', endDate: '2027-06-30', isCurrent: true, status: 'ACTIVE' },
          { id: 2, code: '2027-2028', name: 'Năm học 2027 - 2028', startDate: '2027-09-01', endDate: '2028-06-30', isCurrent: false, status: 'UPCOMING' },
          { id: 3, code: '2028-2029', name: 'Năm học 2028 - 2029', startDate: '2028-09-01', endDate: '2029-06-30', isCurrent: false, status: 'UPCOMING' },
          { id: 4, code: '2029-2030', name: 'Năm học 2029 - 2030', startDate: '2029-09-01', endDate: '2030-06-30', isCurrent: false, status: 'UPCOMING' },
          { id: 5, code: '2030-2031', name: 'Năm học 2030 - 2031', startDate: '2030-09-01', endDate: '2031-06-30', isCurrent: false, status: 'UPCOMING' },
          { id: 6, code: '2025-2026', name: 'Năm học 2025 - 2026', startDate: '2025-09-01', endDate: '2026-06-30', isCurrent: false, status: 'ACTIVE' },
          { id: 7, code: '2024-2025', name: 'Năm học 2024 - 2025', startDate: '2024-09-01', endDate: '2025-06-30', isCurrent: false, status: 'COMPLETED' }
        ])
      })
  }, [])

  const workspaceTabs = [
    { label: 'Tổng quan', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Lớp học', path: '/admin/classes', icon: Calendar },
    { label: 'Khóa học', path: '/admin/courses', icon: BookOpen },
    { label: 'Điểm danh', path: '/admin/attendance', icon: UserCheck },
    { label: 'Học viên', path: '/admin/students', icon: Users },
    { label: 'Tuyển sinh', path: '/admin/leads', icon: UserPlus },
    { label: 'Khảo thí & Đề thi', path: '/admin/exams', icon: FileQuestion },
    { label: 'Tài chính', path: '/admin/finance', icon: CreditCard },
    { label: 'Cài đặt', path: '/admin/settings', icon: Settings }
  ]

  const handleRefresh = () => {
    if (onRefreshData) {
      onRefreshData()
    } else {
      window.location.reload()
    }
  }

  return (
    <div className="w-full bg-slate-50/95 dark:bg-[#0B1322]/95 [data-theme=glass]_&:bg-black/25 [data-theme=glass]_&:backdrop-blur-md border-b border-slate-200/90 dark:border-[#1E2E44] [data-theme=glass]_&:border-white/10 px-3 py-1.5 flex items-center justify-between text-xs transition-colors z-30 select-none">
      {/* Left: Desktop Workspace Tab Ribbon */}
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mr-1.5 hidden xl:inline">
          Phân hệ:
        </span>
        {workspaceTabs.map((tab) => {
          const Icon = tab.icon
          const isActive = location.pathname.startsWith(tab.path)

          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap text-xs ${
                isActive
                  ? 'bg-sky-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 [data-theme=glass]_&:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-[#1A2638] [data-theme=glass]_&:hover:bg-white/10'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-white' : 'text-slate-400 dark:text-slate-400'} />
              <span>{tab.label}</span>
            </NavLink>
          )
        })}
      </div>

      {/* Right: Quick Command Toolbar for Desktop Power Users */}
      <div className="flex items-center gap-2 pl-3 flex-shrink-0">
        {/* Quick Academic Year Pill */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-200/60 dark:bg-[#131E30] [data-theme=glass]_&:bg-white/10 border border-slate-300/50 dark:border-[#22334A] [data-theme=glass]_&:border-white/10 text-[11px] font-medium text-slate-700 dark:text-slate-300">
          <span className="text-slate-400">Năm học:</span>
          <select
            value={activeYear}
            onChange={(e) => setActiveYear(e.target.value)}
            className="bg-transparent font-bold text-sky-600 dark:text-sky-400 outline-none cursor-pointer text-[11px]"
          >
            {years.map((y) => (
              <option key={y.code} value={y.code} className="dark:bg-slate-900 text-slate-800 dark:text-white">
                {y.name || y.code} {y.isCurrent ? '(Hiện tại)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Quick Search Shortcut Ctrl+K */}
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-300/60 dark:border-[#23354C] [data-theme=glass]_&:border-white/10 bg-white dark:bg-[#131F33] [data-theme=glass]_&:bg-white/10 hover:bg-slate-100 dark:hover:bg-[#1A2A42] [data-theme=glass]_&:hover:bg-white/20 text-slate-600 dark:text-slate-300 text-[11px] font-medium transition shadow-2xs"
          title="Mở thanh tra cứu và lệnh nhanh (Ctrl + K)"
        >
          <Search size={12} className="text-sky-500" />
          <span className="hidden sm:inline">Tra cứu</span>
          <kbd className="px-1 py-0.2 bg-slate-100 dark:bg-[#0E1726] border border-slate-300 dark:border-slate-700 rounded text-[9px] font-mono text-slate-400">
            Ctrl+K
          </kbd>
        </button>

        {/* Refresh Data Button */}
        <button
          onClick={handleRefresh}
          className="p-1.5 rounded-md border border-slate-300/60 dark:border-[#23354C] [data-theme=glass]_&:border-white/10 bg-white dark:bg-[#131F33] [data-theme=glass]_&:bg-white/10 hover:bg-slate-100 dark:hover:bg-[#1A2A42] [data-theme=glass]_&:hover:bg-white/20 text-slate-600 dark:text-slate-300 transition"
          title="Làm mới dữ liệu cửa sổ hiện tại"
        >
          <RotateCcw size={13} />
        </button>
      </div>
    </div>
  )
}
