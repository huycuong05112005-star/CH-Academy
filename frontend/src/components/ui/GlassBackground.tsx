import React from 'react'
import { useTheme } from '../../context/ThemeContext'
import { useExperience } from '../../context/ExperienceContext'

export const GlassBackground: React.FC = () => {
  const { resolvedTheme } = useTheme()
  const { isNativeDesktop } = useExperience()

  if (resolvedTheme !== 'glass') {
    return null
  }

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none transition-opacity duration-700"
      aria-hidden="true"
    >
      {/* Deep atmospheric night sky base: Semi-transparent in native Desktop to see Windows desktop behind; solid in Web */}
      <div
        className={`absolute inset-0 ${
          isNativeDesktop
            ? 'bg-gradient-to-br from-[#060C1D]/45 via-[#0A1430]/40 to-[#120D2C]/45 backdrop-blur-md'
            : 'bg-gradient-to-br from-[#060C1D] via-[#0A1430] to-[#120D2C]'
        }`}
      />

      {/* Floating Radiant Aura Orbs */}
      {/* Orb 1: Cyan / Azure (Top-Right) */}
      <div
        className="absolute -top-24 -right-24 w-[650px] h-[650px] rounded-full blur-[100px] animate-pulse duration-[8000ms]"
        style={{
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.55) 0%, rgba(14, 165, 233, 0.28) 40%, transparent 70%)'
        }}
      />

      {/* Orb 2: Royal Indigo / Purple (Bottom-Left) */}
      <div
        className="absolute -bottom-36 -left-28 w-[750px] h-[750px] rounded-full blur-[120px] animate-pulse duration-[10000ms]"
        style={{
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.50) 0%, rgba(139, 92, 246, 0.30) 45%, transparent 70%)'
        }}
      />

      {/* Orb 3: Luminous Electric Blue (Center-Left) */}
      <div
        className="absolute top-1/3 -left-16 w-[520px] h-[520px] rounded-full blur-[90px]"
        style={{
          background: 'radial-gradient(circle, rgba(37, 99, 235, 0.40) 0%, rgba(56, 189, 248, 0.20) 40%, transparent 70%)'
        }}
      />

      {/* Orb 4: Rose / Fuchsia Accent (Center-Right) */}
      <div
        className="absolute top-1/2 -right-16 w-[480px] h-[480px] rounded-full blur-[110px]"
        style={{
          background: 'radial-gradient(circle, rgba(236, 72, 153, 0.30) 0%, rgba(244, 63, 94, 0.16) 40%, transparent 70%)'
        }}
      />

      {/* Orb 5: Emerald Aurora (Bottom-Right) */}
      <div
        className="absolute bottom-12 right-1/4 w-[420px] h-[420px] rounded-full blur-[90px]"
        style={{
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.28) 0%, transparent 60%)'
        }}
      />

      {/* Subtle Geometric Depth Grid Matrix */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255, 255, 255, 0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.6) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />
    </div>
  )
}
export default GlassBackground

