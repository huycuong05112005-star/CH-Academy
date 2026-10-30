import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  MessageCircle,
  Sparkles,
  Users,
  X,
  Send,
  Minimize2,
  Maximize2,
  Bot,
  RotateCcw,
  Copy,
  Check,
  BookOpen,
  Info
} from 'lucide-react'
import { classChatApi, aiChatApi } from '../../api/chat'
import type {
  ChatConversationItem,
  ChatMessageItem,
  AiChatSourceCitation
} from '../../types/chat'
import { useAuth } from '../../context/AuthContext'

interface AiTurn {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: AiChatSourceCitation[]
  createdAt: string
}

export const FloatingChatWidget: React.FC = () => {
  const { user, isAuthenticated } = useAuth()

  const [isOpen, setIsOpen] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [activeTab, setActiveTab] = useState<'group' | 'ai'>('group')
  const [isExpanded, setIsExpanded] = useState(false)

  // Group Chat State
  const [conversations, setConversations] = useState<ChatConversationItem[]>([])
  const [selectedConvId, setSelectedConvId] = useState<number | null>(null)
  const [messages, setMessages] = useState<ChatMessageItem[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [sendingMsg, setSendingMsg] = useState(false)

  // AI Chat State
  const [aiTurns, setAiTurns] = useState<AiTurn[]>([])
  const [aiInput, setAiInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiConvId, setAiConvId] = useState<number | undefined>(undefined)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const aiEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom
  const scrollToBottom = () => {
    if (typeof messagesEndRef.current?.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }
  const scrollAiToBottom = () => {
    if (typeof aiEndRef.current?.scrollIntoView === 'function') {
      aiEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      const res = await classChatApi.getMyConversations()
      if (res.success && res.data) {
        setConversations(res.data)
        if (res.data.length > 0 && !selectedConvId) {
          setSelectedConvId(res.data[0].id)
        }
      }
    } catch (err) {
      console.error('Lỗi tải danh sách nhóm chat:', err)
    }
  }, [isAuthenticated, selectedConvId])

  // Load messages for selected group
  const loadMessages = useCallback(async (convId: number) => {
    try {
      const res = await classChatApi.getMessages(convId)
      if (res.success && res.data) {
        setMessages(res.data)
        scrollToBottom()
      }
    } catch (err) {
      console.error('Lỗi tải tin nhắn nhóm:', err)
    }
  }, [])

  // Auto-refresh conversations & messages every 5s
  useEffect(() => {
    if (!isAuthenticated) return
    loadConversations()
    const timer = setInterval(() => {
      loadConversations()
      if (isOpen && activeTab === 'group' && selectedConvId) {
        loadMessages(selectedConvId)
      }
    }, 5000)
    return () => clearInterval(timer)
  }, [isAuthenticated, isOpen, activeTab, selectedConvId, loadConversations, loadMessages])

  useEffect(() => {
    if (selectedConvId) {
      loadMessages(selectedConvId)
      classChatApi.markAsRead(selectedConvId).catch(() => {})
    }
  }, [selectedConvId, loadMessages])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    scrollAiToBottom()
  }, [aiTurns, aiLoading])

  if (!isAuthenticated || !user) return null

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0)

  // Send group message
  const handleSendGroupMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedConvId || !inputMessage.trim() || sendingMsg) return
    const text = inputMessage.trim()
    setInputMessage('')
    setSendingMsg(true)
    try {
      const res = await classChatApi.sendMessage(selectedConvId, { content: text })
      if (res.success && res.data) {
        setMessages((prev) => [...prev, res.data])
        scrollToBottom()
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Lỗi gửi tin nhắn')
    } finally {
      setSendingMsg(false)
    }
  }

  // Send AI message
  const handleSendAiMessage = async (questionText?: string) => {
    const q = (questionText || aiInput).trim()
    if (!q || aiLoading) return
    setAiInput('')

    const userTurn: AiTurn = {
      id: 'user-' + Date.now(),
      role: 'user',
      content: q,
      createdAt: new Date().toISOString()
    }
    setAiTurns((prev) => [...prev, userTurn])
    setAiLoading(true)

    try {
      const res = await aiChatApi.ask({ question: q, conversationId: aiConvId })
      if (res.success && res.data) {
        setAiConvId(res.data.conversationId)
        const botTurn: AiTurn = {
          id: 'bot-' + Date.now(),
          role: 'assistant',
          content: res.data.answer,
          sources: res.data.sources,
          createdAt: new Date().toISOString()
        }
        setAiTurns((prev) => [...prev, botTurn])
      }
    } catch (err: unknown) {
      const errTurn: AiTurn = {
        id: 'err-' + Date.now(),
        role: 'assistant',
        content: 'Xin lỗi, không thể kết nối tới máy chủ AI: ' + (err instanceof Error ? err.message : 'Vui lòng thử lại sau.'),
        createdAt: new Date().toISOString()
      }
      setAiTurns((prev) => [...prev, errTurn])
    } finally {
      setAiLoading(false)
    }
  }

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const currentConv = conversations.find((c) => c.id === selectedConvId)

  return (
    <>
      {/* 1. FLOATING CHAT TRIGGER BUTTON */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {/* DROPDOWN MENU CHỌN CHAT NHÓM HOẶC CHAT AI */}
        {showMenu && !isOpen && (
          <div className="mb-3 w-72 rounded-2xl bg-white/95 dark:bg-[#151F31]/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 shadow-2xl p-2 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800/80 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Kênh kết nối CH Academy
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveTab('group')
                setIsOpen(true)
                setShowMenu(false)
              }}
              className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition text-left group"
            >
              <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 group-hover:scale-105 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-slate-800 dark:text-white flex items-center justify-between">
                  <span>Chat nhóm lớp</span>
                  {totalUnread > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500 text-white">
                      {totalUnread}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                  Trao đổi cùng giảng viên và các thành viên trong lớp học.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('ai')
                setIsOpen(true)
                setShowMenu(false)
              }}
              className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition text-left group mt-1"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-slate-800 dark:text-white">
                  Chat AI Trợ lý
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                  Trợ lý thông minh hỗ trợ học tập, tra cứu lịch học & nội quy.
                </p>
              </div>
            </button>
          </div>
        )}

        {/* NÚT BẤM CHÍNH */}
        <button
          type="button"
          onClick={() => {
            if (isOpen) {
              setIsOpen(false)
            } else {
              setShowMenu(!showMenu)
            }
          }}
          className="relative group flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-[#0F1E36] to-[#1E3A8A] dark:from-[#38BDF8] dark:to-[#2563EB] text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 border-2 border-white/20"
          title="Mở hội thoại & Trợ lý CH Academy"
          aria-label="Mở kênh chat"
        >
          {isOpen ? (
            <X className="w-6 h-6 animate-in spin-in-180 duration-200" />
          ) : (
            <>
              <MessageCircle className="w-6 h-6 group-hover:hidden transition" />
              <Sparkles className="w-6 h-6 hidden group-hover:block animate-bounce transition" />
              {totalUnread > 0 && (
                <span className="absolute -top-1 -right-1 px-2 py-0.5 rounded-full text-[11px] font-black bg-rose-500 text-white shadow-md border-2 border-white dark:border-slate-900">
                  {totalUnread > 9 ? '9+' : totalUnread}
                </span>
              )}
            </>
          )}
        </button>
      </div>

      {/* 2. CHAT POPUP WINDOW CONTAINER */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-300 flex flex-col bg-white dark:bg-[#151F31] border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-2xl ${
            isExpanded
              ? 'inset-4 sm:inset-10'
              : 'bottom-24 right-6 w-[92vw] sm:w-[480px] h-[600px] max-h-[82vh]'
          }`}
        >
          {/* WINDOW HEADER */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/50">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('group')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                  activeTab === 'group'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Chat nhóm ({conversations.length})</span>
                {totalUnread > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-rose-500 text-white font-extrabold">
                    {totalUnread}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ai')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                  activeTab === 'ai'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Trợ lý AI</span>
              </button>
            </div>

            <div className="flex items-center gap-1 text-slate-400">
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition"
                title={isExpanded ? 'Thu nhỏ' : 'Toàn màn hình'}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition text-slate-500 hover:text-rose-500"
                title="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* TAB 1: GROUP CHAT CONTENT */}
          {activeTab === 'group' && (
            <div className="flex flex-1 min-h-0">
              {/* Conversation mini selector if multiple */}
              {conversations.length > 1 && (
                <div className="w-24 sm:w-36 border-r border-slate-100 dark:border-slate-800 overflow-y-auto p-2 space-y-1 bg-slate-50/40 dark:bg-slate-900/20">
                  {conversations.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedConvId(c.id)}
                      className={`w-full p-2 rounded-xl text-left transition text-xs font-bold flex flex-col ${
                        selectedConvId === c.id
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <span className="truncate">{c.classCode || c.title}</span>
                      <span className="text-[10px] font-normal text-slate-400">
                        {c.memberCount} thành viên
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Message Feed Area */}
              <div className="flex-1 flex flex-col min-h-0 bg-slate-50/20 dark:bg-[#111A29]">
                {/* Active Group Banner */}
                {currentConv && (
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs bg-white/60 dark:bg-slate-900/40">
                    <div className="truncate font-bold text-slate-800 dark:text-white">
                      {currentConv.title}
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0 font-medium ml-2">
                      {currentConv.memberCount} thành viên
                    </span>
                  </div>
                )}

                {/* Messages stream */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                      <Users className="w-10 h-10 mb-2 text-indigo-400 opacity-60" />
                      <p className="text-xs">Chưa có tin nhắn nào trong nhóm lớp.</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Hãy gửi lời chào đầu tiên tới giảng viên và các bạn nhé!
                      </p>
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isMe = m.senderId === user.id
                      const isSystem = m.messageType === 'SYSTEM'

                      if (isSystem) {
                        return (
                          <div key={m.id} className="p-3 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/50 text-xs text-indigo-900 dark:text-indigo-200 text-center">
                            <Info className="w-4 h-4 inline-block mr-1.5 text-indigo-500" />
                            {m.content}
                          </div>
                        )
                      }

                      return (
                        <div
                          key={m.id}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                        >
                          <span className="text-[10px] font-bold text-slate-400 mb-1 px-1">
                            {isMe ? 'Bạn' : m.senderName}
                          </span>
                          <div
                            className={`max-w-[82%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                              isMe
                                ? 'bg-indigo-600 text-white rounded-br-none'
                                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 rounded-bl-none'
                            }`}
                          >
                            {m.content}
                          </div>
                          <span className="text-[9px] text-slate-400 mt-0.5 px-1 font-mono">
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input Box */}
                <form
                  onSubmit={handleSendGroupMessage}
                  className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#151F31] flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Nhập tin nhắn trao đổi cùng lớp..."
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <button
                    type="submit"
                    disabled={!inputMessage.trim() || sendingMsg}
                    className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold transition shadow"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: GEN AI CHAT CONTENT */}
          {activeTab === 'ai' && (
            <div className="flex-1 flex flex-col min-h-0 bg-slate-50/20 dark:bg-[#111A29]">
              {/* AI Header & Controls */}
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs bg-white/60 dark:bg-slate-900/40">
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                  <Bot className="w-4 h-4" />
                  <span>CH Academy AI Companion</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAiTurns([])
                    setAiConvId(undefined)
                  }}
                  className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-white flex items-center gap-1 transition"
                  title="Tạo cuộc hội thoại mới"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Hội thoại mới</span>
                </button>
              </div>

              {/* AI Messages Stream */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {aiTurns.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center mb-3 shadow-lg">
                      <Sparkles className="w-6 h-6 animate-pulse" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                      Xin chào {user.fullName}!
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                      Tôi là trợ lý AI thông minh kết nối dữ liệu CH Academy. Bạn có thể hỏi tôi bất kỳ thông tin nào dưới đây:
                    </p>

                    {/* Quick Suggestion Pills */}
                    <div className="flex flex-wrap gap-2 justify-center mt-4 max-w-sm">
                      {[
                        'Tôi đang học những lớp nào?',
                        'Kiểm tra học phí của tôi',
                        'Lịch học ca tiếp theo?',
                        'Quy định chuyên cần thi cuối kỳ'
                      ].map((pill, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSendAiMessage(pill)}
                          className="px-3 py-1.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 transition shadow-sm text-left"
                        >
                          {pill}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  aiTurns.map((turn) => {
                    const isUser = turn.role === 'user'

                    return (
                      <div
                        key={turn.id}
                        className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 px-1">
                          {isUser ? (
                            <span className="text-[10px] font-bold text-slate-400">Bạn</span>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <Sparkles className="w-3 h-3" /> CH Academy AI
                            </span>
                          )}
                        </div>

                        <div
                          className={`max-w-[85%] px-4 py-3 rounded-2xl text-xs leading-relaxed shadow-sm ${
                            isUser
                              ? 'bg-emerald-600 text-white rounded-br-none'
                              : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 rounded-bl-none'
                          }`}
                        >
                          <div className="whitespace-pre-line">{turn.content}</div>

                          {/* Sources Citations Accordion */}
                          {turn.sources && turn.sources.length > 0 && (
                            <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700 text-[10px] text-slate-500 dark:text-slate-400 space-y-1">
                              <span className="font-bold flex items-center gap-1 text-slate-400">
                                <BookOpen className="w-3 h-3 text-emerald-500" /> Nguồn tham chiếu:
                              </span>
                              {turn.sources.map((s, sIdx) => (
                                <div key={sIdx} className="bg-slate-50 dark:bg-slate-900/60 p-1.5 rounded-lg border border-slate-200/60 dark:border-slate-800">
                                  <strong>{s.documentName}</strong> {s.section && `— ${s.section}`}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {!isUser && (
                          <div className="flex items-center gap-2 mt-1 px-1">
                            <button
                              type="button"
                              onClick={() => handleCopy(turn.id, turn.content)}
                              className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-white flex items-center gap-0.5"
                            >
                              {copiedId === turn.id ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                              <span>{copiedId === turn.id ? 'Đã sao chép' : 'Sao chép'}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}

                {aiLoading && (
                  <div className="flex items-center gap-2 text-xs text-slate-400 p-2 animate-pulse">
                    <Sparkles className="w-4 h-4 text-emerald-500 animate-spin" />
                    <span>Trợ lý AI đang tra cứu cơ sở dữ liệu và tổng hợp câu trả lời...</span>
                  </div>
                )}
                <div ref={aiEndRef} />
              </div>

              {/* AI Input Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSendAiMessage()
                }}
                className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#151F31] flex items-center gap-2"
              >
                <input
                  type="text"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="Đặt câu hỏi cho Trợ lý AI (ví dụ: Lớp học của tôi?)..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <button
                  type="submit"
                  disabled={!aiInput.trim() || aiLoading}
                  className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold transition shadow"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </>
  )
}

