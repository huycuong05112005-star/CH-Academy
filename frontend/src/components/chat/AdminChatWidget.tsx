import React, { useState, useEffect } from 'react'
import {
  Sparkles,
  Users,
  X,
  Maximize2,
  Minimize2,
  ShieldCheck,
  Headphones
} from 'lucide-react'
import { AIConversationPanel } from './AIConversationPanel'
import { GroupChatPanel } from './GroupChatPanel'
import { AiVoiceCallModal } from './AiVoiceCallModal'
import { classChatApi } from '../../api/chat'

export const AdminChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<'ai' | 'group'>('ai') // AI QUẢN TRỊ LÀ MẶC ĐỊNH
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
      {/* 1. NÚT NỔI CHÍNH GÓC DƯỚI BÊN PHẢI CỔNG QUẢN TRỊ */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`relative w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-white transition-all transform hover:scale-105 active:scale-95 cursor-pointer ${
            isOpen
              ? 'bg-slate-700 hover:bg-slate-800 rotate-90'
              : 'bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-600'
          }`}
          title="Trợ lý Quản trị & Giám sát Nhóm lớp — Cổng Admin"
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <>
              <ShieldCheck className="w-6 h-6" />
              {totalUnread > 0 ? (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white shadow-md border-2 border-white dark:border-slate-900">
                  {totalUnread}
                </span>
              ) : (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-purple-500"></span>
                </span>
              )}
            </>
          )}
        </button>
      </div>

      {/* 2. CỬA SỔ CHAT CỔNG QUẢN TRỊ */}
      {isOpen && (
        <div
          className={`fixed z-50 bg-white dark:bg-[#0F172A] rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 flex flex-col overflow-hidden transition-all duration-200 animate-in fade-in slide-in-from-bottom-5 ${
            isExpanded
              ? 'inset-4 md:inset-10 w-auto h-auto'
              : 'bottom-24 right-4 sm:right-6 w-[92vw] sm:w-[440px] h-[640px] max-h-[85vh]'
          }`}
        >
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-purple-700 via-indigo-600 to-blue-600 text-white flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 shadow-inner">
                {activeTab === 'ai' ? (
                  <Sparkles className="w-5 h-5 text-purple-200 animate-pulse" />
                ) : (
                  <Users className="w-5 h-5 text-white" />
                )}
              </div>
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-sm truncate">
                    {activeTab === 'ai' ? 'Trợ lý Quản trị & Vận hành' : 'Giám sát Chat Nhóm Lớp'}
                  </h3>
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase bg-purple-300 text-purple-950">
                    Admin
                  </span>
                </div>
                <p className="text-[11px] text-purple-100 truncate opacity-90">
                  {activeTab === 'ai'
                    ? 'Tra cứu chỉ số học viên, doanh thu, chuyên cần & trung tâm'
                    : 'Giám sát và điều hành toàn bộ nhóm lớp học toàn trung tâm'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {activeTab === 'ai' && (
                <button
                  type="button"
                  onClick={() => setShowVoiceCall(true)}
                  className="p-1.5 rounded-lg hover:bg-white/20 transition cursor-pointer"
                  title="Trao đổi giọng nói với Trợ lý Quản trị"
                >
                  <Headphones className="w-4 h-4 text-purple-200" />
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

          {/* Sub Navigation: 2 Tab (Trợ lý AI & Giám sát Nhóm lớp) */}
          <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 p-1 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('ai')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'ai'
                  ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Trợ lý Quản trị</span>
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
              <span>Giám sát Nhóm lớp</span>
              {totalUnread > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                  {totalUnread}
                </span>
              )}
            </button>
          </div>

          {/* Body Content */}
          {activeTab === 'ai' ? (
            <AIConversationPanel
              portal="ADMIN"
              agentName="Trợ lý Quản trị & Vận hành"
              welcomeMessage="Chào Quản trị viên! Tôi là Trợ lý Quản trị hệ thống CH Academy. Tôi có thể hỗ trợ tra cứu số liệu học viên, tỷ lệ chuyên cần, doanh thu và báo cáo vận hành toàn trung tâm. Quản trị viên cần tra cứu thông tin gì?"
              suggestedPrompts={[
                '📈 Báo cáo chỉ số tuyển sinh tuần này',
                '👥 Tỷ lệ chuyên cần các lớp đang diễn ra',
                '💰 Tổng quan học phí đã thu và công nợ',
                '⚡ Trạng thái các dịch vụ hệ thống'
              ]}
              features={{
                hasTutoringMode: false,
                hasVoiceCall: false,
                hasLeadCapture: false,
                hasDirectHandoff: false
              }}
            />
          ) : (
            <GroupChatPanel onUnreadChange={setTotalUnread} />
          )}
        </div>
      )}

      {/* 3. MODAL CUỘC GỌI VOICE AI QUẢN TRỊ */}
      <AiVoiceCallModal
        isOpen={showVoiceCall}
        onClose={() => setShowVoiceCall(false)}
        agentName="Trợ lý Quản trị & Vận hành"
        agentRole="Quản trị viên"
        agentCode="AGENT_ADMIN_ASSISTANT"
        portal="ADMIN"
      />
    </>
  )
}
