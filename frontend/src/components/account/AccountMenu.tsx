import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import {
  User as UserIcon,
  ChevronDown,
  KeyRound,
  Sun,
  Moon,
  Sparkles,
  Monitor,
  Laptop,
  Globe,
  Bell,
  ShieldCheck,
  HelpCircle,
  LogOut,
  Sliders,
  Settings,
  GraduationCap,
  ExternalLink,
  Check,
  History,
  FileText
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme, type Theme } from '../../context/ThemeContext'
import { useExperience } from '../../context/ExperienceContext'
import { AccountProfileModal } from './AccountProfileModal'
import { ChangePasswordModal } from './ChangePasswordModal'
import { AccountSettingsModal, type SettingsTab } from './AccountSettingsModal'

export interface AccountMenuProps {
  portalRole: 'admin' | 'teacher' | 'student'
  userCode?: string
  extraProfile?: {
    specialization?: string
    bio?: string
    targetType?: string
    studentCode?: string
    teacherCode?: string
  }
  onNavigateTab?: (tab: string) => void
}

export const AccountMenu: React.FC<AccountMenuProps> = ({
  portalRole,
  userCode,
  extraProfile,
  onNavigateTab
}) => {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const { usageMode, setUsageMode, isNativeDesktop } = useExperience()
  const navigate = useNavigate()
  const location = useLocation()

  const [isOpen, setIsOpen] = useState(false)
  const [imgError, setImgError] = useState(false)
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const [pwdModalOpen, setPwdModalOpen] = useState(false)
  const [settingsModalOpen, setSettingsModalOpen] = useState(false)
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('appearance')

  const menuRef = useRef<HTMLDivElement>(null)

  // Reset img error if user avatar changes
  useEffect(() => {
    setImgError(false)
  }, [user?.avatarUrl])

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close dropdown on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Close dropdown on route change
  useEffect(() => {
    setIsOpen(false)
  }, [location.pathname])

  const handleLogout = () => {
    setIsOpen(false)
    logout()
    navigate('/login', { replace: true })
  }

  const openSettings = (tab: SettingsTab) => {
    setSettingsTab(tab)
    setSettingsModalOpen(true)
    setIsOpen(false)
  }

  const getRoleTitle = () => {
    if (portalRole === 'admin') return 'Quản trị viên'
    if (portalRole === 'teacher') return 'Giảng viên'
    return 'Học viên'
  }

  const getRoleBadgeStyle = () => {
    if (portalRole === 'admin') {
      return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900/60'
    }
    if (portalRole === 'teacher') {
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900/60'
    }
    return 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-[#38BDF8] border-sky-200 dark:border-sky-900/60'
  }

  const displayCode =
    userCode ||
    extraProfile?.teacherCode ||
    extraProfile?.studentCode ||
    (user?.id ? `ID: ${user.id}` : '')

  const initials = user?.fullName?.trim()?.charAt(0)?.toUpperCase() || user?.username?.charAt(0)?.toUpperCase() || 'U'

  return (
    <>
      <div className="relative inline-block" ref={menuRef}>
        {/* Trigger Button: Unified Account Pill */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          aria-label={`Mở menu tài khoản: ${user?.fullName || 'Người dùng'}`}
          className={`group flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-2xl border transition-all duration-200 outline-none text-left select-none cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 ${
            isOpen
              ? 'bg-indigo-50/90 dark:bg-[#1E2B40] border-indigo-300 dark:border-indigo-500/50 shadow-sm ring-2 ring-indigo-500/20'
              : 'border-slate-200/80 dark:border-[#2A3A50] hover:border-slate-300 dark:hover:border-slate-600 bg-white/80 dark:bg-[#151F31]/80 hover:bg-slate-50 dark:hover:bg-[#1A2639]'
          } [data-theme=glass]_&:bg-[#0F1E36]/40 [data-theme=glass]_&:border-white/15 [data-theme=glass]_&:hover:bg-[#0F1E36]/70`}
          title={`Tài khoản: ${user?.fullName || 'Người dùng'} (${getRoleTitle()})`}
        >
          {/* Avatar Icon / Image */}
          <div className="relative shrink-0">
            {user?.avatarUrl && !imgError ? (
              <img
                src={user.avatarUrl}
                alt={user.fullName || 'Avatar'}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-2xs"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-[#0F243E] via-indigo-900 to-sky-600 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center shadow-xs">
                {initials}
              </div>
            )}
            <div
              className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#151F31]"
              title="Đang hoạt động"
            />
          </div>

          {/* Name & Role Text (auto-adjust on small screens) */}
          <div className="hidden sm:block text-left leading-tight min-w-0">
            <div className="text-xs font-bold text-slate-800 dark:text-[#E8EEF7] truncate max-w-[120px] md:max-w-[170px] lg:max-w-[220px]">
              {user?.fullName || 'Người dùng'}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-[#A6B4C8] font-medium flex items-center gap-1.5 truncate">
              <span>{getRoleTitle()}</span>
              {displayCode && (
                <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold opacity-85">
                  {displayCode}
                </span>
              )}
            </div>
          </div>

          {/* Chevron Indicator */}
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
              isOpen ? 'rotate-180 text-indigo-600 dark:text-indigo-400' : 'group-hover:text-slate-600 dark:group-hover:text-slate-200'
            }`}
          />
        </button>

        {/* Mobile Backdrop to easily close dropdown on tap outside */}
        {isOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/25 backdrop-blur-2xs sm:hidden"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Dropdown Popover */}
        {isOpen && (
          <div
            className="absolute right-0 top-full mt-2 w-[calc(100vw-1.5rem)] max-w-xs sm:w-80 sm:max-w-none rounded-2xl bg-white dark:bg-[#151F31] border border-slate-200 dark:border-[#2A3A50] shadow-2xl z-50 overflow-hidden flex flex-col max-h-[min(560px,calc(100vh-5rem))] animate-in fade-in zoom-in-95 duration-150 [data-theme=glass]_&:bg-[#0B1528]/95 [data-theme=glass]_&:border-white/20 [data-theme=glass]_&:backdrop-blur-2xl"
            role="menu"
            aria-orientation="vertical"
          >
            {/* Header: User Overview Banner */}
            <div className="p-4 bg-gradient-to-r from-slate-50 via-slate-50/60 to-indigo-50/30 dark:from-[#172338] dark:to-[#1a2b45] border-b border-slate-100 dark:border-[#223147] [data-theme=glass]_&:bg-transparent shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  {user?.avatarUrl && !imgError ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.fullName || 'Avatar'}
                      className="w-12 h-12 rounded-2xl object-cover border-2 border-indigo-500/30 shadow-md"
                      onError={() => setImgError(true)}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0F243E] via-indigo-900 to-sky-600 text-white font-black text-lg flex items-center justify-center shadow-md">
                      {initials}
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-[#151F31] flex items-center justify-center text-[8px] text-white font-bold">
                    ✓
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-sm font-extrabold text-slate-800 dark:text-white truncate" title={user?.fullName}>
                    {user?.fullName || 'Người dùng'}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-[#A6B4C8] truncate" title={user?.email || `@${user?.username}`}>
                    {user?.email || `@${user?.username}`}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getRoleBadgeStyle()}`}
                    >
                      {getRoleTitle()}
                    </span>
                    {displayCode && (
                      <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-[#1E2B40] px-1.5 py-0.5 rounded-md">
                        {displayCode}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Menu Actions List (Scrollable if height exceeds screen) */}
            <div className="overflow-y-auto overscroll-contain flex-1 p-2 space-y-1 text-xs">
              {/* 1. Account Profile */}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false)
                  setProfileModalOpen(true)
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-[#E8EEF7] hover:bg-slate-100 dark:hover:bg-[#1E2B40] transition text-left font-medium"
              >
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold">Thông tin tài khoản</div>
                  <div className="text-[10px] text-slate-400 dark:text-[#A6B4C8]">
                    Hồ sơ cá nhân, số điện thoại & ảnh đại diện
                  </div>
                </div>
              </button>

              {/* 2. Change Password */}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false)
                  setPwdModalOpen(true)
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-[#E8EEF7] hover:bg-slate-100 dark:hover:bg-[#1E2B40] transition text-left font-medium"
              >
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold">Đổi mật khẩu</div>
                  <div className="text-[10px] text-slate-400 dark:text-[#A6B4C8]">
                    Cập nhật mật khẩu bảo mật định kỳ
                  </div>
                </div>
              </button>

              {/* 3. Appearance Quick Switcher */}
              <div className="px-3 py-2 rounded-xl bg-slate-50/80 dark:bg-[#121B2A]/60 border border-slate-100 dark:border-[#223147] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-bold text-slate-700 dark:text-[#E8EEF7] flex items-center gap-1.5">
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    <span>Giao diện (Theme)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => openSettings('appearance')}
                    className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
                  >
                    Chi tiết & Xem trước
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold transition flex items-center justify-center gap-1 ${
                      theme === 'light'
                        ? 'bg-white text-slate-900 border-indigo-500 shadow-2xs'
                        : 'bg-white/60 dark:bg-[#1A2639]/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-[#2A3A50]'
                    }`}
                  >
                    <span>☀️ Sáng</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold transition flex items-center justify-center gap-1 ${
                      theme === 'dark'
                        ? 'bg-slate-800 text-white border-sky-500 shadow-2xs'
                        : 'bg-white/60 dark:bg-[#1A2639]/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-[#2A3A50]'
                    }`}
                  >
                    <span>🌙 Tối</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('glass')}
                    className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold transition flex items-center justify-center gap-1 ${
                      theme === 'glass'
                        ? 'bg-purple-900/80 text-purple-200 border-purple-400 shadow-2xs'
                        : 'bg-white/60 dark:bg-[#1A2639]/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-[#2A3A50]'
                    }`}
                  >
                    <span>💎 Kính</span>
                  </button>
                </div>
              </div>

              {/* 4. Usage Mode Quick Toggle */}
              <button
                type="button"
                onClick={() => {
                  setUsageMode(usageMode === 'web' ? 'desktop' : 'web')
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 dark:text-[#E8EEF7] hover:bg-slate-100 dark:hover:bg-[#1E2B40] transition text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    {usageMode === 'desktop' ? (
                      <Laptop className="w-4 h-4" />
                    ) : (
                      <Globe className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="font-bold">
                      {usageMode === 'desktop' ? 'Chế độ Desktop' : 'Chế độ Web'}
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-[#A6B4C8]">
                      {usageMode === 'desktop'
                        ? (isNativeDesktop ? 'Ứng dụng Windows App' : 'Xem trước Giao diện Desktop')
                        : 'Bố cục chuẩn trình duyệt'}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#202E44] text-slate-600 dark:text-slate-300">
                  Đổi
                </span>
              </button>

              {/* 5. Notification Preferences */}
              <button
                type="button"
                onClick={() => openSettings('notifications')}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-[#E8EEF7] hover:bg-slate-100 dark:hover:bg-[#1E2B40] transition text-left"
              >
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Bell className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold">Cài đặt thông báo</div>
                  <div className="text-[10px] text-slate-400 dark:text-[#A6B4C8]">
                    Hệ thống, lịch học, học phí & khảo thí
                  </div>
                </div>
              </button>

              {/* 6. Account Security */}
              <button
                type="button"
                onClick={() => openSettings('security')}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-[#E8EEF7] hover:bg-slate-100 dark:hover:bg-[#1E2B40] transition text-left"
              >
                <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold">Bảo mật tài khoản</div>
                  <div className="text-[10px] text-slate-400 dark:text-[#A6B4C8]">
                    Nhật ký phiên, mã hóa & khuyến cáo an toàn
                  </div>
                </div>
              </button>

              {/* 7. Help & Support */}
              <button
                type="button"
                onClick={() => openSettings('help')}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-[#E8EEF7] hover:bg-slate-100 dark:hover:bg-[#1E2B40] transition text-left"
              >
                <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold">Trợ giúp & Liên hệ</div>
                  <div className="text-[10px] text-slate-400 dark:text-[#A6B4C8]">
                    Hotline, email hỗ trợ & hướng dẫn sử dụng
                  </div>
                </div>
              </button>

              {/* Role-Specific Items (Only for Admin) */}
              {portalRole === 'admin' && (
                <>
                  <Link
                    to="/admin/settings"
                    onClick={() => setIsOpen(false)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50/80 dark:hover:bg-indigo-950/40 transition text-left font-bold"
                  >
                    <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                      <Settings className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div>Cấu hình trung tâm</div>
                      <div className="text-[10px] text-indigo-500/80 dark:text-indigo-400/80 font-normal">
                        Thông tin cơ sở, chẩn đoán & an ninh
                      </div>
                    </div>
                  </Link>

                  <Link
                    to="/admin/audit-logs"
                    onClick={() => setIsOpen(false)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-purple-700 dark:text-purple-300 hover:bg-purple-50/80 dark:hover:bg-purple-950/40 transition text-left font-bold"
                  >
                    <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-600 dark:text-purple-400">
                      <History className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div>Nhật ký hệ thống & Bảo mật</div>
                      <div className="text-[10px] text-purple-500/80 dark:text-purple-400/80 font-normal">
                        Xem lịch sử đăng nhập & thao tác người dùng
                      </div>
                    </div>
                  </Link>
                </>
              )}
            </div>

            {/* Logout Footer Section */}
            <div className="p-2 border-t border-slate-100 dark:border-[#223147] bg-slate-50/50 dark:bg-[#121B2A]/50 shrink-0">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition text-left text-xs font-bold"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng xuất khỏi hệ thống</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Account Profile Modal */}
      <AccountProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        onOpenChangePassword={() => setPwdModalOpen(true)}
        portalRole={portalRole}
        userCode={userCode}
        extraProfile={extraProfile}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={pwdModalOpen}
        onClose={() => setPwdModalOpen(false)}
        userFullName={user?.fullName}
      />

      {/* Settings Modal */}
      <AccountSettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        initialTab={settingsTab}
        onOpenChangePassword={() => setPwdModalOpen(true)}
        portalRole={portalRole}
      />
    </>
  )
}
