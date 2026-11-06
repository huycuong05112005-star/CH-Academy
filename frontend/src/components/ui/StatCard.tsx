import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { CountUpNumber } from './CountUpNumber'
import { GlowCard, type GlowColorVariant } from './GlowCard'

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
  glowColor?: GlowColorVariant
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
  actionText,
  glowColor = 'cyan'
}) => {
  const isClickable = Boolean(to || onClick)

  const cardInner = (
    <div className="p-4 sm:p-5 h-full flex flex-col justify-between min-w-0">
      <div>
        <div className="flex items-center justify-between gap-2 min-w-0">
          <span
            className="typo-label-secondary text-slate-500 dark:text-[#A6B4C8] [data-theme=glass]_&:text-slate-300 truncate"
            title={title}
          >
            {title}
          </span>
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#1C293D] [data-theme=glass]_&:bg-white/10 [data-theme=glass]_&:border [data-theme=glass]_&:border-white/15 group-hover:bg-sky-50 dark:group-hover:bg-[#38BDF8]/15 flex items-center justify-center text-[#142B4A] dark:text-[#38BDF8] [data-theme=glass]_&:text-[#38BDF8] group-hover:text-[#0284C7] dark:group-hover:text-[#38BDF8] transition-colors shrink-0 shadow-2xs">
            <Icon size={20} />
          </div>
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 min-w-0">
          {loading ? (
            <div className="h-8 w-24 bg-slate-200 dark:bg-slate-700/60 rounded-md animate-pulse" />
          ) : (
            <div
              className="typo-kpi-value text-[#0F172A] dark:text-[#F8FAFC] [data-theme=glass]_&:text-white [data-theme=glass]_&:drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] tabular-nums truncate max-w-full whitespace-nowrap"
              title={typeof value === 'string' || typeof value === 'number' ? String(value) : undefined}
            >
              {typeof value === 'number' ? <CountUpNumber value={value} /> : value}
            </div>
          )}
          {badge && <div className="shrink-0">{badge}</div>}
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-slate-100/90 dark:border-[#20314C]/80 [data-theme=glass]_&:border-white/10 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 [data-theme=glass]_&:text-slate-300 min-w-0 gap-2">
        <div className="min-w-0 truncate text-[11.5px]">
          {trend && (
            <span
              className={`font-bold mr-1.5 shrink-0 ${
                trend.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {trend.text}
            </span>
          )}
          {subtitle && <span className="truncate">{subtitle}</span>}
        </div>

        {isClickable && (
          <span className="shrink-0 text-[11.5px] font-bold text-[#0284C7] dark:text-[#38BDF8] inline-flex items-center gap-0.5 opacity-85 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
            <span>{actionText || 'Chi tiết'}</span>
            <ArrowRight size={12} />
          </span>
        )}
      </div>
    </div>
  )

  return (
    <GlowCard
      to={to}
      onClick={onClick}
      interactive={isClickable}
      glowColor={glowColor}
      className="h-full"
    >
      {cardInner}
    </GlowCard>
  )
}
export default StatCard
