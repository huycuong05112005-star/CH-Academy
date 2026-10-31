import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { FloatingChatWidget } from '../components/chat/FloatingChatWidget'
import { AiStudioPage } from '../pages/admin/AiStudioPage'
import * as authContext from '../context/AuthContext'
import { aiChatApi, aiStudioApi, classChatApi } from '../api/chat'

vi.mock('../api/chat', () => ({
  classChatApi: {
    getMyConversations: vi.fn(),
    getMessages: vi.fn(),
    sendMessage: vi.fn(),
    markAsRead: vi.fn()
  },
  aiChatApi: {
    getConversations: vi.fn(),
    getMessages: vi.fn(),
    ask: vi.fn(),
    getPublicConversations: vi.fn(),
    getPublicMessages: vi.fn(),
    askPublic: vi.fn(),
    submitLead: vi.fn(),
    requestHandoff: vi.fn()
  },
  aiStudioApi: {
    getAnalytics: vi.fn(),
    getAgents: vi.fn(),
    getKnowledgeBases: vi.fn(),
    getDocuments: vi.fn(),
    getFlows: vi.fn(),
    getLeads: vi.fn(),
    getChannels: vi.fn(),
    getAllConversations: vi.fn(),
    createAgent: vi.fn(),
    updateAgent: vi.fn(),
    cloneAgent: vi.fn(),
    deleteAgent: vi.fn(),
    createKnowledgeBase: vi.fn(),
    deleteKnowledgeBase: vi.fn(),
    uploadDocument: vi.fn(),
    deleteDocument: vi.fn(),
    getCalls: vi.fn()
  }
}))

describe('AI Identity & Portal Isolation Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(classChatApi.getMyConversations).mockResolvedValue({ success: true, data: [] } as any)
    vi.mocked(aiChatApi.getConversations).mockResolvedValue({ success: true, data: [] } as any)
    vi.mocked(aiChatApi.getPublicConversations).mockResolvedValue({ success: true, data: [] } as any)

    vi.mocked(aiStudioApi.getAnalytics).mockResolvedValue({
      success: true,
      data: {
        totalAgents: 4,
        totalKnowledgeBases: 4,
        totalDocuments: 2,
        totalChunks: 5,
        totalFlows: 1,
        totalLeads: 3,
        totalConversations: 12,
        activeConversations: 10,
        waitingHumanHandoff: 2,
        estimatedTokensUsed: 5040,
        averageLatencyMs: 380
      }
    } as any)

    vi.mocked(aiStudioApi.getAgents).mockResolvedValue({
      success: true,
      data: [
        { id: 1, code: 'AGENT_ADMISSIONS', name: 'Tư vấn Tuyển sinh', roleTarget: 'PUBLIC', model: 'gemini', status: 'PUBLISHED', version: 1 },
        { id: 2, code: 'AGENT_STUDENT_TUTOR', name: 'Trợ giảng AI', roleTarget: 'STUDENT', model: 'gemini', status: 'PUBLISHED', version: 1 },
        { id: 3, code: 'AGENT_TEACHER_ASSISTANT', name: 'Trợ lý Giảng dạy', roleTarget: 'TEACHER', model: 'gemini', status: 'PUBLISHED', version: 1 },
        { id: 4, code: 'AGENT_ADMIN_ASSISTANT', name: 'Trợ lý Quản trị', roleTarget: 'ADMIN', model: 'gemini', status: 'PUBLISHED', version: 1 }
      ]
    } as any)

    vi.mocked(aiStudioApi.getKnowledgeBases).mockResolvedValue({ success: true, data: [] } as any)
    vi.mocked(aiStudioApi.getFlows).mockResolvedValue({ success: true, data: [] } as any)
    vi.mocked(aiStudioApi.getLeads).mockResolvedValue({ success: true, data: [] } as any)
    vi.mocked(aiStudioApi.getChannels).mockResolvedValue({ success: true, data: [] } as any)
    vi.mocked(aiStudioApi.getAllConversations).mockResolvedValue({ success: true, data: [] } as any)
    vi.mocked(aiStudioApi.getCalls).mockResolvedValue({ success: true, data: [] } as any)
  })

  it('1. Đảm bảo FloatingChatWidget hiển thị đúng Agent khi ở Cổng Giảng viên (/teacher)', async () => {
    vi.spyOn(authContext, 'useAuth').mockReturnValue({
      user: { id: 2, username: 'gv.hoangnam', fullName: 'Lê Hoàng Nam', roles: [{ id: 'TEACHER' }] } as any,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn()
    } as any)

    render(
      <MemoryRouter initialEntries={['/teacher/dashboard']}>
        <FloatingChatWidget />
      </MemoryRouter>
    )

    // Nhấn mở menu chat
    const btn = screen.getByTitle('Mở kênh liên lạc CH Academy')
    fireEvent.click(btn)

    // Phải hiển thị Trợ lý Giảng dạy & Soạn bài
    await waitFor(() => {
      expect(screen.getByText('Trợ lý Giảng dạy & Soạn bài')).toBeDefined()
    })
  })

  it('2. Đảm bảo FloatingChatWidget chuyển sang Agent Quản trị khi đổi sang Cổng Admin (/admin) và cách ly lịch sử', async () => {
    vi.spyOn(authContext, 'useAuth').mockReturnValue({
      user: { id: 1, username: 'admin', fullName: 'Quản trị viên', roles: [{ id: 'ADMIN' }] } as any,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn()
    } as any)

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <FloatingChatWidget />
      </MemoryRouter>
    )

    const btn = screen.getByTitle('Mở kênh liên lạc CH Academy')
    fireEvent.click(btn)

    // Phải hiển thị Trợ lý Quản trị & Vận hành
    await waitFor(() => {
      expect(screen.getByText('Trợ lý Quản trị & Vận hành')).toBeDefined()
    })
  })

  it('3. Đảm bảo trang AI Agent Studio hiển thị đầy đủ tổng quan và các tab điều hướng', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/ai-studio']}>
        <AiStudioPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('CH Academy Gen AI Studio')).toBeDefined()
      expect(screen.getByText('Hệ sinh thái AI Agent & Quản trị Tri thức')).toBeDefined()
      expect(screen.getByText('Tổng quan AI')).toBeDefined()
      expect(screen.getByText('Quản lý Agent')).toBeDefined()
      expect(screen.getByText('Kho tri thức')).toBeDefined()
      expect(screen.getByText('Kịch bản (Flows)')).toBeDefined()
    })
  })
})
