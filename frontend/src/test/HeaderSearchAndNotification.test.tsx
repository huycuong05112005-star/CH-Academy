import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { HeaderSearchBar } from '../components/ui/HeaderSearchBar'
import { NotificationBell } from '../components/ui/NotificationBell'
import { CommandPalette } from '../components/ui/CommandPalette'
import { NotificationDetailModal } from '../components/ui/NotificationDetailModal'
import type { NotificationItem } from '../types/notification'

// Mock api
vi.mock('../api/notifications', () => ({
  notificationsApi: {
    markAsRead: vi.fn().mockResolvedValue({ success: true }),
    markAllAsRead: vi.fn().mockResolvedValue({ success: true }),
    getDetail: vi.fn().mockResolvedValue({ success: true })
  }
}))

describe('HeaderSearchBar Component', () => {
  it('hiển thị thanh tìm kiếm với placeholder và phím tắt', () => {
    const handleClick = vi.fn()
    render(
      <HeaderSearchBar
        onClick={handleClick}
        placeholder="Tìm kiếm nhanh chức năng, mã lớp..."
        shortcutText="Ctrl K"
      />
    )

    expect(screen.getByText('Tìm kiếm nhanh chức năng, mã lớp...')).toBeInTheDocument()
    expect(screen.getByText('Ctrl K')).toBeInTheDocument()

    const button = screen.getByRole('button')
    fireEvent.click(button)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})

describe('NotificationBell & Detail Modal Component', () => {
  const mockNotifications: NotificationItem[] = [
    {
      id: 1,
      title: 'Lịch thi kết thúc môn',
      content: 'Lớp Lập trình Web sẽ thi vào 08:00 sáng Thứ Bảy.',
      priority: 'HIGH',
      targetAudience: 'STUDENTS',
      createdAt: '2026-10-30T08:00:00Z',
      isRead: false
    },
    {
      id: 2,
      title: 'Nhắc nhở nộp điểm danh',
      content: 'Vui lòng hoàn tất điểm danh ca sáng nay.',
      priority: 'NORMAL',
      targetAudience: 'TEACHERS',
      createdAt: '2026-10-30T09:00:00Z',
      isRead: false
    }
  ]

  it('hiển thị chuông thông báo và badge số lượng chưa đọc', () => {
    render(
      <MemoryRouter>
        <NotificationBell notifications={mockNotifications} />
      </MemoryRouter>
    )

    const bellBtn = screen.getByRole('button', { name: /thông báo/i })
    expect(bellBtn).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('không hiển thị badge đỏ khi tất cả thông báo đã đọc', () => {
    const allRead = mockNotifications.map((n) => ({ ...n, isRead: true }))
    render(
      <MemoryRouter>
        <NotificationBell notifications={allRead} />
      </MemoryRouter>
    )

    // Badge số lượng không tồn tại
    expect(screen.queryByText('2')).not.toBeInTheDocument()
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('hiển thị badge 9+ khi số lượng thông báo chưa đọc vượt quá 9', () => {
    const manyNotifications = Array.from({ length: 12 }, (_, i) => ({
      ...mockNotifications[0],
      id: i + 1,
      isRead: false
    }))

    render(
      <MemoryRouter>
        <NotificationBell notifications={manyNotifications} />
      </MemoryRouter>
    )

    expect(screen.getByText('9+')).toBeInTheDocument()
  })

  it('mở danh sách thông báo khi click vào chuông và xem chi tiết, cập nhật số chưa đọc', async () => {
    const handleRefresh = vi.fn()
    const handleRead = vi.fn()

    render(
      <MemoryRouter>
        <NotificationBell
          notifications={mockNotifications}
          onRefresh={handleRefresh}
          onNotificationRead={handleRead}
          title="Thông báo học vụ"
        />
      </MemoryRouter>
    )

    const bellBtn = screen.getByRole('button', { name: /thông báo/i })
    fireEvent.click(bellBtn)

    expect(screen.getByText('2 mới')).toBeInTheDocument()
    expect(screen.getByText('Lịch thi kết thúc môn')).toBeInTheDocument()

    // Click vào thông báo 1 để mở modal chi tiết
    const notifItem = screen.getByText('Lịch thi kết thúc môn')
    fireEvent.click(notifItem)

    // Modal chi tiết xuất hiện
    expect(screen.getByText('Chi tiết thông báo')).toBeInTheDocument()
    expect(screen.getAllByText('Lớp Lập trình Web sẽ thi vào 08:00 sáng Thứ Bảy.').length).toBeGreaterThanOrEqual(1)

    // Callback onNotificationRead đã được gọi
    expect(handleRead).toHaveBeenCalledWith(1)

    // Đóng modal chi tiết
    const closeDetailBtn = screen.getByRole('button', { name: 'Đóng' })
    fireEvent.click(closeDetailBtn)

    // Badge số lượng chưa đọc giảm từ 2 xuống 1
    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument()
    })
  })

  it('cho phép đánh dấu đọc tất cả và cập nhật badge về 0', async () => {
    render(
      <MemoryRouter>
        <NotificationBell notifications={mockNotifications} />
      </MemoryRouter>
    )

    const bellBtn = screen.getByRole('button', { name: /thông báo/i })
    fireEvent.click(bellBtn)

    const markAllBtn = screen.getByText('Đọc hết')
    fireEvent.click(markAllBtn)

    // Badge biến mất vì đã đọc hết
    await waitFor(() => {
      expect(screen.queryByText('2')).not.toBeInTheDocument()
      expect(screen.getByText('(Đã đọc hết)')).toBeInTheDocument()
    })
  })
})

describe('CommandPalette Close Buttons & Shortcuts', () => {
  it('đóng thanh tìm kiếm khi bấm nút dấu x ở góc trên bên phải', () => {
    const handleClose = vi.fn()

    render(
      <MemoryRouter>
        <CommandPalette
          isOpen={true}
          onClose={handleClose}
          portal="admin"
        />
      </MemoryRouter>
    )

    // Nút đóng dấu X ở trên
    const topCloseBtn = screen.getByRole('button', { name: 'Đóng tìm kiếm' })
    expect(topCloseBtn).toBeInTheDocument()
    fireEvent.click(topCloseBtn)

    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('không còn hiển thị dòng chữ CH Academy Quick Navigator và nút đóng ở footer, hỗ trợ phím Escape', () => {
    const handleClose = vi.fn()

    render(
      <MemoryRouter>
        <CommandPalette
          isOpen={true}
          onClose={handleClose}
          portal="teacher"
        />
      </MemoryRouter>
    )

    // Đã xóa chữ CH Academy Quick Navigator
    expect(screen.queryByText('CH Academy Quick Navigator')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Đóng thanh tìm kiếm' })).not.toBeInTheDocument()

    // Bấm phím Escape để đóng
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(handleClose).toHaveBeenCalledTimes(1)
  })
})
