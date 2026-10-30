import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  Sun,
  Moon,
  Sparkles,
  Monitor,
  Laptop,
  Globe,
  Bell,
  ShieldCheck,
  HelpCircle,
  X,
  Check,
  CheckCircle2,
  Lock,
  Smartphone,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  KeyRound,
  FileText,
  Sliders,
  History,
  ShieldAlert,
  ChevronRight
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTheme, type Theme } from '../../context/ThemeContext'
import { useExperience, type UsageMode } from '../../context/ExperienceContext'
import { useSettings } from '../../context/SettingsContext'
import { useAuth } from '../../context/AuthContext'

export type SettingsTab = 'appearance' | 'notifications' | 'security' | 'help'

interface AccountSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  initialTab?: SettingsTab
  onOpenChangePassword?: () => void
  portalRole: 'admin' | 'teacher' | 'student'
}

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'appearance',
  onOpenChangePassword,
  portalRole
}) => {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const { usageMode, setUsageMode, isNativeDesktop, desktopDensity, setDesktopDensity } = useExperience()
  const { settings } = useSettings()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab)

  // Notification Preferences state (persisted in localStorage for active device filter)
  const [notifySystem, setNotifySystem] = useState<boolean>(() => {
    return localStorage.getItem('ch_notify_system') !== 'false'
  })
  const [notifySchedule, setNotifySchedule] = useState<boolean>(() => {
    return localStorage.getItem('ch_notify_schedule') !== 'false'
  })
  const [notifyFinance, setNotifyFinance] = useState<boolean>(() => {
    return localStorage.getItem('ch_notify_finance') !== 'false'
  })
  const [notifyAssessment, setNotifyAssessment] = useState<boolean>(() => {
    return localStorage.getItem('ch_notify_assessment') !== 'false'
  })
  const [saveNotifFeedback, setSaveNotifFeedback] = useState<boolean>(false)

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab)
    }
  }, [isOpen, initialTab])

  // Escape key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Prevent background page scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = prevOverflow
      }
    }
  }, [isOpen])

  const handleToggleNotify = (
    key: string,
    setter: React.Dispatch<React.SetStateAction<boolean>>,
    val: boolean
  ) => {
    setter(val)
    localStorage.setItem(key, String(val))
    setSaveNotifFeedback(true)
    setTimeout(() => setSaveNotifFeedback(false), 2000)
  }

  const getClientEnvironment = () => {
    if (typeof navigator === 'undefined') return 'Trình duyệt Web tiêu chuẩn'
    const ua = navigator.userAgent
    let os = 'Thiết bị thông minh'
    if (ua.includes('Win')) os = 'Hệ điều hành Windows'
    else if (ua.includes('Mac')) os = 'Hệ điều hành macOS'
    else if (ua.includes('Linux')) os = 'Hệ điều hành Linux'
    else if (ua.includes('Android')) os = 'Android Mobile'
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'Apple iOS'

    let browser = 'Trình duyệt'
    if (ua.includes('Edg/')) browser = 'Microsoft Edge'
    else if (ua.includes('Chrome/')) browser = 'Google Chrome'
    else if (ua.includes('Firefox/')) browser = 'Mozilla Firefox'
    else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Apple Safari'

    return `${browser} (${os})`
  }

  const themesList: Array<{
    id: Theme
    label: string
    sublabel: string
    icon: React.ReactNode
    accentBg: string
  }> = [
    {
      id: 'light',
      label: 'Giao diện Sáng',
      sublabel: 'Thanh lịch, độ tương phản cao, tối ưu hiển thị ban ngày',
      icon: <Sun className="w-5 h-5 text-amber-500" />,
      accentBg: 'bg-amber-500/10 text-amber-600'
    },
    {
      id: 'dark',
      label: 'Giao diện Tối',
      sublabel: 'Than chì dịu mắt, tiết kiệm năng lượng, tập trung làm việc',
      icon: <Moon className="w-5 h-5 text-sky-400" />,
      accentBg: 'bg-sky-500/10 text-sky-400'
    },
    {
      id: 'glass',
      label: 'Kính trong suốt',
      sublabel: 'True Glassmorphism, chiều sâu thị giác Deep Aurora cao cấp',
      icon: <Sparkles className="w-5 h-5 text-purple-400" />,
      accentBg: 'bg-purple-500/10 text-purple-400'
    }
  ]

  if (!isOpen) return null

  const modalContent = (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Center Wrapper: ensures dialog stays centered and top content is never cut off on short screens */}
      <div className="flex min-h-full items-center justify-center p-3 sm:p-4 text-center">
        <div
          className="relative w-full max-w-2xl bg-white dark:bg-[#151F31] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#2A3A50] overflow-hidden flex flex-col max-h-[calc(100vh-2.5rem)] text-left [data-theme=glass]_&:bg-[#0B1528]/85 [data-theme=glass]_&:border-white/20 [data-theme=glass]_&:backdrop-blur-2xl animate-in zoom-in-95 duration-150"
          role="dialog"
          aria-modal="true"
          aria-labelledby="account-settings-title"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 dark:border-[#223147] flex items-center justify-between bg-gradient-to-r from-slate-50 via-slate-50/50 to-indigo-50/20 dark:from-[#172338] dark:to-[#1a2b45] [data-theme=glass]_&:bg-transparent shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 dark:bg-indigo-400/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 id="account-settings-title" className="text-base font-bold text-slate-800 dark:text-white">
                Cài đặt & Trải nghiệm hệ thống
              </h2>
              <p className="text-xs text-slate-500 dark:text-[#A6B4C8]">
                Tùy biến phong cách hiển thị, thông báo và thông tin bảo mật
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#202E44] transition"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Rail */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-slate-100 dark:border-[#223147] overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('appearance')}
            className={`px-3.5 py-2 rounded-t-xl text-xs font-bold transition flex items-center gap-2 border-b-2 -mb-px shrink-0 ${
              activeTab === 'appearance'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/20'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-[#A6B4C8] dark:hover:text-white'
            }`}
          >
            <Sun className="w-4 h-4" />
            <span>Giao diện & Trải nghiệm</span>
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-3.5 py-2 rounded-t-xl text-xs font-bold transition flex items-center gap-2 border-b-2 -mb-px shrink-0 ${
              activeTab === 'notifications'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/20'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-[#A6B4C8] dark:hover:text-white'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Thông báo</span>
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-3.5 py-2 rounded-t-xl text-xs font-bold transition flex items-center gap-2 border-b-2 -mb-px shrink-0 ${
              activeTab === 'security'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/20'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-[#A6B4C8] dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Bảo mật</span>
          </button>
          <button
            onClick={() => setActiveTab('help')}
            className={`px-3.5 py-2 rounded-t-xl text-xs font-bold transition flex items-center gap-2 border-b-2 -mb-px shrink-0 ${
              activeTab === 'help'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/20'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-[#A6B4C8] dark:hover:text-white'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Trợ giúp & Hỗ trợ</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto overscroll-contain flex-1 space-y-6">
          {/* TAB 1: APPEARANCE & EXPERIENCE */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              {/* Theme Selection */}
              <div>
                <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5" />
                  <span>Phong cách giao diện (Theme)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {themesList.map((t) => {
                    const isSelected = theme === t.id
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTheme(t.id)}
                        className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                          isSelected
                            ? 'border-indigo-500 ring-2 ring-indigo-500/30 bg-indigo-50/30 dark:bg-indigo-950/30'
                            : 'border-slate-200 dark:border-[#2A3A50] hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-[#1A2639]/60'
                        }`}
                      >
                        {/* Mini Preview Box */}
                        <div
                          className={`w-full h-14 rounded-lg p-1.5 border mb-3 overflow-hidden flex flex-col justify-between shadow-2xs ${
                            t.id === 'light'
                              ? 'bg-slate-100 border-slate-300'
                              : t.id === 'dark'
                              ? 'bg-[#0B1220] border-[#1E2E44]'
                              : 'bg-gradient-to-br from-indigo-950/90 to-purple-950/90 border-purple-400/40'
                          }`}
                        >
                          <div
                            className={`h-3 rounded px-1.5 flex items-center justify-between ${
                              t.id === 'light'
                                ? 'bg-white border border-slate-200'
                                : t.id === 'dark'
                                ? 'bg-[#151F31] border border-slate-700/60'
                                : 'bg-white/10 border border-white/20'
                            }`}
                          >
                            <div
                              className={`w-6 h-1 rounded-full ${
                                t.id === 'light'
                                  ? 'bg-indigo-600'
                                  : t.id === 'dark'
                                  ? 'bg-sky-400'
                                  : 'bg-purple-300'
                              }`}
                            />
                            <div className="flex items-center gap-0.5">
                              <div className="w-1 h-1 rounded-full bg-slate-400 opacity-60" />
                              <div className="w-1 h-1 rounded-full bg-slate-400 opacity-60" />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-1 pt-1">
                            <div
                              className={`h-4 rounded ${
                                t.id === 'light'
                                  ? 'bg-indigo-100/70'
                                  : t.id === 'dark'
                                  ? 'bg-[#152338]'
                                  : 'bg-white/10 border border-white/10'
                              }`}
                            />
                            <div
                              className={`h-4 rounded ${
                                t.id === 'light'
                                  ? 'bg-slate-200/60'
                                  : t.id === 'dark'
                                  ? 'bg-[#1C293D]'
                                  : 'bg-purple-900/40 border border-purple-400/20'
                              }`}
                            />
                          </div>
                        </div>

                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-lg ${t.accentBg}`}>
                              {t.icon}
                            </div>
                            <div className="text-xs font-bold text-slate-800 dark:text-white">
                              {t.label}
                            </div>
                          </div>
                          {isSelected && (
                            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] shrink-0">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-slate-500 dark:text-[#A6B4C8] leading-snug">
                          {t.sublabel}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Usage Mode Selection */}
              <div className="pt-4 border-t border-slate-100 dark:border-[#223147]">
                <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-1.5">
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Chế độ trải nghiệm sử dụng</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Web Mode */}
                  <button
                    type="button"
                    onClick={() => setUsageMode('web')}
                    className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3.5 ${
                      usageMode === 'web'
                        ? 'border-blue-500 ring-2 ring-blue-500/30 bg-blue-50/30 dark:bg-blue-950/30'
                        : 'border-slate-200 dark:border-[#2A3A50] hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-[#1A2639]/60'
                    }`}
                  >
                    <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 shrink-0">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-800 dark:text-white flex items-center justify-between">
                        <span>Giao diện Web</span>
                        {usageMode === 'web' && (
                          <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px]">
                            ✓
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-[#A6B4C8] mt-1 leading-snug">
                        Bố cục tiêu chuẩn qua thanh điều hướng sidebar và header, tối ưu cho trình duyệt.
                      </div>
                    </div>
                  </button>

                  {/* Desktop Preview Mode */}
                  <button
                    type="button"
                    onClick={() => setUsageMode('desktop')}
                    className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3.5 ${
                      usageMode === 'desktop'
                        ? 'border-indigo-500 ring-2 ring-indigo-500/30 bg-indigo-50/30 dark:bg-indigo-950/30'
                        : 'border-slate-200 dark:border-[#2A3A50] hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-[#1A2639]/60'
                    }`}
                  >
                    <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 shrink-0">
                      <Laptop className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-800 dark:text-white flex items-center justify-between">
                        <span>{isNativeDesktop ? 'Ứng dụng Windows App' : 'Xem trước Desktop'}</span>
                        {usageMode === 'desktop' && (
                          <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[9px]">
                            ✓
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-[#A6B4C8] mt-1 leading-snug">
                        {isNativeDesktop
                          ? 'Bản ứng dụng Windows Native đang hoạt động đầy đủ tính năng cục bộ.'
                          : 'Xem trước bố cục phần mềm Desktop trực tiếp trên trình duyệt (Ribbon & Status Bar).'}
                      </div>
                    </div>
                  </button>
                </div>

                {/* Density Toggle if in Desktop Mode */}
                {usageMode === 'desktop' && (
                  <div className="mt-3 p-3.5 rounded-xl bg-slate-50 dark:bg-[#121B2A]/60 border border-slate-200 dark:border-[#223147] flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-white">
                        Mật độ hiển thị bảng biểu & dữ liệu Desktop
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-[#A6B4C8]">
                        Điều chỉnh khoảng cách ô, padding thẻ và độ dày danh sách
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 dark:bg-[#1E2B40] rounded-lg">
                      <button
                        type="button"
                        onClick={() => setDesktopDensity('standard')}
                        className={`px-3 py-1 rounded-md text-xs font-bold transition ${
                          desktopDensity === 'standard'
                            ? 'bg-white dark:bg-[#151F31] text-indigo-600 dark:text-indigo-400 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'
                        }`}
                      >
                        Chuẩn
                      </button>
                      <button
                        type="button"
                        onClick={() => setDesktopDensity('compact')}
                        className={`px-3 py-1 rounded-md text-xs font-bold transition ${
                          desktopDensity === 'compact'
                            ? 'bg-white dark:bg-[#151F31] text-indigo-600 dark:text-indigo-400 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'
                        }`}
                      >
                        Thu gọn
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-white">
                    Tùy chọn nhận thông báo cá nhân
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-[#A6B4C8]">
                    Lựa chọn những danh mục thông báo bạn muốn nhận trên thiết bị này
                  </p>
                </div>
                {saveNotifFeedback && (
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-fade-in">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Đã lưu tùy chọn
                  </span>
                )}
              </div>

              <div className="space-y-3">
                {/* 1. System Notifications */}
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1A2639]/60 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-white">
                      Thông báo hệ thống & Thông tri chung
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-[#A6B4C8]">
                      Cập nhật phiên bản phần mềm, lịch nghỉ lễ, thông điệp từ Ban Giám hiệu
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={notifySystem}
                      onChange={(e) => handleToggleNotify('ch_notify_system', setNotifySystem, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {/* 2. Class & Schedule Notifications */}
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1A2639]/60 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-white">
                      {portalRole === 'teacher' ? 'Lịch giảng dạy & Lớp phụ trách' : 'Lịch học, Điểm danh & Phòng học'}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-[#A6B4C8]">
                      {portalRole === 'teacher'
                        ? 'Nhắc nhở ca dạy trước 24 giờ, thay đổi phòng học hoặc lịch bù'
                        : 'Nhắc nhở buổi học trước 24 giờ, thay đổi phòng học, thông báo vắng học'}
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={notifySchedule}
                      onChange={(e) => handleToggleNotify('ch_notify_schedule', setNotifySchedule, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {/* 3. Tuition & Finance (Only for Admin / Student) */}
                {(portalRole === 'admin' || portalRole === 'student') && (
                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1A2639]/60 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-white">
                        Học phí, Công nợ & Hóa đơn thu tiền
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-[#A6B4C8]">
                        Nhắc đến hạn đóng học phí định kỳ, xác nhận thu học phí thành công
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={notifyFinance}
                        onChange={(e) => handleToggleNotify('ch_notify_finance', setNotifyFinance, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                )}

                {/* 4. Assessment & Exams */}
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1A2639]/60 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-white">
                      Khảo thí, Đề thi & Kết quả điểm số
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-[#A6B4C8]">
                      Thông báo mở phòng thi trực tuyến, bài thi được chấm và xếp loại
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={notifyAssessment}
                      onChange={(e) => handleToggleNotify('ch_notify_assessment', setNotifyAssessment, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>

              {/* Honest Backend Disclaimer */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#121B2A]/60 border border-slate-200 dark:border-[#223147] text-[11px] text-slate-500 dark:text-[#A6B4C8] leading-relaxed">
                <span className="font-bold text-slate-700 dark:text-slate-300">Ghi chú lưu trữ:</span> Tùy chọn thông báo trên được áp dụng trực tiếp cho thông báo nổi (toast) và bộ lọc trên trình duyệt này. Hệ thống thông báo đẩy tự động qua SMS/Email đa kênh được quản lý tập trung theo chính sách đào tạo CH Academy.
              </div>
            </div>
          )}

          {/* TAB 3: SECURITY */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/60 flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                    Tài khoản được bảo vệ bởi chuẩn an ninh CH Academy Identity
                  </div>
                  <div className="text-[11px] text-indigo-900/80 dark:text-indigo-300/80 leading-relaxed">
                    Xác thực qua mã hóa JWT có chữ ký điện tử, chống tấn công dò quét mật khẩu (brute-force) và lưu vết Audit Log mọi hành động quan trọng.
                  </div>
                </div>
              </div>

              {/* Security Details Table */}
              <div className="rounded-xl border border-slate-200 dark:border-[#2A3A50] overflow-hidden text-xs">
                <div className="p-3 bg-slate-50 dark:bg-[#121B2A]/70 font-bold text-slate-700 dark:text-[#E8EEF7] border-b border-slate-200 dark:border-[#2A3A50]">
                  Thông tin phiên & Trạng thái tài khoản
                </div>
                <div className="divide-y divide-slate-100 dark:divide-[#223147]">
                  <div className="px-4 py-3 flex items-center justify-between">
                    <span className="text-slate-500 dark:text-[#A6B4C8]">Trạng thái kích hoạt:</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold text-[10px]">
                      HOẠT ĐỘNG (ACTIVE)
                    </span>
                  </div>
                  <div className="px-4 py-3 flex items-center justify-between">
                    <span className="text-slate-500 dark:text-[#A6B4C8]">Thiết bị & Môi trường:</span>
                    <span className="font-medium text-slate-800 dark:text-white">
                      {getClientEnvironment()}
                    </span>
                  </div>
                  <div className="px-4 py-3 flex items-center justify-between">
                    <span className="text-slate-500 dark:text-[#A6B4C8]">Đăng nhập gần nhất:</span>
                    <span className="font-mono text-slate-800 dark:text-white font-medium">
                      {user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('vi-VN') : 'Phiên làm việc hiện tại'}
                    </span>
                  </div>
                  <div className="px-4 py-3 flex items-center justify-between">
                    <span className="text-slate-500 dark:text-[#A6B4C8]">Đổi mật khẩu lần cuối:</span>
                    <span className="font-mono text-slate-800 dark:text-white font-medium">
                      {user?.lastPasswordChangedAt ? new Date(user.lastPasswordChangedAt).toLocaleString('vi-VN') : 'Mật khẩu mặc định khởi tạo'}
                    </span>
                  </div>
                  <div className="px-4 py-3 flex items-center justify-between">
                    <span className="text-slate-500 dark:text-[#A6B4C8]">Cơ chế mã hóa:</span>
                    <span className="text-slate-700 dark:text-slate-300">BCrypt (Work Factor 12) + SHA-256 JWT</span>
                  </div>
                </div>
              </div>

              {/* Action: Change Password */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1A2639]/60 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-white">
                    Đổi mật khẩu tài khoản
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-[#A6B4C8]">
                    Định kỳ đổi mật khẩu sau 90 ngày để đảm bảo an toàn tuyệt đối
                  </div>
                </div>
                {onOpenChangePassword && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose()
                      onOpenChangePassword()
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Đổi mật khẩu ngay</span>
                  </button>
                )}
              </div>

              {/* Admin Special: Link to Audit Logs */}
              {portalRole === 'admin' && (
                <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/40 dark:bg-purple-950/20 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-purple-950 dark:text-purple-200">
                      Nhật ký kiểm toán & Giám sát bảo mật (Admin)
                    </div>
                    <div className="text-[11px] text-purple-900/80 dark:text-purple-300/80">
                      Truy vết địa chỉ IP, lịch sử đăng nhập và toàn bộ thay đổi dữ liệu hệ thống
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose()
                      navigate('/admin/audit-logs')
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm shrink-0"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>Xem Audit Log</span>
                  </button>
                </div>
              )}

              {/* Security Guidelines */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#121B2A]/60 border border-slate-200 dark:border-[#223147] space-y-1.5 text-[11px] text-slate-500 dark:text-[#A6B4C8]">
                <div className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                  <span>Khuyến cáo an toàn thông tin:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 pl-1">
                  <li>Không chia sẻ tài khoản hoặc mật khẩu với bất kỳ ai, kể cả nhân viên hỗ trợ.</li>
                  <li>Luôn đăng xuất sau khi sử dụng máy tính chung hoặc thiết bị lạ.</li>
                  <li>Thực hiện đổi mật khẩu ngay nếu nghi ngờ tài khoản bị lộ thông tin.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 4: HELP & SUPPORT */}
          {activeTab === 'help' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Contact Card 1 */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1A2639]/60 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-bold text-slate-800 dark:text-white">
                    Đường dây nóng Hỗ trợ
                  </div>
                  <a
                    href={`tel:${settings?.hotline || '0988123456'}`}
                    className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 font-mono block hover:underline"
                  >
                    {settings?.hotline || '0988 123 456'}
                  </a>
                  <div className="text-[11px] text-slate-400">
                    Phục vụ từ 08:00 - 21:00 hàng ngày (cả T7 & CN)
                  </div>
                </div>

                {/* Contact Card 2 */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1A2639]/60 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-bold text-slate-800 dark:text-white">
                    Hộp thư điện tử Học vụ
                  </div>
                  <a
                    href={`mailto:${settings?.email || 'contact@chacademy.edu.vn'}`}
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 truncate block hover:underline"
                  >
                    {settings?.email || 'contact@chacademy.edu.vn'}
                  </a>
                  <div className="text-[11px] text-slate-400">
                    Phản hồi yêu cầu trong vòng 2 - 4 giờ làm việc
                  </div>
                </div>
              </div>

              {/* Technical / Version Specs */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-slate-50 dark:bg-[#121B2A]/60 space-y-2 text-xs">
                <div className="font-bold text-slate-800 dark:text-white flex items-center justify-between">
                  <span>Học viện Anh ngữ & Năng khiếu CH Academy</span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-[#202E44] text-[10px] font-mono">
                    v2.4.0-PRO
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-[#A6B4C8] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  <span>{settings?.address || 'Tầng 3, Tòa nhà Tri Thức, 123 Phố Huế, Q. Hai Bà Trưng, Hà Nội'}</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-[#A6B4C8] flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  <a
                    href={settings?.website || 'https://chacademy.edu.vn'}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <span>{settings?.website || 'https://chacademy.edu.vn'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Quick FAQs */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1A2639]/40 space-y-2 text-xs">
                <div className="font-bold text-slate-800 dark:text-white">
                  Câu hỏi thường gặp:
                </div>
                <div className="space-y-1.5 text-[11px] text-slate-600 dark:text-[#A6B4C8]">
                  <div>
                    <strong className="text-slate-800 dark:text-slate-200">Q: Làm thế nào để đổi ảnh đại diện?</strong>
                    <p className="mt-0.5 text-slate-500">Mở menu tài khoản &gt; Chọn "Thông tin tài khoản" &gt; Nhấn "Tải ảnh từ máy" hoặc nhập URL &gt; Nhấn "Lưu thay đổi".</p>
                  </div>
                  <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                    <strong className="text-slate-800 dark:text-slate-200">Q: Cách dùng phím tắt tìm kiếm toàn hệ thống?</strong>
                    <p className="mt-0.5 text-slate-500">Nhấn tổ hợp phím <kbd className="font-mono px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">Ctrl + K</kbd> (hoặc <kbd className="font-mono px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">Cmd + K</kbd> trên Mac) tại bất kỳ màn hình nào.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 dark:border-[#223147] flex items-center justify-end bg-slate-50/50 dark:bg-[#121B2A]/50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  </div>
)

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent
}
