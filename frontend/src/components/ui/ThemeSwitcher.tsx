import React, { useState, useRef, useEffect } from 'react'
import { Sun, Moon, Monitor, Check } from 'lucide-react'
import { useTheme, type Theme } from '../../context/ThemeContext'

export const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const options: { value: Theme; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
    { value: 'light', label: 'Giao diện Sáng', icon: Sun },
    { value: 'dark', label: 'Giao diện Tối', icon: Moon },
    { value: 'system', label: 'Theo Hệ Thống', icon: Monitor }
  ]

  const CurrentIcon = resolvedTheme === 'dark' ? Moon : Sun

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#151F31] text-slate-700 dark:text-[#E8EEF7] hover:bg-slate-50 dark:hover:bg-[#1C293D] transition-colors shadow-xs"
        aria-label="Đổi chế độ giao diện"
        title={`Giao diện hiện tại: ${theme === 'system' ? 'Hệ thống (' + resolvedTheme + ')' : theme === 'dark' ? 'Tối' : 'Sáng'}`}
      >
        <CurrentIcon size={17} className="text-[#142B4A] dark:text-[#38BDF8]" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#151F31] shadow-lg py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400">
            Chế độ hiển thị
          </div>
          {options.map((opt) => {
            const Icon = opt.icon
            const isSelected = theme === opt.value
            return (
              <button
                key={opt.value}
                onClick={() => {
                  setTheme(opt.value)
                  setIsOpen(false)
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors ${
                  isSelected
                    ? 'bg-slate-100 dark:bg-[#1C293D] text-[#142B4A] dark:text-[#38BDF8] font-semibold'
                    : 'text-slate-700 dark:text-[#A6B4C8] hover:bg-slate-50 dark:hover:bg-[#1C293D]/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon size={16} />
                  <span>{opt.label}</span>
                </div>
                {isSelected && <Check size={14} className="text-[#142B4A] dark:text-[#38BDF8]" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
