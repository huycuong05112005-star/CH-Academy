import React, { useState, useEffect, useRef } from 'react'
import {
  Users,
  RefreshCw,
  Search,
  BookOpen,
  GraduationCap,
  X,
  ChevronDown,
  Check,
  Layers,
  ArrowRight
} from 'lucide-react'
import { classChatApi } from '../../api/chat'
import type { ChatConversationItem, ChatMessageItem, ChatMemberItem } from '../../types/chat'
import { MessageBubble } from './MessageBubble'
import { MessageInput } from './MessageInput'
import { useAuth } from '../../context/AuthContext'

interface GroupChatPanelProps {
  onUnreadChange?: (total: number) => void
  portal?: 'STUDENT' | 'TEACHER' | 'ADMIN'
}

export const GroupChatPanel: React.FC<GroupChatPanelProps> = ({ onUnreadChange, portal }) => {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<ChatConversationItem[]>([])
  const [selectedConvId, setSelectedConvId] = useState<number | null>(null)
  const [messages, setMessages] = useState<ChatMessageItem[]>([])
  const [loadingConv, setLoadingConv] = useState(true)
  const [loadingMsg, setLoadingMsg] = useState(false)
  const [inputMessage, setInputMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Switcher UI State
  const [showSwitcher, setShowSwitcher] = useState(false)
  const [searchClass, setSearchClass] = useState('')
  const [filterMode, setFilterMode] = useState<'ALL' | 'UNREAD'>('ALL')

  // Members View State
  const [showMembers, setShowMembers] = useState(false)
  const [members, setMembers] = useState<ChatMemberItem[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pendingClassIdRef = useRef<number | null>(null)

  const scrollToBottom = () => {
    if (typeof messagesEndRef.current?.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // 1. Tải danh sách nhóm lớp học
  const loadConversations = async (autoSelect = false) => {
    try {
      const res = await classChatApi.getMyConversations(portal)
      if (res?.success && res.data) {
        setConversations(res.data)

        if (pendingClassIdRef.current) {
          const match = res.data.find((c) => c.classId === pendingClassIdRef.current)
          if (match) {
            setSelectedConvId(match.id)
            pendingClassIdRef.current = null
          }
        } else if (res.data.length > 0 && (selectedConvId === null || autoSelect)) {
          setSelectedConvId((prev) => (prev !== null ? prev : res.data[0].id))
        }

        const total = res.data.reduce((sum, c) => sum + (c.unreadCount || 0), 0)
        onUnreadChange?.(total)
      }
    } catch (err) {
      console.error('Lỗi tải danh sách nhóm lớp:', err)
    } finally {
      setLoadingConv(false)
    }
  }

  useEffect(() => {
    loadConversations(true)
  }, [portal])

  // 2. Lắng nghe sự kiện đồng bộ chọn lớp khi click từ các trang Khóa học / Lớp học
  useEffect(() => {
    const handleClassSync = (event: Event) => {
      const customEvent = event as CustomEvent<{ classId?: number; courseId?: number }>
      const targetClassId = customEvent.detail?.classId
      if (!targetClassId) return

      if (conversations.length > 0) {
        const found = conversations.find((c) => c.classId === targetClassId)
        if (found) {
          setSelectedConvId(found.id)
          setShowSwitcher(false)
        }
      } else {
        pendingClassIdRef.current = targetClassId
      }
    }

    window.addEventListener('ch_academy_select_class_chat', handleClassSync)
    return () => {
      window.removeEventListener('ch_academy_select_class_chat', handleClassSync)
    }
  }, [conversations])

  // 3. Tải tin nhắn của nhóm lớp được chọn
  useEffect(() => {
    if (!selectedConvId) return

    let isMounted = true
    const fetchMessages = async () => {
      setLoadingMsg(true)
      try {
        const res = await classChatApi.getMessages(selectedConvId)
        if (isMounted && res?.success && res.data) {
          setMessages(res.data)
          setTimeout(scrollToBottom, 50)
        }
        // Đánh dấu đã đọc
        await classChatApi.markAsRead(selectedConvId).catch(() => {})
        setConversations((prev) =>
          prev.map((c) => (c.id === selectedConvId ? { ...c, unreadCount: 0 } : c))
        )
      } catch (err) {
        console.error('Lỗi tải tin nhắn nhóm:', err)
      } finally {
        if (isMounted) setLoadingMsg(false)
      }
    }

    fetchMessages()

    return () => {
      isMounted = false
    }
  }, [selectedConvId])

  // 4. Tải danh sách thành viên khi mở popover
  const handleToggleMembers = async () => {
    if (!showMembers && selectedConvId) {
      setShowMembers(true)
      setLoadingMembers(true)
      try {
        const res = await classChatApi.getMembers(selectedConvId)
        if (res?.success && res.data) {
          setMembers(res.data)
        }
      } catch (err) {
        console.error('Lỗi tải thành viên nhóm:', err)
      } finally {
        setLoadingMembers(false)
      }
    } else {
      setShowMembers(false)
    }
  }

  // 5. Gửi tin nhắn
  const handleSend = async () => {
    if (!inputMessage.trim() || !selectedConvId || sending) return

    const content = inputMessage.trim()
    const clientMsgId = 'grp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7)
    setInputMessage('')
    setSending(true)

    // Optimistic UI update
    const optimisticMsg: ChatMessageItem = {
      id: Date.now(),
      conversationId: selectedConvId,
      senderId: user?.id || 0,
      senderName: user?.fullName || 'Tôi',
      senderUsername: user?.username || 'me',
      messageType: 'TEXT',
      content,
      createdAt: new Date().toISOString()
    }
    setMessages((prev) => [...prev, optimisticMsg])
    setTimeout(scrollToBottom, 50)

    try {
      const res = await classChatApi.sendMessage(selectedConvId, {
        content,
        clientMsgId,
        messageType: 'TEXT'
      })
      if (res?.success && res.data) {
        setMessages((prev) =>
          prev.map((m) => (m.id === optimisticMsg.id ? res.data : m))
        )
      }
    } catch (err) {
      console.error('Lỗi gửi tin nhắn nhóm:', err)
    } finally {
      setSending(false)
    }
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (loadingConv) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400 text-xs">
        <RefreshCw className="w-5 h-5 animate-spin mb-2 text-indigo-500" />
        Đang tải danh sách nhóm lớp học...
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 dark:bg-[#111827]">
        <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
          <Users className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-1">
          Chưa có nhóm lớp học
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
          {portal === 'ADMIN'
            ? 'Hiện chưa có nhóm lớp học nào trên hệ thống hoặc danh sách đang đồng bộ. Quản trị viên có thể nhấn nút tải lại bên dưới để cập nhật.'
            : 'Bạn chưa được ghi danh hoặc phân công vào lớp học nào đang hoạt động. Khi có lớp học mới, nhóm trao đổi sẽ tự động xuất hiện tại đây.'}
        </p>
        <button
          type="button"
          onClick={() => {
            setLoadingConv(true)
            loadConversations(true)
          }}
          className="mt-4 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Tải lại danh sách</span>
        </button>
      </div>
    )
  }

  const currentConv = conversations.find((c) => c.id === selectedConvId) || conversations[0]

  // Lọc danh sách lớp học theo từ khóa tìm kiếm và tab chưa đọc
  const filteredConversations = conversations.filter((c) => {
    const matchesSearch =
      !searchClass.trim() ||
      (c.className && c.className.toLowerCase().includes(searchClass.toLowerCase())) ||
      (c.classCode && c.classCode.toLowerCase().includes(searchClass.toLowerCase())) ||
      (c.courseName && c.courseName.toLowerCase().includes(searchClass.toLowerCase())) ||
      (c.teacherName && c.teacherName.toLowerCase().includes(searchClass.toLowerCase()))

    if (!matchesSearch) return false
    if (filterMode === 'UNREAD') return (c.unreadCount || 0) > 0
    return true
  })

  const totalUnreadCount = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0)

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50 dark:bg-[#111827] relative">
      {/* =========================================================================
          1. BỘ CHỌN & CHUYỂN ĐỔI NHÓM LỚP (MULTI-CLASS SELECTOR HEADER)
         ========================================================================= */}
      <div className="px-3.5 py-2.5 border-b border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shrink-0 shadow-2xs">
        <div className="flex items-center justify-between gap-2">
          {/* Header nhóm lớp: Nếu chỉ có 1 lớp thì hiển thị trực tiếp cố định, nếu nhiều lớp thì cho phép bấm chuyển đổi */}
          {conversations.length > 1 ? (
            <button
              type="button"
              onClick={() => setShowSwitcher((prev) => !prev)}
              className="flex-1 min-w-0 flex items-center justify-between p-1.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 transition text-left cursor-pointer group"
              title="Bấm để chọn hoặc chuyển sang nhóm lớp học khác"
            >
              <div className="min-w-0 pr-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-white truncate">
                  <GraduationCap className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span className="truncate">{currentConv.className || currentConv.title}</span>
                  {currentConv.classCode && (
                    <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold shrink-0">
                      {currentConv.classCode}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
                  {currentConv.courseName ? (
                    <span>{currentConv.courseName}</span>
                  ) : (
                    <span>Khóa học</span>
                  )}
                  {currentConv.teacherName && (
                    <>
                      <span>•</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        GV: {currentConv.teacherName}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 pl-1">
                {totalUnreadCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white shadow-xs">
                    {totalUnreadCount}
                  </span>
                )}
                <div className="p-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 group-hover:bg-indigo-100 transition">
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showSwitcher ? 'rotate-180' : ''}`} />
                </div>
              </div>
            </button>
          ) : (
            <div className="flex-1 min-w-0 p-1.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
              <div className="min-w-0 pr-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-white truncate">
                  <GraduationCap className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span className="truncate">{currentConv.className || currentConv.title}</span>
                  {currentConv.classCode && (
                    <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold shrink-0">
                      {currentConv.classCode}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
                  {currentConv.courseName ? (
                    <span>{currentConv.courseName}</span>
                  ) : (
                    <span>Khóa học</span>
                  )}
                  {currentConv.teacherName && (
                    <>
                      <span>•</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        GV: {currentConv.teacherName}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Nút xem thành viên lớp hiện tại */}
          <button
            type="button"
            onClick={handleToggleMembers}
            className={`px-2.5 py-2 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              showMembers
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
            }`}
            title="Xem danh sách thành viên trong nhóm lớp"
          >
            <Users className="w-3.5 h-3.5 text-indigo-500" />
            <span>{currentConv.memberCount || 0}</span>
          </button>
        </div>

        {/* Thanh phím tắt chuyển nhanh giữa các lớp (Nếu có trên 1 lớp) */}
        {conversations.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pt-2 no-scrollbar">
            <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">Lớp:</span>
            {conversations.slice(0, 6).map((c) => {
              const isActive = c.id === selectedConvId
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setSelectedConvId(c.id)
                    setShowSwitcher(false)
                  }}
                  className={`px-2.5 py-0.8 rounded-lg text-[11px] font-semibold whitespace-nowrap transition border inline-flex items-center gap-1 cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                  }`}
                >
                  <span className="truncate max-w-[120px]">{c.classCode || c.className}</span>
                  {(c.unreadCount || 0) > 0 && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                  )}
                </button>
              )
            })}
            {conversations.length > 6 && (
              <button
                type="button"
                onClick={() => setShowSwitcher(true)}
                className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline shrink-0 px-1"
              >
                +{conversations.length - 6} lớp khác
              </button>
            )}
          </div>
        )}
      </div>

      {/* =========================================================================
          2. MENU / POPOVER CHUYỂN ĐỔI NHÓM LỚP (FULL CLASS SWITCHER)
         ========================================================================= */}
      {showSwitcher && (
        <div className="absolute top-[68px] left-2 right-2 z-30 max-h-[380px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-3 flex flex-col space-y-2.5 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-500" />
              <h5 className="text-xs font-bold text-slate-800 dark:text-white">
                Chọn Nhóm Lớp Học ({conversations.length})
              </h5>
            </div>
            <button
              onClick={() => setShowSwitcher(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Ô tìm kiếm lớp học */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchClass}
              onChange={(e) => setSearchClass(e.target.value)}
              placeholder="Tìm theo tên lớp, mã lớp, môn học, giáo viên..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-xs rounded-xl border border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder-slate-400"
            />
          </div>

          {/* Tab lọc: Tất cả / Có tin mới */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFilterMode('ALL')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                filterMode === 'ALL'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Tất cả ({conversations.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('UNREAD')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                filterMode === 'UNREAD'
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <span>Có tin mới</span>
              {totalUnreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-rose-500 text-white">
                  {totalUnreadCount}
                </span>
              )}
            </button>
          </div>

          {/* Danh sách các nhóm lớp */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5 max-h-[220px]">
            {filteredConversations.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                Không tìm thấy lớp học nào phù hợp.
              </div>
            ) : (
              filteredConversations.map((c) => {
                const isActive = c.id === selectedConvId
                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      setSelectedConvId(c.id)
                      setShowSwitcher(false)
                    }}
                    className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between gap-2.5 ${
                      isActive
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-400 dark:border-indigo-600'
                        : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-750 hover:border-indigo-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-800 dark:text-white truncate">
                          {c.className || c.title}
                        </span>
                        {c.classCode && (
                          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold shrink-0">
                            {c.classCode}
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-2 mt-1">
                        {c.courseName && (
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-3 h-3 text-slate-400" />
                            {c.courseName}
                          </span>
                        )}
                        {c.teacherName && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                              GV: {c.teacherName}
                            </span>
                          </>
                        )}
                        <span>•</span>
                        <span className="flex items-center gap-0.5">
                          <Users className="w-3 h-3 text-slate-400" />
                          {c.memberCount || 0}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {(c.unreadCount || 0) > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white shadow-xs">
                          {c.unreadCount} mới
                        </span>
                      )}
                      {isActive ? (
                        <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500" />
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          3. PANEL DANH SÁCH THÀNH VIÊN TRONG LỚP (POPOVER)
         ========================================================================= */}
      {showMembers && (
        <div className="absolute top-[68px] left-2 right-2 z-30 max-h-64 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <h5 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-500" />
              Thành viên nhóm ({members.length})
            </h5>
            <button
              onClick={() => setShowMembers(false)}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {loadingMembers ? (
            <div className="py-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-500" />
              Đang tải danh sách thành viên...
            </div>
          ) : members.length === 0 ? (
            <div className="py-3 text-center text-xs text-slate-400">
              Chưa có thông tin thành viên.
            </div>
          ) : (
            <div className="space-y-1.5">
              {members.map((m) => (
                <div
                  key={m.id || m.userId}
                  className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-[10px] shrink-0">
                      {m.fullName?.charAt(0) || 'U'}
                    </div>
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                      {m.fullName}
                    </span>
                  </div>
                  <span
                    className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full shrink-0 ${
                      m.role === 'TEACHER'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        : m.role === 'ADMIN'
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    }`}
                  >
                    {m.role === 'TEACHER' ? 'Giảng viên' : m.role === 'ADMIN' ? 'Quản trị' : 'Học viên'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          4. DANH SÁCH TIN NHẮN TRONG NHÓM
         ========================================================================= */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {loadingMsg ? (
          <div className="text-center py-12 text-slate-400 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
            Đang tải tin nhắn...
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            Chưa có tin nhắn nào trong nhóm học tập này. Hãy là người đầu tiên trao đổi!
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderUsername === user?.username
            return (
              <MessageBubble
                key={msg.id}
                id={String(msg.id)}
                role={isMe ? 'user' : 'assistant'}
                content={msg.content}
                senderName={msg.senderName}
                isMe={isMe}
                createdAt={
                  msg.createdAt
                    ? new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : ''
                }
                copiedId={copiedId}
                onCopy={handleCopy}
              />
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* =========================================================================
          5. INPUT GỬI TIN NHẮN
         ========================================================================= */}
      <MessageInput
        value={inputMessage}
        onChange={setInputMessage}
        onSend={handleSend}
        placeholder={`Nhắn tin tới nhóm ${currentConv?.className || currentConv?.title || 'lớp'}...`}
        disabled={loadingMsg}
        loading={sending}
      />
    </div>
  )
}
