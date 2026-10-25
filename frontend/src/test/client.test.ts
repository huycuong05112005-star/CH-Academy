import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { healthApi, API_BASE_URL } from '../api/client'

// ----- Mock global fetch -----
const mockFetch = vi.fn()
globalThis.fetch = mockFetch

describe('API Client', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('API_BASE_URL', () => {
    it('có giá trị URL hợp lệ', () => {
      expect(API_BASE_URL).toBeTruthy()
      expect(API_BASE_URL).toContain('/api/v1')
    })
  })

  describe('healthApi.check()', () => {
    it('gọi đúng endpoint /health', async () => {
      const mockData = {
        status: 'UP',
        service: 'CH Academy Backend',
        version: '0.0.1-SNAPSHOT',
        timestamp: '2024-01-01T00:00:00',
        message: 'Hệ thống đang hoạt động bình thường',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      })

      const result = await healthApi.check()

      expect(mockFetch).toHaveBeenCalledOnce()
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/health'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      )
      expect(result).toEqual(mockData)
    })

    it('ném lỗi khi server trả về HTTP 500', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      })

      await expect(healthApi.check()).rejects.toThrow('API Error 500')
    })

    it('ném lỗi khi không thể kết nối mạng', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(healthApi.check()).rejects.toThrow('Network error')
    })
  })
})
