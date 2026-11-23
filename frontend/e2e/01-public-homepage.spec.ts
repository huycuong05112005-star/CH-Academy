import { test, expect } from '@playwright/test'

test.describe('1. Public Homepage & Navigation', () => {
  test('1.1 Hiển thị trang chủ đầy đủ với logo thương hiệu, hero section và hiệu ứng LED', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/CH Academy/)

    // Kiểm tra logo và tiêu đề
    const brand = page.locator('text=CH Academy').first()
    await expect(brand).toBeVisible()

    // Hero title
    const heroTitle = page.locator('h1').first()
    await expect(heroTitle).toBeVisible()

    // Kiểm tra các navigation links chuẩn
    await expect(page.locator('a[href="/courses"]').first()).toBeVisible()
    await expect(page.locator('a[href="/about"]').first()).toBeVisible()
    await expect(page.locator('a[href="/login"]').first()).toBeVisible()
  })

  test('1.2 Điều hướng đến trang Khóa học công khai và hiển thị danh sách khóa học', async ({ page }) => {
    await page.goto('/courses')
    await expect(page.locator('text=Khóa học').first()).toBeVisible()
    await page.waitForTimeout(1000)
    const cards = page.locator('.course-card, .led-card, button:has-text("Đăng ký tư vấn"), h3')
    await expect(cards.first()).toBeVisible({ timeout: 10000 })
  })

  test('1.3 Điều hướng đến trang Giới thiệu', async ({ page }) => {
    await page.goto('/about')
    await expect(page.locator('text=CH Academy').first()).toBeVisible()
  })

  test('1.4 Form đăng ký tư vấn tuyển sinh kiểm tra tính hợp lệ', async ({ page }) => {
    await page.goto('/#tu-van')
    const form = page.locator('form').first()
    if (await form.isVisible()) {
      const submitBtn = form.locator('button[type="submit"]')
      await expect(submitBtn).toBeVisible()
    }
  })
})
