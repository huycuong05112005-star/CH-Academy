import React, { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Lock, User as UserIcon, Eye, EyeOff, AlertCircle, GraduationCap, ArrowLeft } from 'lucide-react'
import { ThemeSwitcher } from '../../components/ui/ThemeSwitcher'

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/admin'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!username.trim() || !password) {
      setError('Vui lòng điền đầy đủ tên đăng nhập và mật khẩu')
      return
    }

    setIsSubmitting(true)
    try {
      await login({ username: username.trim(), password })
      navigate(from, { replace: true })
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0B1220] p-4 font-sans transition-colors relative">
      {/* Top bar with back to home & theme switcher */}
      <div className="absolute top-5 left-5 right-5 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-[#A6B4C8] hover:text-[#142B4A] dark:hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Về trang chủ</span>
        </Link>
        <ThemeSwitcher />
      </div>

      <div className="w-full max-w-md bg-white dark:bg-[#151F31] rounded-3xl shadow-xl border border-slate-200/80 dark:border-[#2A3A50] p-8 sm:p-10 animate-in fade-in duration-200">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[#142B4A] dark:bg-[#38BDF8] inline-flex items-center justify-center mb-4 text-white dark:text-[#0B1220] shadow-md">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#142B4A] dark:text-[#E8EEF7]">
            CH Academy
          </h1>
          <p className="text-slate-500 dark:text-[#A6B4C8] text-sm mt-1">
            Hệ thống quản lý trung tâm giáo dục
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            role="alert"
            className="flex items-center gap-3 p-3.5 mb-6 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm animate-in fade-in"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
            <span className="font-medium text-xs sm:text-sm">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-[#A6B4C8] mb-1.5"
            >
              Tên đăng nhập
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập tên đăng nhập"
                disabled={isSubmitting}
                autoFocus
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-slate-50/50 dark:bg-[#1C293D] text-sm text-[#142B4A] dark:text-[#E8EEF7] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#142B4A] dark:focus:ring-[#38BDF8] transition"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-[#A6B4C8] mb-1.5"
            >
              Mật khẩu
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                disabled={isSubmitting}
                className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-slate-50/50 dark:bg-[#1C293D] text-sm text-[#142B4A] dark:text-[#E8EEF7] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#142B4A] dark:focus:ring-[#38BDF8] transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-[#142B4A] dark:bg-[#38BDF8] hover:bg-[#1D4168] dark:hover:bg-[#0284C7] text-white dark:text-[#0B1220] font-semibold text-sm shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? 'Đang xác thực...' : 'Đăng nhập'}
          </button>
        </form>

        {/* Demo Tip */}
        <div className="mt-8 p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1C293D]/60 border border-slate-200/60 dark:border-[#2A3A50] text-center text-xs text-slate-500 dark:text-[#A6B4C8]">
          <div className="font-semibold text-slate-700 dark:text-[#E8EEF7] mb-1">
            💡 Tài khoản Quản trị viên mặc định:
          </div>
          <div>
            Tên đăng nhập: <code className="font-mono bg-white dark:bg-[#151F31] px-1.5 py-0.5 rounded border border-slate-200 dark:border-[#2A3A50] text-[#142B4A] dark:text-[#38BDF8]">admin</code> | Mật khẩu: <code className="font-mono bg-white dark:bg-[#151F31] px-1.5 py-0.5 rounded border border-slate-200 dark:border-[#2A3A50] text-[#142B4A] dark:text-[#38BDF8]">Admin@123456</code>
          </div>
        </div>
      </div>
    </div>
  )
}
