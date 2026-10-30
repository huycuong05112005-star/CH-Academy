import React, { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Clock, CheckCircle2, ArrowRight, CheckCheck } from 'lucide-react'
import type { NotificationItem } from '../../types/notification'
import { notificationsApi } from '../../api/notifications'
import { NotificationDetailModal } from './NotificationDetailModal'

export interface NotificationBellProps {
  notifications: NotificationItem[]
  loading?: boolean
  onRefresh?: () => void
  onViewAll?: () => void
  viewAllLink?: string
  title?: string
  onNotificationRead?: (id: number) => void
  onMarkAllRead?: () => void
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  notifications,
  loading = false,
  onRefresh,
  onViewAll,
  viewAllLink,
  title = 'Thông báo hệ thống',
  onNotificationRead,
  onMarkAllRead
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedNotif, setSelectedNotif] = useState<NotificationItem | null>(null)
  const [localNotifications, setLocalNotifications] = useState<NotificationItem[]>(notifications)
  const bellRef = useRef<HTMLDivElement>(null)

  // Sync with prop updates
  useEffect(() => {
    setLocalNotifications(notifications)
  }, [notifications])

  // Click outside to close popover
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  const handleToggle = () => {
    const next = !isOpen
    setIsOpen(next)
    if (next && onRefresh) {
      onRefresh()
    }
  }

  // Calculate real unread count
  const unreadCount = localNotifications.filter((n) => !n.isRead).length

  // Handle clicking a notification to view detail and mark as read
  const handleItemClick = async (notif: NotificationItem) => {
    // Open detail modal
    setSelectedNotif({ ...notif, isRead: true })

    // If not read yet, mark as read
    if (!notif.isRead) {
      setLocalNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
      )
      onNotificationRead?.(notif.id)

      try {
        await notificationsApi.markAsRead(notif.id)
      } catch (err) {
        console.error('Failed to mark notification as read on server', err)
      }
    }
  }

  // Handle Mark All As Read
  const handleMarkAllAsRead = async () => {
    const unreadIds = localNotifications.filter((n) => !n.isRead).map((n) => n.id)
    if (unreadIds.length === 0) return

    setLocalNotifications((prev) =>
      prev.map((n) => ({ ...n, isRead: true }))
    )
    onMarkAllRead?.()

    try {
      await notificationsApi.markAllAsRead(unreadIds)
      onRefresh?.()
    } catch (err) {
      console.error('Failed to mark all notifications as read', err)
    }
  }

  return (
    <>
      <div className="relative" ref={bellRef}>
        <button
          type="button"
          onClick={handleToggle}
          className="relative flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#152338] text-slate-700 dark:text-[#E8EEF7] hover:bg-slate-50 dark:hover:bg-[#1C2F4D] transition-colors shadow-2xs cursor-pointer select-none"
          aria-label="Thông báo"
          title={unreadCount > 0 ? `Có ${unreadCount} thông báo chưa đọc` : 'Thông báo'}
        >
          <Bell size={17} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-white text-[10px] font-black shadow-sm animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#101B2D] shadow-2xl py-3 z-50 overflow-hidden flex flex-col max-h-[min(500px,calc(100vh-5rem))] animate-in fade-in zoom-in-95 duration-150 [data-theme=glass]_&:bg-[#0B1528]/95 [data-theme=glass]_&:border-white/20 [data-theme=glass]_&:backdrop-blur-2xl">
            <div className="px-4 pb-2.5 border-b border-slate-100 dark:border-[#2A3A50] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-[#E8EEF7]">
                  {title}
                </span>
                {unreadCount > 0 ? (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                    {unreadCount} mới
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-slate-400">
                    (Đã đọc hết)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllAsRead}
                    className="text-[11px] text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-[#38BDF8] flex items-center gap-0.5 cursor-pointer font-medium transition"
                    title="Đánh dấu tất cả là đã đọc"
                  >
                    <CheckCheck size={13} />
                    <span>Đọc hết</span>
                  </button>
                )}
                {onRefresh && (
                  <button
                    type="button"
                    onClick={onRefresh}
                    className="text-[11px] text-sky-600 dark:text-[#38BDF8] hover:underline cursor-pointer font-medium"
                  >
                    Làm mới
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto overscroll-contain flex-1 divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <div className="p-6 text-center text-xs text-slate-400">Đang tải thông báo...</div>
              ) : localNotifications.length > 0 ? (
                localNotifications.slice(0, 5).map((n) => {
                  const isUnread = !n.isRead
                  return (
                    <div
                      key={n.id}
                      onClick={() => handleItemClick(n)}
                      className={`p-3 text-left transition cursor-pointer group ${
                        isUnread
                          ? 'bg-sky-50/50 dark:bg-[#13233A]/70 hover:bg-sky-50 dark:hover:bg-[#162A46]'
                          : 'hover:bg-slate-50 dark:hover:bg-[#16253C]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {isUnread && (
                            <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0 animate-pulse" title="Chưa đọc" />
                          )}
                          <span
                            className={`text-xs truncate max-w-[210px] ${
                              isUnread
                                ? 'font-black text-slate-900 dark:text-white'
                                : 'font-medium text-slate-600 dark:text-[#CBD5E1]'
                            }`}
                          >
                            {n.title}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                            n.priority === 'HIGH' || n.priority === 'URGENT'
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {n.priority}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-[#A6B4C8] line-clamp-2 mt-1 pl-4">
                        {n.content}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 pl-4 font-mono">
                        <div className="flex items-center gap-1">
                          <Clock size={11} />
                          <span>{new Date(n.createdAt).toLocaleDateString('vi-VN')}</span>
                        </div>
                        <span className="text-[10px] text-sky-600 dark:text-[#38BDF8] opacity-0 group-hover:opacity-100 transition-opacity font-sans font-semibold">
                          Xem chi tiết →
                        </span>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="p-6 text-center">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-2">
                    <CheckCircle2 size={22} />
                  </div>
                  <div className="text-sm font-semibold text-[#142B4A] dark:text-[#E8EEF7]">Mọi thứ đang ổn định</div>
                  <p className="text-xs text-slate-500 dark:text-[#A6B4C8] mt-1">
                    Chưa có thông báo hoặc nhắc nhở mới.
                  </p>
                </div>
              )}
            </div>

            {(viewAllLink || onViewAll) && (
              <div className="p-2 border-t border-slate-100 dark:border-[#2A3A50] text-center shrink-0">
                {viewAllLink ? (
                  <Link
                    to={viewAllLink}
                    onClick={() => setIsOpen(false)}
                    className="text-xs font-semibold text-sky-600 dark:text-[#38BDF8] hover:underline flex items-center justify-center gap-1"
                  >
                    <span>Xem toàn bộ thông báo</span>
                    <ArrowRight size={13} />
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false)
                      onViewAll?.()
                    }}
                    className="w-full text-xs font-semibold text-sky-600 dark:text-[#38BDF8] hover:underline flex items-center justify-center gap-1 cursor-pointer py-1"
                  >
                    <span>Xem toàn bộ thông báo</span>
                    <ArrowRight size={13} />
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <NotificationDetailModal
        notification={selectedNotif}
        isOpen={Boolean(selectedNotif)}
        onClose={() => setSelectedNotif(null)}
      />
    </>
  )
}
