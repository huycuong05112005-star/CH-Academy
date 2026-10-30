export interface ChatConversationItem {
  id: number
  classId?: number | null
  classCode?: string | null
  className?: string | null
  title: string
  type: string
  memberCount: number
  unreadCount: number
  lastMessage: string
  lastMessageTime: string
  updatedAt: string
}

export interface ChatMessageItem {
  id: number
  conversationId: number
  senderId: number
  senderName: string
  senderUsername: string
  messageType: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM'
  content: string
  attachmentUrl?: string | null
  attachmentName?: string | null
  isPinned?: boolean
  createdAt: string
}

export interface AiConversationItem {
  id: number
  title: string
  role: string
  createdAt: string
  updatedAt: string
}

export interface AiMessageItem {
  id: number
  conversationId: number
  role: 'user' | 'assistant' | 'system'
  content: string
  sourcesJson?: string | null
  createdAt: string
}

export interface AiChatSourceCitation {
  documentName: string
  section?: string
  snippet?: string
}

export interface AiChatResponseData {
  conversationId: number
  answer: string
  sources: AiChatSourceCitation[]
}

