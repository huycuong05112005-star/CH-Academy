import React, { useState, useEffect, useCallback } from 'react'
import {
  Settings,
  Building2,
  Bell,
  Database,
  CheckCircle2,
  Save,
  Sun,
  Moon,
  Monitor,
  ShieldCheck,
  Server,
  AlertCircle,
  RefreshCw,
  KeyRound,
  Lock,
  UserCheck,
  RotateCcw,
  Copy,
  Sparkles,
  Clock,
  Eye,
  EyeOff,
  Search,
  Check,
  Globe,
  Laptop,
  Terminal,
  Layers
} from 'lucide-react'
import { useTheme, type Theme } from '../../../context/ThemeContext'
import { useExperience, type UsageMode } from '../../../context/ExperienceContext'
import { useSettings } from '../../../context/SettingsContext'
import { settingsApi, type SystemSettings } from '../../../api/settings'
import { authApi } from '../../../api/auth'
import { securityApi, type UserSecurityItem, type ResetPasswordResult, type SecurityAuditItem } from '../../../api/security'

type ActiveTab = 'general' | 'change-password' | 'security'

export const SettingsPage: React.FC = () => {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const { usageMode, setUsageMode, isNativeDesktop, effectiveUsageMode, experienceLabel } = useExperience()
  const { settings: globalSettings, updateSettings: saveGlobalSettings } = useSettings()

  const [activeTab, setActiveTab] = useState<ActiveTab>('general')
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  // Center Info State
  const [centerName, setCenterName] = useState(globalSettings?.centerName || 'Học viện Anh ngữ & Năng khiếu CH Academy')
  const [shortName, setShortName] = useState(globalSettings?.shortName || 'CH Academy')
  const [hotline, setHotline] = useState(globalSettings?.hotline || '0988 123 456')
  const [email, setEmail] = useState(globalSettings?.email || 'contact@chacademy.edu.vn')
  const [address, setAddress] = useState(globalSettings?.address || 'Tầng 3, Tòa nhà Tri Thức, Số 123 Phố Huế, Q. Hai Bà Trưng, Hà Nội')
  const [website, setWebsite] = useState(globalSettings?.website || 'https://chacademy.edu.vn')

  // Notification Preferences
  const [notifyNewLead, setNotifyNewLead] = useState(globalSettings?.notifyNewLead ?? true)
  const [notifyTuitionDue, setNotifyTuitionDue] = useState(globalSettings?.notifyTuitionDue ?? true)
  const [notifyAbsence, setNotifyAbsence] = useState(globalSettings?.notifyAbsence ?? false)

  // Technical Diagnostics
  const [systemDiag, setSystemDiag] = useState<Partial<SystemSettings>>({
    appVersion: globalSettings?.appVersion,
    dbVersion: globalSettings?.dbVersion,
    activeProfile: globalSettings?.activeProfile,
    timezone: globalSettings?.timezone
  })

  // Change Password Form State (Current Admin)
  const [curPassword, setCurPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [pwdChanging, setPwdChanging] = useState(false)
  const [pwdFeedback, setPwdFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  // Security Admin State
  const [securityUsers, setSecurityUsers] = useState<UserSecurityItem[]>([])
  const [securityAudits, setSecurityAudits] = useState<SecurityAuditItem[]>([])
  const [securityLoading, setSecurityLoading] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [resetResult, setResetResult] = useState<ResetPasswordResult | null>(null)
  const [copiedToken, setCopiedToken] = useState(false)

  // Load general settings on mount
  useEffect(() => {
    let isMounted = true
    const loadSettings = async () => {
      try {
        setLoading(true)
        setErrorMsg(null)
        const res = await settingsApi.getSettings()
        if (isMounted && res.data) {
          const d = res.data
          if (d.centerName) setCenterName(d.centerName)
          if (d.shortName) setShortName(d.shortName)
          if (d.hotline) setHotline(d.hotline)
          if (d.email) setEmail(d.email)
          if (d.address) setAddress(d.address)
          if (d.website !== undefined) setWebsite(d.website || '')
          if (d.notifyNewLead !== undefined) setNotifyNewLead(Boolean(d.notifyNewLead))
          if (d.notifyTuitionDue !== undefined) setNotifyTuitionDue(Boolean(d.notifyTuitionDue))
          if (d.notifyAbsence !== undefined) setNotifyAbsence(Boolean(d.notifyAbsence))
          setSystemDiag({
            appVersion: d.appVersion,
            dbVersion: d.dbVersion,
            activeProfile: d.activeProfile,
            timezone: d.timezone
          })
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : String(err)
          console.warn('Could not fetch settings from backend API, using cached/default settings:', msg)
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    loadSettings()
    return () => { isMounted = false }
  }, [])

  // Load security data when switching to security tab
  const fetchSecurityData = useCallback(async () => {
    setSecurityLoading(true)
    try {
      const [usersRes, auditRes] = await Promise.all([
        securityApi.getUsers({ keyword: searchKeyword, role: filterRole, status: filterStatus }),
        securityApi.getSecurityAudit()
      ])
      if (usersRes.success && usersRes.data) {
        setSecurityUsers(usersRes.data)
      }
      if (auditRes.success && auditRes.data) {
        setSecurityAudits(auditRes.data)
      }
    } catch (err: unknown) {
      console.warn('Error loading security data:', err)
    } finally {
      setSecurityLoading(false)
    }
  }, [searchKeyword, filterRole, filterStatus])

  useEffect(() => {
    let active = true
    if (activeTab === 'security') {
      Promise.resolve().then(async () => {
        if (!active) return
        setSecurityLoading(true)
        try {
          const [usersRes, auditRes] = await Promise.all([
            securityApi.getUsers({ keyword: searchKeyword, role: filterRole, status: filterStatus }),
            securityApi.getSecurityAudit()
          ])
          if (active && usersRes.success && usersRes.data) {
            setSecurityUsers(usersRes.data)
          }
          if (active && auditRes.success && auditRes.data) {
            setSecurityAudits(auditRes.data)
          }
        } catch (err: unknown) {
          console.warn('Error loading security data:', err)
        } finally {
          if (active) setSecurityLoading(false)
        }
      })
    }
    return () => {
      active = false
    }
  }, [activeTab, searchKeyword, filterRole, filterStatus])

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setSaving(true)
    setErrorMsg(null)
    setSuccessMsg(null)
    try {
      const payload: SystemSettings = {
        centerName: centerName.trim(),
        shortName: shortName.trim(),
        hotline: hotline.trim(),
        email: email.trim(),
        address: address.trim(),
        website: website.trim(),
        notifyNewLead,
        notifyTuitionDue,
        notifyAbsence
      }
      const updated = await saveGlobalSettings(payload)
      if (updated) {
        setCenterName(updated.centerName)
        setShortName(updated.shortName)
        setHotline(updated.hotline)
        setEmail(updated.email)
        setAddress(updated.address)
        setWebsite(updated.website || '')
        if (updated.notifyNewLead !== undefined) setNotifyNewLead(Boolean(updated.notifyNewLead))
        if (updated.notifyTuitionDue !== undefined) setNotifyTuitionDue(Boolean(updated.notifyTuitionDue))
        if (updated.notifyAbsence !== undefined) setNotifyAbsence(Boolean(updated.notifyAbsence))
      }
      setSuccessMsg('Đã lưu cấu hình hệ thống thành công!')
      setTimeout(() => setSuccessMsg(null), 4000)
    } catch (err: unknown) {
      console.error('Failed to save settings:', err)
      const msg = err instanceof Error ? err.message : 'Lỗi khi lưu cấu hình. Vui lòng kiểm tra lại quyền truy cập hoặc kết nối mạng.'
      setErrorMsg(msg)
    } finally {
      setSaving(false)
    }
  }

  // Handle personal password change
  const handleChangePersonalPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwdFeedback(null)

    if (!curPassword || !newPassword || !confirmPassword) {
      setPwdFeedback({ type: 'error', msg: 'Vui lòng điền đầy đủ các trường thông tin.' })
      return
    }
    if (newPassword.length < 8) {
      setPwdFeedback({ type: 'error', msg: 'Mật khẩu mới phải có độ dài từ 8 ký tự trở lên.' })
      return
    }
    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setPwdFeedback({ type: 'error', msg: 'Mật khẩu mới phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 chữ số.' })
      return
    }
    if (newPassword !== confirmPassword) {
      setPwdFeedback({ type: 'error', msg: 'Mật khẩu xác nhận không khớp.' })
      return
    }
    if (curPassword === newPassword) {
      setPwdFeedback({ type: 'error', msg: 'Mật khẩu mới không được trùng với mật khẩu đang dùng.' })
      return
    }

    setPwdChanging(true)
    try {
      const res = await authApi.changePassword(curPassword, newPassword)
      if (res.success) {
        setPwdFeedback({ type: 'success', msg: 'Đổi mật khẩu thành công! Hãy ghi nhớ mật khẩu mới của bạn.' })
        setCurPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setPwdFeedback({ type: 'error', msg: res.message || 'Không thể đổi mật khẩu. Vui lòng thử lại.' })
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi hệ thống khi cập nhật mật khẩu.'
      setPwdFeedback({ type: 'error', msg })
    } finally {
      setPwdChanging(false)
    }
  }

  // Admin Security Actions
  const handleRequirePasswordChange = async (userId: number, username: string) => {
    try {
      const res = await securityApi.requirePasswordChange(userId)
      if (res.success) {
        setActionSuccess(`Đã yêu cầu tài khoản [${username}] đổi mật khẩu trong lần đăng nhập tới.`)
        fetchSecurityData()
        setTimeout(() => setActionSuccess(null), 4000)
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Lỗi thao tác')
    }
  }

  const handleResetPassword = async (userId: number) => {
    try {
      const res = await securityApi.resetPassword(userId)
      if (res.success && res.data) {
        setResetResult(res.data)
        fetchSecurityData()
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Lỗi cấp lại mật khẩu')
    }
  }

  const handleToggleLock = async (userId: number, username: string, isCurrentlyLocked: boolean) => {
    const actionName = isCurrentlyLocked ? 'mở khóa' : 'khóa'
    if (!confirm(`Bạn có chắc chắn muốn ${actionName} tài khoản [${username}] không?`)) return

    try {
      const res = await securityApi.toggleLock(userId)
      if (res.success) {
        setActionSuccess(`Đã ${actionName} tài khoản [${username}] thành công.`)
        fetchSecurityData()
        setTimeout(() => setActionSuccess(null), 4000)
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Lỗi cập nhật trạng thái khóa')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedToken(true)
    setTimeout(() => setCopiedToken(false), 2000)
  }

  // Password strength checker helper
  const getPasswordStrength = (pwd: string) => {
    let score = 0
    if (!pwd) return { score: 0, text: 'Chưa nhập', color: 'bg-slate-200 dark:bg-slate-700' }
    if (pwd.length >= 8) score += 1
    if (pwd.length >= 12) score += 1
    if (/[A-Z]/.test(pwd)) score += 1
    if (/[a-z]/.test(pwd)) score += 1
    if (/[0-9]/.test(pwd)) score += 1
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1

    if (score <= 2) return { score, text: 'Yếu', color: 'bg-rose-500' }
    if (score <= 4) return { score, text: 'Khá', color: 'bg-amber-500' }
    return { score, text: 'Mạnh (Tốt)', color: 'bg-emerald-500' }
  }

  const strength = getPasswordStrength(newPassword)

  const themeOptions: {
    value: Theme
    label: string
    subLabel: string
    desc: string
    icon: React.ComponentType<{ size?: number; className?: string }>
  }[] = [
    {
      value: 'light',
      label: 'Giao diện Sáng',
      subLabel: 'Light Mode',
      desc: 'Màu nền trắng thanh lịch, thanh điều hướng xanh navy trang nhã, tối ưu hiển thị ban ngày.',
      icon: Sun
    },
    {
      value: 'dark',
      label: 'Giao diện Tối',
      subLabel: 'Dark Mode',
      desc: 'Nền tối xanh đen sâu thẳm, chống mỏi mắt, phù hợp làm việc tập trung ban đêm.',
      icon: Moon
    },
    {
      value: 'glass',
      label: 'Kính trong suốt',
      subLabel: 'True Glassmorphism',
      desc: 'Hiệu ứng kính mờ frosted glass xuyên thấu ánh sáng radiant aura đa tầng độc bản.',
      icon: Sparkles
    }
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#2A3A50]">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-[#A6B4C8] uppercase tracking-wider mb-1">
            <span>Quản trị hệ thống</span>
            <span>/</span>
            <span className="text-[#142B4A] dark:text-[#38BDF8]">Cấu hình & Bảo mật</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#142B4A] dark:text-[#E8EEF7] flex items-center gap-2.5">
            <Settings className="w-7 h-7 text-[#142B4A] dark:text-[#38BDF8]" />
            Cấu hình Hệ thống & Trung tâm
          </h1>
          <p className="text-sm text-slate-600 dark:text-[#A6B4C8] mt-1">
            Quản trị trung tâm đào tạo, tùy chọn giao diện, đổi mật khẩu cá nhân và kiểm soát an ninh tài khoản nhân sự.
          </p>
        </div>

        {activeTab === 'general' && (
          <button
            onClick={() => handleSave()}
            disabled={saving || loading}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#142B4A] dark:bg-[#38BDF8] hover:bg-[#1D4168] dark:hover:bg-[#0284C7] text-white dark:text-[#0B1220] rounded-xl text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save size={16} />}
            <span>{saving ? 'Đang lưu...' : 'Lưu cấu hình'}</span>
          </button>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-[#2A3A50] pb-2">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'general'
              ? 'bg-[#142B4A] dark:bg-[#38BDF8] text-white dark:text-[#0B1220] shadow-sm'
              : 'text-slate-600 dark:text-[#A6B4C8] hover:bg-slate-100 dark:hover:bg-[#1C293D]'
          }`}
        >
          <Building2 size={16} />
          <span>Cấu hình chung</span>
        </button>

        <button
          onClick={() => setActiveTab('change-password')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'change-password'
              ? 'bg-[#142B4A] dark:bg-[#38BDF8] text-white dark:text-[#0B1220] shadow-sm'
              : 'text-slate-600 dark:text-[#A6B4C8] hover:bg-slate-100 dark:hover:bg-[#1C293D]'
          }`}
        >
          <KeyRound size={16} />
          <span>Đổi mật khẩu cá nhân</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'security'
              ? 'bg-[#142B4A] dark:bg-[#38BDF8] text-white dark:text-[#0B1220] shadow-sm'
              : 'text-slate-600 dark:text-[#A6B4C8] hover:bg-slate-100 dark:hover:bg-[#1C293D]'
          }`}
        >
          <ShieldCheck size={16} />
          <span>Quản lý Mật khẩu & An ninh</span>
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-center gap-3 text-sm shadow-xs animate-in fade-in">
          <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 flex items-center gap-3 text-sm shadow-xs animate-in fade-in">
          <AlertCircle size={18} className="text-rose-600 dark:text-rose-400 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-center gap-3 text-sm shadow-xs animate-in fade-in">
          <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* TAB 1: CẤU HÌNH CHUNG */}
      {activeTab === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Form Settings (2 Cols) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Multi-Experience UI Section: Web + Desktop + 3 Themes (6 Total Combinations) */}
            <div className="bg-white dark:bg-[#151F31] p-6 rounded-2xl border border-slate-200/80 dark:border-[#2A3A50] shadow-xs space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100 dark:border-[#2A3A50]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#1C293D] flex items-center justify-center text-[#142B4A] dark:text-[#38BDF8]">
                    <Layers size={20} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#142B4A] dark:text-[#E8EEF7]">Trải nghiệm Giao diện & Đa nền tảng (Multi-Experience UI)</h2>
                    <p className="text-xs text-slate-500 dark:text-[#A6B4C8]">2 Chế độ sử dụng (Web & Desktop) kết hợp 3 Phong cách (Sáng, Tối, Kính trong suốt) — 6 tổ hợp trải nghiệm</p>
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-[#38BDF8] border border-sky-200 dark:border-sky-800">
                  <Sparkles size={13} className="text-sky-500" />
                  <span>{experienceLabel}</span>
                </div>
              </div>

              {/* Nhóm A: Chế độ sử dụng (Usage Mode) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#0284C7] dark:bg-[#38BDF8]" />
                    <span>Nhóm A — Chế độ sử dụng (Usage Mode)</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Chọn phương thức trải nghiệm ứng dụng</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Option A1: Giao diện Web */}
                  <div
                    onClick={() => setUsageMode('web')}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                      usageMode === 'web' && !isNativeDesktop
                        ? 'border-[#0284C7] dark:border-[#38BDF8] ring-2 ring-[#0284C7]/20 dark:ring-[#38BDF8]/30 bg-sky-50/30 dark:bg-sky-950/20'
                        : 'border-slate-200 dark:border-[#2A3A50] hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-[#121B2B]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-[#38BDF8] flex items-center justify-center">
                            <Globe size={18} />
                          </div>
                          <div>
                            <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Giao diện Web</div>
                            <div className="text-[10px] text-slate-400 font-medium">Trình duyệt Chrome, Edge, Safari...</div>
                          </div>
                        </div>

                        {usageMode === 'web' && !isNativeDesktop ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-sky-600 px-2 py-0.5 rounded-full">
                            <Check size={10} /> Đang chọn
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-slate-400">Chọn Web</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        Tiếp tục chạy trên trình duyệt web, định tuyến URL đầy đủ, đăng nhập và phân quyền linh hoạt trên mọi máy tính và thiết bị.
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Thanh điều hướng web</span>
                      <span className="font-semibold text-sky-600 dark:text-sky-400">Không cần cài đặt</span>
                    </div>
                  </div>

                  {/* Option A2: Giao diện Desktop */}
                  <div
                    onClick={() => setUsageMode('desktop')}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                      usageMode === 'desktop' || isNativeDesktop
                        ? 'border-[#0284C7] dark:border-[#38BDF8] ring-2 ring-[#0284C7]/20 dark:ring-[#38BDF8]/30 bg-sky-50/30 dark:bg-sky-950/20'
                        : 'border-slate-200 dark:border-[#2A3A50] hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-[#121B2B]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                            <Laptop size={18} />
                          </div>
                          <div>
                            <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Giao diện Desktop</div>
                            <div className="text-[10px] text-slate-400 font-medium">Windows Native Client (Electron)</div>
                          </div>
                        </div>

                        {isNativeDesktop ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-emerald-600 px-2 py-0.5 rounded-full">
                            <Check size={10} /> Native App
                          </span>
                        ) : usageMode === 'desktop' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-sky-600 px-2 py-0.5 rounded-full">
                            <Check size={10} /> Đang chọn
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-slate-400">Chọn Desktop</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        Thanh tiêu đề ứng dụng độc lập, điều khiển thu nhỏ, phóng to, đóng cửa sổ, vùng kéo thả native và hỗ trợ kính trong suốt hệ điều hành.
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Cửa sổ Frameless chuyên biệt</span>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                        {isNativeDesktop ? 'Đang chạy Native' : 'Xem trước / Cài đặt'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Instruction Callout for Desktop App Launching */}
                {!isNativeDesktop && (
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#101B2D] border border-slate-200/80 dark:border-[#20314C] text-xs space-y-2">
                    <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                      <div className="flex items-center gap-1.5">
                        <Terminal size={14} className="text-sky-500" />
                        <span>Khởi chạy ứng dụng Desktop Windows Native độc lập:</span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-normal">Package đã sẵn sàng trong thư mục desktop/</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                      Để trải nghiệm cửa sổ Desktop Windows thực tế với thanh tiêu đề native và kính trong suốt hệ điều hành, hãy mở terminal tại thư mục dự án và gõ:
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="px-2.5 py-1 rounded bg-slate-200/70 dark:bg-black/50 text-sky-600 dark:text-sky-300 font-mono text-[11px] font-bold flex-1 select-all">
                        npm run desktop:start
                      </code>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText('npm run desktop:start')
                          setSuccessMsg('Đã sao chép lệnh khởi chạy Desktop vào Clipboard!')
                          setTimeout(() => setSuccessMsg(null), 3000)
                        }}
                        className="px-2.5 py-1 rounded bg-white dark:bg-[#1A283D] border border-slate-200 dark:border-white/15 text-slate-700 dark:text-slate-300 hover:bg-slate-100 text-[11px] font-bold transition flex items-center gap-1"
                      >
                        <Copy size={11} />
                        <span>Sao chép</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Nhóm B: Phong cách giao diện (Theme Style) */}
              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-[#2A3A50]">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#0284C7] dark:bg-[#38BDF8]" />
                    <span>Nhóm B — Phong cách hiển thị (Theme Style)</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Áp dụng độc lập cho cả Web & Desktop</span>
                </div>

                {/* 3 Prominent Visual Preview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {themeOptions.map((opt) => {
                    const Icon = opt.icon
                    const isSelected = theme === opt.value || (opt.value === 'glass' && theme === 'transparent')
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setTheme(opt.value)}
                        className={`group flex flex-col text-left p-3.5 rounded-2xl border transition-all duration-200 relative overflow-hidden cursor-pointer ${
                          isSelected
                            ? 'border-[#0284C7] dark:border-[#38BDF8] ring-2 ring-[#0284C7]/20 dark:ring-[#38BDF8]/30 shadow-md'
                            : 'border-slate-200 dark:border-[#2A3A50] hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-xs'
                        }`}
                      >
                        {/* Mini Visual UI Mockup */}
                        <div className="w-full mb-3 rounded-xl overflow-hidden shadow-2xs">
                          {opt.value === 'light' && (
                            <div className="w-full h-24 bg-[#F8FAFC] p-2 flex flex-col gap-1.5 border border-slate-200/90">
                              <div className="h-3.5 w-full bg-[#0F243E] rounded flex items-center px-1.5 gap-1 shadow-2xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                                <span className="w-10 h-1 bg-white/40 rounded-full" />
                              </div>
                              <div className="flex-1 bg-white rounded p-1.5 flex gap-1.5 border border-slate-200 shadow-2xs">
                                <div className="w-1/3 bg-slate-50 rounded flex flex-col gap-1 p-1 border border-slate-100">
                                  <div className="h-1.5 w-full bg-blue-600 rounded-sm" />
                                  <div className="h-1 w-3/4 bg-slate-300 rounded-sm" />
                                </div>
                                <div className="flex-1 flex flex-col gap-1 justify-center">
                                  <div className="h-1.5 w-full bg-slate-300 rounded-sm" />
                                  <div className="h-1.5 w-4/5 bg-slate-200 rounded-sm" />
                                  <div className="h-1.5 w-1/2 bg-blue-500 rounded-sm mt-0.5" />
                                </div>
                              </div>
                            </div>
                          )}

                          {opt.value === 'dark' && (
                            <div className="w-full h-24 bg-[#0B1220] p-2 flex flex-col gap-1.5 border border-[#1E2E44]">
                              <div className="h-3.5 w-full bg-[#101B2D] rounded flex items-center px-1.5 gap-1 border-b border-[#24354D]">
                                <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                                <span className="w-10 h-1 bg-slate-500 rounded-full" />
                              </div>
                              <div className="flex-1 bg-[#151F31] rounded p-1.5 flex gap-1.5 border border-[#2A3A50]">
                                <div className="w-1/3 bg-[#1C293D] rounded flex flex-col gap-1 p-1 border border-[#2A3A50]">
                                  <div className="h-1.5 w-full bg-sky-400 rounded-sm" />
                                  <div className="h-1 w-3/4 bg-slate-600 rounded-sm" />
                                </div>
                                <div className="flex-1 flex flex-col gap-1 justify-center">
                                  <div className="h-1.5 w-full bg-slate-600 rounded-sm" />
                                  <div className="h-1.5 w-4/5 bg-slate-700 rounded-sm" />
                                  <div className="h-1.5 w-1/2 bg-sky-500 rounded-sm mt-0.5" />
                                </div>
                              </div>
                            </div>
                          )}

                          {opt.value === 'glass' && (
                            <div className="relative w-full h-24 p-2 flex flex-col gap-1.5 overflow-hidden border border-white/20 bg-gradient-to-br from-[#060C1D] via-[#0A1430] to-[#120D2C]">
                              <div className="absolute -top-2 -right-2 w-16 h-16 rounded-full bg-cyan-400/50 blur-md pointer-events-none" />
                              <div className="absolute -bottom-2 -left-2 w-16 h-16 rounded-full bg-indigo-500/50 blur-md pointer-events-none" />
                              <div className="absolute top-1/2 left-1/3 w-10 h-10 rounded-full bg-pink-500/30 blur-md pointer-events-none" />

                              <div className="relative z-10 h-3.5 w-full bg-white/10 backdrop-blur-md rounded flex items-center px-1.5 gap-1 border border-white/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_6px_#38bdf8]" />
                                <span className="w-10 h-1 bg-white/60 rounded-full" />
                              </div>
                              <div className="relative z-10 flex-1 bg-white/10 backdrop-blur-md rounded p-1.5 flex gap-1.5 border border-white/25 shadow-md">
                                <div className="w-1/3 bg-white/10 rounded flex flex-col gap-1 p-1 border border-white/15">
                                  <div className="h-1.5 w-full bg-cyan-400 rounded-sm shadow-[0_0_4px_#38bdf8]" />
                                  <div className="h-1 w-3/4 bg-white/40 rounded-sm" />
                                </div>
                                <div className="flex-1 flex flex-col gap-1 justify-center">
                                  <div className="h-1.5 w-full bg-white/60 rounded-sm" />
                                  <div className="h-1.5 w-4/5 bg-white/40 rounded-sm" />
                                  <div className="h-1.5 w-1/2 bg-cyan-400 rounded-sm mt-0.5 shadow-[0_0_4px_#38bdf8]" />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Card Info Header */}
                        <div className="flex items-center justify-between w-full mb-1">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                              isSelected
                                ? 'bg-sky-500 text-white'
                                : 'bg-slate-100 dark:bg-[#1C293D] text-slate-600 dark:text-slate-300'
                            }`}>
                              <Icon size={14} />
                            </div>
                            <div>
                              <div className="font-bold text-xs sm:text-sm text-[#142B4A] dark:text-[#E8EEF7]">
                                {opt.label}
                              </div>
                              <div className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
                                {opt.subLabel}
                              </div>
                            </div>
                          </div>

                          {isSelected ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-white bg-sky-600 dark:bg-sky-500 px-2 py-0.5 rounded-full shadow-2xs">
                              <Check size={10} />
                              Đang chọn
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300">
                              Áp dụng
                            </span>
                          )}
                        </div>

                        {/* Card Description */}
                        <div className="text-[11px] text-slate-500 dark:text-[#A6B4C8] mt-1.5 leading-relaxed">
                          {opt.desc}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Ma trận 6 Tổ hợp Trải nghiệm Giao diện */}
              <div className="pt-4 border-t border-slate-100 dark:border-[#2A3A50] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-sky-500" />
                    <span>Ma trận 6 Tổ hợp Trải nghiệm (Bấm để chuyển nhanh)</span>
                  </div>
                  <span className="text-[11px] text-slate-400">2 chế độ × 3 phong cách</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  {[
                    { mode: 'web' as UsageMode, th: 'light' as Theme, label: 'Web Sáng' },
                    { mode: 'web' as UsageMode, th: 'dark' as Theme, label: 'Web Tối' },
                    { mode: 'web' as UsageMode, th: 'glass' as Theme, label: 'Web Kính' },
                    { mode: 'desktop' as UsageMode, th: 'light' as Theme, label: 'Desktop Sáng' },
                    { mode: 'desktop' as UsageMode, th: 'dark' as Theme, label: 'Desktop Tối' },
                    { mode: 'desktop' as UsageMode, th: 'glass' as Theme, label: 'Desktop Kính' },
                  ].map((item) => {
                    const isComboActive =
                      (effectiveUsageMode === item.mode) &&
                      (theme === item.th || (item.th === 'glass' && theme === 'transparent'))
                    return (
                      <button
                        key={`${item.mode}-${item.th}`}
                        type="button"
                        onClick={() => {
                          setUsageMode(item.mode)
                          setTheme(item.th)
                        }}
                        className={`p-2 rounded-xl text-center border transition-all text-xs font-bold cursor-pointer ${
                          isComboActive
                            ? 'bg-sky-600 text-white border-sky-600 shadow-xs ring-2 ring-sky-300/40'
                            : 'bg-slate-50 dark:bg-[#101B2D] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#20314C] hover:bg-slate-100 dark:hover:bg-[#19273D]'
                        }`}
                      >
                        <div className="truncate">{item.label}</div>
                        {isComboActive && <div className="text-[9px] opacity-90 font-medium">Đang chọn</div>}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* System Theme Option Bar */}
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-[#2A3A50] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#1C293D] flex items-center justify-center text-slate-600 dark:text-slate-300">
                    <Monitor size={15} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#142B4A] dark:text-[#E8EEF7]">
                      Tự động theo hệ điều hành (System)
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-[#A6B4C8]">
                      Tự động chuyển giữa Sáng và Tối dựa trên thiết lập máy tính của bạn
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTheme('system')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      theme === 'system'
                        ? 'bg-sky-50 dark:bg-[#1C293D] text-[#0284C7] dark:text-[#38BDF8] border-[#0284C7] dark:border-[#38BDF8]'
                        : 'bg-white dark:bg-[#151F31] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-[#2A3A50] hover:bg-slate-50 dark:hover:bg-[#1C293D]'
                    }`}
                  >
                    {theme === 'system' ? '✓ Đang bật đồng bộ hệ thống' : 'Bật đồng bộ hệ thống'}
                  </button>
                </div>
              </div>

              {/* Resolved Theme Indicator */}
              <div className="mt-3 text-xs text-slate-500 dark:text-[#A6B4C8] flex items-center gap-2">
                <span>Giao diện thực tế đang hiển thị:</span>
                <span className="inline-flex items-center gap-1.5 font-bold text-sky-600 dark:text-[#38BDF8] bg-sky-50 dark:bg-sky-950/40 px-2 py-0.5 rounded-md border border-sky-200 dark:border-sky-900/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                  {resolvedTheme === 'glass'
                    ? 'Kính trong suốt (True Glassmorphism)'
                    : resolvedTheme === 'dark'
                    ? 'Giao diện Tối (Dark Mode)'
                    : 'Giao diện Sáng (Light Mode)'}
                </span>
              </div>
            </div>

            {/* Center Profile Section */}
            <div className="bg-white dark:bg-[#151F31] p-6 rounded-2xl border border-slate-200/80 dark:border-[#2A3A50] shadow-xs">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-[#2A3A50]">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#1C293D] flex items-center justify-center text-[#142B4A] dark:text-[#38BDF8]">
                  <Building2 size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#142B4A] dark:text-[#E8EEF7]">Thông tin Trung tâm</h2>
                  <p className="text-xs text-slate-500 dark:text-[#A6B4C8]">Hiển thị trên hóa đơn, phiếu thu học phí và cổng thông tin công khai</p>
                </div>
              </div>

              <form onSubmit={handleSave} className="mt-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] mb-1.5">
                      Tên đầy đủ của trung tâm *
                    </label>
                    <input
                      type="text"
                      value={centerName}
                      onChange={(e) => setCenterName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-sm text-[#142B4A] dark:text-[#E8EEF7] focus:outline-hidden focus:ring-2 focus:ring-[#142B4A] dark:focus:ring-[#38BDF8]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] mb-1.5">
                      Tên viết tắt thương hiệu *
                    </label>
                    <input
                      type="text"
                      value={shortName}
                      onChange={(e) => setShortName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-sm text-[#142B4A] dark:text-[#E8EEF7] focus:outline-hidden focus:ring-2 focus:ring-[#142B4A] dark:focus:ring-[#38BDF8]"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] mb-1.5">
                      Hotline tuyển sinh *
                    </label>
                    <input
                      type="text"
                      value={hotline}
                      onChange={(e) => setHotline(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-sm text-[#142B4A] dark:text-[#E8EEF7] focus:outline-hidden focus:ring-2 focus:ring-[#142B4A] dark:focus:ring-[#38BDF8]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] mb-1.5">
                      Hòm thư điện tử (Email) *
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-sm text-[#142B4A] dark:text-[#E8EEF7] focus:outline-hidden focus:ring-2 focus:ring-[#142B4A] dark:focus:ring-[#38BDF8]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] mb-1.5">
                    Địa chỉ trụ sở chính *
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-sm text-[#142B4A] dark:text-[#E8EEF7] focus:outline-hidden focus:ring-2 focus:ring-[#142B4A] dark:focus:ring-[#38BDF8]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] mb-1.5">
                    Website chính thức
                  </label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-sm text-[#142B4A] dark:text-[#E8EEF7] focus:outline-hidden focus:ring-2 focus:ring-[#142B4A] dark:focus:ring-[#38BDF8]"
                  />
                </div>
              </form>
            </div>

            {/* Notification Preferences */}
            <div className="bg-white dark:bg-[#151F31] p-6 rounded-2xl border border-slate-200/80 dark:border-[#2A3A50] shadow-xs">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-[#2A3A50]">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#1C293D] flex items-center justify-center text-[#142B4A] dark:text-[#38BDF8]">
                  <Bell size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#142B4A] dark:text-[#E8EEF7]">Tùy chọn Thông báo</h2>
                  <p className="text-xs text-slate-500 dark:text-[#A6B4C8]">Cấu hình quy tắc gửi thông báo nội bộ cho cán bộ quản lý</p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyNewLead}
                    onChange={(e) => setNotifyNewLead(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded text-[#142B4A] dark:text-[#38BDF8] border-slate-300 dark:border-slate-600 focus:ring-2"
                  />
                  <div>
                    <div className="text-sm font-semibold text-[#142B4A] dark:text-[#E8EEF7]">Khách hàng tiềm năng mới</div>
                    <div className="text-xs text-slate-500 dark:text-[#A6B4C8]">Gửi thông báo tức thì khi có phụ huynh điền đơn tư vấn tuyển sinh từ website</div>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyTuitionDue}
                    onChange={(e) => setNotifyTuitionDue(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded text-[#142B4A] dark:text-[#38BDF8] border-slate-300 dark:border-slate-600 focus:ring-2"
                  />
                  <div>
                    <div className="text-sm font-semibold text-[#142B4A] dark:text-[#E8EEF7]">Khoản thu học phí đến hạn</div>
                    <div className="text-xs text-slate-500 dark:text-[#A6B4C8]">Tự động nhắc kế toán và phụ huynh trước 3 ngày đến hạn đóng học phí</div>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyAbsence}
                    onChange={(e) => setNotifyAbsence(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded text-[#142B4A] dark:text-[#38BDF8] border-slate-300 dark:border-slate-600 focus:ring-2"
                  />
                  <div>
                    <div className="text-sm font-semibold text-[#142B4A] dark:text-[#E8EEF7]">Học viên vắng mặt liên tiếp</div>
                    <div className="text-xs text-slate-500 dark:text-[#A6B4C8]">Cảnh báo giáo vụ khi học viên vắng mặt từ 2 buổi trở lên không phép</div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: System Diagnostics & Health (1 Col) */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-[#151F31] p-6 rounded-2xl border border-slate-200/80 dark:border-[#2A3A50] shadow-xs">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-[#2A3A50]">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#1C293D] flex items-center justify-center text-[#142B4A] dark:text-[#38BDF8]">
                  <Server size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#142B4A] dark:text-[#E8EEF7]">Trạng thái Kỹ thuật</h2>
                  <p className="text-xs text-slate-500 dark:text-[#A6B4C8]">Thông số môi trường vận hành</p>
                </div>
              </div>

              <div className="mt-5 space-y-3.5 text-xs">
                <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-[#2A3A50]/60">
                  <span className="text-slate-500 dark:text-[#A6B4C8]">Hệ thống Backend</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Spring Boot 3.5 (v{systemDiag.appVersion || '1.0.0'})
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-[#2A3A50]/60">
                  <span className="text-slate-500 dark:text-[#A6B4C8]">Cơ sở dữ liệu</span>
                  <span className="font-semibold text-slate-700 dark:text-[#E8EEF7] flex items-center gap-1.5">
                    <Database size={13} className="text-sky-500" />
                    {systemDiag.dbVersion || 'PostgreSQL 16 (Port 5432)'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-[#2A3A50]/60">
                  <span className="text-slate-500 dark:text-[#A6B4C8]">Flyway Migration</span>
                  <span className="font-semibold text-slate-700 dark:text-[#E8EEF7]">V19 (Mới nhất)</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-[#2A3A50]/60">
                  <span className="text-slate-500 dark:text-[#A6B4C8]">Bảo mật & Xác thực</span>
                  <span className="font-semibold text-slate-700 dark:text-[#E8EEF7] flex items-center gap-1.5">
                    <ShieldCheck size={13} className="text-emerald-500" />
                    JWT + Spring Security 6.x
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-slate-500 dark:text-[#A6B4C8]">Múi giờ vận hành</span>
                  <span className="font-semibold text-slate-700 dark:text-[#E8EEF7]">{systemDiag.timezone || 'Asia/Ho_Chi_Minh (UTC+7)'}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-[#1C293D]/50 p-5 rounded-2xl border border-slate-200 dark:border-[#2A3A50] text-xs text-slate-600 dark:text-[#A6B4C8] leading-relaxed">
              <div className="font-bold text-[#142B4A] dark:text-[#E8EEF7] mb-1">Ghi chú vận hành</div>
              Hệ thống quản lý CH Academy chạy trên kiến trúc micro-modular tích hợp với dữ liệu PostgreSQL toàn vẹn. Mọi thay đổi cấu hình được áp dụng ngay lập tức trên toàn bộ các phiên làm việc.
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ĐỔI MẬT KHẨU CÁ NHÂN */}
      {activeTab === 'change-password' && (
        <div className="max-w-xl mx-auto bg-white dark:bg-[#151F31] p-6 sm:p-8 rounded-2xl border border-slate-200/80 dark:border-[#2A3A50] shadow-sm">
          <div className="flex items-center gap-3 pb-5 border-b border-slate-100 dark:border-[#2A3A50]">
            <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-[#38BDF8] flex items-center justify-center">
              <KeyRound size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#142B4A] dark:text-[#E8EEF7]">Đổi mật khẩu tài khoản Quản trị</h2>
              <p className="text-xs text-slate-500 dark:text-[#A6B4C8]">Cập nhật mật khẩu bảo vệ quyền truy cập trung tâm điều hành</p>
            </div>
          </div>

          <form onSubmit={handleChangePersonalPassword} className="mt-6 space-y-4">
            {pwdFeedback && (
              <div
                className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 ${
                  pwdFeedback.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                }`}
              >
                {pwdFeedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{pwdFeedback.msg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] mb-1.5">
                Mật khẩu hiện tại *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={curPassword}
                  onChange={(e) => setCurPassword(e.target.value)}
                  placeholder="Nhập mật khẩu đang sử dụng"
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-sm text-[#142B4A] dark:text-[#E8EEF7] focus:outline-hidden focus:ring-2 focus:ring-[#142B4A] dark:focus:ring-[#38BDF8]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] mb-1.5">
                Mật khẩu mới *
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Tối thiểu 8 ký tự, có hoa, thường và số"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-sm text-[#142B4A] dark:text-[#E8EEF7] focus:outline-hidden focus:ring-2 focus:ring-[#142B4A] dark:focus:ring-[#38BDF8]"
                required
              />

              {/* Password strength meter */}
              {newPassword && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 dark:text-[#A6B4C8]">Độ mạnh mật khẩu:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">{strength.text}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${strength.color}`}
                      style={{ width: `${Math.min(100, (strength.score / 6) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] mb-1.5">
                Xác nhận mật khẩu mới *
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-sm text-[#142B4A] dark:text-[#E8EEF7] focus:outline-hidden focus:ring-2 focus:ring-[#142B4A] dark:focus:ring-[#38BDF8]"
                required
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1C293D]/50 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-[#A6B4C8] space-y-1">
              <div className="font-semibold text-slate-700 dark:text-[#E8EEF7]">Yêu cầu an toàn mật khẩu:</div>
              <div>• Tối thiểu 8 ký tự</div>
              <div>• Bao gồm cả chữ hoa (A-Z) và chữ thường (a-z)</div>
              <div>• Bao gồm ít nhất một chữ số (0-9)</div>
              <div>• Không được tái sử dụng mật khẩu cũ</div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-[#2A3A50] flex justify-end">
              <button
                type="submit"
                disabled={pwdChanging}
                className="px-6 py-2.5 bg-[#142B4A] dark:bg-[#38BDF8] hover:bg-[#1D4168] dark:hover:bg-[#0284C7] text-white dark:text-[#0B1220] rounded-xl text-sm font-bold shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {pwdChanging ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock size={16} />}
                <span>{pwdChanging ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: QUẢN LÝ MẬT KHẨU & AN NINH TÀI KHOẢN (ADMIN ONLY) */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Security KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-[#151F31] border border-slate-200/80 dark:border-[#2A3A50] shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-[#A6B4C8] mb-1">
                <span>Tài khoản nhân sự</span>
                <UserCheck size={16} className="text-sky-500" />
              </div>
              <div className="text-2xl font-black text-slate-800 dark:text-[#E8EEF7]">{securityUsers.length}</div>
              <div className="text-[11px] text-slate-400 mt-1">Admin, Giảng viên, Giáo vụ</div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#151F31] border border-slate-200/80 dark:border-[#2A3A50] shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-[#A6B4C8] mb-1">
                <span>Cần đổi mật khẩu</span>
                <RotateCcw size={16} className="text-amber-500" />
              </div>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                {securityUsers.filter(u => u.mustChangePassword).length}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Buộc đổi trong lần đăng nhập tới</div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#151F31] border border-slate-200/80 dark:border-[#2A3A50] shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-[#A6B4C8] mb-1">
                <span>Tài khoản bị khóa</span>
                <Lock size={16} className="text-rose-500" />
              </div>
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
                {securityUsers.filter(u => u.isLocked).length}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Bị khóa do vi phạm hoặc thủ công</div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#151F31] border border-slate-200/80 dark:border-[#2A3A50] shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-[#A6B4C8] mb-1">
                <span>Sự kiện an ninh</span>
                <Clock size={16} className="text-indigo-500" />
              </div>
              <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                {securityAudits.length}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Đổi pass, cấp token, khóa acc</div>
            </div>
          </div>

          {/* Reset Token Modal Result */}
          {resetResult && (
            <div className="p-5 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 animate-in fade-in">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 font-bold text-sky-800 dark:text-sky-300 text-sm">
                  <CheckCircle2 size={18} />
                  <span>Mã cấp lại mật khẩu cho tài khoản: {resetResult.username}</span>
                </div>
                <button
                  onClick={() => setResetResult(null)}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  Đóng
                </button>
              </div>
              <p className="text-xs text-slate-600 dark:text-[#A6B4C8] mb-3">
                Mã bảo mật có hiệu lực trong 24 giờ. Vui lòng sao chép và chuyển giao cho giảng viên / nhân sự một cách an toàn.
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={resetResult.resetToken}
                  className="w-full px-3 py-2 rounded-xl border border-sky-300 dark:border-sky-700 bg-white dark:bg-[#0E1A30] font-mono text-xs font-bold text-sky-900 dark:text-sky-200 select-all"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(resetResult.resetToken)}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition flex-shrink-0"
                >
                  {copiedToken ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedToken ? 'Đã sao chép' : 'Sao chép mã'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Filter & Search Bar */}
          <div className="bg-white dark:bg-[#151F31] p-4 rounded-2xl border border-slate-200/80 dark:border-[#2A3A50] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Tìm theo tên đăng nhập, họ tên, email..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-slate-50/50 dark:bg-[#1C293D] text-xs text-[#142B4A] dark:text-[#E8EEF7] focus:outline-hidden focus:ring-2 focus:ring-[#142B4A] dark:focus:ring-[#38BDF8]"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-slate-50/50 dark:bg-[#1C293D] text-xs font-semibold text-slate-700 dark:text-[#E8EEF7]"
              >
                <option value="">Tất cả vai trò</option>
                <option value="SUPER_ADMIN">Quản trị cấp cao</option>
                <option value="ADMIN">Quản trị viên</option>
                <option value="TEACHER">Giảng viên</option>
                <option value="ACADEMIC_STAFF">Cán bộ giáo vụ</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-slate-50/50 dark:bg-[#1C293D] text-xs font-semibold text-slate-700 dark:text-[#E8EEF7]"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="ACTIVE">Bình thường</option>
                <option value="LOCKED">Đang bị khóa</option>
              </select>

              <button
                type="button"
                onClick={fetchSecurityData}
                className="p-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] text-slate-600 dark:text-[#A6B4C8] hover:bg-slate-100 dark:hover:bg-[#1C293D]"
                title="Làm mới danh sách"
              >
                <RefreshCw size={15} className={securityLoading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Security User Table */}
          <div className="bg-white dark:bg-[#151F31] rounded-2xl border border-slate-200/80 dark:border-[#2A3A50] shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-[#2A3A50] flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#142B4A] dark:text-[#E8EEF7]">
                Danh sách Tài khoản Quản trị & Giảng viên ({securityUsers.length})
              </h2>
              <span className="text-xs text-slate-500 dark:text-[#A6B4C8]">
                Kiểm soát mật khẩu và trạng thái đăng nhập
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-[#1C293D] border-b border-slate-200/80 dark:border-[#2A3A50] text-slate-500 dark:text-[#A6B4C8] uppercase tracking-wider font-bold">
                  <tr>
                    <th className="px-6 py-3">Tài khoản & Họ tên</th>
                    <th className="px-4 py-3">Vai trò</th>
                    <th className="px-4 py-3">Đổi pass lần cuối</th>
                    <th className="px-4 py-3">Nguồn đặt lại</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-6 py-3 text-right">Thao tác an ninh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {securityLoading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-slate-400">
                        Đang tải danh sách an ninh tài khoản...
                      </td>
                    </tr>
                  ) : securityUsers.length > 0 ? (
                    securityUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-[#1C293D]/50 transition">
                        <td className="px-6 py-3.5">
                          <div className="font-bold text-slate-900 dark:text-[#E8EEF7]">{u.fullName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">@{u.username} • {u.email}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-[11px] text-slate-600 dark:text-[#A6B4C8]">
                          {u.lastPasswordChangedAt
                            ? new Date(u.lastPasswordChangedAt).toLocaleDateString('vi-VN')
                            : 'Chưa cập nhật'}
                        </td>
                        <td className="px-4 py-3.5 text-[11px] text-slate-500 dark:text-[#A6B4C8]">
                          {u.passwordResetSource || 'Khởi tạo hệ thống'}
                        </td>
                        <td className="px-4 py-3.5">
                          {u.isLocked ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                              <Lock size={10} />
                              <span>Bị khóa</span>
                            </span>
                          ) : u.mustChangePassword ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                              <RotateCcw size={10} />
                              <span>Cần đổi pass</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                              <CheckCircle2 size={10} />
                              <span>Hoạt động</span>
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleRequirePasswordChange(u.id, u.username)}
                            className="px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-[11px] font-semibold hover:bg-amber-100 transition shadow-2xs cursor-pointer"
                            title="Buộc người dùng đổi mật khẩu trong lần đăng nhập tới"
                          >
                            Yêu cầu đổi
                          </button>
                          <button
                            type="button"
                            onClick={() => handleResetPassword(u.id)}
                            className="px-2.5 py-1 rounded-lg border border-sky-300 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 text-[11px] font-semibold hover:bg-sky-100 transition shadow-2xs cursor-pointer"
                            title="Cấp mã đặt lại mật khẩu an toàn 24h"
                          >
                            Cấp lại mã
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleLock(u.id, u.username, u.isLocked)}
                            className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition shadow-2xs cursor-pointer ${
                              u.isLocked
                                ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                                : 'border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100'
                            }`}
                            title={u.isLocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản khẩn cấp'}
                          >
                            {u.isLocked ? 'Mở khóa' : 'Khóa'}
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                        Không tìm thấy tài khoản nhân sự phù hợp điều kiện lọc.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Security Audit Log Table */}
          <div className="bg-white dark:bg-[#151F31] rounded-2xl border border-slate-200/80 dark:border-[#2A3A50] shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-[#2A3A50] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-slate-400" />
                <h2 className="text-sm font-bold text-[#142B4A] dark:text-[#E8EEF7]">
                  Nhật ký Sự kiện An ninh (Security Audit Trail)
                </h2>
              </div>
              <span className="text-xs text-slate-400">
                Lưu vết thay đổi mật khẩu & quyền tài khoản
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-[#1C293D] border-b border-slate-200/80 dark:border-[#2A3A50] text-slate-500 dark:text-[#A6B4C8] uppercase tracking-wider font-bold">
                  <tr>
                    <th className="px-6 py-3">Thời gian</th>
                    <th className="px-4 py-3">Tài khoản thao tác</th>
                    <th className="px-4 py-3">Hành động</th>
                    <th className="px-6 py-3">Chi tiết sự kiện</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {securityAudits.length > 0 ? (
                    securityAudits.slice(0, 15).map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-[#1C293D]/50 transition">
                        <td className="px-6 py-3 font-mono text-[11px] text-slate-500 dark:text-[#A6B4C8]">
                          {new Date(a.createdAt).toLocaleString('vi-VN')}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-800 dark:text-[#E8EEF7]">
                          {a.username || 'System'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            a.action.includes('FAIL') || a.action.includes('LOCK')
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          }`}>
                            {a.action}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-slate-600 dark:text-[#A6B4C8] truncate max-w-md font-mono text-[11px]">
                          {a.details || 'Không có chi tiết'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-6 text-center text-slate-400">
                        Chưa có sự kiện an ninh nào được ghi nhận.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default SettingsPage
