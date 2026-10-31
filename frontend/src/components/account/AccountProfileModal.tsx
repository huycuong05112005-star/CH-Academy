import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  User as UserIcon,
  Mail,
  Phone,
  Shield,
  Clock,
  Sparkles,
  Camera,
  CheckCircle2,
  AlertCircle,
  X,
  KeyRound,
  GraduationCap,
  BookOpen,
  Calendar,
  Save,
  Upload,
  Trash2,
  RefreshCw
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { authApi } from '../../api/auth'
import { filesApi } from '../../api/files'
import type { User } from '../../types/auth'

interface AccountProfileModalProps {
  isOpen: boolean
  onClose: () => void
  onOpenChangePassword?: () => void
  portalRole: 'admin' | 'teacher' | 'student'
  userCode?: string
  extraProfile?: {
    specialization?: string
    bio?: string
    targetType?: string
    studentCode?: string
    teacherCode?: string
    guardiansCount?: number
  }
}

export const AccountProfileModal: React.FC<AccountProfileModalProps> = ({
  isOpen,
  onClose,
  onOpenChangePassword,
  portalRole,
  userCode,
  extraProfile
}) => {
  const { user, updateUser } = useAuth()

  const [fullName, setFullName] = useState(user?.fullName || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '')
  const [specialization, setSpecialization] = useState(extraProfile?.specialization || '')
  const [bio, setBio] = useState(extraProfile?.bio || '')

  const [imgError, setImgError] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && user) {
      setFullName(user.fullName || '')
      setPhone(user.phone || '')
      setAvatarUrl(user.avatarUrl || '')
      setSpecialization(extraProfile?.specialization || '')
      setBio(extraProfile?.bio || '')
      setImgError(false)
      setErrorMsg(null)
      setSuccessMsg(null)
    }
  }, [isOpen, user, extraProfile])

  // Reset imgError when avatarUrl changes
  useEffect(() => {
    setImgError(false)
  }, [avatarUrl])

  // Escape key handler
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

  // Helpers
  const getRoleLabel = () => {
    if (portalRole === 'admin') return 'Quản trị viên Trung tâm'
    if (portalRole === 'teacher') return 'Giảng viên CH Academy'
    return 'Học viên CH Academy'
  }

  const getRoleBadgeClass = () => {
    if (portalRole === 'admin') return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900/60'
    if (portalRole === 'teacher') return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900/60'
    return 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-[#38BDF8] border-sky-200 dark:border-sky-900/60'
  }

  const validatePhone = (val: string) => {
    if (!val || val.trim() === '') return true
    return /^(0|\+84)[0-9]{9,10}$/.test(val.trim())
  }

  const handleAvatarFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WebP...).')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Dung lượng hình ảnh không được vượt quá 5MB.')
      return
    }

    setUploadingAvatar(true)
    setErrorMsg(null)
    try {
      const fileData = await filesApi.uploadFile(file)
      if (fileData?.fileUrl) {
        setAvatarUrl(fileData.fileUrl)
        setImgError(false)
        setSuccessMsg('Đã tải ảnh đại diện lên thành công! Nhấn "Lưu thay đổi" để áp dụng.')
      } else {
        throw new Error('Không nhận được đường dẫn ảnh từ máy chủ.')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi tải ảnh đại diện lên máy chủ.'
      setErrorMsg(msg)
    } finally {
      setUploadingAvatar(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleClearAvatar = () => {
    setAvatarUrl('')
    setImgError(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)

    if (!fullName || fullName.trim().length < 2) {
      setErrorMsg('Họ và tên bắt buộc phải có ít nhất 2 ký tự.')
      return
    }

    if (phone && !validatePhone(phone)) {
      setErrorMsg('Số điện thoại không đúng định dạng (phải có 10 số, bắt đầu bằng 0 hoặc +84).')
      return
    }

    try {
      setLoading(true)
      const res = await authApi.updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim(),
        avatarUrl: avatarUrl.trim(),
        specialization: portalRole === 'teacher' ? specialization.trim() : undefined,
        bio: portalRole === 'teacher' ? bio.trim() : undefined
      })

      if (res.success && res.data) {
        updateUser(res.data)
        setSuccessMsg('Đã lưu thông tin tài khoản thành công!')
        setTimeout(() => {
          setSuccessMsg(null)
        }, 3000)
      } else {
        setErrorMsg(res.message || 'Cập nhật thông tin thất bại.')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi lưu thông tin tài khoản. Vui lòng thử lại.'
      setErrorMsg(msg)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !user) return null

  const modalContent = (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Center Wrapper: ensures dialog stays centered and top content is never cut off on short screens */}
      <div className="flex min-h-full items-start justify-center p-3 sm:p-6 text-center">
        <div
          className="relative w-full max-w-xl bg-white dark:bg-[#151F31] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#2A3A50] overflow-hidden flex flex-col max-h-[calc(100vh-3rem)] text-left my-auto [data-theme=glass]_&:bg-[#0B1528]/85 [data-theme=glass]_&:border-white/20 [data-theme=glass]_&:backdrop-blur-2xl animate-in zoom-in-95 duration-150"
          role="dialog"
          aria-modal="true"
          aria-labelledby="account-profile-title"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Hidden File Input for Avatar Upload */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarFileUpload}
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            aria-hidden="true"
          />

          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 dark:border-[#223147] flex items-center justify-between bg-gradient-to-r from-slate-50 via-blue-50/20 to-indigo-50/30 dark:from-[#172338] dark:to-[#1a2b45] [data-theme=glass]_&:bg-transparent shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-400/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 id="account-profile-title" className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <span>Hồ sơ tài khoản cá nhân</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getRoleBadgeClass()}`}>
                  {getRoleLabel()}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-[#A6B4C8]">
                Quản lý thông tin định danh và liên hệ của bạn tại CH Academy
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

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto overscroll-contain flex-1">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{errorMsg}</div>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <div className="font-medium">{successMsg}</div>
            </div>
          )}

          {/* Avatar & Quick Identity Overview Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl bg-slate-50/80 dark:bg-[#121B2A]/60 border border-slate-100 dark:border-[#223147]">
            <div className="flex items-center gap-3.5">
              <div className="relative shrink-0">
                {avatarUrl && !imgError ? (
                  <img
                    src={avatarUrl}
                    alt={user.fullName || 'Avatar'}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-500/30 shadow-md"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#0F243E] via-indigo-900 to-sky-600 text-white font-black text-2xl flex items-center justify-center shadow-md">
                    {user.fullName?.trim()?.charAt(0)?.toUpperCase() || user.username?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
                <div
                  className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#151F31] flex items-center justify-center text-[10px] text-white"
                  title="Trạng thái: Đang hoạt động"
                >
                  ✓
                </div>
              </div>

              {/* Avatar Quick Upload Buttons */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="px-2.5 py-1.5 rounded-lg border border-indigo-300 dark:border-indigo-700/80 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-[11px] font-bold transition flex items-center gap-1.5 shadow-2xs"
                  >
                    {uploadingAvatar ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Đang tải lên...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Tải ảnh từ máy</span>
                      </>
                    )}
                  </button>
                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={handleClearAvatar}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-300 text-[11px] font-medium transition flex items-center gap-1"
                      title="Sử dụng chữ cái đầu thay vì ảnh đại diện"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Dùng chữ cái</span>
                    </button>
                  )}
                </div>
                <div className="text-[10px] text-slate-400">
                  Hỗ trợ PNG, JPG, WebP tối đa 5MB
                </div>
              </div>
            </div>

            <div className="min-w-0 sm:border-l sm:border-slate-200/80 dark:sm:border-[#223147] sm:pl-4 space-y-1">
              <div className="text-sm font-extrabold text-slate-800 dark:text-white truncate">
                {user.fullName}
              </div>
              <div className="text-xs text-slate-500 dark:text-[#A6B4C8] flex flex-wrap items-center gap-2">
                <span>@{user.username}</span>
                <span>•</span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                  {userCode || (extraProfile?.teacherCode || extraProfile?.studentCode || `ID: ${user.id}`)}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500">
                Đăng nhập gần nhất: {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('vi-VN') : 'Mới khởi tạo'}
              </div>
            </div>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-[#E8EEF7] mb-1.5">
                Họ và tên <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nhập họ và tên đầy đủ"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-slate-800 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition outline-none [data-theme=glass]_&:bg-white/10"
                required
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-[#E8EEF7] mb-1.5">
                Số điện thoại liên hệ
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-3.5 h-3.5" />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="09xx xxx xxx"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-slate-800 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition outline-none [data-theme=glass]_&:bg-white/10"
                />
              </div>
            </div>

            {/* Email (Readonly) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-[#E8EEF7] mb-1.5">
                Địa chỉ Email <span className="text-slate-400 font-normal">(Cố định định danh)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <input
                  type="email"
                  value={user.email || 'Chưa thiết lập'}
                  disabled
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200/60 dark:border-[#223147] bg-slate-100/80 dark:bg-[#121B2A]/60 text-slate-500 dark:text-slate-400 text-xs cursor-not-allowed outline-none"
                />
              </div>
            </div>

            {/* Username (Readonly) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-[#E8EEF7] mb-1.5">
                Tên đăng nhập <span className="text-slate-400 font-normal">(Không thể sửa)</span>
              </label>
              <input
                type="text"
                value={user.username}
                disabled
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/60 dark:border-[#223147] bg-slate-100/80 dark:bg-[#121B2A]/60 text-slate-500 dark:text-slate-400 text-xs font-mono cursor-not-allowed outline-none"
              />
            </div>

            {/* Avatar URL Text Input */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-[#E8EEF7] mb-1.5">
                Đường dẫn ảnh đại diện (Tùy chọn nhập URL trực tiếp)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Camera className="w-3.5 h-3.5" />
                </div>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... hoặc tải ảnh bằng nút phía trên"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-slate-800 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition outline-none [data-theme=glass]_&:bg-white/10"
                />
              </div>
            </div>

            {/* Teacher Specific Fields */}
            {portalRole === 'teacher' && (
              <>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-[#E8EEF7] mb-1.5">
                    Lĩnh vực chuyên môn giảng dạy
                  </label>
                  <input
                    type="text"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    placeholder="VD: Tiếng Anh IELTS 8.0+, Lập trình Scratch, Robotics..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-slate-800 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition outline-none [data-theme=glass]_&:bg-white/10"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-[#E8EEF7] mb-1.5">
                    Tiểu sử & Giới thiệu kinh nghiệm (Bio)
                  </label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Kinh nghiệm giảng dạy, thành tích học thuật..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-slate-800 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition outline-none resize-none [data-theme=glass]_&:bg-white/10"
                  />
                </div>
              </>
            )}

            {/* Student Specific Badges */}
            {portalRole === 'student' && extraProfile?.targetType && (
              <div className="sm:col-span-2 p-3 bg-slate-50 dark:bg-[#121B2A]/50 rounded-xl border border-slate-100 dark:border-[#223147] flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-[#A6B4C8]">Đối tượng đào tạo:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  {extraProfile.targetType === 'KID' ? 'Học viên Nhí (Kids)' : extraProfile.targetType === 'TEEN' ? 'Thiếu niên (Teens)' : 'Người lớn (Adults)'}
                </span>
              </div>
            )}
          </div>

          {/* Footer Shortcuts */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 dark:border-[#223147]">
            {onOpenChangePassword && (
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onOpenChangePassword()
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Đổi mật khẩu tài khoản</span>
              </button>
            )}

            <div className="flex items-center gap-2.5 ml-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] text-xs font-semibold text-slate-600 dark:text-[#A6B4C8] hover:bg-slate-100 dark:hover:bg-[#1E2B40] transition"
              >
                Đóng
              </button>
              <button
                type="submit"
                disabled={loading || uploadingAvatar}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 disabled:opacity-50 transition flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Lưu thay đổi</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
)

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent
}
