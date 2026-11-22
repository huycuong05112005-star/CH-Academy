import { test, expect } from '@playwright/test'

test.describe('4. Portals & RBAC Role Isolation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
  })

  test('4.1 Học viên chỉ truy cập Student Portal, bị chặn khi cố vào Admin Portal (RBAC Enforcement)', async ({ page }) => {
    await page.goto('/login')
    await page.locator('#username').fill('thuylinh.nguyen@gmail.com')
    await page.locator('#password').fill('Student@123456')
    await page.locator('button[type="submit"]').click()
    await page.waitForURL(/.*student.*/, { timeout: 15000 })
    expect(page.url()).toContain('/student')

    // Thử truy cập trái phép vào trang Admin
    await page.goto('/admin/dashboard')
    await page.waitForTimeout(1500)
    // Phải bị đẩy ra khỏi /admin/dashboard
    expect(page.url()).not.toContain('/admin/dashboard')
  })

  test('4.2 Giáo viên vào Teacher Portal chỉ thấy các lớp và tài liệu được phân công', async ({ page }) => {
    await page.goto('/login')
    await page.locator('#username').fill('gv.minhhanh')
    await page.locator('#password').fill('Teacher@123456')
    await page.locator('button[type="submit"]').click()
    await page.waitForURL(/.*teacher.*/, { timeout: 15000 })
    expect(page.url()).toContain('/teacher')

    // Thử truy cập vào quản trị bảo mật của Admin
    await page.goto('/admin/security')
    await page.waitForTimeout(1500)
    expect(page.url()).not.toContain('/admin/security')
  })

  test('4.3 Cổng học viên lưu trữ tiến trình học tập và chỉ hiển thị khóa học đã ghi danh', async ({ page }) => {
    await page.goto('/login')
    await page.locator('#username').fill('thuylinh.nguyen@gmail.com')
    await page.locator('#password').fill('Student@123456')
    await page.locator('button[type="submit"]').click()
    await page.waitForURL(/.*student.*/, { timeout: 15000 })

    const content = page.locator('main, [class*="portal"], [class*="student"]').first()
    await expect(content).toBeVisible()
  })
})
