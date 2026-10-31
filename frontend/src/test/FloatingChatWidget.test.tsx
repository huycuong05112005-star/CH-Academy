import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { FloatingChatWidget } from '../components/chat/FloatingChatWidget'
import { classChatApi, aiChatApi } from '../api/chat'

// Mock useAuth
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 2, username: 'thuylinh', fullName: 'Nguyễn Thùy Linh', roles: [{ id: 'STUDENT' }] },
    isAuthenticated: true
  })
}))

// Mock Chat APIs
vi.mock('../api/chat', () => ({
  classChatApi: {
    getMyConversations: vi.fn(),
    getMessages: vi.fn(),
    sendMessage: vi.fn(),
    markAsRead: vi.fn().mockResolvedValue({ success: true })
  },
  aiChatApi: {
    getConversations: vi.fn().mockResolvedValue({ success: true, data: [] }),
    getMessages: vi.fn().mockResolvedValue({ success: true, data: [] }),
    ask: vi.fn(),
    getPublicConversations: vi.fn().mockResolvedValue({ success: true, data: [] }),
    getPublicMessages: vi.fn().mockResolvedValue({ success: true, data: [] }),
    askPublic: vi.fn(),
    submitLead: vi.fn(),
    requestHandoff: vi.fn()
  }
}))

describe('FloatingChatWidget Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(classChatApi.getMyConversations as any).mockResolvedValue({
      success: true,
      data: [
        {
          id: 1,
          classId: 2,
          classCode: 'CLS-ENG-PRO01',
          className: 'Lớp Giao Tiếp Công Sở',
          title: 'Nhóm học tập: Lớp Giao Tiếp Công Sở',
          type: 'CLASS_GROUP',
          memberCount: 5,
          unreadCount: 2,
          lastMessage: 'Thầy Nam: Chào các em',
          lastMessageTime: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
    })
    ;(classChatApi.getMessages as any).mockResolvedValue({
      success: true,
      data: [
        {
          id: 101,
          conversationId: 1,
          senderId: 6,
          senderName: 'Lê Hoàng Nam',
          senderUsername: 'gv.hoangnam',
          messageType: 'SYSTEM',
          content: 'Chào mừng các bạn học viên đến với nhóm học tập!',
          createdAt: new Date().toISOString()
        }
      ]
    })
  })

  it('1. Hiển thị nút chat nổi với badge số tin nhắn chưa đọc', async () => {
    render(
      <MemoryRouter initialEntries={['/portal']}>
        <FloatingChatWidget />
      </MemoryRouter>
    )

    const triggerBtn = screen.getByTitle('Mở kênh liên lạc CH Academy')
    expect(triggerBtn).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument()
    })
  })

  it('2. Bấm vào nút chat mở menu lựa chọn (Chat nhóm & Chat AI)', async () => {
    render(
      <MemoryRouter initialEntries={['/portal']}>
        <FloatingChatWidget />
      </MemoryRouter>
    )

    const triggerBtn = screen.getByTitle('Mở kênh liên lạc CH Academy')
    fireEvent.click(triggerBtn)

    expect(screen.getByText('Kênh kết nối CH Academy')).toBeInTheDocument()
    expect(screen.getByText('Chat nhóm lớp')).toBeInTheDocument()
    expect(screen.getByText('Trợ giảng AI Đồng hành')).toBeInTheDocument()
  })

  it('3. Chọn Chat nhóm mở cửa sổ nhóm lớp và hiển thị tin nhắn', async () => {
    render(
      <MemoryRouter initialEntries={['/portal']}>
        <FloatingChatWidget />
      </MemoryRouter>
    )

    const triggerBtn = screen.getByTitle('Mở kênh liên lạc CH Academy')
    fireEvent.click(triggerBtn)

    const groupOption = screen.getByText('Chat nhóm lớp')
    fireEvent.click(groupOption)

    // Cửa sổ chat nhóm mở
    await waitFor(() => {
      expect(screen.getByText('Chào mừng các bạn học viên đến với nhóm học tập!')).toBeInTheDocument()
    })
  })

  it('4. Chuyển sang tab Trợ lý AI và gửi câu hỏi thành công', async () => {
    ;(aiChatApi.ask as any).mockResolvedValue({
      success: true,
      data: {
        conversationId: 10,
        answer: 'Bạn hiện đang theo học lớp CLS-ENG-PRO01.',
        sources: [
          {
            documentName: 'Cơ sở dữ liệu CH Academy',
            section: 'Hồ sơ học viên',
            snippet: 'Lớp Giao Tiếp Công Sở'
          }
        ]
      }
    })

    render(
      <MemoryRouter initialEntries={['/portal']}>
        <FloatingChatWidget />
      </MemoryRouter>
    )

    const triggerBtn = screen.getByTitle('Mở kênh liên lạc CH Academy')
    fireEvent.click(triggerBtn)

    const aiOption = screen.getByText('Trợ giảng AI Đồng hành')
    fireEvent.click(aiOption)

    // Màn hình AI hiển thị
    await waitFor(() => {
      expect(screen.getByText(/Hướng dẫn giải bài tập theo 6 bước sư phạm/)).toBeInTheDocument()
    })

    // Bấm vào gợi ý câu hỏi
    const promptPill = screen.getByText(/Hướng dẫn giải bài tập theo 6 bước sư phạm/)
    fireEvent.click(promptPill)

    await waitFor(() => {
      expect(screen.getByText('Bạn hiện đang theo học lớp CLS-ENG-PRO01.')).toBeInTheDocument()
      expect(screen.getByText(/Cơ sở dữ liệu CH Academy/i)).toBeInTheDocument()
    })
  })
})
