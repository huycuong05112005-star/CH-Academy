import React from 'react'
import { Link } from 'react-router-dom'
import { GraduationCap, LogIn } from 'lucide-react'
import { ThemeSwitcher } from '../ui/ThemeSwitcher'

export const PublicNavbar: React.FC = () => {
  return (
    <header
      role="navigation"
      aria-label="Điều hướng chính"
      className="bg-white dark:bg-[#101B2D] border-b border-slate-200 dark:border-[#2A3A50] sticky top-0 z-50 shadow-xs transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link
          to="/"
          aria-label="CH Academy - Trang chủ"
          className="flex items-center gap-3 no-underline group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#142B4A] dark:bg-[#38BDF8] text-white dark:text-[#0B1220] flex items-center justify-center shadow-xs transition group-hover:scale-105">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-lg font-bold text-[#142B4A] dark:text-[#E8EEF7] leading-tight tracking-tight">
              CH ACADEMY
            </div>
            <div className="text-[10px] text-slate-500 dark:text-[#A6B4C8] font-semibold tracking-wider">
              TRUNG TÂM GIÁO DỤC CHẤT LƯỢNG CAO
            </div>
          </div>
        </Link>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-700 dark:text-[#E8EEF7]">
          <Link to="/" className="hover:text-[#142B4A] dark:hover:text-[#38BDF8] transition">
            Trang chủ
          </Link>
          <Link to="/courses" className="hover:text-[#142B4A] dark:hover:text-[#38BDF8] transition">
            Khóa học
          </Link>
          <Link to="/about" className="hover:text-[#142B4A] dark:hover:text-[#38BDF8] transition">
            Về chúng tôi
          </Link>
          <Link to="/contact" className="hover:text-[#142B4A] dark:hover:text-[#38BDF8] transition">
            Liên hệ
          </Link>
        </nav>

        {/* Action CTAs & ThemeSwitcher */}
        <div className="flex items-center gap-3">
          <ThemeSwitcher />
          
          <Link
            to="/login"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#151F31] text-[#142B4A] dark:text-[#E8EEF7] hover:bg-slate-50 dark:hover:bg-[#1C293D] font-semibold text-xs shadow-xs transition"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Đăng nhập</span>
          </Link>
          <a
            href="#tu-van"
            className="hidden sm:inline-flex px-4 py-2 rounded-xl bg-[#142B4A] dark:bg-[#38BDF8] text-white dark:text-[#0B1220] hover:bg-[#1D4168] dark:hover:bg-[#0284C7] font-semibold text-xs shadow-sm transition"
          >
            Đăng ký tư vấn
          </a>
        </div>
      </div>
    </header>
  )
}
export default PublicNavbar
