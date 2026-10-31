import React, { useState, useEffect, useRef } from 'react'
import {
  Sparkles,
  RefreshCw,
  Plus,
  History,
  PhoneCall,
  UserCheck,
  Headphones,
  Check,
  ChevronDown
} from 'lucide-react'
import { chatApi } from '../../api/chat'
import type { AiConversationItem, AiChatSourceCitation } from '../../types/chat'
import { MessageBubble } from './MessageBubble'
import { MessageInput } from './MessageInput'

interface AiTurn {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: AiChatSourceCitation[]
  createdAt: string
}

interface AIConversationPanelProps {
  portal: 'PUBLIC' | 'STUDENT' | 'TEACHER' | 'ADMIN'
  agentName: string
  welcomeMessage: string
  suggestedPrompts?: string[]
  features: {
    hasTutoringMode?: boolean
    hasVoiceCall?: boolean
    hasLeadCapture?: boolean
    hasDirectHandoff?: boolean
  }
  sessionId?: string
  onOpenVoiceCall?: () => void
  onOpenLeadModal?: () => void
}

export const AIConversationPanel: React.FC<AIConversationPanelProps> = ({
  portal,
  agentName,
  welcomeMessage,
  suggestedPrompts = [],
  features,
  sessionId,
  onOpenVoiceCall,
  onOpenLeadModal
}) => {
  const isPublic = portal === 'PUBLIC'
  const [turns, setTurns] = useState<AiTurn[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [convId, setConvId] = useState<number | undefined>(undefined)
  const [conversations, setConversations] = useState<AiConversationItem[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [isListening, setIsListening] = useState(false)
  const [handoffStatus, setHandoffStatus] = useState<string | null>(null)
  const [tutoringMode, setTutoringMode] = useState<'STEP_BY_STEP' | 'DETAILED'>('STEP_BY_STEP')

  const aiEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    if (typeof aiEndRef.current?.scrollIntoView === 'function') {
      aiEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Khởi tạo lời chào ban đầu
  useEffect(() => {
    if (turns.length === 0) {
      setTurns([
        {
          id: 'welcome_' + Date.now(),
          role: 'assistant',
          content: welcomeMessage,
          createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ])
    }
  }, [welcomeMessage])

  // Tải danh sách hội thoại cũ
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        if (isPublic && sessionId) {
          const res = await chatApi.getPublicConversations(sessionId)
          if (res.success && res.data) setConversations(res.data)
        } else if (!isPublic) {
          const res = await chatApi.getConversations(portal)
          if (res.success && res.data) setConversations(res.data)
        }
      } catch (err) {
        // im lặng xử lý khi không có hội thoại
      }
    }
    fetchHistory()
  }, [portal, isPublic, sessionId])

  const handleStartNewChat = () => {
    setConvId(undefined)
    setHandoffStatus(null)
    setTurns([
      {
        id: 'new_chat_' + Date.now(),
        role: 'assistant',
        content: welcomeMessage,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ])
    setShowHistory(false)
  }

  const handleSelectConv = async (c: AiConversationItem) => {
    setConvId(c.id)
    setShowHistory(false)
    setHandoffStatus(c.status === 'WAITING_HUMAN' ? 'WAITING_HUMAN' : null)
    try {
      const res = isPublic && sessionId
        ? await chatApi.getPublicMessages(c.id, sessionId)
        : await chatApi.getMessages(c.id, portal)
      if (res.success && res.data) {
        setTurns(
          res.data.map((m) => ({
            id: String(m.id),
            role: m.role as 'user' | 'assistant',
            content: m.content,
            createdAt: m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
          }))
        )
        setTimeout(scrollToBottom, 50)
      }
    } catch (err) {
      console.error('Lỗi tải tin nhắn hội thoại cũ:', err)
    }
  }

  const handleSend = async (customText?: string) => {
    const text = (customText || input).trim()
    if (!text || loading) return

    let finalPrompt = text
    if (features.hasTutoringMode && portal === 'STUDENT') {
      if (tutoringMode === 'STEP_BY_STEP' && !text.toLowerCase().includes('6 bước')) {
        finalPrompt = `${text}\n[Yêu cầu chế độ: Hãy hướng dẫn theo đúng 6 bước sư phạm kiến tạo, dùng công thức toán học nếu có và gợi mở từng bước thay vì chỉ đưa đáp án].`
      }
    }

    const userTurn: AiTurn = {
      id: 'u_' + Date.now(),
      role: 'user',
      content: text,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setTurns((prev) => [...prev, userTurn])
    if (!customText) setInput('')
    setLoading(true)
    setTimeout(scrollToBottom, 20)

    try {
      const res = isPublic
        ? await chatApi.askPublic({
            question: finalPrompt,
            conversationId: convId,
            sessionId: sessionId || 'GUEST_DEFAULT',
            channel: 'WEBSITE'
          })
        : await chatApi.ask({
            question: finalPrompt,
            conversationId: convId,
            portal,
            channel: 'PORTAL'
          })

      if (res.success && res.data) {
        if (!convId && res.data.conversationId) {
          setConvId(res.data.conversationId)
        }

        const aiTurn: AiTurn = {
          id: 'a_' + Date.now(),
          role: 'assistant',
          content: res.data.answer,
          sources: res.data.sources,
          createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
        setTurns((prev) => [...prev, aiTurn])
        setTimeout(scrollToBottom, 50)
      }
    } catch (err: unknown) {
      console.error('Lỗi phản hồi AI:', err)
      setTurns((prev) => [
        ...prev,
        {
          id: 'err_' + Date.now(),
          role: 'assistant',
          content: 'Xin lỗi, hiện tại tôi gặp sự cố kết nối tới máy chủ trí tuệ nhân tạo. Vui lòng thử lại sau giây lát.',
          createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleToggleVoice = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Trình duyệt của bạn chưa hỗ trợ nhận dạng giọng nói.')
      return
    }

    if (isListening) {
      setIsListening(false)
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.lang = 'vi-VN'
      recognition.interimResults = false
      recognition.maxAlternatives = 1

      recognition.onstart = () => setIsListening(true)
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setInput((prev) => (prev ? prev + ' ' + transcript : transcript))
        setIsListening(false)
      }
      recognition.onerror = () => setIsListening(false)
      recognition.onend = () => setIsListening(false)
      recognition.start()
    } catch (e) {
      setIsListening(false)
    }
  }

  const handleHandoff = async () => {
    if (!convId) return
    try {
      await chatApi.requestHandoff(convId, portal)
      setHandoffStatus('WAITING_HUMAN')
      setTurns((prev) => [
        ...prev,
        {
          id: 'ho_' + Date.now(),
          role: 'assistant',
          content: 'Yêu cầu của bạn đã được chuyển tới chuyên viên tư vấn. Chuyên viên sẽ sớm liên hệ hỗ trợ bạn qua số điện thoại hoặc tin nhắn này!',
          createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ])
    } catch (err) {
      alert('Lỗi gửi yêu cầu gặp nhân viên.')
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50 dark:bg-[#111827]">
      {/* Sub-bar: Cuộc hội thoại & Nút hành động */}
      <div className="px-3 py-1.5 border-b border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 flex items-center justify-between text-[11px] shrink-0">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleStartNewChat}
            className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition flex items-center gap-1 cursor-pointer"
            title="Bắt đầu hội thoại mới"
          >
            <Plus className="w-3 h-3" />
            <span>Đoạn chat mới</span>
          </button>

          {conversations.length > 0 && (
            <button
              type="button"
              onClick={() => setShowHistory((prev) => !prev)}
              className="px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold transition flex items-center gap-1 cursor-pointer"
              title="Lịch sử hội thoại"
            >
              <History className="w-3 h-3" />
              <span>Lịch sử ({conversations.length})</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1">
          {features.hasVoiceCall && onOpenVoiceCall && (
            <button
              type="button"
              onClick={onOpenVoiceCall}
              className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold transition flex items-center gap-1 cursor-pointer"
              title="Gọi đàm thoại trực tiếp với AI bằng giọng nói"
            >
              <Headphones className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Gọi Voice AI</span>
            </button>
          )}

          {features.hasDirectHandoff && convId && handoffStatus !== 'WAITING_HUMAN' && (
            <button
              type="button"
              onClick={handleHandoff}
              className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 font-bold transition flex items-center gap-1 cursor-pointer"
              title="Gặp nhân viên tư vấn người thật"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Gặp tư vấn viên</span>
            </button>
          )}
        </div>
      </div>

      {/* Lịch sử hội thoại dropdown */}
      {showHistory && (
        <div className="p-2 border-b border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 max-h-40 overflow-y-auto space-y-1 text-xs shrink-0 z-10 shadow-inner">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-0.5">
            Các cuộc trò chuyện gần đây:
          </div>
          {conversations.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => handleSelectConv(c)}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs truncate transition flex items-center justify-between ${
                convId === c.id
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <span className="truncate flex-1">{c.title || 'Hội thoại #' + c.id}</span>
              <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                {new Date(c.updatedAt).toLocaleDateString()}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Thanh chuyển đổi Chế độ Sư phạm (chỉ dành riêng cho Cổng Học viên) */}
      {features.hasTutoringMode && portal === 'STUDENT' && (
        <div className="px-3 py-1.5 bg-emerald-50/60 dark:bg-emerald-950/30 border-b border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between text-[11px] shrink-0">
          <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Phương pháp sư phạm:
          </span>
          <div className="inline-flex rounded-lg p-0.5 bg-emerald-100/80 dark:bg-emerald-900/60">
            <button
              type="button"
              onClick={() => setTutoringMode('STEP_BY_STEP')}
              className={`px-2 py-0.5 rounded-md font-bold text-[10px] transition ${
                tutoringMode === 'STEP_BY_STEP'
                  ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 shadow-xs'
                  : 'text-emerald-600/80 dark:text-emerald-400 hover:text-emerald-900'
              }`}
            >
              6 Bước Sư phạm
            </button>
            <button
              type="button"
              onClick={() => setTutoringMode('DETAILED')}
              className={`px-2 py-0.5 rounded-md font-bold text-[10px] transition ${
                tutoringMode === 'DETAILED'
                  ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 shadow-xs'
                  : 'text-emerald-600/80 dark:text-emerald-400 hover:text-emerald-900'
              }`}
            >
              Giải thích chi tiết
            </button>
          </div>
        </div>
      )}

      {/* Danh sách tin nhắn AI */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {turns.map((turn) => (
          <MessageBubble
            key={turn.id}
            id={turn.id}
            role={turn.role}
            content={turn.content}
            sources={turn.sources}
            createdAt={turn.createdAt}
            copiedId={copiedId}
            onCopy={handleCopy}
            agentTitle={agentName}
          />
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-400 animate-pulse p-2">
            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs shadow">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
            </div>
            <span>{agentName} đang suy nghĩ và tổng hợp kiến thức...</span>
          </div>
        )}

        <div ref={aiEndRef} />
      </div>

      {/* Gợi ý câu hỏi nhanh (Suggestion Pills) */}
      {suggestedPrompts.length > 0 && turns.length <= 2 && (
        <div className="px-3 py-2 border-t border-slate-200/60 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 flex gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
          {suggestedPrompts.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(prompt)}
              className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 whitespace-nowrap transition shadow-xs shrink-0 cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <MessageInput
        value={input}
        onChange={setInput}
        onSend={() => handleSend()}
        placeholder={`Hỏi ${agentName}...`}
        disabled={loading}
        loading={loading}
        onToggleVoice={handleToggleVoice}
        isListening={isListening}
      />
    </div>
  )
}
