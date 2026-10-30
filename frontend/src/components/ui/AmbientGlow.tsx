import React from 'react'

interface AmbientGlowProps {
  className?: string
  variant?: 'primary' | 'cyan' | 'emerald' | 'subtle'
}

export const AmbientGlow: React.FC<AmbientGlowProps> = ({
  className = '',
  variant = 'primary'
}) => {
  const gradientVariants = {
    primary: 'from-blue-600/15 via-indigo-500/10 to-transparent dark:from-sky-500/15 dark:via-cyan-500/10',
    cyan: 'from-cyan-500/15 via-sky-500/10 to-transparent dark:from-cyan-400/20 dark:via-blue-500/10',
    emerald: 'from-emerald-500/15 via-teal-500/10 to-transparent dark:from-emerald-400/20 dark:via-teal-500/10',
    subtle: 'from-slate-400/10 via-slate-300/5 to-transparent dark:from-slate-600/15 dark:via-slate-800/10'
  }

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute -z-10 rounded-full blur-3xl opacity-70 bg-gradient-to-tr ${gradientVariants[variant]} ${className}`}
    />
  )
}
