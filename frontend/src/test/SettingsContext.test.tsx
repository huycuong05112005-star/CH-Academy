import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import React from 'react'
import { SettingsProvider, useSettings } from '../context/SettingsContext'
import { settingsApi } from '../api/settings'

vi.mock('../api/settings', () => ({
  settingsApi: {
    getSettings: vi.fn(),
    getPublicSettings: vi.fn(),
    updateSettings: vi.fn(),
  },
}))

describe('SettingsContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    vi.mocked(settingsApi.getPublicSettings).mockResolvedValue({
      success: true,
      message: 'OK',
      data: undefined as any,
    })
  })

  it('provides default settings initially', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SettingsProvider>{children}</SettingsProvider>
    )
    const { result } = renderHook(() => useSettings(), { wrapper })

    expect(result.current.settings.shortName).toBe('CH Academy')
    expect(result.current.settings.email).toBe('contact@chacademy.edu.vn')
  })

  it('updates settings and persists to cache when updateSettings is called', async () => {
    const mockUpdated = {
      centerName: 'Học viện Quốc tế CH Academy Mới',
      shortName: 'CH ACADEMY PRO',
      hotline: '0901 234 567',
      email: 'info@chacademy.edu.vn',
      address: '456 Phố Huế, Hà Nội',
      website: 'https://chacademy.edu.vn',
      notifyNewLead: true,
      notifyTuitionDue: false,
      notifyAbsence: true,
    }

    vi.mocked(settingsApi.updateSettings).mockResolvedValue({
      success: true,
      message: 'Cập nhật thành công',
      data: mockUpdated,
    })

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SettingsProvider>{children}</SettingsProvider>
    )
    const { result } = renderHook(() => useSettings(), { wrapper })

    await act(async () => {
      await result.current.updateSettings(mockUpdated)
    })

    expect(result.current.settings.shortName).toBe('CH ACADEMY PRO')
    expect(result.current.settings.hotline).toBe('0901 234 567')

    const cached = localStorage.getItem('ch_academy_cached_settings')
    expect(cached).not.toBeNull()
    expect(JSON.parse(cached!).shortName).toBe('CH ACADEMY PRO')
  })

  it('throws error and does not falsify success when updateSettings fails', async () => {
    vi.mocked(settingsApi.updateSettings).mockRejectedValue(new Error('Mạng bị lỗi'))

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SettingsProvider>{children}</SettingsProvider>
    )
    const { result } = renderHook(() => useSettings(), { wrapper })

    await expect(
      act(async () => {
        await result.current.updateSettings({
          ...result.current.settings,
          shortName: 'Tên Thất Bại',
        })
      })
    ).rejects.toThrow('Mạng bị lỗi')

    expect(result.current.settings.shortName).toBe('CH Academy')
  })
})
