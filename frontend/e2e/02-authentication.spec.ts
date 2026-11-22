import { test, expect } from '@playwright/test'

test.describe('2. Authentication & Authorization Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Xóa session sạch sẽ trước mỗi test case
    await page.goto('/login')
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
    await page.goto('/login')
  })

  test('2.1 Hiển thị đầy đủ form đăng nhập với các trường thông tin', async ({ page }) => {
    await expect(page.locator('h2:has-text("Đăng nhập Hệ thống")')).toBeVisible()

    const usernameInput = page.locator('#username')
    const passwordInput = page.locator('#password')
    const submitBtn = page.locator('button[type="submit"]')

    await expect(usernameInput).toBeVisible()
    await expect(passwordInput).toBeVisible()
    await expect(submitBtn).toBeVisible()
  })

  test('2.2 Báo lỗi khi nhập sai mật khẩu', async ({ page }) => {
    await page.locator('#username').fill('admin')
    await page.locator('#password').fill('WrongPassword@999')
    await page.locator('button[type="submit"]').click()

    // Chờ thông báo lỗi role="alert" xuất hiện
    const alertBox = page.locator('[role="alert"]').first()
    await expect(alertBox).toBeVisible({ timeout: 10000 })
  })

  test('2.3 Đăng nhập thành công với quyền Admin và chuyển hướng đến Admin Dashboard', async ({ page }) => {
    await page.locator('#username').fill('admin')
    await page.locator('#password').fill('Admin@123456')
    await page.locator('button[type="submit"]').click()

    await page.waitForURL(/.*admin.*/, { timeout: 15000 })
    expect(page.url()).toContain('/admin')
  })

  test('2.4 Đăng nhập với quyền Giáo viên và chuyển hướng đến Teacher Portal', async ({ page }) => {
    await page.locator('#username').fill('gv.minhhanh')
    await page.locator('#password').fill('Teacher@123456')
    await page.locator('button[type="submit"]').click()

    await page.waitForURL(/.*teacher.*/, { timeout: 15000 })
    expect(page.url()).toContain('/teacher')
  })

  test('2.5 Đăng nhập với quyền Học viên và chuyển hướng đến Student Portal', async ({ page }) => {
    await page.locator('#username').fill('thuylinh.nguyen@gmail.com')
    await page.locator('#password').fill('Student@123456')
    await page.locator('button[type="submit"]').click()

    await page.waitForURL(/.*student.*/, { timeout: 15000 })
    expect(page.url()).toContain('/student')
  })
})
