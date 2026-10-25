import React, { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSettings } from '../context/SettingsContext'
import { ThemeSwitcher } from '../components/ui/ThemeSwitcher'
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  Users,
  UserCheck,
  CreditCard,
  UserPlus,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Bell,
  Menu,
  X,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react'

interface NavItem {
  label: string
  path: string
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties; className?: string }>
  end?: boolean
}

interface NavGroup {
  group: string
  items: NavItem[]
}

export const AdminLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const { user, logout } = useAuth()
  const { settings } = useSettings()
  const navigate = useNavigate()
  const location = useLocation()

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
    setNotifOpen(false)
  }, [location.pathname])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navGroups: NavGroup[] = [
    {
      group: 'ĐIỀU HÀNH',
      items: [
        { label: 'Tổng quan', path: '/admin', icon: LayoutDashboard, end: true },
      ]
    },
    {
      group: 'ĐÀO TẠO & HỌC VỤ',
      items: [
        { label: 'Khóa học', path: '/admin/courses', icon: BookOpen },
        { label: 'Lớp học & Lịch', path: '/admin/classes', icon: Calendar },
        { label: 'Giảng viên & Phân công', path: '/admin/teacher-assignments', icon: UserCheck },
        { label: 'Điểm danh lớp', path: '/admin/attendance', icon: UserCheck },
        { label: 'Giám sát Điểm danh', path: '/admin/attendance-monitoring', icon: CheckCircle2 },
        { label: 'Thông báo & GV', path: '/admin/notifications', icon: Bell },
      ]
    },
    {
      group: 'HỌC VIÊN & TUYỂN SINH',
      items: [
        { label: 'Tuyển sinh & Leads', path: '/admin/leads', icon: UserPlus },
        { label: 'Học viên & Giám hộ', path: '/admin/students', icon: Users },
      ]
    },
    {
      group: 'TÀI CHÍNH & HỆ THỐNG',
      items: [
        { label: 'Học phí & Công nợ', path: '/admin/finance', icon: CreditCard },
        { label: 'Nhật ký Audit', path: '/admin/audit-logs', icon: ShieldCheck },
        { label: 'Cấu hình hệ thống', path: '/admin/settings', icon: Settings },
      ]
    }
  ]

  const allNavItems = navGroups.flatMap(g => g.items)
  const currentItem = allNavItems.find((item) =>
    item.end ? location.pathname === item.path : location.pathname.startsWith(item.path)
  )

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'Quản trị cấp cao'
      case 'ADMIN': return 'Quản trị viên'
      case 'ACADEMIC_STAFF': return 'Cán bộ giáo vụ'
      case 'TEACHER': return 'Giảng viên'
      case 'ACCOUNTANT': return 'Kế toán viên'
      default: return 'Nhân sự'
    }
  }

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full bg-[#142B4A] dark:bg-[#101B2D] text-white">
      {/* Brand */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-white text-[#142B4A] flex items-center justify-center flex-shrink-0 shadow-sm">
            <GraduationCap size={24} />
          </div>
          {(!collapsed || mobileMenuOpen) && (
            <div className="whitespace-nowrap">
              <div className="font-extrabold text-lg tracking-tight text-white">{settings.shortName}</div>
              <div className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">Trung tâm Đào tạo</div>
            </div>
          )}
        </div>
        {mobileMenuOpen && (
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 lg:hidden"
            aria-label="Đóng menu"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-6">
        {navGroups.map((group, gIdx) => (
          <div key={gIdx}>
            {(!collapsed || mobileMenuOpen) && (
              <div className="text-[11px] font-bold text-slate-400 tracking-wider uppercase px-3 mb-2">
                {group.group}
              </div>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.end}
                    className={({ isActive }) => `
                      flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all
                      ${collapsed && !mobileMenuOpen ? 'justify-center px-0' : 'justify-start'}
                      ${
                        isActive
                          ? 'bg-white/15 dark:bg-[#1C293D] text-white dark:text-[#38BDF8] border-l-3 border-[#38BDF8] shadow-xs'
                          : 'text-slate-400 hover:text-white hover:bg-white/5 border-l-3 border-transparent'
                      }
                    `}
                    title={collapsed && !mobileMenuOpen ? item.label : undefined}
                  >
                    <Icon size={19} className="flex-shrink-0" />
                    {(!collapsed || mobileMenuOpen) && <span>{item.label}</span>}
                  </NavLink>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-white/10 flex items-center justify-between bg-black/20 flex-shrink-0">
        {(!collapsed || mobileMenuOpen) && (
          <div className="px-2">
            <div className="text-xs font-bold text-slate-200">CH-Academy v1.0</div>
            <div className="text-[10px] text-slate-400">Hệ thống Quản lý Chuẩn</div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex p-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors ml-auto"
          aria-label={collapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-[var(--bg-app)] text-[var(--text-main)] transition-colors duration-200">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:block sticky top-0 h-screen z-40 transition-all duration-200 flex-shrink-0 shadow-md ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {renderSidebarContent()}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-50 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-72 z-50 lg:hidden transform transition-transform duration-300 ease-in-out shadow-2xl ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {renderSidebarContent()}
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 sticky top-0 z-30 bg-white dark:bg-[#151F31] border-b border-slate-200 dark:border-[#2A3A50] px-4 lg:px-8 flex items-center justify-between shadow-xs transition-colors duration-200">
          {/* Left: Mobile Toggle & Breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-lg border border-slate-200 dark:border-[#2A3A50] text-slate-700 dark:text-[#E8EEF7] hover:bg-slate-100 dark:hover:bg-[#1C293D] lg:hidden"
              aria-label="Mở menu điều hướng"
            >
              <Menu size={20} />
            </button>

            <div className="flex items-center gap-2 text-sm">
              <span className="hidden sm:inline text-slate-500 dark:text-[#A6B4C8] font-medium">Quản trị trung tâm</span>
              <span className="hidden sm:inline text-slate-300 dark:text-slate-600">/</span>
              <span className="font-bold text-[#142B4A] dark:text-[#E8EEF7]">{currentItem?.label || 'Bảng điều khiển'}</span>
            </div>
          </div>

          {/* Right: Theme Switcher, Notifications, User profile */}
          <div className="flex items-center gap-3">
            {/* Theme Switcher */}
            <ThemeSwitcher />

            {/* Notification Entry */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#151F31] text-slate-700 dark:text-[#E8EEF7] hover:bg-slate-50 dark:hover:bg-[#1C293D] transition-colors shadow-xs"
                aria-label="Thông báo hệ thống"
              >
                <Bell size={17} />
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#151F31] shadow-xl py-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 pb-2 border-b border-slate-100 dark:border-[#2A3A50] flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#A6B4C8]">
                      Thông báo hệ thống
                    </span>
                    <span className="text-[11px] text-slate-400">Thời gian thực</span>
                  </div>
                  <div className="p-6 text-center">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-2">
                      <CheckCircle2 size={22} />
                    </div>
                    <div className="text-sm font-semibold text-[#142B4A] dark:text-[#E8EEF7]">Mọi thứ đang ổn định</div>
                    <p className="text-xs text-slate-500 dark:text-[#A6B4C8] mt-1">
                      Chưa có cảnh báo hoặc công việc mới cần xử lý ngay.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Info */}
            <div className="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-[#2A3A50]">
              <div className="w-9 h-9 rounded-xl bg-[#142B4A] dark:bg-[#38BDF8] text-white dark:text-[#0B1220] font-bold text-sm flex items-center justify-center shadow-xs">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
              <div className="hidden md:block text-left leading-tight">
                <div className="text-sm font-bold text-[#142B4A] dark:text-[#E8EEF7]">
                  {user?.fullName || 'Người dùng'}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-[#A6B4C8] font-medium">
                  {getRoleLabel(user?.roles?.[0])}
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 ml-1 px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-xs font-semibold transition-colors"
                title="Đăng xuất khỏi hệ thống"
              >
                <LogOut size={14} />
                <span className="hidden sm:inline">Thoát</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto box-border animate-fade-in" key={location.pathname}>
          <Outlet />
        </main>
      </div>
    </div>
  )

}
