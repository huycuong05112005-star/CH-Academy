import React, { createContext, useContext, useEffect, useState, useMemo } from 'react'

export type Theme = 'light' | 'dark' | 'glass' | 'transparent' | 'system'
export type ResolvedTheme = 'light' | 'dark' | 'glass'

interface ThemeContextType {
  theme: Theme
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
}

const THEME_STORAGE_KEY = 'ch_academy_theme'

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY)
      if (stored === 'light' || stored === 'dark' || stored === 'glass' || stored === 'transparent' || stored === 'system') {
        return (stored === 'transparent' ? 'glass' : stored) as Theme
      }
    } catch {
      // Ignore localStorage errors
    }
    return 'light'
  })

  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  })

  // Watch system color scheme changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemIsDark(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const resolvedTheme: ResolvedTheme = useMemo(() => {
    if (theme === 'system') {
      return systemIsDark ? 'dark' : 'light'
    }
    if (theme === 'glass' || theme === 'transparent') {
      return 'glass'
    }
    return theme
  }, [theme, systemIsDark])

  // Apply to DOM
  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('dark', 'light', 'glass', 'theme-glass', 'transparent')
    if (resolvedTheme === 'dark') {
      root.classList.add('dark')
      root.setAttribute('data-theme', 'dark')
    } else if (resolvedTheme === 'glass') {
      root.classList.add('dark', 'glass', 'theme-glass')
      root.setAttribute('data-theme', 'glass')
    } else {
      root.classList.add('light')
      root.setAttribute('data-theme', 'light')
    }
  }, [resolvedTheme])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme)
    } catch {
      // Ignore
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext)
  if (!context) {
    return {
      theme: 'system',
      resolvedTheme: 'light',
      setTheme: () => {}
    }
  }
  return context
}
