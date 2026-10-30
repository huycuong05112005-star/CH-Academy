import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  LayoutDashboard,
  BookOpen,
  Calendar,
  Users,
  UserCheck,
  CreditCard,
  UserPlus,
  Settings,
  ShieldCheck,
  FileQuestion,
  FileText,
  CheckSquare,
  BarChart2,
  Bell,
  Sparkles,
  CornerDownLeft,
  X
} from 'lucide-react'

export interface CommandItem {
  id: string
  title: string
  description?: string
  category: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  path?: string
  tab?: string
  badge?: string
}

const ADMIN_COMMANDS: CommandItem[] = [
  // Quick Actions
  {
    id: 'act-course',
    title: 'Tạo khóa học mới',
    description: 'Thêm chương trình đào tạo & lộ trình học',
    category: 'Thao tác nhanh',
    icon: BookOpen,
    path: '/admin/courses?action=new',
    badge: 'Mới'
  },
  {
    id: 'act-class',
    title: 'Mở lớp học mới',
    description: 'Lập lịch lớp & chỉ định giảng viên phụ trách',
    category: 'Thao tác nhanh',
    icon: Calendar,
    path: '/admin/classes?action=new',
    badge: 'Mới'
  },
  {
    id: 'act-lead',
    title: 'Tiếp nhận Lead tuyển sinh',
    description: 'Tạo hồ sơ tư vấn tuyển sinh & chuyển đổi',
    category: 'Thao tác nhanh',
    icon: UserPlus,
    path: '/admin/leads?action=new'
  },
  {
    id: 'act-exam',
    title: 'Soạn đề kiểm tra / Thi',
    description: 'Thiết kế ma trận đề thi & câu hỏi trắc nghiệm/tự luận',
    category: 'Thao tác nhanh',
    icon: FileText,
    path: '/admin/assessment/exams'
  },
  {
    id: 'act-attendance',
    title: 'Điểm danh buổi học',
    description: 'Chấm chuyên cần & ghi nhận nhận xét học viên',
    category: 'Thao tác nhanh',
    icon: UserCheck,
    path: '/admin/attendance'
  },

  // Overview
  {
    id: 'port-dashboard',
    title: 'Bảng điều khiển Tổng quan',
    description: 'KPI học viên, doanh thu, lịch học sắp tới',
    category: 'Điều hành',
    icon: LayoutDashboard,
    path: '/admin'
  },

  // Modules
  {
    id: 'mod-courses',
    title: 'Danh mục Khóa học',
    description: 'Quản lý chương trình đào tạo, học phí niêm yết',
    category: 'Đào tạo & Học vụ',
    icon: BookOpen,
    path: '/admin/courses'
  },
  {
    id: 'mod-classes',
    title: 'Lớp học & Lịch đào tạo',
    description: 'Xếp lịch, sĩ số, phòng học & trạng thái lớp',
    category: 'Đào tạo & Học vụ',
    icon: Calendar,
    path: '/admin/classes'
  },
  {
    id: 'mod-teacher-assign',
    title: 'Giảng viên & Phân công',
    description: 'Danh sách giáo viên, chuyên môn & lịch giảng dạy',
    category: 'Đào tạo & Học vụ',
    icon: UserCheck,
    path: '/admin/teacher-assignments'
  },
  {
    id: 'mod-attendance-mon',
    title: 'Giám sát Điểm danh toàn trường',
    description: 'Theo dõi tỷ lệ chuyên cần & cảnh báo vắng',
    category: 'Đào tạo & Học vụ',
    icon: UserCheck,
    path: '/admin/attendance-monitoring'
  },
  {
    id: 'mod-leads',
    title: 'Tuyển sinh & Khách hàng tiềm năng (Leads)',
    description: 'Theo dõi pipeline, tỷ lệ chuyển đổi Lead sang Học viên',
    category: 'Học viên & Tuyển sinh',
    icon: UserPlus,
    path: '/admin/leads'
  },
  {
    id: 'mod-students',
    title: 'Hồ sơ Học viên & Người giám hộ',
    description: 'Thông tin học viên, phụ huynh, liên kết gia đình',
    category: 'Học viên & Tuyển sinh',
    icon: Users,
    path: '/admin/students'
  },
  {
    id: 'mod-approval',
    title: 'Phê duyệt Đề thi (Exam Approval)',
    description: 'Quy trình kiểm duyệt đề trước khi phát đề cho lớp',
    category: 'Kiểm tra & Đánh giá',
    icon: ShieldCheck,
    path: '/admin/assessment/approval'
  },
  {
    id: 'mod-questions',
    title: 'Ngân hàng Câu hỏi',
    description: 'Kho câu hỏi trắc nghiệm, tự luận, độ khó, chủ đề',
    category: 'Kiểm tra & Đánh giá',
    icon: FileQuestion,
    path: '/admin/assessment/questions'
  },
  {
    id: 'mod-exams',
    title: 'Danh sách Đề thi',
    description: 'Kỳ thi, thời lượng, hình thức thi trực tuyến',
    category: 'Kiểm tra & Đánh giá',
    icon: FileText,
    path: '/admin/assessment/exams'
  },
  {
    id: 'mod-grading',
    title: 'Chấm thi & Chấm tự luận',
    description: 'Bảng điểm học viên, chấm bài tự luận giáo viên',
    category: 'Kiểm tra & Đánh giá',
    icon: CheckSquare,
    path: '/admin/assessment/grading'
  },
  {
    id: 'mod-class-analytics',
    title: 'Phân tích Kết quả theo Lớp',
    description: 'Biểu đồ phổ điểm, tỷ lệ đạt & chủ đề cần cải thiện',
    category: 'Kiểm tra & Đánh giá',
    icon: BarChart2,
    path: '/admin/assessment/class-analytics'
  },
  {
    id: 'mod-finance',
    title: 'Học phí, Thu chi & Công nợ',
    description: 'Quản lý thu học phí, tạo hóa đơn, công nợ tồn đọng',
    category: 'Tài chính & Hệ thống',
    icon: CreditCard,
    path: '/admin/finance'
  },
  {
    id: 'mod-notifications',
    title: 'Thông báo & Tin nhắn Giáo viên',
    description: 'Gửi thông báo lớp học, tài liệu giảng dạy',
    category: 'Tài chính & Hệ thống',
    icon: Bell,
    path: '/admin/notifications'
  },
  {
    id: 'mod-audit',
    title: 'Nhật ký Truy vết (Audit Logs)',
    description: 'Lịch sử thao tác người dùng, bảo mật & an toàn dữ liệu',
    category: 'Tài chính & Hệ thống',
    icon: ShieldCheck,
    path: '/admin/audit-logs'
  },
  {
    id: 'mod-settings',
    title: 'Cấu hình Hệ thống',
    description: 'Thông tin học viện, liên hệ, cấu hình chung',
    category: 'Tài chính & Hệ thống',
    icon: Settings,
    path: '/admin/settings'
  }
]

