import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { settingsApi, type SystemSettings } from '../api/settings'

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  centerName: 'Học viện Anh ngữ & Năng khiếu CH Academy',
  shortName: 'CH Academy',
  hotline: '0988 123 456',
  email: 'contact@chacademy.edu.vn',
  address: 'Tầng 3, Tòa nhà Tri Thức, Số 123 Phố Huế, Q. Hai Bà Trưng, Hà Nội',
  website: 'https://chacademy.edu.vn',
  notifyNewLead: true,
  notifyTuitionDue: true,
  notifyAbsence: false,
  appVersion: '1.0.0',
  dbVersion: 'PostgreSQL 16.0 (Alpine)',
  activeProfile: 'dev',
  timezone: 'Asia/Ho_Chi_Minh (UTC+7)',
}

const SETTINGS_STORAGE_KEY = 'ch_academy_cached_settings'
const SYNC_EVENT_NAME = 'ch_academy_settings_sync'

export interface SettingsContextType {
  settings: SystemSettings
  isLoading: boolean
  error: string | null
  refreshSettings: () => Promise<void>
  updateSettings: (newSettings: SystemSettings) => Promise<SystemSettings>
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SystemSettings>(() => {
    try {
      const cached = localStorage.getItem(SETTINGS_STORAGE_KEY)
      if (cached) {
        const parsed = JSON.parse(cached)
        return { ...DEFAULT_SYSTEM_SETTINGS, ...parsed }
      }
    } catch {
      // Ignore cache parse error
    }
    return DEFAULT_SYSTEM_SETTINGS
  })

  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const applySettings = useCallback((newSettings: Partial<SystemSettings>) => {
    setSettings((prev) => {
      const merged: SystemSettings = {
        ...prev,
        ...newSettings,
      }
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(merged))
      } catch {
        // Ignore localStorage error
      }
      return merged
    })
  }, [])

  const refreshSettings = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await settingsApi.getPublicSettings()

      if (res && res.success && res.data) {
        // Clean out undefined/null before merging
        const cleaned: Partial<SystemSettings> = {}
        Object.entries(res.data).forEach(([k, v]) => {
          if (v !== null && v !== undefined) {
            (cleaned as Record<string, unknown>)[k] = v
          }
        })
        applySettings(cleaned)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải cấu hình hệ thống'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }, [applySettings])

  useEffect(() => {
    refreshSettings()
  }, [refreshSettings])

  // Sync across tabs and internal sync events
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === SETTINGS_STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue)
          setSettings((prev) => ({ ...prev, ...parsed }))
        } catch {
          // Ignore
        }
      }
    }

    const handleSyncEvent = () => {
      try {
        const cached = localStorage.getItem(SETTINGS_STORAGE_KEY)
        if (cached) {
          const parsed = JSON.parse(cached)
          setSettings((prev) => ({ ...prev, ...parsed }))
        }
      } catch {
        // Ignore
      }
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener(SYNC_EVENT_NAME, handleSyncEvent)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener(SYNC_EVENT_NAME, handleSyncEvent)
    }
  }, [])

  const updateSettings = async (payload: SystemSettings): Promise<SystemSettings> => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await settingsApi.updateSettings(payload)
      if (res.success && res.data) {
        applySettings(res.data)
        window.dispatchEvent(new Event(SYNC_EVENT_NAME))
        return res.data
      } else {
        throw new Error(res.message || 'Lưu cấu hình không thành công')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi lưu cấu hình'
      setError(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const value: SettingsContextType = {
    settings,
    isLoading,
    error,
    refreshSettings,
    updateSettings,
  }

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext)
  if (!context) {
    return {
      settings: DEFAULT_SYSTEM_SETTINGS,
      isLoading: false,
      error: null,
      refreshSettings: async () => {},
      updateSettings: async (s) => s,
    }
  }
  return context
}
