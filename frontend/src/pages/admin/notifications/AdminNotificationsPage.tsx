import React, { useEffect, useState } from 'react'
import { notificationsApi } from '../../../api/notifications'
import { classesApi } from '../../../api/classes'
import type { NotificationItem } from '../../../types/notification'
import type { SessionMaterial } from '../../../types/teacher'
import type { ClassItem } from '../../../types/class'
import { NotificationDetailModal } from '../../../components/ui/NotificationDetailModal'
import {
  Send,
  Trash2,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  ChevronRight
} from 'lucide-react'

export const AdminNotificationsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'send' | 'history' | 'teacher_activity'>('send')
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null)
  const unreadCount = notifications.filter((n) => !n.isRead).length
  const [teacherMaterials, setTeacherMaterials] = useState<SessionMaterial[]>([])
  const [classList, setClassList] = useState<ClassItem[]>([])

  const handleViewNotificationDetail = async (notif: NotificationItem) => {
    setSelectedNotification(notif)
    if (!notif.isRead) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
      )
      try {
        await notificationsApi.markAsRead(notif.id)
      } catch (err) {
        console.error('Failed to mark notification read', err)
      }
    }
  }

  // Form State
  const [title, setTitle] = useState<string>('')
  const [content, setContent] = useState<string>('')
  const [targetAudience, setTargetAudience] = useState<string>('ALL')
  const [targetClassId, setTargetClassId] = useState<number | undefined>(undefined)
  const [priority, setPriority] = useState<string>('NORMAL')
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [notifRes, matRes, classRes] = await Promise.all([
        notificationsApi.getAll().catch(() => null),
        notificationsApi.getTeacherMaterials().catch(() => null),
        classesApi.searchClasses({ size: 100 }).catch(() => null)
      ])

      if (notifRes && notifRes.success && notifRes.data) {
        setNotifications(notifRes.data)
      }
      if (matRes && matRes.success && matRes.data) {
        setTeacherMaterials(matRes.data)
      }
      if (classRes && classRes.success && classRes.data) {
        setClassList(classRes.data.content || [])
      }
    } catch {
      // Non-fatal
    }
  }

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccessMsg(null)
    setErrorMsg(null)

    if (!title.trim() || !content.trim()) {
      setErrorMsg('Vui lòng nhập tiêu đề và nội dung thông báo')
      return
    }

    if (targetAudience === 'CLASS' && !targetClassId) {
      setErrorMsg('Vui lòng chọn lớp học cụ thể để gửi thông báo')
      return
    }

    setSubmitting(true)
    try {
      const res = await notificationsApi.create({
        title: title.trim(),
        content: content.trim(),
        targetAudience,
        targetClassId: targetAudience === 'CLASS' ? targetClassId : undefined,
        priority
      })

      if (res.success) {
        setSuccessMsg('Đã phát thông báo thành công đến các đối tượng đã chọn!')
        setTitle('')
        setContent('')
        loadData()
      } else {
        setErrorMsg(res.message || 'Lỗi gửi thông báo')
      }
    } catch (err: unknown) {
      const e = err as { message?: string }
      setErrorMsg(e.message || 'Lỗi gửi thông báo')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteNotification = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa thông báo này?')) return

    try {
      const res = await notificationsApi.delete(id)
      if (res.success) {
        loadData()
      }
    } catch (err: unknown) {
      const e = err as { message?: string }
      alert(e.message || 'Lỗi khi xóa thông báo')
    }
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—'
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateStr
    }
  }

  const renderMaterialBadge = (type: string) => {
    switch (type) {
      case 'SLIDE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">SLIDE</span>
      case 'EXERCISE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">BÀI TẬP</span>
      case 'VIDEO':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">VIDEO</span>
      case 'LINK':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300">LIÊN KẾT</span>
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">TÀI LIỆU</span>
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#2A3A50]">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-[#A6B4C8] uppercase tracking-wider mb-1">
            <span>Truyền thông & Giám sát đào tạo</span>
          </div>
          <h1 className="text-2xl font-black text-[#142B4A] dark:text-[#E8EEF7] tracking-tight">
            Thông báo & Hoạt động Giảng viên
          </h1>
          <p className="text-xs text-slate-500 dark:text-[#A6B4C8] mt-1">
            Phát thông báo cho Giáo viên, Học viên từng lớp và theo dõi tài liệu bài giảng giáo viên cập nhật.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/90 dark:bg-[#1C293D] rounded-2xl border border-slate-200/60 dark:border-[#2A3A50] shadow-xs">
          <button
            onClick={() => setActiveTab('send')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'send'
                ? 'bg-white dark:bg-[#151F31] text-[#142B4A] dark:text-[#38BDF8] shadow-sm'
                : 'text-slate-600 dark:text-[#A6B4C8] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Gửi thông báo
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-white dark:bg-[#151F31] text-[#142B4A] dark:text-[#38BDF8] shadow-sm'
                : 'text-slate-600 dark:text-[#A6B4C8] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>Lịch sử</span>
            {unreadCount > 0 ? (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white shadow-2xs">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            ) : (
              <span className="text-[11px] opacity-60">({notifications.length})</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('teacher_activity')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'teacher_activity'
                ? 'bg-white dark:bg-[#151F31] text-[#142B4A] dark:text-[#38BDF8] shadow-sm'
                : 'text-slate-600 dark:text-[#A6B4C8] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Tài liệu GV đẩy ({teacherMaterials.length})
          </button>
        </div>
      </div>

      {/* TAB 1: GỬI THÔNG BÁO */}
      {activeTab === 'send' && (
        <div className="max-w-3xl bg-white dark:bg-[#151F31] rounded-3xl border border-slate-200/80 dark:border-[#2A3A50] p-6 sm:p-8 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-[#142B4A] dark:text-[#E8EEF7]">
              Tạo thông báo mới
            </h3>
            <p className="text-xs text-slate-500 dark:text-[#A6B4C8]">
              Thông báo sẽ ngay lập tức được gửi đến Cổng Giáo viên hoặc Cổng Học viên tương ứng.
            </p>
          </div>

          {successMsg && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
              <AlertTriangle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSendNotification} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-[#E8EEF7] mb-1">
                Tiêu đề thông báo *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Lịch nghỉ lễ 30/4 & Hoãn ca học buổi tối thứ 6"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-slate-50/50 dark:bg-[#1C293D] text-sm text-[#142B4A] dark:text-[#E8EEF7]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-[#E8EEF7] mb-1">
                  Đối tượng nhận thông báo
                </label>
                <select
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-xs font-semibold text-[#142B4A] dark:text-[#E8EEF7]"
                >
                  <option value="ALL">Tất cả mọi người (Giáo viên & Học viên)</option>
                  <option value="TEACHERS">Chỉ gửi cho Giảng viên (TEACHERS)</option>
                  <option value="STUDENTS">Chỉ gửi cho toàn thể Học viên (STUDENTS)</option>
                  <option value="CLASS">Gửi riêng cho một Lớp học cụ thể (CLASS)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-[#E8EEF7] mb-1">
                  Mức độ ưu tiên
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-xs font-semibold text-[#142B4A] dark:text-[#E8EEF7]"
                >
                  <option value="NORMAL">Bình thường (NORMAL)</option>
                  <option value="HIGH">Quan trọng (HIGH)</option>
                  <option value="URGENT">Khẩn cấp (URGENT)</option>
                </select>
              </div>
            </div>

            {targetAudience === 'CLASS' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-[#E8EEF7] mb-1">
                  Chọn lớp học nhận thông báo *
                </label>
                <select
                  required
                  value={targetClassId || ''}
                  onChange={(e) => setTargetClassId(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-blue-300 dark:border-blue-700 bg-white dark:bg-[#1C293D] text-xs font-semibold text-[#142B4A] dark:text-[#E8EEF7]"
                >
                  <option value="">-- Chọn lớp học --</option>
                  {classList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code}) - {c.courseName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-[#E8EEF7] mb-1">
                Nội dung chi tiết thông báo *
              </label>
              <textarea
                rows={4}
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Nhập nội dung thông báo đầy đủ gửi đến các thầy cô hoặc các bạn học viên..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-slate-50/50 dark:bg-[#1C293D] text-sm text-[#142B4A] dark:text-[#E8EEF7]"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-[#2A3A50] flex items-center justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-[#142B4A] dark:bg-[#38BDF8] text-white dark:text-[#0B1220] font-bold text-xs shadow-md transition disabled:opacity-50 flex items-center gap-2"
              >
                <Send size={14} />
                <span>{submitting ? 'Đang phát thông báo...' : 'Phát thông báo ngay'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: LỊCH SỬ THÔNG BÁO */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {notifications.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-[#151F31] rounded-3xl border border-slate-200 dark:border-[#2A3A50] text-xs text-slate-400">
              Chưa có thông báo nào được phát đi.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleViewNotificationDetail(n)}
                  className="hover-lift p-6 rounded-2xl bg-white dark:bg-[#151F31] border border-slate-200/80 dark:border-[#2A3A50] shadow-sm flex flex-col justify-between space-y-4 group transition-all duration-200 cursor-pointer select-none"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase bg-blue-50 text-blue-700 border border-blue-200/60 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-900">
                          {n.targetAudience === 'ALL' ? 'TẤT CẢ' : n.targetAudience === 'TEACHERS' ? 'GIẢNG VIÊN' : n.targetAudience === 'STUDENTS' ? 'HỌC VIÊN' : n.targetAudience}
                        </span>
                        {n.targetClassName && (
                          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase bg-purple-50 text-purple-700 border border-purple-200/60 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-900">
                            {n.targetClassName}
                          </span>
                        )}
                        {n.priority === 'HIGH' && (
                          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900">
                            QUAN TRỌNG
                          </span>
                        )}
                        {n.priority === 'URGENT' && (
                          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase bg-rose-50 text-rose-700 border border-rose-200/60 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900">
                            KHẨN CẤP
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteNotification(n.id)
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                        title="Xóa thông báo"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <h4 className="text-base font-bold text-slate-900 dark:text-[#E8EEF7] tracking-tight leading-snug group-hover:text-blue-600 dark:group-hover:text-[#38BDF8] transition-colors">
                      {n.title}
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-[#A6B4C8] whitespace-pre-line leading-relaxed line-clamp-3">
                      {n.content}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-[#2A3A50] flex items-center justify-between text-xs text-slate-500 dark:text-[#8899A6]">
                    <span>Gửi bởi: <strong className="text-slate-700 dark:text-slate-300">{n.createdByName || 'Quản trị viên Hệ thống'}</strong></span>
                    <span className="text-xs font-semibold text-blue-600 dark:text-[#38BDF8] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      <span>Xem toàn văn</span>
                      <ChevronRight size={13} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: TÀI LIỆU & HOẠT ĐỘNG CỦA GIÁO VIÊN CẬP NHẬT */}
      {activeTab === 'teacher_activity' && (
        <div className="bg-white dark:bg-[#151F31] rounded-3xl border border-slate-200/80 dark:border-[#2A3A50] shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-[#2A3A50]">
            <h3 className="text-sm font-bold text-slate-900 dark:text-[#E8EEF7]">
              Nhật ký tài liệu giảng dạy do Giảng viên đẩy lên ({teacherMaterials.length} tài liệu)
            </h3>
            <p className="text-xs text-slate-500">
              Giúp Ban Quản trị giám sát chất lượng giáo án, slide bài giảng và bài tập về nhà của từng giảng viên.
            </p>
          </div>

          {teacherMaterials.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              Chưa có tài liệu nào được giảng viên tải lên.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl">
              <table className="w-full text-left border-collapse text-xs min-w-[850px]">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-[#1C293D]/60 text-slate-600 dark:text-[#A6B4C8] border-b border-slate-200 dark:border-[#2A3A50] font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4 w-[160px] whitespace-nowrap font-bold">Giảng viên tải lên</th>
                    <th className="py-3 px-4 min-w-[180px] font-bold">Buổi học / Chủ đề</th>
                    <th className="py-3 px-4 min-w-[220px] font-bold">Tiêu đề tài liệu</th>
                    <th className="py-3 px-4 w-[110px] whitespace-nowrap font-bold">Loại</th>
                    <th className="py-3 px-4 w-[140px] whitespace-nowrap font-bold">Thời gian tải</th>
                    <th className="py-3 px-4 w-[110px] whitespace-nowrap font-bold text-right">Xem trước</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#2A3A50]/60">
                  {teacherMaterials.map((mat) => (
                    <tr key={mat.id} className="hover:bg-slate-50/50 dark:hover:bg-[#1C293D]/30">
                      <td className="py-3.5 px-4 font-bold text-indigo-600 dark:text-indigo-400">
                        {mat.uploadedByName || 'Giảng viên'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-200 font-medium">
                        {mat.sessionTopic || `Buổi ID: ${mat.sessionId}`}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-[#E8EEF7]">
                        {mat.title}
                        {mat.description && (
                          <p className="text-[11px] text-slate-400 font-normal line-clamp-1">{mat.description}</p>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {renderMaterialBadge(mat.materialType)}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">
                        {formatDate(mat.createdAt)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <a
                          href={mat.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-semibold hover:underline"
                        >
                          <ExternalLink size={12} />
                          <span>Mở file</span>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Detail Notification Modal */}
      <NotificationDetailModal
        notification={selectedNotification}
        isOpen={Boolean(selectedNotification)}
        onClose={() => setSelectedNotification(null)}
      />
    </div>
  )
}

export default AdminNotificationsPage
