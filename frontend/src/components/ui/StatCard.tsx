import React from 'react'

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
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  subtitle,
  trend,
  badge,
  loading = false
}) => {
  return (
    <div className="bg-white dark:bg-[#151F31] p-5 rounded-2xl border border-slate-200/80 dark:border-[#2A3A50] shadow-xs hover-lift transition-all hover:border-[#2563EB]/40 dark:hover:border-[#38BDF8]/40 group">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#A6B4C8]">
          {title}
        </span>
        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#1C293D] group-hover:bg-blue-50 dark:group-hover:bg-[#38BDF8]/10 flex items-center justify-center text-[#142B4A] dark:text-[#38BDF8] group-hover:text-[#2563EB] transition-colors flex-shrink-0">
          <Icon size={20} />
        </div>
      </div>

      <div className="mt-2.5 flex items-baseline gap-2">
        {loading ? (
          <div className="h-8 w-24 bg-slate-200 dark:bg-slate-700/60 rounded-md animate-pulse" />
        ) : (
          <div className="text-2xl lg:text-3xl font-bold tracking-tight text-[#0F172A] dark:text-[#F8FAFC] tabular-nums">
            {value}
          </div>
        )}
        {badge}
      </div>

      {(subtitle || trend) && (
        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          {trend && (
            <span
              className={`font-semibold ${
                trend.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {trend.text}
            </span>
          )}
          {subtitle && <span>{subtitle}</span>}
        </div>
      )}
    </div>
  )

}
