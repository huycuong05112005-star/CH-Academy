import React from 'react'
import { Database, Server, User, Globe, Keyboard, Laptop } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useExperience } from '../../context/ExperienceContext'

export const DesktopStatusBar: React.FC = () => {
  const { user } = useAuth()
  const {
    effectiveUsageMode,
    isNativeDesktop,
    setUsageMode,
    desktopDensity
  } = useExperience()

  if (effectiveUsageMode !== 'desktop') {
    return null
  }

  return (
    <footer className="h-6.5 w-full bg-slate-200/90 dark:bg-[#070D18]/95 [data-theme=glass]_&:bg-black/40 [data-theme=glass]_&:backdrop-blur-md border-t border-slate-300/80 dark:border-[#1E2E44] [data-theme=glass]_&:border-white/10 px-3 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 [data-theme=glass]_&:text-slate-300 select-none z-30 transition-colors">
      {/* Left: System Status & Infrastructure Indicators */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <Database size={11} />
          <span className="hidden sm:inline">PostgreSQL 16: Đã kết nối (5432)</span>
          <span className="sm:hidden">DB OK</span>
        </div>

        <div className="hidden md:flex items-center gap-1 text-sky-600 dark:text-sky-400 font-medium">
          <Server size={11} />
          <span>Spring Boot: Sẵn sàng (8088)</span>
        </div>

        <div className="hidden lg:flex items-center gap-1 text-slate-500">
          <span>|</span>
          <Laptop size={11} className="text-indigo-400" />
          <span>
            {isNativeDesktop ? 'Windows Native' : 'Xem trước Desktop'} ({desktopDensity === 'compact' ? 'Thu gọn' : 'Chuẩn'})
          </span>
        </div>
      </div>

      {/* Right: User Role, Shortcut & Return to Web */}
      <div className="flex items-center gap-3">
        {user && (
          <div className="hidden sm:flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
            <User size={11} className="text-amber-500" />
            <span>{user.fullName}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-300/60 dark:bg-[#1E2D44] font-bold text-sky-600 dark:text-sky-400">
              {user.roles?.[0] || 'USER'}
            </span>
          </div>
        )}

        <div className="hidden xl:flex items-center gap-1 text-slate-400 text-[10px]">
          <Keyboard size={10} />
          <span>Ctrl+K: Tra cứu nhanh</span>
        </div>

        {/* 1-click Exit Desktop Mode to Web */}
        <button
          onClick={() => setUsageMode('web')}
          className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 font-bold transition text-[10px]"
          title="Thoát chế độ xem trước Desktop và trở về Giao diện Web"
        >
          <Globe size={10} />
          <span>Về Web</span>
        </button>
      </div>
    </footer>
  )
}
