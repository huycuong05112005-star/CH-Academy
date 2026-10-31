import React, { useState, useEffect } from 'react'
import {
  Sparkles,
  Users,
  X,
  Maximize2,
  Minimize2,
  Headphones,
  BookOpen
} from 'lucide-react'
import { AIConversationPanel } from './AIConversationPanel'
import { GroupChatPanel } from './GroupChatPanel'
import { AiVoiceCallModal } from './AiVoiceCallModal'
import { classChatApi } from '../../api/chat'

export const TeacherChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<'ai' | 'group'>('ai') // TRỢ LÝ GIẢNG DẠY LÀ MẶC ĐỊNH
  const [showVoiceCall, setShowVoiceCall] = useState(false)
  const [totalUnread, setTotalUnread] = useState(0)

  // Tải số lượng tin nhắn chưa đọc từ các nhóm lớp phụ trách
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

    const handleClassSync = () => {
      setActiveTab('group')
    }
    window.addEventListener('ch_academy_select_class_chat', handleClassSync)
    return () => {
      window.removeEventListener('ch_academy_select_class_chat', handleClassSync)
    }
  }, [])

  return (
    <>
      {/* 1. NÚT NỔI CHÍNH GÓC DƯỚI BÊN PHẢI CỔNG GIẢNG VIÊN */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`relative w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-white transition-all transform hover:scale-105 active:scale-95 cursor-pointer ${
            isOpen
              ? 'bg-slate-700 hover:bg-slate-800 rotate-90'
              : 'bg-gradient-to-tr from-amber-600 via-orange-600 to-indigo-600'
          }`}
          title="Trợ lý Giảng dạy & Chat Lớp học — Cổng Giảng viên"
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <>
              <BookOpen className="w-6 h-6" />
              {totalUnread > 0 ? (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white shadow-md border-2 border-white dark:border-slate-900">
                  {totalUnread}
                </span>
              ) : (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
                </span>
              )}
            </>
          )}
        </button>
      </div>

      {/* 2. CỬA SỔ CHAT CỔNG GIẢNG VIÊN */}
      {isOpen && (
        <div
          className={`fixed z-50 bg-white dark:bg-[#0F172A] rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 flex flex-col overflow-hidden transition-all duration-200 animate-in fade-in slide-in-from-bottom-5 ${
            isExpanded
              ? 'inset-4 md:inset-10 w-auto h-auto'
              : 'bottom-24 right-4 sm:right-6 w-[92vw] sm:w-[440px] h-[640px] max-h-[85vh]'
          }`}
        >
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-amber-600 via-orange-600 to-indigo-600 text-white flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 shadow-inner">
                {activeTab === 'ai' ? (
                  <Sparkles className="w-5 h-5 text-amber-200 animate-pulse" />
                ) : (
                  <Users className="w-5 h-5 text-white" />
                )}
              </div>
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-sm truncate">
                    {activeTab === 'ai' ? 'Trợ lý Giảng dạy & Soạn bài' : 'Chat Lớp Phụ Trách'}
                  </h3>
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase bg-amber-300 text-amber-950">
                    Giảng viên
                  </span>
                </div>
                <p className="text-[11px] text-amber-100 truncate opacity-90">
                  {activeTab === 'ai'
                    ? 'Hỗ trợ soạn giáo án, câu hỏi kiểm tra & phân tích lớp học'
                    : 'Trao đổi cùng học viên các lớp được phân công'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {activeTab === 'ai' && (
                <button
                  type="button"
                  onClick={() => setShowVoiceCall(true)}
                  className="p-1.5 rounded-lg hover:bg-white/20 transition cursor-pointer"
                  title="Thảo luận giọng nói với Trợ lý AI"
                >
                  <Headphones className="w-4 h-4 text-amber-200" />
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

          {/* Sub Navigation */}
          <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 p-1 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('ai')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'ai'
                  ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Trợ lý Giảng dạy</span>
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
              <span>Nhóm lớp giảng dạy</span>
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
              portal="TEACHER"
              agentName="Trợ lý Giảng dạy & Soạn bài"
              welcomeMessage="Chào thầy cô! Tôi là Trợ lý Giảng dạy & Soạn bài của CH Academy. Tôi có thể hỗ trợ soạn giáo án, gợi ý đề thi, tóm tắt tài liệu môn học và phân tích điểm số học viên. Hôm nay tôi có thể hỗ trợ gì cho thầy cô?"
              suggestedPrompts={[
                '📋 Gợi ý giáo án cho buổi học tới',
                '❓ Tạo 5 câu hỏi trắc nghiệm kiểm tra nhanh',
                '📊 Phân tích kết quả học tập của lớp',
                '💡 Đề xuất bài tập bổ trợ cho học viên yếu'
              ]}
              features={{
                hasTutoringMode: false,
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

      {/* 3. MODAL CUỘC GỌI VOICE AI GIẢNG VIÊN */}
      <AiVoiceCallModal
        isOpen={showVoiceCall}
        onClose={() => setShowVoiceCall(false)}
        agentName="Trợ lý Giảng dạy & Soạn bài"
        agentRole="Giảng viên"
        agentCode="AGENT_TEACHER_ASSISTANT"
        portal="TEACHER"
      />
    </>
  )
}
