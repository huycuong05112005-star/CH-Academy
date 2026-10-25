import React from 'react'
import { Inbox } from 'lucide-react'

interface EmptyStateProps {
  title?: string
  description?: string
  icon?: React.ComponentType<{ size?: number; className?: string }>
  action?: {
    label: string
    onClick: () => void
    icon?: React.ComponentType<{ size?: number; className?: string }>
  }
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Không tìm thấy dữ liệu',
  description = 'Chưa có bản ghi nào phù hợp với điều kiện tìm kiếm hoặc dữ liệu đang trống.',
  icon: Icon = Inbox,
  action
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-2xl bg-white dark:bg-[#151F31] border border-dashed border-slate-300 dark:border-[#2A3A50] my-4">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-[#1C293D] flex items-center justify-center text-slate-400 dark:text-slate-400 mb-4 shadow-inner">
        <Icon size={28} />
      </div>
      <h3 className="text-base font-bold text-[#142B4A] dark:text-[#E8EEF7] mb-1">
        {title}
      </h3>
      <p className="text-sm text-slate-500 dark:text-[#A6B4C8] max-w-md mb-5 leading-relaxed">
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[#142B4A] dark:bg-[#38BDF8] text-white dark:text-[#0B1220] hover:bg-[#1D4168] dark:hover:bg-[#0284C7] shadow-sm transition-all"
        >
          {action.icon && <action.icon size={16} />}
          <span>{action.label}</span>
        </button>
      )}
    </div>
  )
}
