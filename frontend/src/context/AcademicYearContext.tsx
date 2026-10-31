import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { apiClient, type ApiResponse } from '../api/client'

export interface AcademicYearItem {
  id: number
  code: string
  name: string
  startDate: string
  endDate: string
  registrationStartDate?: string
  registrationEndDate?: string
  description?: string
  isCurrent: boolean
  status: string
}

interface AcademicYearContextType {
  selectedAcademicYear: string
  setSelectedAcademicYear: (year: string) => void
  availableYears: string[]
  academicYears: AcademicYearItem[]
  loading: boolean
  refreshYears: () => Promise<void>
}

const STORAGE_KEY = 'ch_academy_selected_academic_year'
const SYNC_EVENT = 'ch_academy_academic_year_changed'

const DEFAULT_YEARS = [
  '2031-2032',
  '2030-2031',
  '2029-2030',
  '2028-2029',
  '2027-2028',
  '2026-2027',
  '2025-2026',
  '2024-2025',
  '2023-2024'
]

const AcademicYearContext = createContext<AcademicYearContextType | undefined>(undefined)

export const AcademicYearProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedAcademicYear, setSelectedYearState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) return saved
    } catch {}
    return '2026-2027'
  })

  const [academicYears, setAcademicYears] = useState<AcademicYearItem[]>([])
  const [availableYears, setAvailableYears] = useState<string[]>(DEFAULT_YEARS)
  const [loading, setLoading] = useState(false)

  const refreshYears = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiClient.get<AcademicYearItem[]>('/academic-years')
      if (res?.success && res.data && res.data.length > 0) {
        setAcademicYears(res.data)
        const codes = Array.from(new Set(res.data.map((y) => y.code))).sort().reverse()
        setAvailableYears(codes)

        // Nếu năm đang chọn không nằm trong danh sách và có năm current
        const currentYear = res.data.find((y) => y.isCurrent)
        if (currentYear && !localStorage.getItem(STORAGE_KEY)) {
          setSelectedYearState(currentYear.code)
        }
      }
    } catch (err) {
      console.warn('Lỗi tải danh mục năm học từ server, dùng danh sách mặc định:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const setSelectedAcademicYear = useCallback((year: string) => {
    if (!year) return
    setSelectedYearState(year)
    try {
      localStorage.setItem(STORAGE_KEY, year)
    } catch {}
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: { year } }))
    }
  }, [])

  // Lắng nghe sự kiện đồng bộ giữa các tab hoặc component khác
  useEffect(() => {
    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent<{ year?: string }>
      const newYear = customEvent.detail?.year
      if (newYear && newYear !== selectedAcademicYear) {
        setSelectedYearState(newYear)
      }
    }

    window.addEventListener(SYNC_EVENT, handleSync)
    refreshYears()

    return () => {
      window.removeEventListener(SYNC_EVENT, handleSync)
    }
  }, [refreshYears])

  return (
    <AcademicYearContext.Provider
      value={{
        selectedAcademicYear,
        setSelectedAcademicYear,
        availableYears,
        academicYears,
        loading,
        refreshYears
      }}
    >
      {children}
    </AcademicYearContext.Provider>
  )
}

export const useAcademicYear = (): AcademicYearContextType => {
  const context = useContext(AcademicYearContext)
  if (!context) {
    throw new Error('useAcademicYear must be used within an AcademicYearProvider')
  }
  return context
}
