import React, { useState } from 'react'
import { TrendingUp, BarChart2, Layers } from 'lucide-react'

export interface TrendDataPoint {
  label: string
  revenue: number
  students: number
  sessions: number
}

interface TrendAnalyticsChartProps {
  data: TrendDataPoint[]
  currencyFormatter: (val: number) => string
}

export const TrendAnalyticsChart: React.FC<TrendAnalyticsChartProps> = ({
  data,
  currencyFormatter
}) => {
  const [chartType, setChartType] = useState<'line' | 'bar'>('line')
  const [metric, setMetric] = useState<'revenue' | 'students'>('revenue')
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  const activePoints = data.map((d) => ({
    label: d.label,
    val: metric === 'revenue' ? d.revenue : d.students
  }))

  const maxVal = Math.max(...activePoints.map((p) => p.val), 1)

  // Chart dimensions (SVG coordinate space)
  const width = 640
  const height = 220
  const padLeft = 20
  const padRight = 20
  const padTop = 30
  const padBottom = 35

  const chartW = width - padLeft - padRight
  const chartH = height - padTop - padBottom

  // Coordinates
  const points = activePoints.map((p, idx) => {
    const x = padLeft + (idx / Math.max(1, activePoints.length - 1)) * chartW
    const y = padTop + chartH - (p.val / maxVal) * chartH
    return { x, y, ...p }
  })

  // SVG Line path
  const linePath = points.reduce((acc, curr, idx) => {
    return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`
  }, '')

  // SVG Area path
  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${padTop + chartH} L ${points[0].x} ${padTop + chartH} Z`
    : ''

  return (
    <div className="space-y-4">
      {/* Chart Top Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="typo-section-title text-[#0F172A] dark:text-[#E8EEF7] flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#0284C7] dark:text-[#38BDF8]" />
            <span>Xu hướng hoạt động theo tháng</span>
          </h3>
          <p className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-0.5">
            Dữ liệu phát sinh thực tế trong năm học được đối soát liên tục
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Metric switcher */}
          <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-[#152338] border border-slate-200/80 dark:border-[#20314C]">
            <button
              type="button"
              onClick={() => setMetric('revenue')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                metric === 'revenue'
                  ? 'bg-white dark:bg-[#20314C] text-[#0284C7] dark:text-[#38BDF8] shadow-2xs'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              Doanh thu
            </button>
            <button
              type="button"
              onClick={() => setMetric('students')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                metric === 'students'
                  ? 'bg-white dark:bg-[#20314C] text-[#0284C7] dark:text-[#38BDF8] shadow-2xs'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              Học viên
            </button>
          </div>

          {/* Line / Bar mode switcher */}
          <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-[#152338] border border-slate-200/80 dark:border-[#20314C]">
            <button
              type="button"
              onClick={() => setChartType('line')}
              className={`p-1.5 rounded-lg transition-all ${
                chartType === 'line'
                  ? 'bg-white dark:bg-[#20314C] text-[#0284C7] dark:text-[#38BDF8] shadow-2xs'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Dạng đường Area Chart"
            >
              <TrendingUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setChartType('bar')}
              className={`p-1.5 rounded-lg transition-all ${
                chartType === 'bar'
                  ? 'bg-white dark:bg-[#20314C] text-[#0284C7] dark:text-[#38BDF8] shadow-2xs'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Dạng cột Bar Chart"
            >
              <BarChart2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="relative w-full aspect-[21/9] sm:aspect-[24/9] min-h-[190px]">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="revenueAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.32" />
              <stop offset="60%" stopColor="#0284C7" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#0F243E" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#0284C7" />
            </linearGradient>
          </defs>

          {/* Horizontal grid guide lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const y = padTop + chartH * (1 - pct)
            return (
              <g key={i}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="currentColor"
                  strokeDasharray="3 3"
                  className="text-slate-200 dark:text-[#1E2E44]"
                  strokeWidth="1"
                />
              </g>
            )
          })}

          {/* Area & Line */}
          {chartType === 'line' && (
            <>
              <path d={areaPath} fill="url(#revenueAreaGrad)" />
              <path
                d={linePath}
                fill="none"
                stroke="#0EA5E9"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="drop-shadow-[0_2px_8px_rgba(14,165,233,0.3)] transition-all duration-300"
              />
              {points.map((pt, i) => (
                <circle
                  key={i}
                  cx={pt.x}
                  cy={pt.y}
                  r={hoveredIdx === i ? 5 : 3.5}
                  className={`transition-all duration-150 cursor-pointer ${
                    hoveredIdx === i
                      ? 'fill-white stroke-[#0284C7] stroke-2'
                      : 'fill-[#0EA5E9] stroke-white dark:stroke-[#101B2D] stroke-1.5'
                  }`}
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />
              ))}
            </>
          )}

          {/* Bar Chart rendering */}
          {chartType === 'bar' && (
            <g>
              {points.map((pt, i) => {
                const barWidth = Math.min(26, chartW / points.length - 8)
                const barH = Math.max(2, (pt.val / maxVal) * chartH)
                const barX = pt.x - barWidth / 2
                const barY = padTop + chartH - barH
                const isHovered = hoveredIdx === i

                return (
                  <rect
                    key={i}
                    x={barX}
                    y={barY}
                    width={barWidth}
                    height={barH}
                    rx="4"
                    fill={isHovered ? '#38BDF8' : 'url(#barGrad)'}
                    className="transition-all duration-200 cursor-pointer opacity-90 hover:opacity-100"
                    onMouseEnter={() => setHoveredIdx(i)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  />
                )
              })}
            </g>
          )}

          {/* Bottom X-Axis Labels */}
          {points.map((pt, i) => (
            <text
              key={i}
              x={pt.x}
              y={height - 10}
              textAnchor="middle"
              className={`text-[10px] font-semibold transition-colors ${
                hoveredIdx === i
                  ? 'fill-[#0284C7] dark:fill-[#38BDF8] font-bold'
                  : 'fill-slate-400 dark:fill-slate-500'
              }`}
            >
              {pt.label}
            </text>
          ))}
        </svg>

        {/* Hover Tooltip Float */}
        {hoveredIdx !== null && points[hoveredIdx] && (
          <div
            className="absolute z-20 pointer-events-none -translate-x-1/2 -translate-y-full mb-3 px-3 py-1.5 rounded-xl bg-slate-900/95 dark:bg-[#16253C]/95 text-white shadow-xl border border-slate-700/80 backdrop-blur-md text-xs whitespace-nowrap animate-in fade-in zoom-in-95 duration-150"
            style={{
              left: `${(points[hoveredIdx].x / width) * 100}%`,
              top: `${(points[hoveredIdx].y / height) * 100}%`
            }}
          >
            <div className="text-[10px] text-slate-300 font-semibold">{points[hoveredIdx].label}</div>
            <div className="font-extrabold text-[#38BDF8] text-sm tabular-nums">
              {metric === 'revenue'
                ? currencyFormatter(points[hoveredIdx].val)
                : `${points[hoveredIdx].val} học viên`}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// 2. Donut Breakdown Chart (Nexora Revenue by Source style)
export interface DonutSegment {
  label: string
  value: number
  color: string
}

interface DonutBreakdownChartProps {
  title: string
  subtitle?: string
  segments: DonutSegment[]
  centerLabel: string
  centerValue: string
  valueFormatter?: (val: number) => string
}

export const DonutBreakdownChart: React.FC<DonutBreakdownChartProps> = ({
  title,
  subtitle,
  segments,
  centerLabel,
  centerValue,
  valueFormatter = (v) => `${v}`
}) => {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1
  let cumulative = 0

  return (
    <div className="space-y-4 w-full min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1">
        <div>
          <h3 className="typo-section-title text-[#0F172A] dark:text-[#E8EEF7] flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#0284C7] dark:text-[#38BDF8]" />
            <span>{title}</span>
          </h3>
          {subtitle && (
            <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
          )}
        </div>
        <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Đối soát 100%
        </div>
      </div>

      {/* Enterprise Responsive Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center w-full min-w-0">
        {/* Left Column: Donut Chart Area */}
        <div className="md:col-span-5 flex items-center justify-center min-w-0 py-2">
          <div className="relative w-40 h-40 sm:w-44 sm:h-44 shrink-0">
            <svg viewBox="0 0 42 42" className="w-full h-full transform -rotate-90 drop-shadow-xs">
              <circle
                cx="21"
                cy="21"
                r="15.91549430918954"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="4"
                className="text-slate-100 dark:text-[#18263D]"
              />
              {segments.map((seg, i) => {
                const pct = (seg.value / total) * 100
                const dashOffset = 100 - cumulative + 25
                cumulative += pct

                return (
                  <circle
                    key={i}
                    cx="21"
                    cy="21"
                    r="15.91549430918954"
                    fill="transparent"
                    stroke={seg.color}
                    strokeWidth="4.2"
                    strokeDasharray={`${pct} ${100 - pct}`}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                    className="transition-all duration-500 hover:opacity-90"
                  />
                )
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2 pointer-events-none">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
                {centerLabel}
              </span>
              <span className="text-xs sm:text-[13px] font-extrabold text-[#0F172A] dark:text-white tabular-nums truncate max-w-full mt-0.5 px-1" title={centerValue}>
                {centerValue}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Structured Legend Rows */}
        <div className="md:col-span-7 flex flex-col justify-center gap-2.5 min-w-0">
          {segments.map((seg, i) => {
            const pct = Math.round((seg.value / total) * 100)
            return (
              <div
                key={i}
                className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/70 text-xs min-w-0 transition-colors hover:bg-slate-100/70 dark:hover:bg-slate-800/70"
              >
                {/* Col 1: Status Dot + Label */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                    style={{ backgroundColor: seg.color }}
                  />
                  <span
                    className="font-medium text-slate-700 dark:text-slate-300 truncate text-[12.5px]"
                    title={seg.label}
                  >
                    {seg.label}
                  </span>
                </div>

                {/* Col 2: Percentage */}
                <div className="w-11 text-right font-mono text-[11.5px] font-semibold text-slate-500 dark:text-slate-400 shrink-0">
                  {pct}%
                </div>

                {/* Col 3: Currency Amount */}
                <div className="text-right font-mono text-[12.5px] font-bold text-slate-900 dark:text-white shrink-0 pl-1 pr-1">
                  {valueFormatter(seg.value)}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

