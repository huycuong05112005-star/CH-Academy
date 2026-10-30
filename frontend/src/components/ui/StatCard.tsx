import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { CountUpNumber } from './CountUpNumber'

interface StatCardProps {
  title: string
  value: number | string
  icon: React.ComponentType<{ size?: number; className?: string }>
  subtitle?: React.ReactNode
  trend?: {
    text: string
    isPositive?: boolean
  }
  badge?: React.ReactNode
  loading?: boolean
  to?: string
  onClick?: () => void
  actionText?: string
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  subtitle,
  trend,
  badge,
  loading = false,
  to,
  onClick,
  actionText
}) => {
  const isClickable = Boolean(to || onClick)

  const cardContent = (
    <div
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable && !to ? 0 : undefined}
      className={`relative overflow-hidden bg-white/90 dark:bg-[#151F31]/90 [data-theme=glass]_&:bg-white/[0.09] [data-theme=glass]_&:hover:bg-white/[0.15] backdrop-blur-md [data-theme=glass]_&:backdrop-blur-xl p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-[#2A3A50] [data-theme=glass]_&:border-white/20 [data-theme=glass]_&:hover:border-white/35 shadow-xs [data-theme=glass]_&:shadow-[0_16px_36px_-10px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.22)] transition-all duration-200 group min-w-0 h-full flex flex-col justify-between ${
        isClickable
          ? 'cursor-pointer hover:border-blue-400 dark:hover:border-sky-400 [data-theme=glass]_&:hover:border-sky-300 hover:shadow-md hover:-translate-y-0.5'
          : ''
      }`}
    >
      <div>
        <div className="flex items-center justify-between gap-2 min-w-0">
          <span
            className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#A6B4C8] [data-theme=glass]_&:text-slate-300 truncate"
            title={title}
          >
            {title}
          </span>
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#1C293D] [data-theme=glass]_&:bg-white/10 [data-theme=glass]_&:border [data-theme=glass]_&:border-white/15 group-hover:bg-blue-50 dark:group-hover:bg-[#38BDF8]/15 flex items-center justify-center text-[#142B4A] dark:text-[#38BDF8] [data-theme=glass]_&:text-[#38BDF8] group-hover:text-[#2563EB] dark:group-hover:text-[#38BDF8] transition-colors shrink-0 shadow-xs">
            <Icon size={20} />
          </div>
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 min-w-0">
          {loading ? (
            <div className="h-8 w-24 bg-slate-200 dark:bg-slate-700/60 rounded-md animate-pulse" />
          ) : (
            <div
              className="text-xl sm:text-2xl xl:text-3xl font-extrabold tracking-tight text-[#0F172A] dark:text-[#F8FAFC] [data-theme=glass]_&:text-white [data-theme=glass]_&:drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] tabular-nums truncate max-w-full whitespace-nowrap"
              title={typeof value === 'string' || typeof value === 'number' ? String(value) : undefined}
            >
              {typeof value === 'number' ? <CountUpNumber value={value} /> : value}
            </div>
          )}
          {badge && <div className="shrink-0">{badge}</div>}
        </div>
      </div>

      <div className="mt-3 pt-2 border-t border-slate-100/80 dark:border-[#2A3A50]/60 [data-theme=glass]_&:border-white/10 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 [data-theme=glass]_&:text-slate-300 min-w-0 gap-2">
        <div className="min-w-0 truncate">
          {trend && (
            <span
              className={`font-semibold mr-1.5 shrink-0 ${
                trend.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {trend.text}
            </span>
          )}
          {subtitle && <span className="truncate">{subtitle}</span>}
        </div>

        {isClickable && (
          <span className="shrink-0 text-[11px] font-semibold text-blue-600 dark:text-sky-400 inline-flex items-center gap-0.5 opacity-80 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
            <span>{actionText || 'Chi tiết'}</span>
            <ArrowRight size={12} />
          </span>
        )}
      </div>
    </div>
  )

  if (to) {
    return (
      <Link
        to={to}
        className="block h-full focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded-2xl no-underline"
        title={`Xem danh sách ${title}`}
      >
        {cardContent}
      </Link>
    )
  }

  return cardContent
}
