import React, { useRef, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

export type GlowColorVariant = 'cyan' | 'blue' | 'indigo' | 'emerald' | 'amber' | 'purple' | 'rose'

export interface GlowCardProps {
  children: React.ReactNode
  className?: string
  innerClassName?: string
  glowColor?: GlowColorVariant
  interactive?: boolean
  active?: boolean
  disabled?: boolean
  to?: string
  onClick?: (e: React.MouseEvent) => void
  role?: string
  tabIndex?: number
  ariaLabel?: string
  glare?: boolean
  rounded?: 'xl' | '2xl' | '3xl'
  elevation?: 'none' | 'sm' | 'md' | 'lg'
}

const colorGradientMap: Record<GlowColorVariant, { beamClass: string; shadow: string; borderHover: string }> = {
  cyan: {
    beamClass: 'led-beam-cyan',
    shadow: 'hover:shadow-[0_16px_36px_-10px_rgba(14,165,233,0.22),0_4px_12px_rgba(15,23,42,0.06)] dark:hover:shadow-[0_18px_40px_-10px_rgba(56,189,248,0.25)]',
    borderHover: 'group-hover:border-sky-400/60 dark:group-hover:border-sky-400/80'
  },
  blue: {
    beamClass: 'led-beam-blue',
    shadow: 'hover:shadow-[0_16px_36px_-10px_rgba(37,99,235,0.2)] dark:hover:shadow-[0_18px_40px_-10px_rgba(96,165,250,0.25)]',
    borderHover: 'group-hover:border-blue-400/60 dark:group-hover:border-blue-400/80'
  },
  indigo: {
    beamClass: 'led-beam-indigo',
    shadow: 'hover:shadow-[0_16px_36px_-10px_rgba(99,102,241,0.2)] dark:hover:shadow-[0_18px_40px_-10px_rgba(129,140,248,0.25)]',
    borderHover: 'group-hover:border-indigo-400/60 dark:group-hover:border-indigo-400/80'
  },
  emerald: {
    beamClass: 'led-beam-emerald',
    shadow: 'hover:shadow-[0_16px_36px_-10px_rgba(16,185,129,0.2)] dark:hover:shadow-[0_18px_40px_-10px_rgba(52,211,153,0.25)]',
    borderHover: 'group-hover:border-emerald-400/60 dark:group-hover:border-emerald-400/80'
  },
  amber: {
    beamClass: 'led-beam-amber',
    shadow: 'hover:shadow-[0_16px_36px_-10px_rgba(245,158,11,0.2)] dark:hover:shadow-[0_18px_40px_-10px_rgba(251,191,36,0.25)]',
    borderHover: 'group-hover:border-amber-400/60 dark:group-hover:border-amber-400/80'
  },
  purple: {
    beamClass: 'led-beam-purple',
    shadow: 'hover:shadow-[0_16px_36px_-10px_rgba(168,85,247,0.2)] dark:hover:shadow-[0_18px_40px_-10px_rgba(192,132,252,0.25)]',
    borderHover: 'group-hover:border-purple-400/60 dark:group-hover:border-purple-400/80'
  },
  rose: {
    beamClass: 'led-beam-rose',
    shadow: 'hover:shadow-[0_16px_36px_-10px_rgba(244,63,94,0.2)] dark:hover:shadow-[0_18px_40px_-10px_rgba(251,113,133,0.25)]',
    borderHover: 'group-hover:border-rose-400/60 dark:group-hover:border-rose-400/80'
  }
}

export const GlowCard: React.FC<GlowCardProps> = ({
  children,
  className = '',
  innerClassName = '',
  glowColor = 'cyan',
  interactive = true,
  active = false,
  disabled = false,
  to,
  onClick,
  role,
  tabIndex,
  ariaLabel,
  glare = false,
  rounded = '2xl',
  elevation = 'sm'
}) => {
  const cardRef = useRef<HTMLDivElement>(null)
  const [glarePos, setGlarePos] = useState<{ x: number; y: number; opacity: number }>({ x: 50, y: 50, opacity: 0 })
  const [isHovered, setIsHovered] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener?.('change', handler)
    return () => mq.removeEventListener?.('change', handler)
  }, [])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!glare || reducedMotion || !cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setGlarePos({ x, y, opacity: 0.15 })
  }

  const handleMouseEnter = () => {
    if (interactive && !disabled) {
      setIsHovered(true)
    }
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    if (glare) {
      setGlarePos((prev) => ({ ...prev, opacity: 0 }))
    }
  }

  const roundedClasses = {
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    '3xl': 'rounded-3xl'
  }

  const innerRoundedClasses = {
    xl: 'rounded-[calc(0.75rem-1px)]',
    '2xl': 'rounded-[calc(1rem-1.5px)]',
    '3xl': 'rounded-[calc(1.5rem-1.5px)]'
  }

  const elevationClasses = {
    none: '',
    sm: 'shadow-2xs',
    md: 'shadow-xs',
    lg: 'shadow-md'
  }

  const variant = colorGradientMap[glowColor] || colorGradientMap.cyan
  const isClickable = Boolean(to || onClick) && !disabled

  const containerClasses = [
    'group relative p-[1.5px] transition-all duration-300',
    roundedClasses[rounded],
    elevationClasses[elevation],
    disabled ? 'opacity-60 cursor-not-allowed' : '',
    interactive && !disabled
      ? `hover:-translate-y-1 ${variant.shadow} ${isClickable ? 'cursor-pointer' : ''}`
      : '',
    active
      ? 'ring-2 ring-sky-500/80 dark:ring-sky-400 shadow-md'
      : 'border border-slate-200/85 dark:border-[#1E2E44]',
    variant.borderHover,
    className
  ]
    .filter(Boolean)
    .join(' ')

  const innerWrapper = (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={containerClasses}
      role={role || (isClickable && !to ? 'button' : undefined)}
      tabIndex={tabIndex ?? (isClickable && !to ? 0 : undefined)}
      aria-label={ariaLabel}
      onClick={disabled ? undefined : onClick}
      onKeyDown={(e) => {
        if (!to && onClick && !disabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onClick(e as unknown as React.MouseEvent)
        }
      }}
    >
      {/* 1. Continuous 360° Running LED Border Beam (Hardware-Accelerated) */}
      {interactive && !disabled && !reducedMotion && (
        <div
          aria-hidden="true"
          className={`led-border-beam ${isHovered || active ? 'opacity-100' : 'opacity-0'}`}
        >
          <div
            className={`led-border-spinner ${variant.beamClass || 'led-beam-cyan'}`}
          />
        </div>
      )}

      {/* 2. Optional Mouse-tracking Glare Overlay */}
      {glare && interactive && !disabled && !reducedMotion && (
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 z-20 ${roundedClasses[rounded]} transition-opacity duration-300`}
          style={{
            opacity: glarePos.opacity,
            background: `radial-gradient(circle 180px at ${glarePos.x}% ${glarePos.y}%, rgba(255, 255, 255, 0.45) 0%, rgba(56, 189, 248, 0.15) 40%, transparent 80%)`
          }}
        />
      )}

      {/* 3. Inner Card Canvas (Matches CH Academy surface theme & isolates pointer events) */}
      <div
        className={`relative z-10 w-full h-full bg-white dark:bg-[#101B2D] [data-theme=glass]_&:bg-white/[0.08] [data-theme=glass]_&:backdrop-blur-xl ${innerRoundedClasses[rounded]} ${innerClassName}`}
      >
        {children}
      </div>
    </div>
  )

  if (to && !disabled) {
    return (
      <Link to={to} className="block no-underline focus:outline-hidden focus-visible:ring-2 focus-visible:ring-sky-500 rounded-2xl">
        {innerWrapper}
      </Link>
    )
  }

  return innerWrapper
}
export default GlowCard

