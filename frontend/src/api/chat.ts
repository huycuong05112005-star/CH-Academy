import { apiClient, type ApiResponse } from './client'
import type {
  ChatConversationItem,
  ChatMessageItem,
  AiConversationItem,
  AiMessageItem,
  AiChatResponseData
} from '../types/chat'

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

export const aiChatApi = {
  getConversations: (): Promise<ApiResponse<AiConversationItem[]>> =>
    apiClient.get<AiConversationItem[]>('/chat/ai/conversations'),

  getMessages: (conversationId: number): Promise<ApiResponse<AiMessageItem[]>> =>
    apiClient.get<AiMessageItem[]>(`/chat/ai/conversations/${conversationId}/messages`),

  ask: (data: { question: string; conversationId?: number }): Promise<ApiResponse<AiChatResponseData>> =>
    apiClient.post<AiChatResponseData>('/chat/ai/ask', data)
}

