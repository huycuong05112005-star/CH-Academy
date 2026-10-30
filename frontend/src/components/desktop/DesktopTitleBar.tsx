import React, { useState, useEffect } from 'react'
import {
  Minus,
  Square,
  X,
  GraduationCap,
  Sparkles,
  Sun,
  Moon,
  Laptop,
  Maximize2,
  Minimize2,
  Globe
} from 'lucide-react'
import { useExperience } from '../../context/ExperienceContext'
import { useTheme } from '../../context/ThemeContext'
import { useSettings } from '../../context/SettingsContext'

export const DesktopTitleBar: React.FC = () => {
  const {
    effectiveUsageMode,
    isNativeDesktop,
    setUsageMode,
    desktopDensity,
    toggleDesktopDensity
  } = useExperience()
  const { resolvedTheme, setTheme } = useTheme()
  const { settings } = useSettings()

  const [isMaximized, setIsMaximized] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  useEffect(() => {
    if (isNativeDesktop && window.electronAPI) {
      window.electronAPI.isMaximized().then(setIsMaximized)
      const cleanup = window.electronAPI.onMaximizedChange((max) => {
        setIsMaximized(max)
      })
      return cleanup
    }
  }, [isNativeDesktop])

  const showNotice = (actionText: string) => {
    setToastMsg(`[Xem trước Desktop] Thao tác ${actionText} áp dụng trực tiếp cho cửa sổ hệ thống khi chạy trên app Windows native độc lập.`)
    setTimeout(() => setToastMsg(null), 3500)
  }

  const handleMinimize = () => {
    if (isNativeDesktop && window.electronAPI) {
      window.electronAPI.minimize()
    } else {
      showNotice('Thu nhỏ cửa sổ')
    }
  }

  const handleMaximize = () => {
    if (isNativeDesktop && window.electronAPI) {
      window.electronAPI.maximize()
    } else {
      // Toggle browser fullscreen
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.().catch(() => {})
        setIsMaximized(true)
      } else {
        document.exitFullscreen?.().catch(() => {})
        setIsMaximized(false)
      }
    }
  }

  const handleClose = () => {
    if (isNativeDesktop && window.electronAPI) {
      window.electronAPI.close()
    } else {
      // In browser preview, closing switches back to web mode
      setUsageMode('web')
    }
  }

  // Only render titlebar when in desktop mode
  if (effectiveUsageMode !== 'desktop') {
    return null
  }

  return (
    <>
      <div
        className="h-9 w-full select-none flex items-center justify-between px-3 text-xs z-[9999] border-b transition-colors bg-slate-100/95 dark:bg-[#070D18]/95 [data-theme=glass]_&:bg-black/35 [data-theme=glass]_&:backdrop-blur-xl border-slate-200 dark:border-[#1E2E44] [data-theme=glass]_&:border-white/10"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        {/* Left: App Branding & Status Badge */}
        <div
          className="flex items-center gap-2"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <div className="w-5 h-5 rounded-md bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-2xs">
            <GraduationCap size={13} />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold tracking-tight text-slate-800 dark:text-white [data-theme=glass]_&:text-white text-xs">
              {settings.shortName}
            </span>
            <span className="text-[10px] text-slate-400 font-medium hidden md:inline">
              — {isNativeDesktop ? 'Windows Native Client' : 'Xem trước Giao diện Desktop'}
            </span>
          </div>

          {/* Mode Pill Badge */}
          {isNativeDesktop ? (
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Windows App</span>
            </span>
          ) : (
            <span
              className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-600 dark:text-sky-300 border border-sky-500/30"
              title="Bạn đang xem trước giao diện dạng phần mềm máy tính ngay trong trình duyệt"
            >
              <Laptop size={11} />
              <span>Xem trước Desktop</span>
            </span>
          )}
        </div>

        {/* Center: Return to Web & Density Switcher */}
        <div
          className="flex items-center gap-2"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          {/* Prominent Quick Return to Web Button */}
          <button
            onClick={() => setUsageMode('web')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 border border-amber-500/30 transition shadow-2xs"
            title="Nhấn để thoát chế độ xem trước và quay lại Giao diện Web trình duyệt tiêu chuẩn"
          >
            <Globe size={12} />
            <span>Quay lại Giao diện Web</span>
          </button>

          {/* Density Toggle Button */}
          <button
            onClick={toggleDesktopDensity}
            className={`hidden md:flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold border transition ${
              desktopDensity === 'compact'
                ? 'bg-indigo-500/20 text-indigo-500 border-indigo-500/40'
                : 'bg-slate-200/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-transparent hover:bg-slate-200'
            }`}
            title="Chuyển đổi mật độ hiển thị dữ liệu: Chuẩn / Thu gọn (Compact)"
          >
            {desktopDensity === 'compact' ? <Minimize2 size={11} /> : <Maximize2 size={11} />}
            <span>{desktopDensity === 'compact' ? 'Mật độ: Thu gọn' : 'Mật độ: Chuẩn'}</span>
          </button>
        </div>

        {/* Right: Theme Quick Switcher & Window Control Buttons */}
        <div
          className="flex items-center gap-1"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          {/* Quick Style Switcher */}
          <div className="flex items-center bg-slate-200/70 dark:bg-[#131D2E]/80 [data-theme=glass]_&:bg-white/10 rounded-md p-0.5 mr-2 border border-slate-300/60 dark:border-[#22334B] [data-theme=glass]_&:border-white/10">
            <button
              onClick={() => setTheme('light')}
              className={`p-1 rounded transition ${
                resolvedTheme === 'light'
                  ? 'bg-white text-amber-500 shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
              title="Chế độ Sáng"
            >
              <Sun size={12} />
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`p-1 rounded transition ${
                resolvedTheme === 'dark'
                  ? 'bg-slate-800 text-sky-400 shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
              title="Chế độ Tối"
            >
              <Moon size={12} />
            </button>
            <button
              onClick={() => setTheme('glass')}
              className={`p-1 rounded transition ${
                resolvedTheme === 'glass'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
              title="Chế độ Kính trong suốt (Glassmorphism)"
            >
              <Sparkles size={12} />
            </button>
          </div>

          {/* Window Control Buttons */}
          <button
            onClick={handleMinimize}
            className="w-7 h-7 rounded hover:bg-slate-200 dark:hover:bg-white/10 [data-theme=glass]_&:hover:bg-white/15 flex items-center justify-center text-slate-600 dark:text-slate-300 transition"
            title="Thu nhỏ cửa sổ"
          >
            <Minus size={12} />
          </button>
          <button
            onClick={handleMaximize}
            className="w-7 h-7 rounded hover:bg-slate-200 dark:hover:bg-white/10 [data-theme=glass]_&:hover:bg-white/15 flex items-center justify-center text-slate-600 dark:text-slate-300 transition"
            title={isMaximized ? 'Khôi phục kích thước' : 'Phóng to / Toàn màn hình'}
          >
            {isMaximized ? <Minimize2 size={11} /> : <Square size={10} />}
          </button>
          <button
            onClick={handleClose}
            className="w-7 h-7 rounded hover:bg-red-500 hover:text-white flex items-center justify-center text-slate-600 dark:text-slate-300 transition"
            title={isNativeDesktop ? 'Đóng ứng dụng' : 'Đóng chế độ xem trước (Trở về Web)'}
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Floating Info Toast Notification */}
      {toastMsg && (
        <div className="fixed top-12 right-6 z-[10000] px-4 py-2.5 rounded-xl bg-slate-900/90 text-white text-xs shadow-xl border border-white/10 backdrop-blur-md flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <Laptop size={14} className="text-sky-400 flex-shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}
    </>
  )
}
