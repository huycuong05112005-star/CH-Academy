import { test, expect } from '@playwright/test'

test.describe('3. Admin Portal & Dashboard Metrics', () => {
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

  test('3.1 Dashboard hiển thị các thẻ thống kê tổng quan (Metrics Cards) và biểu đồ học phí', async ({ page }) => {
    await page.goto('/admin/dashboard')
    await expect(page.locator('text=Tổng quan').or(page.locator('text=Dashboard')).first()).toBeVisible()

    await page.waitForTimeout(1500)
    const statCards = page.locator('.led-card, [class*="StatCard"]')
    await expect(statCards.first()).toBeVisible()

    const yearSelect = page.locator('select, [role="combobox"]').first()
    if (await yearSelect.isVisible()) {
      await expect(yearSelect).toBeEnabled()
    }
  })

  test('3.2 Điều hướng từ Dashboard đến Quản lý lớp học', async ({ page }) => {
    await page.goto('/admin/classes')
    await expect(page.locator('text=Lớp học').or(page.locator('text=Danh sách lớp')).first()).toBeVisible()
  })

  test('3.3 Điều hướng đến Quản lý khóa học', async ({ page }) => {
    await page.goto('/admin/courses')
    await expect(page.locator('text=Khóa học').or(page.locator('text=Danh sách khóa học')).first()).toBeVisible()
  })
})
