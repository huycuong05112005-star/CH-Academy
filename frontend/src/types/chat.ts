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
  portal: string
  channel: string
  agentCode?: string
  status: 'ACTIVE' | 'WAITING_HUMAN' | 'AGENT_JOINED' | 'CLOSED'
  sessionId?: string
  guestName?: string
  guestPhone?: string
  createdAt: string
  updatedAt: string
}

export interface AiMessageItem {
  id: number
  conversationId: number
  role: 'user' | 'assistant' | 'system'
  content: string
  sourcesJson?: string | null
  tokensUsed?: number
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

// AI Studio Management Types
export interface AiAgentItem {
  id: number
  code: string
  name: string
  description?: string
  roleTarget: 'PUBLIC' | 'STUDENT' | 'TEACHER' | 'ADMIN'
  scope?: 'PUBLIC_ADMISSION' | 'STUDENT_TUTOR' | 'TEACHER_ASSISTANT' | 'ADMIN_ASSISTANT' | string
  model: string
  systemPrompt: string
  status: 'DRAFT' | 'PUBLISHED' | 'PAUSED'
  temperature: number
  maxTokens: number
  topP?: number
  isPublished?: boolean
  welcomeMessage?: string
  quickPrompts?: string
  version: number
  settingsJson?: string
  knowledgeBaseIds: number[]
  knowledgeBaseNames: string[]
  createdAt: string
  updatedAt: string
}

export interface AiKnowledgeBaseItem {
  id: number
  code: string
  name: string
  description?: string
  accessLevel: 'PUBLIC' | 'INTERNAL' | 'TEACHER_ONLY' | 'ADMIN_ONLY'
  documentCount: number
  createdAt: string
  updatedAt: string
}

export interface AiKbDocumentItem {
  id: number
  kbId: number
  kbName?: string
  name: string
  filePath?: string
  fileType: string
  fileSize: number
  status: 'UPLOADING' | 'PROCESSING' | 'INDEXED' | 'FAILED' | 'NEEDS_RETRY'
  chunkCount: number
  rawContent?: string
  errorMessage?: string
  createdAt: string
  updatedAt: string
}

export interface AiKbChunkItem {
  id: number
  documentId: number
  chunkIndex: number
  content: string
  metadataJson?: string
  createdAt: string
}

export interface AiFlowItem {
  id: number
  agentId?: number | null
  agentName?: string | null
  name: string
  description?: string
  graphJson: string
  status: 'DRAFT' | 'PUBLISHED'
  triggerType: 'NEW_CONVERSATION' | 'INTENT'
  version: number
  createdAt: string
  updatedAt: string
}

export interface AiLeadItem {
  id: number
  conversationId?: number | null
  fullName: string
  phone: string
  courseInterest?: string
  note?: string
  status: 'NEW' | 'CONTACTED' | 'CONVERTED'
  createdAt: string
}

export interface AiChannelConfigItem {
  id: number
  channelType: 'WEBSITE' | 'PORTAL_STUDENT' | 'PORTAL_TEACHER' | 'PORTAL_ADMIN' | 'ZALO_OA' | 'VOICE'
  agentId?: number | null
  agentName?: string | null
  isActive: boolean
  configJson?: string
  createdAt: string
  updatedAt: string
}

export interface AiAnalyticsData {
  totalAgents: number
  totalKnowledgeBases: number
  totalDocuments: number
  totalChunks: number
  totalFlows: number
  totalLeads: number
  totalConversations: number
  activeConversations: number
  waitingHumanHandoff: number
  estimatedTokensUsed: number
  averageLatencyMs: number
}
