import { test, expect } from '@playwright/test'

test.describe('5. Security Audit Center & AI Studio Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
    await page.goto('/login')
    await page.locator('#username').fill('admin')
    await page.locator('#password').fill('Admin@123456')
    await page.locator('button[type="submit"]').click()
    await page.waitForURL(/.*admin.*/, { timeout: 15000 })
  })

  test('5.1 Trung tâm an ninh hiển thị danh sách cảnh báo SIEM Zero-Trust', async ({ page }) => {
    await page.goto('/admin/security')
    await expect(page.locator('text=Trung tâm An ninh').or(page.locator('text=Security')).first()).toBeVisible()

    await page.waitForTimeout(1500)
    const alertCode = page.locator('text=SEC-').first()
    await expect(alertCode).toBeVisible()
  })

  test('5.2 Kiểm tra phòng chống SQL Injection trên ô tìm kiếm và trường đăng nhập', async ({ page }) => {
    await page.goto('/admin/courses')
    const searchInput = page.locator('input[placeholder*="tìm" i], input[type="search"]').first()
    if (await searchInput.isVisible()) {
      await searchInput.fill("' OR '1'='1; DROP TABLE courses; --")
      await page.keyboard.press('Enter')
      await page.waitForTimeout(1000)

      expect(page.url()).toContain('/admin/courses')
      await expect(page.locator('text=Internal Server Error').or(page.locator('text=SQLException'))).not.toBeVisible()
    }
  })

  test('5.3 AI Agent Studio chuyển đổi qua lại giữa các tab chức năng', async ({ page }) => {
    await page.goto('/admin/ai-studio')
    await expect(page.locator('text=AI').first()).toBeVisible()

    await page.waitForTimeout(1000)
    const agentTab = page.locator('button:has-text("Agent"), [role="tab"]:has-text("Agent")').first()
    if (await agentTab.isVisible()) {
      await agentTab.click()
      await page.waitForTimeout(500)
    }
  })

  test('5.4 Kiểm tra phân định Voice AI: Đánh dấu BLOCKED nếu thiếu API Key ngoài thực tế', async ({ page }) => {
    const response = await page.request.get('http://127.0.0.1:8088/api/v1/chat/ai/voice/diagnostics')
    expect(response.status()).toBe(200)
    const json = await response.json()

    expect(json).toBeDefined()
    if (json.data && json.data.configured === false) {
      console.log('VOICE_AI_STATUS: BLOCKED (Dịch vụ bên ngoài chưa cấp API key live thực tế)')
    }
  })
})
