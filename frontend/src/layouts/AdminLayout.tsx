import React, { useState, useEffect, useCallback } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useSettings } from '../context/SettingsContext'
import { useExperience } from '../context/ExperienceContext'
import { CommandPalette } from '../components/ui/CommandPalette'
import { DesktopWorkspaceBar } from '../components/desktop/DesktopWorkspaceBar'
import { DesktopStatusBar } from '../components/desktop/DesktopStatusBar'
import { AccountMenu } from '../components/account/AccountMenu'
import { HeaderSearchBar } from '../components/ui/HeaderSearchBar'
import { NotificationBell } from '../components/ui/NotificationBell'
import { notificationsApi } from '../api/notifications'
import type { NotificationItem } from '../types/notification'
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  Users,
  UserCheck,
  CreditCard,
  UserPlus,
  Settings,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Bell,
  Menu,
  X,
  CheckCircle2,
  ShieldCheck,
  FileQuestion,
  FileText,
  CheckSquare,
  BarChart2,
  Sparkles
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
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loadingNotifs, setLoadingNotifs] = useState(false)

  const { settings } = useSettings()
  const { effectiveUsageMode, desktopDensity } = useExperience()
  const location = useLocation()

  // Global Ctrl+K / Cmd+K listener for Command Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCommandPaletteOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Fetch real notifications for the bell indicator
  const fetchNotifications = useCallback(async () => {
    setLoadingNotifs(true)
    try {
      const res = await notificationsApi.getAll()
      if (res.success && res.data) {
        setNotifications(res.data)
      }
    } catch {
      // Keep silent on failure
    } finally {
      setLoadingNotifs(false)
    }
  }, [])

  // Fetch notifications on mount
  useEffect(() => {
    let ignore = false
    notificationsApi.getAll().then((res) => {
      if (!ignore && res.success && res.data) {
        setNotifications(res.data)
      }
    }).catch(() => {
      // Keep silent on failure
    })
    return () => {
      ignore = true
    }
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    const timer = setTimeout(() => {
      setMobileMenuOpen(false)
    }, 0)
    return () => clearTimeout(timer)
  }, [location.pathname])

  const navGroups: NavGroup[] = [
    {
      group: 'ĐIỀU HÀNH & ĐÀO TẠO',
      items: [
        { label: 'Tổng quan hệ thống', path: '/admin', icon: LayoutDashboard, end: true },
        { label: 'Khóa học', path: '/admin/courses', icon: BookOpen },
        { label: 'Lớp học & Lịch', path: '/admin/classes', icon: Calendar },
        { label: 'Giảng viên & Phân công', path: '/admin/teacher-assignments', icon: UserCheck },
        { label: 'Điểm danh lớp', path: '/admin/attendance', icon: UserCheck },
        { label: 'Giám sát Điểm danh', path: '/admin/attendance-monitoring', icon: CheckCircle2 },
      ]
    },
    {
      group: 'KIỂM TRA & ĐÁNH GIÁ',
      items: [
        { label: 'Duyệt đề thi', path: '/admin/assessment/approval', icon: ShieldCheck },
        { label: 'Ngân hàng câu hỏi', path: '/admin/assessment/questions', icon: FileQuestion },
        { label: 'Quản lý đề thi', path: '/admin/assessment/exams', icon: FileText },
        { label: 'Chấm thi & Tự luận', path: '/admin/assessment/grading', icon: CheckSquare },
        { label: 'Phân tích theo lớp', path: '/admin/assessment/class-analytics', icon: BarChart2 }
      ]
    },
    {
      group: 'HỌC VIÊN & TUYỂN SINH',
      items: [
        { label: 'Tuyển sinh & Leads', path: '/admin/leads', icon: UserPlus },
        { label: 'Học viên & Giám hộ', path: '/admin/students', icon: Users },
        { label: 'Thông báo & GV', path: '/admin/notifications', icon: Bell },
      ]
    },
    {
      group: 'HỆ THỐNG & TÀI CHÍNH',
      items: [
        { label: 'Học phí & Công nợ', path: '/admin/finance', icon: CreditCard },
        { label: 'AI Agent Studio', path: '/admin/ai-studio', icon: Sparkles },
        { label: 'Bảo mật & Nhật ký', path: '/admin/security-audit', icon: ShieldCheck },
        { label: 'Cấu hình hệ thống', path: '/admin/settings', icon: Settings },
      ]
    }
  ]

  const allNavItems = navGroups.flatMap(g => g.items)
  const currentItem = allNavItems.find((item) =>
    item.end ? location.pathname === item.path : location.pathname.startsWith(item.path)
  )

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full bg-[#0A1120] [data-theme=glass]_&:bg-[#070D1B]/55 [data-theme=glass]_&:backdrop-blur-2xl text-white border-r border-slate-800/80 [data-theme=glass]_&:border-white/15 shadow-xl">
      {/* Brand Header */}
      <div className="h-14 px-3.5 flex items-center justify-between border-b border-white/10 flex-shrink-0 bg-gradient-to-r from-[#0A1120] to-[#0E1A30]">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
            <GraduationCap size={18} className="text-white" />
          </div>
          {(!collapsed || mobileMenuOpen) && (
            <div className="whitespace-nowrap">
              <div className="font-bold text-[14px] tracking-tight text-white flex items-center gap-1.5">
                <span>{settings.shortName}</span>
                <span className="px-1.5 py-0.5 rounded text-[9.5px] font-semibold uppercase tracking-wider bg-sky-500/15 text-[#38BDF8] border border-sky-500/25">
                  Admin
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-medium">
                Quản trị đào tạo
              </div>
            </div>
          )}
        </div>
        {mobileMenuOpen && (
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 lg:hidden"
            aria-label="Đóng menu"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-2.5 py-3 overflow-y-auto space-y-3">
        {navGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            {(!collapsed || mobileMenuOpen) && (
              <div className="text-[10.5px] font-semibold text-slate-400/90 tracking-wider uppercase px-2.5 py-1">
                {group.group}
              </div>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.end}
                    className={({ isActive }) => `
                      flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12.5px] font-medium transition-all group
                      ${collapsed && !mobileMenuOpen ? 'justify-center px-0 h-9' : 'justify-start h-9'}
                      ${
                        isActive
                          ? 'nav-pill-active font-semibold'
                          : 'text-slate-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent'
                      }
                    `}
                    title={collapsed && !mobileMenuOpen ? item.label : undefined}
                  >
                    <Icon size={16} className="flex-shrink-0 transition-transform group-hover:scale-105" />
                    {(!collapsed || mobileMenuOpen) && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </NavLink>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Sidebar Footer */}
      <div className="h-12 px-3 border-t border-white/10 flex items-center justify-between bg-black/30 flex-shrink-0">
        {(!collapsed || mobileMenuOpen) && (
          <div className="px-1 text-[11px] text-slate-400 font-medium">
            CH Academy v2.4
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex p-1.5 rounded-md bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors ml-auto"
          aria-label={collapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-[var(--bg-app)] text-[var(--text-main)] transition-colors duration-200">
      {/* Command Palette Modal */}
      <CommandPalette isOpen={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />

      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:block sticky top-0 h-screen z-40 transition-all duration-200 flex-shrink-0 ${
          collapsed
            ? 'w-16'
            : 'w-[240px]'
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
        className={`fixed top-0 bottom-0 left-0 w-[240px] z-50 lg:hidden transform transition-transform duration-300 ease-in-out shadow-2xl ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {renderSidebarContent()}
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop Workspace Ribbon (When in Desktop Mode) */}
        {effectiveUsageMode === 'desktop' && (
          <DesktopWorkspaceBar
            onOpenCommandPalette={() => setCommandPaletteOpen(true)}
            onRefreshData={() => window.location.reload()}
          />
        )}

        {/* Top Header */}
        <header className={`${
          effectiveUsageMode === 'desktop' ? 'h-12 px-3 lg:px-5' : 'h-14 px-4 lg:px-6'
        } sticky top-0 z-20 bg-white/95 dark:bg-[#0D1524]/95 [data-theme=glass]_&:bg-[#070D1B]/45 [data-theme=glass]_&:backdrop-blur-2xl backdrop-blur-md border-b border-slate-200/80 dark:border-[#1E2E44] [data-theme=glass]_&:border-white/15 flex items-center justify-between shadow-xs transition-colors duration-200`}>
          {/* Left: Mobile Toggle & Breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] [data-theme=glass]_&:border-white/20 text-slate-700 dark:text-[#E8EEF7] hover:bg-slate-100 dark:hover:bg-[#1C293D] [data-theme=glass]_&:hover:bg-white/10 lg:hidden"
              aria-label="Mở menu điều hướng"
            >
              <Menu size={20} />
            </button>

            <div className="flex items-center gap-2 text-sm">
              <span className="hidden sm:inline text-slate-500 dark:text-[#A6B4C8] font-medium">Trung tâm Quản trị</span>
              <span className="hidden sm:inline text-slate-300 dark:text-slate-600">/</span>
              <span className="font-bold text-[#0F172A] dark:text-[#38BDF8]">{currentItem?.label || 'Bảng điều khiển'}</span>
            </div>
          </div>

          {/* Center: Command Palette Trigger Bar */}
          <HeaderSearchBar
            onClick={() => setCommandPaletteOpen(true)}
            placeholder="Tìm kiếm nhanh chức năng, mã lớp, học viên..."
          />

          {/* Right: Notifications, User profile */}
          <div className="flex items-center gap-2.5">
            {/* Notification Bell with Real Dynamic Data */}
            <NotificationBell
              notifications={notifications}
              loading={loadingNotifs}
              onRefresh={fetchNotifications}
              viewAllLink="/admin/notifications"
              title="Thông báo hệ thống"
              onNotificationRead={(id) =>
                setNotifications((prev) =>
                  prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
                )
              }
              onMarkAllRead={() =>
                setNotifications((prev) =>
                  prev.map((n) => ({ ...n, isRead: true }))
                )
              }
            />

            {/* Unified Account Profile Menu */}
            <div className="pl-1.5 border-l border-slate-200 dark:border-[#2A3A50]">
              <AccountMenu portalRole="admin" />
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main
          className={`flex-1 min-w-0 box-border animate-fade-in ${
            effectiveUsageMode === 'desktop'
              ? (desktopDensity === 'compact' ? 'p-2 sm:p-3 max-w-none w-full' : 'p-3 sm:p-4 max-w-none w-full')
              : 'p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto'
          }`}
          key={location.pathname}
        >
          <Outlet />
        </main>

        {/* Desktop Status Bar (Bottom Application Bar) */}
        {effectiveUsageMode === 'desktop' && <DesktopStatusBar />}
      </div>
    </div>
  )
}
