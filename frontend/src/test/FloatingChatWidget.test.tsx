import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { FloatingChatWidget } from '../components/chat/FloatingChatWidget'
import { classChatApi, aiChatApi, chatApi } from '../api/chat'

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
    getTotalUnreadCount: vi.fn().mockResolvedValue({ success: true, data: 2 }),
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
    requestHandoff: vi.fn(),
    getPortalConfig: vi.fn().mockResolvedValue({
      success: true,
      data: {
        portal: 'STUDENT',
        agentCode: 'AGENT_STUDENT_TUTOR',
        agentName: 'AI Gia sư',
        roleName: 'Trợ lý Học tập',
        features: { hasGroupChat: true, hasVoiceCall: true, hasTutoringMode: true }
      }
    })
  },
  chatApi: {
    getConversations: vi.fn().mockResolvedValue({ success: true, data: [] }),
    getMessages: vi.fn().mockResolvedValue({ success: true, data: [] }),
    ask: vi.fn(),
    getPublicConversations: vi.fn().mockResolvedValue({ success: true, data: [] }),
    getPublicMessages: vi.fn().mockResolvedValue({ success: true, data: [] }),
    askPublic: vi.fn(),
    submitLead: vi.fn(),
    requestHandoff: vi.fn(),
    getPortalConfig: vi.fn().mockResolvedValue({
      success: true,
      data: {
        portal: 'STUDENT',
        agentCode: 'AGENT_STUDENT_TUTOR',
        agentName: 'AI Gia sư',
        roleName: 'Trợ lý Học tập',
        features: { hasGroupChat: true, hasVoiceCall: true, hasTutoringMode: true }
      }
    })
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
    ;(classChatApi.getTotalUnreadCount as any).mockResolvedValue({
      success: true,
      data: 2
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

  it('1. Hiển thị nút chat nổi Cổng Học viên với badge số tin nhắn chưa đọc', async () => {
    render(
      <MemoryRouter initialEntries={['/student']}>
        <FloatingChatWidget />
      </MemoryRouter>
    )

    const triggerBtn = screen.getByTitle(/AI Gia sư & Chat Nhóm lớp/i)
    expect(triggerBtn).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument()
    })
  })

  it('2. Bấm vào nút chat Cổng Học viên mở trực tiếp AI Gia sư mặc định, không có tư vấn tuyển sinh', async () => {
    render(
      <MemoryRouter initialEntries={['/student']}>
        <FloatingChatWidget />
      </MemoryRouter>
    )

    const triggerBtn = screen.getByTitle(/AI Gia sư & Chat Nhóm lớp/i)
    fireEvent.click(triggerBtn)

    // Phải mở giao diện học viên với tab AI Gia sư mặc định
    await waitFor(() => {
      expect(screen.getAllByText('AI Gia sư').length).toBeGreaterThan(0)
      expect(screen.getByText('Chat nhóm lớp')).toBeInTheDocument()
      expect(screen.queryByText('Chuyên viên Tư vấn Tuyển sinh AI')).not.toBeInTheDocument()
      expect(screen.queryByText('Tư vấn ngay')).not.toBeInTheDocument()
    })
  })

  it('3. Chọn Chat nhóm mở cửa sổ nhóm lớp và hiển thị tin nhắn', async () => {
    render(
      <MemoryRouter initialEntries={['/student']}>
        <FloatingChatWidget />
      </MemoryRouter>
    )

    const triggerBtn = screen.getByTitle(/AI Gia sư & Chat Nhóm lớp/i)
    fireEvent.click(triggerBtn)

    const groupTab = screen.getByText('Chat nhóm lớp')
    fireEvent.click(groupTab)

    // Cửa sổ chat nhóm mở và hiển thị tin nhắn
    await waitFor(() => {
      expect(screen.getByText('Chào mừng các bạn học viên đến với nhóm học tập!')).toBeInTheDocument()
    })
  })

  it('4. Chuyển sang tab AI Gia sư và gửi câu hỏi thành công', async () => {
    const mockResponse = {
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
    }
    ;(aiChatApi.ask as any).mockResolvedValue(mockResponse)
    ;(chatApi.ask as any).mockResolvedValue(mockResponse)

    render(
      <MemoryRouter initialEntries={['/student']}>
        <FloatingChatWidget />
      </MemoryRouter>
    )

    const triggerBtn = screen.getByTitle(/AI Gia sư & Chat Nhóm lớp/i)
    fireEvent.click(triggerBtn)

    // Màn hình AI Gia sư hiển thị
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

  it('5. Trang chủ công khai (/) chỉ hiển thị duy nhất AI Tư vấn Tuyển sinh, KHÔNG có Chat nhóm lớp', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <FloatingChatWidget />
      </MemoryRouter>
    )

    const triggerBtn = screen.getByTitle(/Tư vấn Tuyển sinh AI/i)
    expect(triggerBtn).toBeInTheDocument()
    fireEvent.click(triggerBtn)

    // Phải mở trực tiếp chatbox Tư vấn Tuyển sinh
    await waitFor(() => {
      expect(screen.getByText('Chuyên viên Tư vấn Tuyển sinh AI')).toBeInTheDocument()
      expect(screen.getByText('Tư vấn ngay')).toBeInTheDocument()
      // Tuyệt đối không có Chat nhóm lớp
      expect(screen.queryByText('Chat nhóm lớp')).not.toBeInTheDocument()
      expect(screen.queryByText('Kênh kết nối CH Academy')).not.toBeInTheDocument()
    })
  })
})
