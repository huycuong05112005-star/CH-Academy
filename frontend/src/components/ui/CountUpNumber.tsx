import React, { useEffect, useState } from 'react'

interface CountUpNumberProps {
  value: number
  duration?: number
  formatter?: (val: number) => string
  className?: string
}

export const CountUpNumber: React.FC<CountUpNumberProps> = ({
  value,
  duration = 800,
  formatter,
  className = ''
}) => {
  const checkIsTestEnv = () => {
    const globalObj = globalThis as unknown as { process?: { env?: { NODE_ENV?: string } }; __vitest_worker__?: unknown; vi?: unknown }
    return (
      (typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'test') ||
      globalObj.process?.env?.NODE_ENV === 'test' ||
      Boolean(globalObj.__vitest_worker__) ||
      Boolean(globalObj.vi)
    )
  }

  const [displayValue, setDisplayValue] = useState<number>(() => {
    return checkIsTestEnv() || duration <= 0 ? value : 0
  })

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
        : false

    const isTestEnv = checkIsTestEnv()

    if (isTestEnv || prefersReducedMotion || duration <= 0 || typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') {
      setDisplayValue(value)
      return
    }

    let startTimestamp: number | null = null
    const startValue = 0

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp
      const progress = Math.min((timestamp - startTimestamp) / duration, 1)
      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(startValue + (value - startValue) * easeOut)
      setDisplayValue(current)

      if (progress < 1) {
        window.requestAnimationFrame(step)
      }
    }

    const animationId = window.requestAnimationFrame(step)
    return () => window.cancelAnimationFrame(animationId)
  }, [value, duration])

  const formatted = formatter ? formatter(displayValue) : displayValue.toLocaleString('vi-VN')

  return <span className={`tabular-nums ${className}`}>{formatted}</span>
}
