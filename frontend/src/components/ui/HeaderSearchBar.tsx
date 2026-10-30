import React from 'react'
import { Search } from 'lucide-react'

export interface HeaderSearchBarProps {
  onClick: () => void
  placeholder?: string
  shortcutText?: string
}

export const HeaderSearchBar: React.FC<HeaderSearchBarProps> = ({
  onClick,
  placeholder = 'Tìm kiếm nhanh chức năng, mã lớp, học viên...',
  shortcutText = 'Ctrl K'
}) => {
  return (
    <div className="hidden md:flex items-center">
      <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl border border-slate-200/80 dark:border-[#2A3A50] [data-theme=glass]_&:border-white/15 bg-slate-50 dark:bg-[#152338] [data-theme=glass]_&:bg-white/[0.08] hover:bg-slate-100 dark:hover:bg-[#1B2F4C] [data-theme=glass]_&:hover:bg-white/[0.14] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 [data-theme=glass]_&:text-slate-200 text-xs font-medium shadow-2xs transition group cursor-pointer"
        title={`Mở thanh tìm kiếm nhanh (${shortcutText})`}
      >
        <Search size={14} className="text-slate-400 group-hover:text-[#38BDF8] transition-colors shrink-0" />
        <span className="truncate max-w-[200px] lg:max-w-[320px]">{placeholder}</span>
        <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-[#0A1120] [data-theme=glass]_&:bg-white/10 border border-slate-200 dark:border-slate-700 [data-theme=glass]_&:border-white/20 text-slate-500 dark:text-slate-400 [data-theme=glass]_&:text-slate-300 shadow-2xs shrink-0">
          {shortcutText}
        </kbd>
      </button>
    </div>
  )
}

