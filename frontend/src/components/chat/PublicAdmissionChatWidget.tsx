import React, { useState } from 'react'
import {
  MessageCircle,
  X,
  Maximize2,
  Minimize2,
  Sparkles,
  Headphones,
  UserCheck,
  Phone,
  User,
  GraduationCap
} from 'lucide-react'
import { AIConversationPanel } from './AIConversationPanel'
import { AiVoiceCallModal } from './AiVoiceCallModal'
import { chatApi } from '../../api/chat'

export const PublicAdmissionChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [showVoiceCall, setShowVoiceCall] = useState(false)
  const [showLeadModal, setShowLeadModal] = useState(false)

  // Guest Session Id cho khách vãng lai
  const [guestSessionId] = useState<string>(() => {
    const cached = localStorage.getItem('ch_ai_guest_session_id')
    if (cached) return cached
    const newId = 'GUEST_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now()
    localStorage.setItem('ch_ai_guest_session_id', newId)
    return newId
  })

  // Lead capture state
  const [leadName, setLeadName] = useState('')
  const [leadPhone, setLeadPhone] = useState('')
  const [leadCourse, setLeadCourse] = useState('Tiếng Anh Giao tiếp')
  const [leadSubmitted, setLeadSubmitted] = useState(false)

  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!leadPhone.trim() || !leadName.trim()) {
      alert('Vui lòng điền họ tên và số điện thoại liên hệ!')
      return
    }

    try {
      await chatApi.submitLead({
        fullName: leadName.trim(),
        phone: leadPhone.trim(),
        courseInterest: leadCourse,
        note: `Khách đăng ký qua form tư vấn trang chủ (Session: ${guestSessionId})`
      })
      setLeadSubmitted(true)
      setTimeout(() => {
        setShowLeadModal(false)
        setLeadSubmitted(false)
      }, 2000)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Lỗi gửi thông tin tư vấn')
    }
  }

  return (
    <>
      {/* 1. NÚT TRÒN CHÍNH GÓC DƯỚI BÊN PHẢI (CHỈ MỞ TRỰC TIẾP CHAT TUYỂN SINH, KHÔNG CÓ MENU) */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`relative w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-white transition-all transform hover:scale-105 active:scale-95 cursor-pointer ${
            isOpen
              ? 'bg-slate-700 hover:bg-slate-800 rotate-90'
              : 'bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-500 animate-pulse'
          }`}
          title="Tư vấn Tuyển sinh AI — CH Academy"
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <>
              <MessageCircle className="w-6 h-6" />
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
              </span>
            </>
          )}
        </button>
      </div>

      {/* 2. CỬA SỔ CHAT TUYỂN SINH CÔNG KHAI */}
      {isOpen && (
        <div
          className={`fixed z-50 bg-white dark:bg-[#0F172A] rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 flex flex-col overflow-hidden transition-all duration-200 animate-in fade-in slide-in-from-bottom-5 ${
            isExpanded
              ? 'inset-4 md:inset-10 w-auto h-auto'
              : 'bottom-24 right-4 sm:right-6 w-[92vw] sm:w-[440px] h-[640px] max-h-[85vh]'
          }`}
        >
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 text-white flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 shadow-inner">
                <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
              </div>
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-sm truncate">
                    Chuyên viên Tư vấn Tuyển sinh AI
                  </h3>
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase bg-emerald-400 text-emerald-950">
                    Online 24/7
                  </span>
                </div>
                <p className="text-[11px] text-blue-100 truncate opacity-90">
                  Giải đáp khóa học, học phí, lịch khai giảng & ưu đãi
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {/* Nút Tư vấn ngay */}
              <button
                type="button"
                onClick={() => setShowLeadModal(true)}
                className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold text-[11px] transition shadow-xs flex items-center gap-1 cursor-pointer"
                title="Để lại số điện thoại để trung tâm tư vấn"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Tư vấn ngay</span>
              </button>

              {/* Nút Voice AI Call */}
              <button
                type="button"
                onClick={() => setShowVoiceCall(true)}
                className="p-1.5 rounded-lg hover:bg-white/20 transition cursor-pointer"
                title="Gọi thoại trực tiếp với AI"
              >
                <Headphones className="w-4 h-4 text-emerald-200" />
              </button>

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

          {/* Body: AI Conversation Panel (100% tuyển sinh, không có group chat) */}
          <AIConversationPanel
            portal="PUBLIC"
            agentName="Chuyên viên Tư vấn Tuyển sinh AI"
            welcomeMessage="Xin chào! Tôi là Chuyên viên Tư vấn Tuyển sinh AI của CH Academy. Tôi có thể hỗ trợ bạn tìm hiểu chi tiết các khóa học, học phí niêm yết, lịch khai giảng và chính sách ưu đãi mới nhất. Bạn quan tâm khóa học nào hôm nay?"
            suggestedPrompts={[
              '🎓 Các khóa học đang tuyển sinh',
              '💰 Biểu phí & học bổng 2026',
              '📅 Lịch khai giảng gần nhất',
              '📞 Đăng ký kiểm tra đầu vào'
            ]}
            features={{
              hasTutoringMode: false,
              hasVoiceCall: true,
              hasLeadCapture: true,
              hasDirectHandoff: true
            }}
            sessionId={guestSessionId}
            onOpenVoiceCall={() => setShowVoiceCall(true)}
            onOpenLeadModal={() => setShowLeadModal(true)}
          />
        </div>
      )}

      {/* 3. MODAL ĐĂNG KÝ TƯ VẤN NHANH */}
      {showLeadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#151F31] rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                  Đăng ký Nhận Tư vấn Miễn phí
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowLeadModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {leadSubmitted ? (
              <div className="text-center py-6">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center mb-2">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h5 className="text-sm font-bold text-slate-800 dark:text-white mb-1">
                  Gửi thông tin thành công!
                </h5>
                <p className="text-xs text-slate-500">
                  Chuyên viên tuyển sinh của CH Academy sẽ liên hệ hỗ trợ bạn sớm nhất.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitLead} className="space-y-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Để lại thông tin để nhận lộ trình học tập tối ưu và ưu đãi học phí lên tới 25%:
                </p>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1 block">
                    Họ và tên của bạn:
                  </label>
                  <input
                    type="text"
                    required
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    placeholder="Ví dụ: Nguyễn Văn A"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1 block">
                    Số điện thoại liên hệ (Zalo):
                  </label>
                  <input
                    type="tel"
                    required
                    value={leadPhone}
                    onChange={(e) => setLeadPhone(e.target.value)}
                    placeholder="Ví dụ: 0912 345 678"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
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
                    <option value="Luyện thi IELTS Cấp tốc 6.5+">Luyện thi IELTS Cấp tốc 6.5+</option>
                    <option value="Lập trình Python Căn bản">Lập trình Python Căn bản & Dữ liệu</option>
                  </select>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowLeadModal(false)}
                    className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow cursor-pointer"
                  >
                    Gửi yêu cầu tư vấn
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 4. MODAL CUỘC GỌI VOICE AI TUYỂN SINH */}
      <AiVoiceCallModal
        isOpen={showVoiceCall}
        onClose={() => setShowVoiceCall(false)}
        agentName="Chuyên viên Tư vấn Tuyển sinh AI"
        agentRole="Tư vấn Tuyển sinh"
        agentCode="AGENT_ADMISSIONS"
        portal="PUBLIC"
        guestSessionId={guestSessionId}
      />
    </>
  )
}
