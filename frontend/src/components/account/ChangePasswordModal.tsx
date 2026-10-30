import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  X,
  ShieldCheck,
  Check
} from 'lucide-react'
import { authApi } from '../../api/auth'

interface ChangePasswordModalProps {
  isOpen: boolean
  onClose: () => void
  userFullName?: string
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  userFullName
}) => {
  const [curPassword, setCurPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showCur, setShowCur] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setCurPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setErrorMsg(null)
      setSuccessMsg(null)
      setShowCur(false)
      setShowNew(false)
      setShowConfirm(false)
    }
  }, [isOpen])

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

  // Password rules validation
  const hasMinLength = newPassword.length >= 8
  const hasUpper = /[A-Z]/.test(newPassword)
  const hasLower = /[a-z]/.test(newPassword)
  const hasDigit = /[0-9]/.test(newPassword)
  const matchesConfirm = newPassword === confirmPassword && confirmPassword.length > 0
  const isDifferent = !curPassword || newPassword !== curPassword

  const isFormValid =
    curPassword.length > 0 &&
    hasMinLength &&
    hasUpper &&
    hasLower &&
    hasDigit &&
    matchesConfirm &&
    isDifferent

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)

    if (!curPassword || !newPassword || !confirmPassword) {
      setErrorMsg('Vui lòng điền đầy đủ tất cả các trường mật khẩu.')
      return
    }

    if (!hasMinLength || !hasUpper || !hasLower || !hasDigit) {
      setErrorMsg('Mật khẩu mới chưa đáp ứng đầy đủ chính sách bảo mật.')
      return
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không trùng khớp với mật khẩu mới.')
      return
    }

    if (curPassword === newPassword) {
      setErrorMsg('Mật khẩu mới không được trùng với mật khẩu hiện tại.')
      return
    }

    try {
      setLoading(true)
      const res = await authApi.changePassword(curPassword, newPassword)
      if (res.success) {
        setSuccessMsg('Đổi mật khẩu thành công! Tài khoản của bạn đã được bảo vệ với mật khẩu mới.')
        setCurPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setTimeout(() => {
          onClose()
        }, 1800)
      } else {
        setErrorMsg(res.message || 'Đổi mật khẩu không thành công. Vui lòng kiểm tra lại mật khẩu hiện tại.')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi cập nhật mật khẩu. Vui lòng kiểm tra lại kết nối mạng hoặc thử lại sau.'
      setErrorMsg(msg)
    } finally {
      setLoading(false)
    }
  }

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
          className="relative w-full max-w-md bg-white dark:bg-[#151F31] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#2A3A50] overflow-hidden flex flex-col max-h-[calc(100vh-2.5rem)] text-left [data-theme=glass]_&:bg-[#0B1528]/85 [data-theme=glass]_&:border-white/20 [data-theme=glass]_&:backdrop-blur-2xl animate-in zoom-in-95 duration-150"
          role="dialog"
          aria-modal="true"
          aria-labelledby="change-pwd-title"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 dark:border-[#223147] flex items-center justify-between bg-gradient-to-r from-slate-50 to-indigo-50/30 dark:from-[#172338] dark:to-[#1a2b45] [data-theme=glass]_&:bg-transparent shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 dark:bg-indigo-400/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 id="change-pwd-title" className="text-base font-bold text-slate-800 dark:text-white">
                Đổi mật khẩu tài khoản
              </h2>
              <p className="text-xs text-slate-500 dark:text-[#A6B4C8]">
                {userFullName ? `Tài khoản: ${userFullName}` : 'Cập nhật thông tin đăng nhập an toàn'}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto overscroll-contain flex-1">
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

          {/* Current Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-[#E8EEF7] mb-1.5">
              Mật khẩu hiện tại <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showCur ? 'text' : 'password'}
                value={curPassword}
                onChange={(e) => setCurPassword(e.target.value)}
                placeholder="Nhập mật khẩu đang dùng"
                className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-slate-800 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition outline-none [data-theme=glass]_&:bg-white/10"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowCur(!showCur)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                tabIndex={-1}
              >
                {showCur ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-[#E8EEF7] mb-1.5">
              Mật khẩu mới <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Tối thiểu 8 ký tự, có hoa, thường & số"
                className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-slate-800 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition outline-none [data-theme=glass]_&:bg-white/10"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                tabIndex={-1}
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-[#E8EEF7] mb-1.5">
              Xác nhận mật khẩu mới <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới vừa đặt"
                className={`w-full pl-9 pr-10 py-2.5 rounded-xl border text-xs focus:ring-2 focus:ring-indigo-500/30 transition outline-none bg-white dark:bg-[#1C293D] text-slate-800 dark:text-white [data-theme=glass]_&:bg-white/10 ${
                  confirmPassword && !matchesConfirm
                    ? 'border-rose-400 dark:border-rose-500 focus:border-rose-500'
                    : 'border-slate-200 dark:border-[#2A3A50] focus:border-indigo-500'
                }`}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Password Security Criteria */}
          <div className="p-3 bg-slate-50/80 dark:bg-[#121B2A]/70 rounded-xl border border-slate-100 dark:border-[#223147] space-y-1.5">
            <div className="text-[11px] font-bold text-slate-600 dark:text-[#A6B4C8]">
              Yêu cầu bảo mật mật khẩu:
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <span className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                <Check className={`w-3.5 h-3.5 ${hasMinLength ? 'opacity-100' : 'opacity-40'}`} />
                Tối thiểu 8 ký tự
              </span>
              <span className={`flex items-center gap-1.5 ${hasUpper ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                <Check className={`w-3.5 h-3.5 ${hasUpper ? 'opacity-100' : 'opacity-40'}`} />
                Có chữ in hoa (A-Z)
              </span>
              <span className={`flex items-center gap-1.5 ${hasLower ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                <Check className={`w-3.5 h-3.5 ${hasLower ? 'opacity-100' : 'opacity-40'}`} />
                Có chữ thường (a-z)
              </span>
              <span className={`flex items-center gap-1.5 ${hasDigit ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                <Check className={`w-3.5 h-3.5 ${hasDigit ? 'opacity-100' : 'opacity-40'}`} />
                Có chữ số (0-9)
              </span>
              <span className={`col-span-2 flex items-center gap-1.5 ${matchesConfirm ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                <Check className={`w-3.5 h-3.5 ${matchesConfirm ? 'opacity-100' : 'opacity-40'}`} />
                Mật khẩu xác nhận trùng khớp
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] text-xs font-semibold text-slate-600 dark:text-[#A6B4C8] hover:bg-slate-100 dark:hover:bg-[#1E2B40] transition"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading || !isFormValid}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Cập nhật mật khẩu</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
)

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent
}
