import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Sparkles,
  Users,
  X,
  Send,
  Minimize2,
  Maximize2,
  RotateCcw,
  Copy,
  Check,
  BookOpen,
  Headphones,
  Mic,
  MicOff,
  Volume2,
  UserCheck,
  AlertCircle,
  PhoneCall
} from 'lucide-react'
import { classChatApi, aiChatApi } from '../../api/chat'
import { AiVoiceCallModal } from './AiVoiceCallModal'
import type {
  ChatConversationItem,
  ChatMessageItem,
  AiConversationItem,
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
  const location = useLocation()

  // 1. Xác định cổng hiện tại để phân tách không gian hội thoại (Identity & Portal Isolation)
  const currentPortal = useMemo<'ADMIN' | 'TEACHER' | 'STUDENT' | 'PUBLIC'>(() => {
    const path = location.pathname
    if (path.startsWith('/admin')) return 'ADMIN'
    if (path.startsWith('/teacher')) return 'TEACHER'
    if (path.startsWith('/portal')) return 'STUDENT'
    return 'PUBLIC'
  }, [location.pathname])

  // Guest Session Id cho khách vãng lai trên website công khai
  const [guestSessionId] = useState<string>(() => {
    const cached = localStorage.getItem('ch_ai_guest_session_id')
    if (cached) return cached
    const newId = 'GUEST_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now()
    localStorage.setItem('ch_ai_guest_session_id', newId)
    return newId
  })

  const [isOpen, setIsOpen] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [activeTab, setActiveTab] = useState<'group' | 'ai'>('ai')
  const [isExpanded, setIsExpanded] = useState(false)

  // Group Chat State (Chỉ khả dụng cho tài khoản đã đăng nhập)
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
  const [aiConversations, setAiConversations] = useState<AiConversationItem[]>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [isListening, setIsListening] = useState(false)
  const [handoffStatus, setHandoffStatus] = useState<string | null>(null)

  // Lead capture state cho khách công khai
  const [showLeadModal, setShowLeadModal] = useState(false)
  const [showVoiceCall, setShowVoiceCall] = useState(false)
  const [leadName, setLeadName] = useState('')
  const [leadPhone, setLeadPhone] = useState('')
  const [leadCourse, setLeadCourse] = useState('Tiếng Anh Giao tiếp')
  const [leadSubmitted, setLeadSubmitted] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const aiEndRef = useRef<HTMLDivElement>(null)

  // Tên và huy hiệu của Agent theo cổng
  const agentMetadata = useMemo(() => {
    switch (currentPortal) {
      case 'ADMIN':
        return {
          title: 'Trợ lý Quản trị & Vận hành',
          badge: 'Quản trị viên',
          badgeColor: 'bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300',
          welcome: 'Chào Quản trị viên! Tôi có thể hỗ trợ tra cứu số liệu học viên, doanh thu, lớp học và báo cáo trung tâm.'
        }
      case 'TEACHER':
        return {
          title: 'Trợ lý Giảng dạy & Soạn bài',
          badge: 'Giảng viên',
          badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300',
          welcome: 'Chào thầy cô! Tôi có thể hỗ trợ soạn giáo án, gợi ý đề thi, tóm tắt tài liệu môn học và xem lịch dạy.'
        }
      case 'STUDENT':
        return {
          title: 'Trợ giảng AI Đồng hành',
          badge: 'Học viên',
          badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300',
          welcome: 'Chào bạn! Tôi là Trợ giảng AI. Bạn cần giải thích bài học, hướng dẫn giải bài tập hay xem lịch học?'
        }
      default:
        return {
          title: 'Chuyên viên Tư vấn Tuyển sinh AI',
          badge: 'Tư vấn Tuyển sinh',
          badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300',
          welcome: 'Chào bạn! Tôi là Chuyên viên tư vấn tuyển sinh AI của CH Academy. Tôi có thể hỗ trợ bạn chọn khóa học, tra cứu học phí và lịch khai giảng!'
        }
    }
  }, [currentPortal])

  // Gợi ý câu hỏi nhanh (Prompt Pills) theo vai trò và cổng
  const suggestionPills = useMemo(() => {
    switch (currentPortal) {
      case 'ADMIN':
        return [
          'Tổng quan số liệu học viên và lớp học?',
          'Doanh thu học phí và công nợ hiện tại?',
          'Tỷ lệ chuyên cần toàn trung tâm?',
          'Chính sách bảo lưu và chuyển lớp'
        ]
      case 'TEACHER':
        return [
          'Tôi đang phụ trách những lớp nào?',
          'Gợi ý 3 câu hỏi trắc nghiệm kiểm tra định kỳ',
          'Dàn ý giáo án Tiếng Anh giao tiếp công sở',
          'Tiêu chí chấm bài thi tự luận đạt điểm cao'
        ]
      case 'STUDENT':
        return [
          'Tôi đang học những lớp nào?',
          'Kiểm tra học phí của tôi',
          'Lịch học ca tiếp theo?',
          'Quy định chuyên cần thi cuối kỳ'
        ]
      default:
        return [
          'Các khóa học hiện tại và học phí?',
          'Khóa Tiếng Anh Trẻ em có ưu đãi gì?',
          'Luyện thi IELTS có cam kết đầu ra không?',
          'Tôi muốn gặp chuyên viên tư vấn trực tiếp'
        ]
    }
  }, [currentPortal])

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

  // ========================================================
  // 2. KHẮC PHỤC TRIỆT ĐỂ LỖI DÙNG CHUNG LỊCH SỬ CHAT:
  // KHI ĐỔI TÀI KHOẢN HOẶC ĐỔI CỔNG, XÓA TOÀN BỘ STATE CŨ
  // ========================================================
  useEffect(() => {
    setAiTurns([])
    setAiConvId(undefined)
    setAiInput('')
    setHandoffStatus(null)
    loadAiConversations()
  }, [user?.id, currentPortal])

  // Tải danh sách hội thoại AI theo đúng danh tính và cổng
  const loadAiConversations = useCallback(async () => {
    try {
      if (isAuthenticated) {
        const res = await aiChatApi.getConversations(currentPortal)
        if (res.success && res.data) {
          setAiConversations(res.data)
        }
      } else {
        const res = await aiChatApi.getPublicConversations(guestSessionId)
        if (res.success && res.data) {
          setAiConversations(res.data)
        }
      }
    } catch (err) {
      console.warn('Lỗi tải lịch sử hội thoại AI:', err)
    }
  }, [isAuthenticated, currentPortal, guestSessionId])

  // Tải nhóm chat lớp học
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

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0)

  // ========================================================
  // 3. XỬ LÝ GỬI TIN NHẮN AI & TƯ VẤN VIÊN
  // ========================================================
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
      let res
      if (isAuthenticated) {
        res = await aiChatApi.ask({
          question: q,
          conversationId: aiConvId,
          portal: currentPortal,
          channel: 'PORTAL'
        })
      } else {
        res = await aiChatApi.askPublic({
          question: q,
          conversationId: aiConvId,
          sessionId: guestSessionId
        })
      }

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

        // Nếu câu trả lời có chứa thông tin chuyển giao nhân viên
        if (res.data.answer.includes('chuyển tiếp cuộc trò chuyện') || res.data.answer.includes('chuyên viên tư vấn')) {
          setHandoffStatus('WAITING_HUMAN')
        }
      }
    } catch (err: unknown) {
      const errTurn: AiTurn = {
        id: 'err-' + Date.now(),
        role: 'assistant',
        content:
          'Xin lỗi, không thể kết nối tới máy chủ AI: ' +
          (err instanceof Error ? err.message : 'Vui lòng thử lại sau.'),
        createdAt: new Date().toISOString()
      }
      setAiTurns((prev) => [...prev, errTurn])
    } finally {
      setAiLoading(false)
    }
  }

  // Yêu cầu chuyển giao nhân viên (Human Handoff)
  const handleRequestHandoff = async () => {
    if (!aiConvId) {
      handleSendAiMessage('Tôi muốn gặp chuyên viên tư vấn trực tiếp')
      return
    }
    try {
      await aiChatApi.requestHandoff(aiConvId, currentPortal)
      setHandoffStatus('WAITING_HUMAN')
      const noticeTurn: AiTurn = {
        id: 'handoff-' + Date.now(),
        role: 'assistant',
        content:
          '🔔 Yêu cầu kết nối nhân viên tư vấn đã được gửi đi thành công! Chuyên viên CH Academy sẽ phản hồi bạn trong thời gian sớm nhất. Hotline: 0987.654.321.',
        createdAt: new Date().toISOString()
      }
      setAiTurns((prev) => [...prev, noticeTurn])
    } catch {
      handleSendAiMessage('Tôi muốn kết nối chuyên viên tư vấn trực tiếp')
    }
  }

  // Gửi tin nhắn nhóm lớp
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

  // Sao chép nội dung
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Giọng nói: Web Speech API (STT & TTS)
  const handleVoiceInput = () => {
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition

    if (!SpeechRecognition) {
      alert('Trình duyệt của bạn chưa hỗ trợ nhận diện giọng nói (Web Speech API). Vui lòng dùng Chrome hoặc Edge.')
      return
    }

    if (isListening) {
      setIsListening(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'vi-VN'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    setIsListening(true)

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setIsListening(false)
      if (transcript) {
        handleSendAiMessage(transcript)
      }
    }

    recognition.onerror = () => {
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()
  }

  const handleSpeakText = (text: string) => {
    if (!('speechSynthesis' in window)) {
      alert('Trình duyệt chưa hỗ trợ Text-to-Speech')
      return
    }
    window.speechSynthesis.cancel()
    const cleanText = text.replace(/[*#_`]/g, '')
    const utterance = new SpeechSynthesisUtterance(cleanText)
    utterance.lang = 'vi-VN'
    utterance.rate = 1.0
    window.speechSynthesis.speak(utterance)
  }

  // Thu thập thông tin khách hàng tiềm năng (Leads)
  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!leadPhone.trim() || !leadName.trim()) return
    try {
      await aiChatApi.submitLead({
        conversationId: aiConvId,
        fullName: leadName.trim(),
        phone: leadPhone.trim(),
        courseInterest: leadCourse,
        note: 'Đăng ký tư vấn nhanh từ Chat Widget công khai'
      })
      setLeadSubmitted(true)
      setTimeout(() => {
        setShowLeadModal(false)
        setLeadSubmitted(false)
      }, 2000)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Lỗi gửi thông tin')
    }
  }

  const currentConv = conversations.find((c) => c.id === selectedConvId)

  return (
    <>
      {/* 1. FLOATING CHAT TRIGGER BUTTON */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {/* DROPDOWN MENU CHỌN CHAT NHÓM HOẶC CHAT AI */}
        {showMenu && !isOpen && (
          <div className="mb-3 w-72 rounded-2xl bg-white/95 dark:bg-[#151F31]/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 shadow-2xl p-2 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800/80 mb-1 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Kênh kết nối CH Academy
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${agentMetadata.badgeColor}`}>
                {agentMetadata.badge}
              </span>
            </div>

            {/* Chat nhóm lớp (chỉ hiện khi đã đăng nhập) */}
            {isAuthenticated && (
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
            )}

            {/* Chat AI Trợ lý */}
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
                <div className="text-sm font-bold text-slate-800 dark:text-white flex items-center justify-between">
                  <span>{agentMetadata.title}</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500 text-white">
                    AI 24/7
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                  Tư vấn, giải đáp thông tin và hỗ trợ học tập trực tiếp.
                </p>
              </div>
            </button>
          </div>
        )}

        {/* Nút tròn chính góc dưới bên phải */}
        <button
          type="button"
          onClick={() => {
            if (isOpen) {
              setIsOpen(false)
            } else {
              setShowMenu((prev) => !prev)
            }
          }}
          className={`relative w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-white transition-all transform hover:scale-105 active:scale-95 ${
            isOpen
              ? 'bg-slate-700 hover:bg-slate-800 rotate-90'
              : 'bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-500'
          }`}
          title="Mở kênh liên lạc CH Academy"
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <div className="relative">
              <Sparkles className="w-7 h-7" />
              {totalUnread > 0 && (
                <span className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white border-2 border-white shadow">
                  {totalUnread > 9 ? '9+' : totalUnread}
                </span>
              )}
            </div>
          )}
        </button>
      </div>

      {/* 2. CHAT POPUP WINDOW */}
      {isOpen && (
        <div
          className={`fixed bottom-24 right-6 z-50 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col transition-all duration-200 animate-in fade-in slide-in-from-bottom-5 ${
            isExpanded
              ? 'w-[90vw] md:w-[780px] h-[82vh] max-h-[850px]'
              : 'w-[92vw] sm:w-[420px] h-[580px]'
          }`}
        >
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 text-white flex items-center justify-between shrink-0 shadow-md">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-white shrink-0">
                {activeTab === 'group' ? <Users className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold truncate flex items-center gap-1.5">
                  <span>{activeTab === 'group' ? currentConv?.title || 'Chat nhóm lớp' : agentMetadata.title}</span>
                </div>
                <div className="text-[11px] text-white/80 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{agentMetadata.badge}</span>
                  {handoffStatus === 'WAITING_HUMAN' && (
                    <span className="ml-1 text-amber-200 font-bold">• Đang chờ tư vấn viên</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0 text-white/90">
              {/* Nút Gọi điện trực tiếp với AI (Voice AI) */}
              {activeTab === 'ai' && (
                <button
                  type="button"
                  onClick={() => setShowVoiceCall(true)}
                  title="Gọi điện thoại trực tiếp với AI (Voice AI)"
                  className="p-1.5 rounded-lg hover:bg-emerald-500 text-emerald-950 bg-emerald-400 font-bold text-[11px] transition px-2.5 flex items-center gap-1 shadow-sm"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Gọi AI</span>
                </button>
              )}

              {/* Nút chuyển giao nhân viên (Human Handoff) */}
              {activeTab === 'ai' && (
                <button
                  type="button"
                  onClick={handleRequestHandoff}
                  title="Chuyển sang chuyên viên tư vấn thật (Human Handoff)"
                  className="p-1.5 rounded-lg hover:bg-white/20 transition flex items-center gap-1 text-[11px] font-bold bg-white/10 px-2"
                >
                  <Headphones className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Gặp nhân viên</span>
                </button>
              )}

              {/* Nút Đăng ký tư vấn nhanh cho khách công khai */}
              {currentPortal === 'PUBLIC' && activeTab === 'ai' && (
                <button
                  type="button"
                  onClick={() => setShowLeadModal(true)}
                  title="Để lại số điện thoại để trung tâm tư vấn"
                  className="p-1.5 rounded-lg hover:bg-amber-400 text-amber-900 bg-amber-300 font-bold text-[11px] transition px-2"
                >
                  <UserCheck className="w-3.5 h-3.5 inline mr-1" />
                  <span>Tư vấn ngay</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsExpanded((prev) => !prev)}
                className="p-1.5 rounded-lg hover:bg-white/20 transition"
                title={isExpanded ? 'Thu nhỏ' : 'Phóng to'}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/20 transition"
                title="Đóng cửa sổ chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 p-1 shrink-0">
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => setActiveTab('group')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 ${
                  activeTab === 'group'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Nhóm lớp học</span>
                {totalUnread > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-extrabold">
                    {totalUnread}
                  </span>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab('ai')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 ${
                activeTab === 'ai'
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{agentMetadata.title}</span>
            </button>
          </div>

          {/* 3. GROUP CHAT BODY */}
          {activeTab === 'group' && isAuthenticated && (
            <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50 dark:bg-[#111827]">
              {conversations.length > 1 && (
                <div className="px-3 py-2 border-b border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 overflow-x-auto flex gap-2 shrink-0">
                  {conversations.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedConvId(c.id)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition border ${
                        selectedConvId === c.id
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {c.className || c.title}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                {messages.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    Chưa có tin nhắn nào trong nhóm học tập này.
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.senderUsername === user?.username
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <span className="text-[10px] text-slate-400 mb-0.5 px-1 font-semibold">
                          {isMe ? 'Bạn' : msg.senderName}
                        </span>
                        <div
                          className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                            isMe
                              ? 'bg-indigo-600 text-white rounded-br-none'
                              : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 rounded-bl-none'
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <form
                onSubmit={handleSendGroupMessage}
                className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151F31] flex items-center gap-2 shrink-0"
              >
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Nhắn tin cho cả lớp..."
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
          )}

          {/* 4. AI CHAT BODY */}
          {activeTab === 'ai' && (
            <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50 dark:bg-[#111827]">
              {/* Handoff Banner nếu đang chờ nhân viên */}
              {handoffStatus === 'WAITING_HUMAN' && (
                <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/60 p-2.5 px-4 flex items-center gap-2.5 text-xs text-amber-800 dark:text-amber-300 shrink-0">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="flex-1">
                    Cuộc trò chuyện đã được chuyển sang chế độ <strong>Chờ chuyên viên tư vấn tiếp nhận</strong>.
                  </span>
                </div>
              )}

              {/* Chat Message List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                {aiTurns.length === 0 ? (
                  <div className="py-8 text-center flex flex-col items-center">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3 shadow-inner">
                      <Sparkles className="w-6 h-6 animate-pulse" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                      {agentMetadata.welcome}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                      Hệ thống kết nối trực tiếp kho tri thức và cơ sở dữ liệu CH Academy.
                    </p>

                    {/* Quick Suggestion Pills */}
                    <div className="flex flex-wrap gap-2 justify-center mt-4 max-w-sm">
                      {suggestionPills.map((pill, idx) => (
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
                              <Sparkles className="w-3 h-3" /> {agentMetadata.title}
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
                                <BookOpen className="w-3 h-3 text-emerald-500" /> Nguồn trích dẫn dữ liệu:
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
                          <div className="flex items-center gap-3 mt-1 px-1">
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

                            <button
                              type="button"
                              onClick={() => handleSpeakText(turn.content)}
                              className="text-[10px] text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-0.5"
                              title="Nghe câu trả lời bằng giọng nói"
                            >
                              <Volume2 className="w-3 h-3" />
                              <span>Nghe</span>
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
                    <span>Đang truy xuất Kho tri thức và tổng hợp câu trả lời...</span>
                  </div>
                )}
                <div ref={aiEndRef} />
              </div>

              {/* AI Input Form với nút Giọng nói (Voice) */}
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSendAiMessage()
                }}
                className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#151F31] flex items-center gap-2 shrink-0"
              >
                <button
                  type="button"
                  onClick={handleVoiceInput}
                  className={`p-2.5 rounded-xl border transition ${
                    isListening
                      ? 'bg-rose-500 text-white border-rose-500 animate-pulse'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                  title={isListening ? 'Đang nghe bạn nói...' : 'Nói chuyện bằng giọng nói (Voice)'}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                <input
                  type="text"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder={`Hỏi ${agentMetadata.title}...`}
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

      {/* MODAL THU THẬP THÔNG TIN LEAD CHO KHÁCH CÔNG KHAI */}
      {showLeadModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span>Đăng ký nhận tư vấn tuyển sinh</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowLeadModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {leadSubmitted ? (
              <div className="py-6 text-center text-xs text-emerald-600 font-bold">
                ✓ Đã gửi thông tin! Chuyên viên CH Academy sẽ liên hệ bạn ngay.
              </div>
            ) : (
              <form onSubmit={handleLeadSubmit} className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1 block">
                    Họ và tên của bạn:
                  </label>
                  <input
                    type="text"
                    required
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1 block">
                    Số điện thoại liên hệ:
                  </label>
                  <input
                    type="tel"
                    required
                    value={leadPhone}
                    onChange={(e) => setLeadPhone(e.target.value)}
                    placeholder="0912 345 678"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1 block">
                    Khóa học bạn quan tâm:
                  </label>
                  <select
                    value={leadCourse}
                    onChange={(e) => setLeadCourse(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white"
                  >
                    <option value="Tiếng Anh Trẻ em (KID-ENG-01)">Tiếng Anh Trẻ em Toàn diện (KID-ENG-01)</option>
                    <option value="Tiếng Anh Giao tiếp (PRO-ENG-02)">Tiếng Anh Giao tiếp Công sở (PRO-ENG-02)</option>
                    <option value="Luyện thi IELTS Cấp tốc">Luyện thi IELTS Cấp tốc 6.5+</option>
                  </select>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowLeadModal(false)}
                    className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow"
                  >
                    Gửi yêu cầu tư vấn
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL CUỘC GỌI VOICE AI */}
      <AiVoiceCallModal
        isOpen={showVoiceCall}
        onClose={() => setShowVoiceCall(false)}
        agentName={agentMetadata.title}
        agentRole={agentMetadata.badge}
        agentCode={
          currentPortal === 'STUDENT'
            ? 'AGENT_STUDENT_TUTOR'
            : currentPortal === 'TEACHER'
            ? 'AGENT_TEACHER_ASSISTANT'
            : currentPortal === 'ADMIN'
            ? 'AGENT_ADMIN_ASSISTANT'
            : 'AGENT_ADMISSIONS'
        }
        portal={currentPortal}
        conversationId={aiConvId}
        guestSessionId={guestSessionId}
        onMessageLogged={(userSpeech, aiReply) => {
          setAiTurns((prev) => [
            ...prev,
            {
              id: 'voice_u_' + Date.now(),
              role: 'user',
              content: userSpeech,
              createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            },
            {
              id: 'voice_a_' + Date.now(),
              role: 'assistant',
              content: aiReply,
              createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ])
        }}
      />
    </>
  )
}
