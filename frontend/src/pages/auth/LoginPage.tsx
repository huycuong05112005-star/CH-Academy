import React, { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  AlertCircle,
  GraduationCap,
  ArrowLeft,
  Shield,
  Layers,
  Cpu,
  CheckCircle2
} from 'lucide-react'
import { ThemeSwitcher } from '../../components/ui/ThemeSwitcher'
import { AmbientGlow } from '../../components/ui/AmbientGlow'
import { KnowledgeMatrix3D } from '../../components/3d/KnowledgeMatrix3D'

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [oauthModal, setOauthModal] = useState<{ open: boolean; provider: string } | null>(null)

  const { login, user, isAuthenticated, isLoading: authLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const rawFrom = (location.state as { from?: { pathname: string } })?.from?.pathname
  const from = rawFrom && rawFrom !== '/login' ? rawFrom : '/admin'

  // Tự động điều hướng nếu đã có phiên đăng nhập hợp lệ
  React.useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      const isTeacher =
        user.roles?.includes('TEACHER') &&
        !user.roles?.includes('ADMIN') &&
        !user.roles?.includes('SUPER_ADMIN')
      const isStudentOnly =
        user.roles?.includes('STUDENT') &&
        !user.roles?.includes('ADMIN') &&
        !user.roles?.includes('SUPER_ADMIN') &&
        !user.roles?.includes('ACADEMIC_ADMIN')

      if (isTeacher) {
        navigate('/teacher', { replace: true })
      } else if (isStudentOnly) {
        navigate('/student', { replace: true })
      } else {
        navigate(from, { replace: true })
      }
    }
  }, [authLoading, isAuthenticated, user, navigate, from])

  const executeLogin = async (targetUser: string, targetPass: string) => {
    if (isSubmitting) return

    setError(null)

    if (!targetUser.trim() || !targetPass) {
      setError('Vui lòng điền đầy đủ tên đăng nhập và mật khẩu')
      return
    }

    setIsSubmitting(true)
    try {
      const loggedUser = await login({ username: targetUser.trim(), password: targetPass })
      const isTeacher =
        loggedUser.roles?.includes('TEACHER') &&
        !loggedUser.roles?.includes('ADMIN') &&
        !loggedUser.roles?.includes('SUPER_ADMIN')
      const isStudentOnly =
        loggedUser.roles?.includes('STUDENT') &&
        !loggedUser.roles?.includes('ADMIN') &&
        !loggedUser.roles?.includes('SUPER_ADMIN') &&
        !loggedUser.roles?.includes('ACADEMIC_ADMIN')

      if (isTeacher) {
        navigate('/teacher', { replace: true })
      } else if (isStudentOnly) {
        navigate('/student', { replace: true })
      } else {
        navigate(from, { replace: true })
      }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return
    await executeLogin(username, password)
  }

  const handleOAuthLogin = (provider: 'Google' | 'Facebook') => {
    setOauthModal({ open: true, provider })
  }


  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-[#0B1220] p-4 sm:p-6 lg:p-10 font-sans transition-colors relative overflow-hidden">
      {/* Ambient depth lighting */}
      <AmbientGlow className="top-10 -left-20 w-96 h-96" variant="cyan" />
      <AmbientGlow className="bottom-10 -right-20 w-[30rem] h-[30rem]" variant="primary" />

      {/* Top Navigation Bar */}
      <header className="w-full max-w-7xl mx-auto flex items-center justify-between z-20">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/70 dark:bg-[#151F31]/70 backdrop-blur-md border border-slate-200/80 dark:border-[#2A3A50] text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] hover:border-blue-500/40 dark:hover:border-sky-400/40 shadow-xs hover-lift transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Về trang chủ</span>
        </Link>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/60 dark:bg-[#151F31]/60 backdrop-blur-md border border-slate-200/80 dark:border-[#2A3A50] text-xs font-semibold text-slate-600 dark:text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Hệ thống trực tuyến v2.0</span>
          </div>
          <ThemeSwitcher />
        </div>
      </header>

      {/* Main Container: 2-Column Desktop Grid with 3D Experience */}
      <main className="w-full max-w-7xl mx-auto my-auto py-6 sm:py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center z-10">
        {/* Left Column: 3D Knowledge Core & Brand Showcase */}
        <div className="lg:col-span-6 xl:col-span-7 flex flex-col justify-center space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase bg-blue-500/10 dark:bg-sky-500/15 text-blue-700 dark:text-[#38BDF8] border border-blue-500/20 dark:border-sky-400/30 w-fit mx-auto lg:mx-0 shadow-2xs">
            <Cpu className="w-3.5 h-3.5 animate-pulse" />
            <span>Next-Generation 3D EdTech Platform</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0F243E] dark:text-[#F8FAFC] leading-tight">
            Nền tảng Quản trị & <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600 dark:from-[#38BDF8] dark:via-cyan-300 dark:to-indigo-400 bg-clip-text text-transparent">
              Khảo thí Giáo dục Trực tuyến
            </span>
          </h1>

          <p className="text-slate-600 dark:text-[#A6B4C8] text-sm sm:text-base max-w-xl mx-auto lg:mx-0 leading-relaxed">
            Hệ sinh thái đào tạo thông minh với phòng thi trực tuyến đa thiết bị, phân tích chất lượng buổi học tự động, và trải nghiệm không gian 3D tương tác.
          </p>

          {/* Interactive 3D Canvas Showcase */}
          <div className="relative w-full h-64 sm:h-72 lg:h-80 rounded-3xl overflow-hidden bg-gradient-to-b from-blue-900/5 to-slate-900/10 dark:from-slate-900/40 dark:to-[#0B1220]/80 border border-slate-200/60 dark:border-[#2A3A50] shadow-inner flex items-center justify-center group">
            <KnowledgeMatrix3D density="rich" className="w-full h-full" />
            <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 pointer-events-none select-none">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-sky-500" />
                <span>3D Knowledge Matrix</span>
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Realtime Telemetry
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: High-Grade Glassmorphic Login Card */}
        <div className="lg:col-span-6 xl:col-span-5 flex justify-center">
          <div className="w-full max-w-md glass-specular rounded-3xl p-6 sm:p-8 border border-white/60 dark:border-[#2A3A50] shadow-2xl relative z-10 transition-all hover:shadow-cyan-500/10">
            {/* Header Badge */}
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0F243E] to-blue-700 dark:from-[#38BDF8] dark:to-cyan-400 inline-flex items-center justify-center mb-3 text-white dark:text-[#0B1220] shadow-md hover-glow transition-all">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0F243E] dark:text-[#E8EEF7]">
                CH Academy — Đăng nhập Hệ thống
              </h2>
              <p className="text-xs text-slate-500 dark:text-[#A6B4C8] mt-1">
                Truy cập cổng thông tin CH Academy với tài khoản được cấp
              </p>
            </div>

            {/* Error Notification */}
            {error && (
              <div
                role="alert"
                className="flex items-center gap-2.5 p-3 mb-5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold animate-in fade-in"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            {/* Social OAuth SSO Section */}
            <div className="space-y-2.5 mb-5">
              <button
                type="button"
                onClick={() => handleOAuthLogin('Google')}
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#152338] hover:bg-slate-50 dark:hover:bg-[#1B2F4C] text-slate-700 dark:text-[#E8EEF7] text-xs font-bold transition shadow-2xs flex items-center justify-center gap-2.5 cursor-pointer hover-lift"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Đăng nhập bằng Google</span>
              </button>

              <button
                type="button"
                onClick={() => handleOAuthLogin('Facebook')}
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#152338] hover:bg-slate-50 dark:hover:bg-[#1B2F4C] text-slate-700 dark:text-[#E8EEF7] text-xs font-bold transition shadow-2xs flex items-center justify-center gap-2.5 cursor-pointer hover-lift"
              >
                <svg className="w-4 h-4 fill-[#1877F2]" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span>Đăng nhập bằng Facebook</span>
              </button>
            </div>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-[#2A3A50]"></div>
              </div>
              <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
                <span className="px-3 bg-white dark:bg-[#121E31] text-slate-400 font-semibold">
                  hoặc đăng nhập bằng tài khoản
                </span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="username"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-[#A6B4C8] mb-1.5"
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
                    placeholder="Nhập username hoặc email"
                    disabled={isSubmitting}
                    autoFocus
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white/70 dark:bg-[#1C293D]/80 text-sm text-[#0F243E] dark:text-[#E8EEF7] placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#2563EB] dark:focus:ring-[#38BDF8] transition shadow-xs"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-[#A6B4C8] mb-1.5"
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
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white/70 dark:bg-[#1C293D]/80 text-sm text-[#0F243E] dark:text-[#E8EEF7] placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#2563EB] dark:focus:ring-[#38BDF8] transition shadow-xs"
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
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#0F243E] via-blue-700 to-[#173557] dark:from-[#38BDF8] dark:to-[#0284C7] hover:opacity-95 text-white dark:text-[#0B1220] font-bold text-sm shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer hover-lift"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    <span>Đang xác thực...</span>
                  </>
                ) : (
                  <span>Đăng nhập hệ thống</span>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* OAuth Notice Modal */}
      {oauthModal?.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#152338] border border-slate-200 dark:border-[#2A3A50] rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-[#38BDF8] mx-auto flex items-center justify-center mb-4">
              <Shield size={24} />
            </div>
            <h3 className="text-base font-bold text-center text-slate-900 dark:text-[#E8EEF7] mb-2">
              Đăng nhập một chạm ({oauthModal.provider})
            </h3>
            <p className="text-xs text-slate-600 dark:text-[#A6B4C8] text-center leading-relaxed mb-6">
              Hệ thống xác thực liên kết Google / Facebook SSO dành riêng cho Học viên (Student). 
              Trong môi trường triển khai thực tế, tính năng này được kết nối trực tiếp với <strong>Google Cloud Console & Meta Developer App ID</strong> đã thẩm định bảo mật.
              <br /><br />
              Nếu bạn là Quản trị viên hoặc Giảng viên, vui lòng đăng nhập trực tiếp bằng tên đăng nhập và mật khẩu được cấp.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setOauthModal(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-[#38BDF8] dark:text-[#0B1220] text-white text-xs font-bold shadow-sm transition hover:opacity-90"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer System Telemetry */}
      <footer className="w-full max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-4 border-t border-slate-200/60 dark:border-[#2A3A50]/60 z-20">
        <div>© 2026 CH Academy. Hệ thống Quản trị & Đào tạo Trực tuyến. Bảo lưu mọi quyền.</div>
        <div className="font-mono text-[11px] mt-1 sm:mt-0">Tiêu chuẩn An ninh ISO/IEC 27001 & SOC 2 Ready</div>
      </footer>
    </div>
  )
}
export default LoginPage