const TEACHER_COMMANDS: CommandItem[] = [
  // Thao tác nhanh
  {
    id: 'tch-attendance',
    title: 'Điểm danh buổi học',
    description: 'Chấm chuyên cần, có phép, vắng học cho học sinh ca này',
    category: 'Thao tác nhanh',
    icon: UserCheck,
    path: '/teacher?tab=attendance',
    tab: 'attendance',
    badge: 'Ưu tiên'
  },
  {
    id: 'tch-exam-create',
    title: 'Studio Đề thi & Ngân hàng câu hỏi',
    description: 'Thiết kế đề kiểm tra mới, tạo câu hỏi trắc nghiệm/tự luận',
    category: 'Thao tác nhanh',
    icon: FileText,
    path: '/teacher?tab=exams',
    tab: 'exams',
    badge: 'Studio'
  },
  {
    id: 'tch-announcement',
    title: 'Gửi thông báo đến lớp học',
    description: 'Gửi thông tri, nhắc nhở bài tập về nhà tới học sinh của lớp',
    category: 'Thao tác nhanh',
    icon: Bell,
    path: '/teacher?tab=announcements',
    tab: 'announcements'
  },
  {
    id: 'tch-material-upload',
    title: 'Tải tài liệu giảng dạy lên',
    description: 'Đăng tải slide bài giảng, file PDF, bài tập thực hành',
    category: 'Thao tác nhanh',
    icon: BookOpen,
    path: '/teacher?tab=materials',
    tab: 'materials'
  },

  // Giảng dạy & Lớp học
  {
    id: 'tch-dashboard',
    title: 'Bảng tổng quan sư phạm',
    description: 'Thống kê tổng số lớp, học sinh theo học, ca cần điểm danh',
    category: 'Giảng dạy & Học vụ',
    icon: LayoutDashboard,
    path: '/teacher?tab=dashboard',
    tab: 'dashboard'
  },
  {
    id: 'tch-classes',
    title: 'Danh sách Lớp phụ trách',
    description: 'Xem thông tin lớp, sĩ số, lịch học định kỳ, giáo trình',
    category: 'Giảng dạy & Học vụ',
    icon: Calendar,
    path: '/teacher?tab=classes',
    tab: 'classes'
  },
  {
    id: 'tch-students',
    title: 'Danh sách Học sinh',
    description: 'Tra cứu thông tin học viên, tiến độ và tỷ lệ đi học',
    category: 'Giảng dạy & Học vụ',
    icon: Users,
    path: '/teacher?tab=students',
    tab: 'students'
  },

  // Khảo thí & Đánh giá
  {
    id: 'tch-exam-results',
    title: 'Chấm thi & Kết quả học sinh',
    description: 'Xem điểm bài làm trắc nghiệm & chấm bài tự luận học sinh',
    category: 'Khảo thí & Đánh giá',
    icon: CheckSquare,
    path: '/teacher?tab=exam-results',
    tab: 'exam-results'
  },
  {
    id: 'tch-history',
    title: 'Lịch sử ca dạy & Giờ lên lớp',
    description: 'Nhật ký các buổi học đã giảng dạy và hoàn thành',
    category: 'Khảo thí & Đánh giá',
    icon: BarChart2,
    path: '/teacher?tab=history',
    tab: 'history'
  },
  {
    id: 'tch-notifications',
    title: 'Hộp thư Thông báo học vụ',
    description: 'Xem toàn bộ thông báo từ Ban Giám hiệu trung tâm',
    category: 'Hệ thống & Tin nhắn',
    icon: Bell,
    path: '/teacher?tab=notifications',
    tab: 'notifications'
  }
]

