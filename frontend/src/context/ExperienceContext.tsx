import React, { createContext, useContext, useEffect, useState, useMemo } from 'react'
import { useTheme } from './ThemeContext'

export type UsageMode = 'web' | 'desktop'
export type DesktopDensity = 'standard' | 'compact'
export type ExperienceKey =
  | 'web-light'
  | 'web-dark'
  | 'web-glass'
  | 'desktop-light'
  | 'desktop-dark'
  | 'desktop-glass'

export interface ExperienceContextType {
  usageMode: UsageMode
  setUsageMode: (mode: UsageMode) => void
  isNativeDesktop: boolean
  effectiveUsageMode: UsageMode
  activeExperience: ExperienceKey
  experienceLabel: string
  desktopDensity: DesktopDensity
  setDesktopDensity: (density: DesktopDensity) => void
  toggleDesktopDensity: () => void
}

const USAGE_MODE_STORAGE_KEY = 'ch_academy_usage_mode'
const DENSITY_STORAGE_KEY = 'ch_academy_desktop_density'

const ExperienceContext = createContext<ExperienceContextType | undefined>(undefined)

export const ExperienceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { resolvedTheme } = useTheme()

  // Native desktop app detection via secure preload bridge
  const isNativeDesktop = useMemo(() => {
    return typeof window !== 'undefined' && Boolean(window.electronAPI?.isDesktop)
  }, [])

  const [usageMode, setUsageModeState] = useState<UsageMode>(() => {
    if (typeof window === 'undefined') return 'web'
    if (window.electronAPI?.isDesktop) return 'desktop'
    try {
      const stored = localStorage.getItem(USAGE_MODE_STORAGE_KEY)
      if (stored === 'desktop' || stored === 'web') return stored
    } catch {
      // Ignore localStorage errors
    }
    return 'web'
  })

  const [desktopDensity, setDesktopDensityState] = useState<DesktopDensity>(() => {
    if (typeof window === 'undefined') return 'standard'
    try {
      const stored = localStorage.getItem(DENSITY_STORAGE_KEY)
      if (stored === 'compact' || stored === 'standard') return stored
    } catch {
      // Ignore
    }
    return 'standard'
  })

  // In native desktop, effective mode is always desktop
  const effectiveUsageMode: UsageMode = isNativeDesktop ? 'desktop' : usageMode

  const setUsageMode = (mode: UsageMode) => {
    setUsageModeState(mode)
    try {
      localStorage.setItem(USAGE_MODE_STORAGE_KEY, mode)
    } catch {
      // Ignore
    }
  }

  const setDesktopDensity = (density: DesktopDensity) => {
    setDesktopDensityState(density)
    try {
      localStorage.setItem(DENSITY_STORAGE_KEY, density)
    } catch {
      // Ignore
    }
  }

  const toggleDesktopDensity = () => {
    setDesktopDensity(desktopDensity === 'compact' ? 'standard' : 'compact')
  }

  // Calculate 1 of the 6 multi-experience combinations
  const activeExperience: ExperienceKey = `${effectiveUsageMode}-${resolvedTheme}` as ExperienceKey

  const experienceLabel = useMemo(() => {
    switch (activeExperience) {
      case 'web-light':
        return 'Web — Sáng (Light)'
      case 'web-dark':
        return 'Web — Tối (Dark)'
      case 'web-glass':
        return 'Web — Kính trong suốt (In-Web Glass)'
      case 'desktop-light':
        return isNativeDesktop ? 'Desktop — Sáng (Native Windows)' : 'Xem trước Desktop — Sáng'
      case 'desktop-dark':
        return isNativeDesktop ? 'Desktop — Tối (Native Windows)' : 'Xem trước Desktop — Tối'
      case 'desktop-glass':
        return isNativeDesktop ? 'Desktop — Kính (OS Acrylic Glass)' : 'Xem trước Desktop — Kính'
      default:
        return 'Web — Kính trong suốt'
    }
  }, [activeExperience, isNativeDesktop])

  // Apply data-mode, data-density and classes to DOM documentElement
  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-mode', effectiveUsageMode)
    root.setAttribute('data-density', desktopDensity)

    if (effectiveUsageMode === 'desktop') {
      root.classList.add('desktop-mode')
    } else {
      root.classList.remove('desktop-mode')
    }

    if (desktopDensity === 'compact') {
      root.classList.add('desktop-compact')
    } else {
      root.classList.remove('desktop-compact')
    }

    if (isNativeDesktop) {
      root.classList.add('electron-app')
    } else {
      root.classList.remove('electron-app')
    }
  }, [effectiveUsageMode, desktopDensity, isNativeDesktop])

  return (
    <ExperienceContext.Provider
      value={{
        usageMode,
        setUsageMode,
        isNativeDesktop,
        effectiveUsageMode,
        activeExperience,
        experienceLabel,
        desktopDensity,
        setDesktopDensity,
        toggleDesktopDensity
      }}
    >
      {children}
    </ExperienceContext.Provider>
  )
}

export const useExperience = (): ExperienceContextType => {
  const context = useContext(ExperienceContext)
  if (!context) {
    return {
      usageMode: 'web',
      setUsageMode: () => {},
      isNativeDesktop: false,
      effectiveUsageMode: 'web',
      activeExperience: 'web-glass',
      experienceLabel: 'Web — Kính trong suốt',
      desktopDensity: 'standard',
      setDesktopDensity: () => {},
      toggleDesktopDensity: () => {}
    }
  }
  return context
}
