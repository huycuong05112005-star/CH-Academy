import React, { useState, useEffect, useRef } from 'react'
import {
  Users,
  RefreshCw,
  Search,
  BookOpen,
  GraduationCap,
  X,
  ChevronDown,
  Shield,
  UserCheck
} from 'lucide-react'
import { classChatApi } from '../../api/chat'
import type { ChatConversationItem, ChatMessageItem, ChatMemberItem } from '../../types/chat'
import { MessageBubble } from './MessageBubble'
import { MessageInput } from './MessageInput'
import { useAuth } from '../../context/AuthContext'

interface GroupChatPanelProps {
  onUnreadChange?: (total: number) => void
}

export const GroupChatPanel: React.FC<GroupChatPanelProps> = ({ onUnreadChange }) => {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<ChatConversationItem[]>([])
  const [selectedConvId, setSelectedConvId] = useState<number | null>(null)
  const [messages, setMessages] = useState<ChatMessageItem[]>([])
  const [loadingConv, setLoadingConv] = useState(true)
  const [loadingMsg, setLoadingMsg] = useState(false)
  const [inputMessage, setInputMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [searchClass, setSearchClass] = useState('')
  const [showMembers, setShowMembers] = useState(false)
  const [members, setMembers] = useState<ChatMemberItem[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    if (typeof messagesEndRef.current?.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Tải danh sách nhóm lớp hợp lệ mà tài khoản được phân quyền tham gia
  const loadConversations = async (autoSelect = false) => {
    try {
      const res = await classChatApi.getMyConversations()
      if (res?.success && res.data) {
        setConversations(res.data)
        if (res.data.length > 0 && (selectedConvId === null || autoSelect)) {
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
  }, [])

  // Tải tin nhắn của nhóm lớp được chọn
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
        // Cập nhật lại số unread của nhóm này trong state
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

  // Tải danh sách thành viên khi mở popover
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
          Bạn chưa được ghi danh hoặc phân công vào lớp học nào đang hoạt động. Khi có lớp học mới, nhóm trao đổi sẽ tự động xuất hiện tại đây.
        </p>
      </div>
    )
  }

  const currentConv = conversations.find((c) => c.id === selectedConvId)
  const filteredConversations = conversations.filter(
    (c) =>
      !searchClass.trim() ||
      (c.className && c.className.toLowerCase().includes(searchClass.toLowerCase())) ||
      (c.classCode && c.classCode.toLowerCase().includes(searchClass.toLowerCase())) ||
      (c.courseName && c.courseName.toLowerCase().includes(searchClass.toLowerCase()))
  )

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50 dark:bg-[#111827] relative">
      {/* 1. Thanh chọn nhiều khóa học / lớp học (Multi-Course Class Selector) */}
      {conversations.length > 1 && (
        <div className="px-3 py-2 border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shrink-0 space-y-1.5">
          {conversations.length > 3 && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
              <input
                type="text"
                value={searchClass}
                onChange={(e) => setSearchClass(e.target.value)}
                placeholder="Tìm lớp học, môn học..."
                className="w-full pl-8 pr-3 py-1 bg-slate-100 dark:bg-slate-800 text-xs rounded-lg border-0 focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
              />
            </div>
          )}

          <div className="overflow-x-auto flex gap-1.5 pb-0.5 no-scrollbar">
            {filteredConversations.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedConvId(c.id)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition border inline-flex items-center gap-1.5 cursor-pointer ${
                  selectedConvId === c.id
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                }`}
              >
                <span>{c.classCode || c.className || c.title}</span>
                {(c.unreadCount || 0) > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white shadow-xs">
                    {c.unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 2. Header Chi tiết Nhóm Lớp Hiện Tại */}
      {currentConv && (
        <div className="px-3.5 py-2 border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shrink-0 shadow-2xs">
          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-white truncate">
              <GraduationCap className="w-4 h-4 text-indigo-500 shrink-0" />
              <span className="truncate">{currentConv.className || currentConv.title}</span>
              {currentConv.classCode && (
                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
                  {currentConv.classCode}
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-2 mt-0.5">
              {currentConv.courseName && (
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3 h-3 text-slate-400" />
                  {currentConv.courseName}
                </span>
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

          <button
            type="button"
            onClick={handleToggleMembers}
            className="px-2.5 py-1 rounded-lg text-[11px] font-medium border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 flex items-center gap-1 shrink-0 cursor-pointer"
            title="Xem danh sách thành viên trong lớp"
          >
            <Users className="w-3.5 h-3.5 text-indigo-500" />
            <span>{currentConv.memberCount || 0}</span>
          </button>
        </div>
      )}

      {/* 3. Panel Danh sách thành viên (Khi mở) */}
      {showMembers && (
        <div className="absolute top-12 left-0 right-0 z-20 max-h-60 overflow-y-auto bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xl p-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-100 dark:border-slate-800">
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

      {/* 4. Danh sách tin nhắn */}
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

      {/* 5. Input gửi tin nhắn */}
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
