import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  Bell,
  Clock,
  User,
  AlertTriangle,
  CheckCircle2,
  Users,
  GraduationCap
} from 'lucide-react'
import type { NotificationItem } from '../../types/notification'

export interface NotificationDetailModalProps {
  notification: NotificationItem | null
  isOpen: boolean
  onClose: () => void
}

export const NotificationDetailModal: React.FC<NotificationDetailModalProps> = ({
  notification,
  isOpen,
  onClose
}) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = prevOverflow
      }
    }
  }, [isOpen])

  if (!isOpen || !notification) return null

  const formatDateTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return d.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    } catch {
      return dateStr
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return { text: 'Khẩn cấp', color: 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border-rose-200 dark:border-rose-900' }
      case 'HIGH':
        return { text: 'Quan trọng', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-900' }
      default:
        return { text: 'Thông thường', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700' }
    }
  }

  const getAudienceLabel = (audience: string, className?: string) => {
    switch (audience) {
      case 'ALL':
        return 'Toàn trung tâm'
      case 'TEACHERS':
        return 'Tất cả Giảng viên'
      case 'STUDENTS':
        return 'Tất cả Học viên'
      case 'CLASS':
        return className ? `Lớp ${className}` : 'Lớp học'
      case 'USER':
        return 'Cá nhân'
      default:
        return audience
    }
  }

  const priorityInfo = getPriorityLabel(notification.priority)

  const modalContent = (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Center Wrapper: ensures modal is vertically centered on tall viewports, and starts from top on short viewports without cutting off */}
      <div className="flex min-h-full items-start justify-center p-3 sm:p-6 text-center">
        <div
          className="relative w-full max-w-lg bg-white dark:bg-[#111C2E] border border-slate-200 dark:border-[#2A3A50] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[calc(100vh-3rem)] text-left my-auto animate-in zoom-in-95 duration-150 [data-theme=glass]_&:bg-[#0B1528]/95 [data-theme=glass]_&:border-white/20 [data-theme=glass]_&:backdrop-blur-2xl"
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-slate-100 dark:border-[#1E2E44] flex items-center justify-between bg-slate-50/70 dark:bg-[#152338]/60 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 dark:text-[#38BDF8] flex items-center justify-center">
                <Bell size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-[#E8EEF7]">
                  Chi tiết thông báo
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-[#A6B4C8]">
                  Thông tri & nhắc nhở từ hệ thống CH Academy
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1C2F4D] transition-colors cursor-pointer"
              title="Đóng cửa sổ"
            >
              <X size={18} />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-6 overflow-y-auto overscroll-contain space-y-4 flex-1">
            {/* Title & Badges */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${priorityInfo.color}`}>
                  {priorityInfo.text}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-[#38BDF8] border border-sky-200 dark:border-sky-900 flex items-center gap-1">
                  <Users size={11} />
                  <span>{getAudienceLabel(notification.targetAudience, notification.targetClassName)}</span>
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 flex items-center gap-1">
                  <CheckCircle2 size={11} />
                  <span>Đã đọc</span>
                </span>
              </div>

              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-[#E8EEF7] leading-snug">
                {notification.title}
              </h2>
            </div>

            {/* Meta card */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#152338]/60 border border-slate-100 dark:border-[#22354F] grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-600 dark:text-[#A6B4C8]">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-slate-400 shrink-0" />
                <span>Thời gian: <strong className="text-slate-800 dark:text-slate-200 font-mono text-[11px]">{formatDateTime(notification.createdAt)}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <User size={14} className="text-slate-400 shrink-0" />
                <span>Người gửi: <strong className="text-slate-800 dark:text-slate-200">{notification.createdByName || 'Ban Giám hiệu'}</strong></span>
              </div>
              {notification.targetClassName && (
                <div className="flex items-center gap-2 sm:col-span-2">
                  <GraduationCap size={14} className="text-slate-400 shrink-0" />
                  <span>Lớp áp dụng: <strong className="text-slate-800 dark:text-slate-200">{notification.targetClassName}</strong></span>
                </div>
              )}
            </div>

            {/* Main content body */}
            <div className="pt-2">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Nội dung thông báo
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-[#0D1626] border border-slate-200/80 dark:border-[#1E2E44] text-xs sm:text-sm text-slate-700 dark:text-[#D5E2F3] whitespace-pre-wrap leading-relaxed shadow-inner">
                {notification.content}
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-3 border-t border-slate-100 dark:border-[#1E2E44] flex items-center justify-end bg-slate-50/70 dark:bg-[#152338]/60 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-[#1C293D] hover:bg-slate-300 dark:hover:bg-[#253852] text-xs font-bold text-slate-700 dark:text-[#E8EEF7] transition cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent
}
