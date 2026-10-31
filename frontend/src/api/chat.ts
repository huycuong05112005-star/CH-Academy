import { apiClient, type ApiResponse } from './client'
import type {
  ChatConversationItem,
  ChatMessageItem,
  AiConversationItem,
  AiMessageItem,
  AiChatResponseData,
  AiAgentItem,
  AiKnowledgeBaseItem,
  AiKbDocumentItem,
  AiFlowItem,
  AiLeadItem,
  AiChannelConfigItem,
  AiAnalyticsData
} from '../types/chat'

// ==========================================
// 1. CLASS GROUP CHAT API
// ==========================================

export const classChatApi = {
  getMyConversations: (): Promise<ApiResponse<ChatConversationItem[]>> =>
    apiClient.get<ChatConversationItem[]>('/chat/classes/conversations'),

  getMessages: (conversationId: number): Promise<ApiResponse<ChatMessageItem[]>> =>
    apiClient.get<ChatMessageItem[]>(`/chat/classes/conversations/${conversationId}/messages`),

  sendMessage: (
    conversationId: number,
    data: { content: string; messageType?: string; attachmentUrl?: string; attachmentName?: string }
  ): Promise<ApiResponse<ChatMessageItem>> =>
    apiClient.post<ChatMessageItem>(`/chat/classes/conversations/${conversationId}/messages`, data),

  markAsRead: (conversationId: number): Promise<ApiResponse<void>> =>
    apiClient.post<void>(`/chat/classes/conversations/${conversationId}/read`, {})
}

// ==========================================
// 2. GEN AI CHAT API (PORTAL & PUBLIC)
// ==========================================

export const aiChatApi = {
  getConversations: (portal?: string): Promise<ApiResponse<AiConversationItem[]>> => {
    const q = portal ? `?portal=${encodeURIComponent(portal)}` : ''
    return apiClient.get<AiConversationItem[]>(`/chat/ai/conversations${q}`)
  },

  getMessages: (conversationId: number, portal?: string): Promise<ApiResponse<AiMessageItem[]>> => {
    const q = portal ? `?portal=${encodeURIComponent(portal)}` : ''
    return apiClient.get<AiMessageItem[]>(`/chat/ai/conversations/${conversationId}/messages${q}`)
  },
  getAiMessages: (conversationId: number, portal?: string): Promise<ApiResponse<AiMessageItem[]>> => {
    const q = portal ? `?portal=${encodeURIComponent(portal)}` : ''
    return apiClient.get<AiMessageItem[]>(`/chat/ai/conversations/${conversationId}/messages${q}`)
  },

  ask: (data: {
    question?: string
    message?: string
    conversationId?: number
    portal?: string
    channel?: string
    agentCode?: string
    sessionId?: string
  }): Promise<ApiResponse<AiChatResponseData>> =>
    apiClient.post<AiChatResponseData>('/chat/ai/ask', {
      question: data.question || data.message || '',
      conversationId: data.conversationId,
      portal: data.portal,
      channel: data.channel,
      agentCode: data.agentCode,
      sessionId: data.sessionId
    }),

  askAi: (data: {
    question?: string
    message?: string
    conversationId?: number
    portal?: string
    channel?: string
    agentCode?: string
    sessionId?: string
  }): Promise<ApiResponse<AiChatResponseData>> =>
    apiClient.post<AiChatResponseData>('/chat/ai/ask', {
      question: data.question || data.message || '',
      conversationId: data.conversationId,
      portal: data.portal,
      channel: data.channel,
      agentCode: data.agentCode,
      sessionId: data.sessionId
    }),

  requestHandoff: (conversationId: number, portal?: string): Promise<ApiResponse<string>> => {
    const q = portal ? `?portal=${encodeURIComponent(portal)}` : ''
    return apiClient.post<string>(`/chat/ai/conversations/${conversationId}/handoff${q}`, {})
  },

  // Public Guest Chat (Website)
  getPublicConversations: (sessionId: string): Promise<ApiResponse<AiConversationItem[]>> =>
    apiClient.get<AiConversationItem[]>(`/chat/ai/public/conversations?sessionId=${encodeURIComponent(sessionId)}`),

  getPublicMessages: (conversationId: number, sessionId: string): Promise<ApiResponse<AiMessageItem[]>> =>
    apiClient.get<AiMessageItem[]>(`/chat/ai/public/conversations/${conversationId}/messages?sessionId=${encodeURIComponent(sessionId)}`),

  askPublic: (data: {
    question?: string
    message?: string
    conversationId?: number
    sessionId: string
    guestName?: string
    guestPhone?: string
    agentCode?: string
  }): Promise<ApiResponse<AiChatResponseData>> =>
    apiClient.post<AiChatResponseData>('/chat/ai/public/ask', {
      question: data.question || data.message || '',
      conversationId: data.conversationId,
      sessionId: data.sessionId,
      guestName: data.guestName,
      guestPhone: data.guestPhone
    }),

  askPublicAi: (data: {
    question?: string
    message?: string
    conversationId?: number
    sessionId: string
    guestName?: string
    guestPhone?: string
    agentCode?: string
  }): Promise<ApiResponse<AiChatResponseData>> =>
    apiClient.post<AiChatResponseData>('/chat/ai/public/ask', {
      question: data.question || data.message || '',
      conversationId: data.conversationId,
      sessionId: data.sessionId,
      guestName: data.guestName,
      guestPhone: data.guestPhone
    }),

  submitLead: (data: {
    conversationId?: number
    fullName: string
    phone: string
    courseInterest?: string
    note?: string
  }): Promise<ApiResponse<AiLeadItem>> =>
    apiClient.post<AiLeadItem>('/chat/ai/public/lead', data)
}

