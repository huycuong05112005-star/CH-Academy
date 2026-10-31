import React, { useState, useEffect } from 'react'
import {
  Sparkles,
  Users,
  X,
  Maximize2,
  Minimize2,
  Headphones,
  GraduationCap
} from 'lucide-react'
import { AIConversationPanel } from './AIConversationPanel'
import { GroupChatPanel } from './GroupChatPanel'
import { AiVoiceCallModal } from './AiVoiceCallModal'
import { classChatApi } from '../../api/chat'

export const StudentChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<'ai' | 'group'>('ai') // AI GIA SƯ LÀ TAB MẶC ĐỊNH
  const [showVoiceCall, setShowVoiceCall] = useState(false)
  const [totalUnread, setTotalUnread] = useState(0)

  // Tải số lượng tin nhắn chưa đọc từ các nhóm lớp
  useEffect(() => {
    if (typeof classChatApi?.getTotalUnreadCount === 'function') {
      classChatApi.getTotalUnreadCount()
        .then((res) => {
          if (res?.success && typeof res.data === 'number') {
            setTotalUnread(res.data)
          }
        })
        .catch(() => {})
    }
  }, [])

  return (
    <>
      {/* 1. NÚT NỔI CHÍNH GÓC DƯỚI BÊN PHẢI CỔNG HỌC VIÊN */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`relative w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-white transition-all transform hover:scale-105 active:scale-95 cursor-pointer ${
            isOpen
              ? 'bg-slate-700 hover:bg-slate-800 rotate-90'
              : 'bg-gradient-to-tr from-emerald-600 via-teal-600 to-blue-600'
          }`}
          title="AI Gia sư & Chat Nhóm lớp — Cổng Học viên"
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <>
              <GraduationCap className="w-6 h-6" />
              {totalUnread > 0 ? (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white shadow-md border-2 border-white dark:border-slate-900">
                  {totalUnread}
                </span>
              ) : (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
                </span>
              )}
            </>
          )}
        </button>
      </div>

      {/* 2. CỬA SỔ CHAT CỔNG HỌC VIÊN */}
      {isOpen && (
        <div
          className={`fixed z-50 bg-white dark:bg-[#0F172A] rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 flex flex-col overflow-hidden transition-all duration-200 animate-in fade-in slide-in-from-bottom-5 ${
            isExpanded
              ? 'inset-4 md:inset-10 w-auto h-auto'
              : 'bottom-24 right-4 sm:right-6 w-[92vw] sm:w-[440px] h-[640px] max-h-[85vh]'
          }`}
        >
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 text-white flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 shadow-inner">
                {activeTab === 'ai' ? (
                  <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                ) : (
                  <Users className="w-5 h-5 text-white" />
                )}
              </div>
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-sm truncate">
                    {activeTab === 'ai' ? 'AI Gia sư' : 'Chat Nhóm Lớp Học'}
                  </h3>
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase bg-emerald-300 text-emerald-950">
                    Học viên
                  </span>
                </div>
                <p className="text-[11px] text-emerald-100 truncate opacity-90">
                  {activeTab === 'ai'
                    ? 'Trợ lý Học tập • Hỗ trợ bài tập & giải đáp 24/7'
                    : 'Trao đổi cùng giảng viên và các bạn cùng lớp'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {/* Nút Voice AI Call cho học viên */}
              {activeTab === 'ai' && (
                <button
                  type="button"
                  onClick={() => setShowVoiceCall(true)}
                  className="p-1.5 rounded-lg hover:bg-white/20 transition cursor-pointer"
                  title="Luyện đàm thoại với AI Gia sư"
                >
                  <Headphones className="w-4 h-4 text-emerald-200" />
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsExpanded((prev) => !prev)}
                className="p-1.5 rounded-lg hover:bg-white/20 transition cursor-pointer"
                title={isExpanded ? 'Thu nhỏ' : 'Phóng to'}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/20 transition cursor-pointer"
                title="Đóng cửa sổ"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sub Navigation: 2 Tab rõ rệt (AI Gia sư & Chat nhóm lớp) */}
          <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 p-1 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('ai')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'ai'
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Gia sư</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('group')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'group'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Chat nhóm lớp</span>
              {totalUnread > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-black">
                  {totalUnread}
                </span>
              )}
            </button>
          </div>

          {/* Body */}
          {activeTab === 'ai' ? (
            <AIConversationPanel
              portal="STUDENT"
              agentName="AI Gia sư"
              welcomeMessage="Chào bạn! Tôi là AI Gia sư đồng hành học tập của CH Academy. Tôi có thể hỗ trợ bạn giải thích bài học, hướng dẫn giải bài tập theo 6 bước sư phạm kiến tạo hoặc cùng luyện tập kiến thức. Hôm nay bạn cần hỗ trợ phần nào?"
              suggestedPrompts={[
                '📐 Hướng dẫn giải bài tập theo 6 bước sư phạm',
                '✍️ Sửa lỗi phát âm & ngữ pháp tiếng Anh',
                '📝 Tóm tắt kiến thức bài học vừa qua',
                '🎯 Tạo 3 câu hỏi trắc nghiệm tự luyện'
              ]}
              features={{
                hasTutoringMode: true,
                hasVoiceCall: true,
                hasLeadCapture: false,
                hasDirectHandoff: false
              }}
              onOpenVoiceCall={() => setShowVoiceCall(true)}
            />
          ) : (
            <GroupChatPanel onUnreadChange={setTotalUnread} />
          )}
        </div>
      )}

      {/* 3. MODAL CUỘC GỌI VOICE AI GIA SƯ */}
      <AiVoiceCallModal
        isOpen={showVoiceCall}
        onClose={() => setShowVoiceCall(false)}
        agentName="AI Gia sư"
        agentRole="Trợ lý Học tập"
        agentCode="AGENT_STUDENT_TUTOR"
        portal="STUDENT"
      />
    </>
  )
}
