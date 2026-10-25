import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { GraduationCap, LogIn, Menu, X } from 'lucide-react'
import { ThemeSwitcher } from '../ui/ThemeSwitcher'
import { useSettings } from '../../context/SettingsContext'

export const PublicNavbar: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { settings } = useSettings()

  return (
    <header
      role="navigation"
      aria-label="Điều hướng chính"
      className="bg-white/95 dark:bg-[#101B2D]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-[#2A3A50] sticky top-0 z-50 shadow-xs transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link
          to="/"
          aria-label={`${settings.shortName} - Trang chủ`}
          className="flex items-center gap-3 no-underline group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#0F243E] dark:bg-[#38BDF8] text-white dark:text-[#0B1220] flex items-center justify-center shadow-xs transition-transform group-hover:scale-105">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-lg font-extrabold text-[#0F243E] dark:text-[#F8FAFC] leading-tight tracking-tight uppercase">
              {settings.shortName}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-[#94A3B8] font-semibold tracking-wider uppercase">
              Hệ Thống Đào Tạo Chuẩn Hóa
            </div>
          </div>
        </Link>

        {/* Navigation links (Desktop) */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-700 dark:text-[#E8EEF7]">
          <Link to="/" className="hover:text-[#2563EB] dark:hover:text-[#38BDF8] transition-colors">
            Trang chủ
          </Link>
          <Link to="/courses" className="hover:text-[#2563EB] dark:hover:text-[#38BDF8] transition-colors">
            Khóa học
          </Link>
          <Link to="/about" className="hover:text-[#2563EB] dark:hover:text-[#38BDF8] transition-colors">
            Về chúng tôi
          </Link>
          <Link to="/contact" className="hover:text-[#2563EB] dark:hover:text-[#38BDF8] transition-colors">
            Liên hệ
          </Link>
        </nav>

        {/* Action CTAs & ThemeSwitcher */}
        <div className="flex items-center gap-2.5">
          <ThemeSwitcher />
          
          <Link
            to="/login"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#151F31] text-[#0F243E] dark:text-[#E8EEF7] hover:bg-slate-50 dark:hover:bg-[#1C293D] font-semibold text-xs shadow-xs transition-colors"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Đăng nhập</span>
          </Link>
          <a
            href="/#tu-van"
            className="hidden sm:inline-flex px-4 py-2 rounded-xl bg-[#0F243E] dark:bg-[#38BDF8] text-white dark:text-[#0B1220] hover:bg-[#173557] dark:hover:bg-[#0284C7] font-semibold text-xs shadow-sm transition-colors"
          >
            Đăng ký tư vấn
          </a>

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg border border-slate-200 dark:border-[#2A3A50] text-slate-700 dark:text-[#E8EEF7] hover:bg-slate-100 dark:hover:bg-[#1C293D] md:hidden"
            aria-label="Mở menu di động"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#101B2D] px-4 pt-3 pb-5 space-y-2 animate-slide-down shadow-lg">
          <Link
            to="/"
            onClick={() => setMobileOpen(false)}
            className="block px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-800 dark:text-[#E8EEF7] hover:bg-slate-100 dark:hover:bg-[#151F31]"
          >
            Trang chủ
          </Link>
          <Link
            to="/courses"
            onClick={() => setMobileOpen(false)}
            className="block px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-800 dark:text-[#E8EEF7] hover:bg-slate-100 dark:hover:bg-[#151F31]"
          >
            Khóa học đào tạo
          </Link>
          <Link
            to="/about"
            onClick={() => setMobileOpen(false)}
            className="block px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-800 dark:text-[#E8EEF7] hover:bg-slate-100 dark:hover:bg-[#151F31]"
          >
            Về chúng tôi & Tầm nhìn
          </Link>
          <Link
            to="/contact"
            onClick={() => setMobileOpen(false)}
            className="block px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-800 dark:text-[#E8EEF7] hover:bg-slate-100 dark:hover:bg-[#151F31]"
          >
            Liên hệ & Hỗ trợ
          </Link>
          <div className="pt-2">
            <a
              href="/#tu-van"
              onClick={() => setMobileOpen(false)}
              className="block text-center w-full py-2.5 rounded-xl bg-[#0F243E] dark:bg-[#38BDF8] text-white dark:text-[#0B1220] font-semibold text-sm"
            >
              Đăng ký tư vấn tuyển sinh
            </a>
          </div>
        </div>
      )}
    </header>
  )
}
export default PublicNavbar