// ==========================================
// 3. AI AGENT STUDIO ADMIN API
// ==========================================

export const aiStudioApi = {
  // Agents
  getAgents: (): Promise<ApiResponse<AiAgentItem[]>> =>
    apiClient.get<AiAgentItem[]>('/admin/ai/agents'),

  getAgentById: (id: number): Promise<ApiResponse<AiAgentItem>> =>
    apiClient.get<AiAgentItem>(`/admin/ai/agents/${id}`),

  createAgent: (data: Partial<AiAgentItem>): Promise<ApiResponse<AiAgentItem>> =>
    apiClient.post<AiAgentItem>('/admin/ai/agents', data),

  updateAgent: (id: number, data: Partial<AiAgentItem>): Promise<ApiResponse<AiAgentItem>> =>
    apiClient.put<AiAgentItem>(`/admin/ai/agents/${id}`, data),

  cloneAgent: (id: number): Promise<ApiResponse<AiAgentItem>> =>
    apiClient.post<AiAgentItem>(`/admin/ai/agents/${id}/clone`, {}),

  deleteAgent: (id: number): Promise<ApiResponse<string>> =>
    apiClient.delete<string>(`/admin/ai/agents/${id}`),

  // Knowledge Bases
  getKnowledgeBases: (): Promise<ApiResponse<AiKnowledgeBaseItem[]>> =>
    apiClient.get<AiKnowledgeBaseItem[]>('/admin/ai/knowledge-bases'),

  createKnowledgeBase: (data: Partial<AiKnowledgeBaseItem>): Promise<ApiResponse<AiKnowledgeBaseItem>> =>
    apiClient.post<AiKnowledgeBaseItem>('/admin/ai/knowledge-bases', data),

  deleteKnowledgeBase: (id: number): Promise<ApiResponse<string>> =>
    apiClient.delete<string>(`/admin/ai/knowledge-bases/${id}`),

  getDocuments: (kbId: number): Promise<ApiResponse<AiKbDocumentItem[]>> =>
    apiClient.get<AiKbDocumentItem[]>(`/admin/ai/knowledge-bases/${kbId}/documents`),

  uploadDocument: (kbId: number, formData: FormData): Promise<ApiResponse<AiKbDocumentItem>> =>
    apiClient.post<AiKbDocumentItem>(`/admin/ai/knowledge-bases/${kbId}/documents`, formData),

  deleteDocument: (docId: number): Promise<ApiResponse<string>> =>
    apiClient.delete<string>(`/admin/ai/documents/${docId}`),

  getDocumentDetail: (docId: number): Promise<ApiResponse<AiKbDocumentItem>> =>
    apiClient.get<AiKbDocumentItem>(`/admin/ai/documents/${docId}`),

  getDocumentChunks: (docId: number): Promise<ApiResponse<Array<{ id: number; chunkIndex: number; content: string }>>> =>
    apiClient.get<Array<{ id: number; chunkIndex: number; content: string }>>(`/admin/ai/documents/${docId}/chunks`),

  reindexDocument: (docId: number): Promise<ApiResponse<AiKbDocumentItem>> =>
    apiClient.post<AiKbDocumentItem>(`/admin/ai/documents/${docId}/reindex`, {}),

  // Flows
  getFlows: (): Promise<ApiResponse<AiFlowItem[]>> =>
    apiClient.get<AiFlowItem[]>('/admin/ai/flows'),

  saveFlow: (data: Partial<AiFlowItem>): Promise<ApiResponse<AiFlowItem>> =>
    apiClient.post<AiFlowItem>('/admin/ai/flows', data),

  updateFlow: (id: number, data: Partial<AiFlowItem>): Promise<ApiResponse<AiFlowItem>> =>
    apiClient.put<AiFlowItem>(`/admin/ai/flows/${id}`, data),

  deleteFlow: (id: number): Promise<ApiResponse<string>> =>
    apiClient.delete<string>(`/admin/ai/flows/${id}`),

  // Leads
  getLeads: (): Promise<ApiResponse<AiLeadItem[]>> =>
    apiClient.get<AiLeadItem[]>('/admin/ai/leads'),

  updateLeadStatus: (id: number, status: string): Promise<ApiResponse<AiLeadItem>> =>
    apiClient.put<AiLeadItem>(`/admin/ai/leads/${id}/status?status=${encodeURIComponent(status)}`, {}),

  // Channels
  getChannels: (): Promise<ApiResponse<AiChannelConfigItem[]>> =>
    apiClient.get<AiChannelConfigItem[]>('/admin/ai/channels'),

  updateChannel: (channelType: string, data: Partial<AiChannelConfigItem>): Promise<ApiResponse<AiChannelConfigItem>> =>
    apiClient.put<AiChannelConfigItem>(`/admin/ai/channels/${channelType}`, data),

  // Analytics
  getAnalytics: (): Promise<ApiResponse<AiAnalyticsData>> =>
    apiClient.get<AiAnalyticsData>('/admin/ai/analytics'),

  // Conversations Audit
  getAllConversations: (params?: { portal?: string; status?: string }): Promise<ApiResponse<AiConversationItem[]>> => {
    const sp = new URLSearchParams()
    if (params?.portal) sp.append('portal', params.portal)
    if (params?.status) sp.append('status', params.status)
    const q = sp.toString() ? `?${sp.toString()}` : ''
    return apiClient.get<AiConversationItem[]>(`/admin/ai/conversations${q}`)
  },

  getConversationMessages: (id: number): Promise<ApiResponse<AiMessageItem[]>> =>
    apiClient.get<AiMessageItem[]>(`/admin/ai/conversations/${id}/messages`)
}