const STUDENT_COMMANDS: CommandItem[] = [
  // Thao tác nhanh
  {
    id: 'stu-exams',
    title: 'Vào phòng thi trực tuyến',
    description: 'Làm bài kiểm tra đánh giá năng lực & xem đề được giao',
    category: 'Thao tác nhanh',
    icon: FileText,
    path: '/student?tab=exams',
    tab: 'exams',
    badge: 'Trực tuyến'
  },
  {
    id: 'stu-schedule',
    title: 'Xem lịch học tuần này',
    description: 'Tra cứu ngày giờ học, phòng học, ca học sắp tới',
    category: 'Thao tác nhanh',
    icon: Calendar,
    path: '/student?tab=schedule',
    tab: 'schedule'
  },
  {
    id: 'stu-finance',
    title: 'Học phí & Hóa đơn thanh toán',
    description: 'Tra cứu công nợ, số tiền đã đóng, lịch sử thanh toán học phí',
    category: 'Thao tác nhanh',
    icon: CreditCard,
    path: '/student?tab=finance',
    tab: 'finance'
  },

  // Học tập & Khóa học
  {
    id: 'stu-classes',
    title: 'Khóa học & Lớp đang theo học',
    description: 'Xem tiến độ học tập, môn học, giáo viên phụ trách',
    category: 'Học tập & Tiến độ',
    icon: BookOpen,
    path: '/student?tab=classes',
    tab: 'classes'
  },
  {
    id: 'stu-attendance',
    title: 'Chuyên cần & Lịch sử điểm danh',
    description: 'Kiểm tra tỷ lệ đi học, số buổi có mặt, vắng hoặc đi muộn',
    category: 'Học tập & Tiến độ',
    icon: UserCheck,
    path: '/student?tab=attendance',
    tab: 'attendance'
  },
  {
    id: 'stu-notifications',
    title: 'Hộp thư Thông báo từ Trung tâm',
    description: 'Xem tin nhắn lớp, lịch nghỉ lễ, thông báo từ thầy cô',
    category: 'Học tập & Tiến độ',
    icon: Bell,
    path: '/student?tab=notifications',
    tab: 'notifications'
  },
  {
    id: 'stu-profile',
    title: 'Hồ sơ học viên cá nhân',
    description: 'Mã học viên, đối tượng đào tạo và người giám hộ',
    category: 'Cá nhân & Giám hộ',
    icon: Users,
    path: '/student?tab=profile',
    tab: 'profile'
  }
]

export interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  portal?: 'admin' | 'teacher' | 'student'
  onSelectTab?: (tab: string) => void
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  portal = 'admin',
  onSelectTab
}) => {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const commandsList =
    portal === 'teacher'
      ? TEACHER_COMMANDS
      : portal === 'student'
      ? STUDENT_COMMANDS
      : ADMIN_COMMANDS

  const placeholderText =
    portal === 'teacher'
      ? 'Tìm kiếm lớp dạy, học sinh, đề thi, ca dạy... (Ctrl + K)'
      : portal === 'student'
      ? 'Tìm kiếm lớp học, lịch thi, học phí, điểm danh... (Ctrl + K)'
      : 'Tìm kiếm nhanh chức năng, mã lớp, học viên... (Ctrl + K)'

  // Prevent body scroll when CommandPalette is open
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = prevOverflow
      }
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 50)
    }
  }, [isOpen])

  // Filter commands
  const filtered = commandsList.filter((cmd) => {
    if (!query.trim()) return true
    const q = query.toLowerCase()
    return (
      cmd.title.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q) ||
      cmd.description?.toLowerCase().includes(q) ||
      (cmd.path && cmd.path.toLowerCase().includes(q))
    )
  })

  const handleSelect = (item: CommandItem) => {
    if (onSelectTab && item.tab) {
      onSelectTab(item.tab)
    } else if (item.path) {
      navigate(item.path)
    }
    onClose()
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (filtered[selectedIndex]) {
          handleSelect(filtered[selectedIndex])
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, filtered, selectedIndex, onClose])

  // Scroll active item inside list container without scrolling the outer window
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector('[data-active="true"]') as HTMLElement | null
      if (activeEl && typeof activeEl.scrollIntoView === 'function') {
        activeEl.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [selectedIndex])

  if (!isOpen) return null

  // Group by category
  const categories = Array.from(new Set(filtered.map((item) => item.category)))
  let flatCounter = -1

  const content = (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Center Top Wrapper */}
      <div className="flex min-h-full items-start justify-center pt-8 sm:pt-16 p-3 sm:p-4 text-center">
        <div
          className="relative w-full max-w-2xl bg-white dark:bg-[#101B2D] border border-slate-200 dark:border-[#2A3A50] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[calc(100vh-4rem)] text-left animate-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Input Bar */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 dark:border-[#2A3A50] bg-slate-50/50 dark:bg-[#152338] shrink-0">
            <Search className="w-5 h-5 text-slate-400 dark:text-[#38BDF8] shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setSelectedIndex(0)
              }}
              placeholder={placeholderText}
              className="flex-1 bg-transparent border-0 outline-none text-sm font-medium text-slate-800 dark:text-[#E8EEF7] placeholder-slate-400 dark:placeholder-slate-500"
            />
            {query && (
              <button
                onClick={() => {
                  setQuery('')
                  inputRef.current?.focus({ preventScroll: true })
                }}
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                title="Xóa nội dung"
              >
                <X size={15} />
              </button>
            )}
            {/* Top Close Button (dấu x) */}
            <button
              type="button"
              onClick={onClose}
              className="flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-slate-700/80 transition-colors cursor-pointer shrink-0"
              title="Đóng tìm kiếm (Esc)"
              aria-label="Đóng tìm kiếm"
            >
              <X size={18} />
            </button>
          </div>

          {/* Results list */}
          <div ref={listRef} className="overflow-y-auto overscroll-contain p-2 space-y-3 flex-1 max-h-[55vh]">
          {filtered.length === 0 ? (
            <div className="py-12 text-center">
              <Search className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Không tìm thấy chức năng phù hợp</p>
              <p className="text-xs text-slate-400 mt-1">Thử tìm theo từ khóa: Khóa học, Học viên, Lớp, Đề thi, Lịch học...</p>
            </div>
          ) : (
            categories.map((cat) => {
              const catItems = filtered.filter((item) => item.category === cat)
              return (
                <div key={cat} className="space-y-1">
                  <div className="px-3 py-1 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    {cat}
                  </div>
                  {catItems.map((item) => {
                    flatCounter++
                    const isSelected = flatCounter === selectedIndex
                    const Icon = item.icon
                    const curIndex = flatCounter

                    return (
                      <div
                        key={item.id}
                        data-active={isSelected}
                        onClick={() => handleSelect(item)}
                        onMouseEnter={() => setSelectedIndex(curIndex)}
                        className={`group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-sky-50 dark:bg-[#192B45] text-sky-900 dark:text-[#38BDF8] border-l-4 border-[#38BDF8] shadow-xs'
                            : 'text-slate-700 dark:text-[#A6B4C8] hover:bg-slate-100 dark:hover:bg-[#152338]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                              isSelected
                                ? 'bg-sky-500 text-white dark:bg-[#38BDF8] dark:text-[#0B1220]'
                                : 'bg-slate-100 dark:bg-[#1C293D] text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            <Icon size={16} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-slate-800 dark:text-[#E8EEF7] truncate">
                                {item.title}
                              </span>
                              {item.badge && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 shrink-0">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            {item.description && (
                              <p className="text-xs text-slate-500 dark:text-[#A6B4C8] truncate">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          {isSelected && (
                            <span className="flex items-center gap-1 text-[11px] font-mono text-sky-600 dark:text-[#38BDF8]">
                              <span>Mở</span>
                              <CornerDownLeft size={12} />
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-[#142236] border-t border-slate-200 dark:border-[#2A3A50] flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 shrink-0">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-[#1C293D] border border-slate-200 dark:border-slate-700 rounded text-[10px] font-mono">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-[#1C293D] border border-slate-200 dark:border-slate-700 rounded text-[10px] font-mono">↓</kbd>
              <span>di chuyển</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-[#1C293D] border border-slate-200 dark:border-slate-700 rounded text-[10px] font-mono">↵</kbd>
              <span>chọn</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-[#1C293D] border border-slate-200 dark:border-slate-700 rounded text-[10px] font-mono">esc</kbd>
              <span>thoát</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
)

  return typeof document !== 'undefined' ? createPortal(content, document.body) : content
}
