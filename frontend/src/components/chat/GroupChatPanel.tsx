import React, { useState, useEffect, useRef } from 'react'
import { Users, AlertCircle, RefreshCw } from 'lucide-react'
import { classChatApi } from '../../api/chat'
import type { ChatConversationItem, ChatMessageItem } from '../../types/chat'
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

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    if (typeof messagesEndRef.current?.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Tải danh sách nhóm lớp hợp lệ mà tài khoản được phân quyền tham gia
  const loadConversations = async () => {
    setLoadingConv(true)
    try {
      const res = await classChatApi.getMyConversations()
      if (res.success && res.data) {
        setConversations(res.data)
        if (res.data.length > 0 && selectedConvId === null) {
          setSelectedConvId(res.data[0].id)
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
    loadConversations()
  }, [])

  // Tải tin nhắn của nhóm lớp được chọn
  useEffect(() => {
    if (!selectedConvId) return

    let isMounted = true
    const fetchMessages = async () => {
      setLoadingMsg(true)
      try {
        const res = await classChatApi.getMessages(selectedConvId)
        if (isMounted && res.success && res.data) {
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

  const handleSend = async () => {
    if (!selectedConvId || !inputMessage.trim() || sending) return
    const text = inputMessage.trim()
    setInputMessage('')
    setSending(true)

    const clientMsgId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7)

    // Optimistic UI update
    const tempMsg: ChatMessageItem = {
      id: Date.now(),
      conversationId: selectedConvId,
      senderId: user?.id || 0,
      senderName: user?.fullName || 'Tôi',
      senderUsername: user?.username || 'me',
      messageType: 'TEXT',
      content: text,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    setMessages((prev) => [...prev, tempMsg])
    setTimeout(scrollToBottom, 20)

    try {
      const res = await classChatApi.sendMessage(selectedConvId, {
        content: text,
        clientMsgId
      })
      if (res.success && res.data) {
        setMessages((prev) => prev.map((m) => (m.id === tempMsg.id ? res.data : m)))
      }
    } catch (err) {
      console.error('Lỗi gửi tin nhắn:', err)
      alert('Không thể gửi tin nhắn. Vui lòng kiểm tra kết nối mạng.')
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
        Đang tải nhóm lớp học của bạn...
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

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50 dark:bg-[#111827]">
      {/* Thanh chọn nhóm lớp nếu tham gia nhiều lớp */}
      {conversations.length > 1 && (
        <div className="px-3 py-2 border-b border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 overflow-x-auto flex gap-2 shrink-0">
          {conversations.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedConvId(c.id)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition border inline-flex items-center gap-1.5 ${
                selectedConvId === c.id
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              <span>{c.className || c.title}</span>
              {(c.unreadCount || 0) > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white">
                  {c.unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Danh sách tin nhắn */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {loadingMsg ? (
          <div className="text-center py-12 text-slate-400 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
            Đang tải tin nhắn...
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            Chưa có tin nhắn nào trong nhóm học tập này. Hãy là người đầu tiên đặt câu hỏi!
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
                createdAt={msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                copiedId={copiedId}
                onCopy={handleCopy}
              />
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input gửi tin nhắn */}
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
