import React, { useRef, useState, useEffect } from 'react'

interface Tilt3DCardProps {
  children: React.ReactNode
  className?: string
  maxTilt?: number // Max tilt in degrees (default 7deg)
  glare?: boolean // Show dynamic glare overlay
  scaleOnHover?: number // Subtle zoom, e.g. 1.015
  depth?: 'sm' | 'md' | 'lg'
}

export const Tilt3DCard: React.FC<Tilt3DCardProps> = ({
  children,
  className = '',
  maxTilt = 7,
  glare = true,
  scaleOnHover = 1.015,
  depth = 'md'
}) => {
  const cardRef = useRef<HTMLDivElement>(null)
  const [style, setStyle] = useState<React.CSSProperties>({})
  const [glareStyle, setGlareStyle] = useState<React.CSSProperties>({ opacity: 0 })
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener?.('change', handler)
    return () => mediaQuery.removeEventListener?.('change', handler)
  }, [])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || !cardRef.current) return

    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2

    // Normalize coordinates between -1 and 1
    const normX = (x - centerX) / centerX
    const normY = (y - centerY) / centerY

    // Calculate rotation angles (clamped to maxTilt)
    const rotateY = normX * maxTilt
    const rotateX = -normY * maxTilt

    setStyle({
      transform: `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(${scaleOnHover}, ${scaleOnHover}, 1)`,
      transition: 'transform 100ms ease-out'
    })

    if (glare) {
      const glareX = (x / rect.width) * 100
      const glareY = (y / rect.height) * 100
      setGlareStyle({
        opacity: 0.18,
        background: `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255, 255, 255, 0.8) 0%, rgba(56, 189, 248, 0.2) 40%, transparent 80%)`,
        transition: 'opacity 150ms ease-out'
      })
    }
  }

  const handleMouseLeave = () => {
    if (prefersReducedMotion) return
    setStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
      transition: 'transform 400ms cubic-bezier(0.2, 0.8, 0.2, 1)'
    })
    setGlareStyle({
      opacity: 0,
      transition: 'opacity 400ms ease-out'
    })
  }

  const depthShadows = {
    sm: 'shadow-xs hover:shadow-md dark:shadow-black/20',
    md: 'shadow-md hover:shadow-xl dark:shadow-black/40',
    lg: 'shadow-xl hover:shadow-2xl dark:shadow-black/60'
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transformStyle: 'preserve-3d',
        ...style
      }}
      className={`relative rounded-2xl transition-shadow duration-300 will-change-transform ${depthShadows[depth]} ${className}`}
    >
      {/* Glare specular overlay */}
      {glare && !prefersReducedMotion && (
        <div
          aria-hidden="true"
          style={glareStyle}
          className="pointer-events-none absolute inset-0 z-20 rounded-2xl overflow-hidden"
        />
      )}

      {/* Card Content with 3D z-elevation */}
      <div style={{ transform: 'translateZ(10px)', transformStyle: 'preserve-3d' }}>
        {children}
      </div>
    </div>
  )
}
