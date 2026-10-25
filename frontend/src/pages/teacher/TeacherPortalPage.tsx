import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { teacherApi } from '../../api/teacher'
import type {
  TeacherProfile,
  TeacherClassItem,
  TeacherSessionItem
} from '../../types/teacher'
import type { NotificationItem } from '../../types/notification'
import { ThemeSwitcher } from '../../components/ui/ThemeSwitcher'
import { exportToCsv } from '../../utils/exportCsv'
import { filesApi } from '../../api/files'
import {
  GraduationCap,
  LogOut,
  Users,
  BookOpen,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Trash2,
  Plus,
  ExternalLink,
  Bell,
  Check,
  Sparkles,
  X,
  Send,
  History,
  Download,
  FileText
} from 'lucide-react'

export const TeacherPortalPage: React.FC = () => {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [profile, setProfile] = useState<TeacherProfile | null>(null)
  const [classes, setClasses] = useState<TeacherClassItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'classes' | 'students' | 'attendance' | 'materials' | 'notifications' | 'announcements' | 'history'>('classes')

  // Unmarked sessions & announcements
  const [unmarkedSessions, setUnmarkedSessions] = useState<TeacherSessionItem[]>([])
  const [sentAnnouncements, setSentAnnouncements] = useState<NotificationItem[]>([])
  const [announcementTitle, setAnnouncementTitle] = useState('')
  const [announcementContent, setAnnouncementContent] = useState('')
  const [announcementClassId, setAnnouncementClassId] = useState<number | ''>('')
  const [announcementPriority, setAnnouncementPriority] = useState('NORMAL')
  const [sendingAnnouncement, setSendingAnnouncement] = useState(false)
  const [announcementSuccess, setAnnouncementSuccess] = useState<string | null>(null)

  // Selected Class & Details
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null)
  const [currentClassDetail, setCurrentClassDetail] = useState<TeacherClassItem | null>(null)

  // Selected Session for Attendance & Materials
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null)
  const [attendanceChanges, setAttendanceChanges] = useState<Record<number, { status: string; note: string }>>({})
  const [savingAttendance, setSavingAttendance] = useState<boolean>(false)
  const [attendanceSuccess, setAttendanceSuccess] = useState<string | null>(null)

  // Materials Modal & Local File Upload
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState<boolean>(false)
  const [materialSourceType, setMaterialSourceType] = useState<'FILE' | 'URL'>('FILE')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadingFile, setUploadingFile] = useState<boolean>(false)
  const [materialTitle, setMaterialTitle] = useState<string>('')
  const [materialDesc, setMaterialDesc] = useState<string>('')
  const [materialType, setMaterialType] = useState<string>('DOCUMENT')
  const [materialUrl, setMaterialUrl] = useState<string>('')
  const [submittingMaterial, setSubmittingMaterial] = useState<boolean>(false)

  // Notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>([])

  useEffect(() => {
    loadPortalData()
    loadNotifications()
    loadSentAnnouncements()
    loadUnmarkedSessions()

    // Sync active tab from pathname
    const path = location.pathname
    if (path.includes('/classes')) setActiveTab('classes')
    else if (path.includes('/attendance')) setActiveTab('attendance')
    else if (path.includes('/materials')) setActiveTab('materials')
    else if (path.includes('/announcements')) setActiveTab('announcements')
    else if (path.includes('/history')) setActiveTab('history')
    else if (path.includes('/students')) setActiveTab('students')
  }, [location.pathname])

  const loadSentAnnouncements = async () => {
    try {
      const res = await teacherApi.getMySentAnnouncements()
      if (res.success && res.data) {
        setSentAnnouncements(res.data)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const loadUnmarkedSessions = async () => {
    try {
      const res = await teacherApi.getUnmarkedSessions()
      if (res.success && res.data) {
        setUnmarkedSessions(res.data)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleSendAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!announcementClassId || !announcementTitle.trim() || !announcementContent.trim()) {
      alert('Vui lòng điền đầy đủ tiêu đề, nội dung và chọn lớp học')
      return
    }

    setSendingAnnouncement(true)
    setAnnouncementSuccess(null)
    try {
      const res = await teacherApi.createClassAnnouncement({
        title: announcementTitle.trim(),
        content: announcementContent.trim(),
        targetClassId: Number(announcementClassId),
        priority: announcementPriority
      })
      if (res.success) {
        setAnnouncementSuccess('Đã gửi thông báo thành công đến học sinh của lớp!')
        setAnnouncementTitle('')
        setAnnouncementContent('')
        setAnnouncementClassId('')
        loadSentAnnouncements()
      } else {
        alert(res.message || 'Lỗi gửi thông báo')
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi gửi thông báo')
    } finally {
      setSendingAnnouncement(false)
    }
  }

  const handleDeleteAnnouncement = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn thu hồi thông báo này không?')) return
    try {
      const res = await teacherApi.deleteMyAnnouncement(id)
      if (res.success) {
        loadSentAnnouncements()
      }
    } catch (err: any) {
      alert(err.message || 'Không thể thu hồi thông báo')
    }
  }

  const loadPortalData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [profileRes, classesRes] = await Promise.all([
        teacherApi.getProfile(),
        teacherApi.getMyClasses()
      ])

      if (profileRes.success && profileRes.data) {
        setProfile(profileRes.data)
      }

      if (classesRes.success && classesRes.data) {
        setClasses(classesRes.data)
        if (classesRes.data.length > 0) {
          loadClassDetail(classesRes.data[0].id)
        }
      }
    } catch (err: unknown) {
      const e = err as { message?: string }
      setError(e.message || 'Lỗi khi tải dữ liệu Cổng Giáo viên')
    } finally {
      setLoading(false)
    }
  }

  const loadNotifications = async () => {
    try {
      const res = await teacherApi.getMyNotifications()
      if (res.success && res.data) {
        setNotifications(res.data)
      }
    } catch {
      // Non-fatal
    }
  }

  const loadClassDetail = async (classId: number) => {
    setSelectedClassId(classId)
    try {
      const res = await teacherApi.getClassDetails(classId)
      if (res.success && res.data) {
        setCurrentClassDetail(res.data)
        if (res.data.sessions && res.data.sessions.length > 0) {
          selectSession(res.data.sessions[0].id, res.data)
        }
      }
    } catch (err: unknown) {
      const e = err as { message?: string }
      alert(e.message || 'Không thể tải chi tiết lớp học')
    }
  }

  const selectSession = async (sessionId: number, classData?: TeacherClassItem) => {
    setSelectedSessionId(sessionId)
    setAttendanceSuccess(null)
    const targetClass = classData || currentClassDetail
    if (!targetClass) return

    try {
      const res = await teacherApi.getSessionAttendance(sessionId)
      if (res.success && res.data) {
        // Init form changes from existing records or students
        const initialMap: Record<number, { status: string; note: string }> = {}
        targetClass.students?.forEach((stu) => {
          const rec = res.data.find((r) => r.studentId === stu.studentId)
          initialMap[stu.studentId] = {
            status: rec ? rec.status : 'PRESENT',
            note: rec?.note || ''
          }
        })
        setAttendanceChanges(initialMap)
      }
    } catch {
      // Fallback
    }
  }

  const handleAttendanceStatusChange = (studentId: number, status: string) => {
    setAttendanceChanges((prev) => ({
      ...prev,
      [studentId]: {
        status,
        note: prev[studentId]?.note || ''
      }
    }))
  }

  const handleAttendanceNoteChange = (studentId: number, note: string) => {
    setAttendanceChanges((prev) => ({
      ...prev,
      [studentId]: {
        status: prev[studentId]?.status || 'PRESENT',
        note
      }
    }))
  }

  const handleSaveAttendance = async () => {
    if (!selectedSessionId) return
    setSavingAttendance(true)
    setAttendanceSuccess(null)

    const payload = {
      records: Object.entries(attendanceChanges).map(([studentId, val]) => ({
        studentId: Number(studentId),
        status: val.status,
        note: val.note
      }))
    }

    try {
      const res = await teacherApi.markAttendance(selectedSessionId, payload)
      if (res.success) {
        setAttendanceSuccess('Đã lưu điểm danh và nhận xét thành công!')
        selectSession(selectedSessionId)
      } else {
        alert(res.message || 'Lỗi lưu điểm danh')
      }
    } catch (err: unknown) {
      const e = err as { message?: string }
      alert(e.message || 'Lỗi kết nối khi lưu điểm danh')
    } finally {
      setSavingAttendance(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSelectedFile(file)
      if (!materialTitle) {
        const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name
        setMaterialTitle(nameWithoutExt)
      }
      const ext = file.name.substring(file.name.lastIndexOf('.') + 1).toLowerCase()
      if (['ppt', 'pptx', 'pdf'].includes(ext)) {
        setMaterialType('SLIDE')
      } else if (['doc', 'docx', 'txt'].includes(ext)) {
        setMaterialType('DOCUMENT')
      } else if (['xls', 'xlsx', 'csv'].includes(ext)) {
        setMaterialType('EXERCISE')
      } else if (['mp4', 'avi', 'mov', 'mkv'].includes(ext)) {
        setMaterialType('VIDEO')
      }
    }
  }

  const handleExportStudents = () => {
    if (!currentClassDetail?.students || currentClassDetail.students.length === 0) {
      alert('Lớp học chưa có học sinh để xuất file')
      return
    }
    const headers = ['STT', 'Mã học viên', 'Họ và tên', 'Email', 'Số điện thoại', 'Ngày sinh', 'Giới tính', 'Lớp học', 'Trạng thái']
    const rows = currentClassDetail.students.map((stu, idx) => [
      idx + 1,
      stu.studentCode || '',
      stu.fullName || '',
      stu.email || '',
      stu.phone || '',
      formatDate(stu.dateOfBirth),
      stu.gender === 'FEMALE' ? 'Nữ' : 'Nam',
      currentClassDetail.name,
      stu.status === 'ENROLLED' ? 'Đang học' : stu.status
    ])
    exportToCsv(`Danh_sach_hoc_sinh_${currentClassDetail.code}`, headers, rows)
  }

  const handleExportAttendance = () => {
    if (!currentClassDetail?.students || currentClassDetail.students.length === 0) {
      alert('Chưa có danh sách học sinh để xuất điểm danh')
      return
    }
    const curSession = currentClassDetail.sessions?.find((s) => s.id === selectedSessionId)
    const sessionLabel = curSession ? `Buoi_${formatDate(curSession.sessionDate).replace(/\//g, '-')}` : 'Tat_ca'

    const headers = ['STT', 'Mã học viên', 'Họ và tên', 'Lớp học', 'Buổi học', 'Ngày học', 'Trạng thái điểm danh', 'Ghi chú']
    const rows = currentClassDetail.students.map((stu, idx) => {
      const change = attendanceChanges[stu.studentId]
      const status = change?.status || 'PRESENT'
      const statusLabel = status === 'PRESENT' ? 'Có mặt' : status === 'LATE' ? 'Đi muộn' : status === 'EXCUSED' ? 'Có phép' : 'Vắng mặt'
      return [
        idx + 1,
        stu.studentCode || '',
        stu.fullName || '',
        currentClassDetail.name,
        curSession?.topic || 'Buổi học',
        formatDate(curSession?.sessionDate),
        statusLabel,
        change?.note || ''
      ]
    })
    exportToCsv(`Diem_danh_${currentClassDetail.code}_${sessionLabel}`, headers, rows)
  }

  const handleUploadMaterial = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSessionId) {
      alert('Vui lòng chọn buổi học để đẩy tài liệu')
      return
    }

    let finalFileUrl = materialUrl.trim()
    let finalFileSize: string | undefined = undefined

    if (materialSourceType === 'FILE') {
      if (!selectedFile) {
        alert('Vui lòng chọn file từ máy tính để tải lên')
        return
      }
      setUploadingFile(true)
      try {
        const uploadResult = await filesApi.uploadFile(selectedFile)
        finalFileUrl = uploadResult.fileUrl
        finalFileSize = uploadResult.fileSize
      } catch (err: unknown) {
        const e = err as { message?: string }
        alert(e.message || 'Lỗi khi tải file từ máy tính lên máy chủ')
        setUploadingFile(false)
        return
      } finally {
        setUploadingFile(false)
      }
    } else {
      if (!materialUrl.trim()) {
        alert('Vui lòng nhập liên kết tài liệu')
        return
      }
    }

    if (!materialTitle.trim()) {
      alert('Vui lòng nhập tiêu đề tài liệu')
      return
    }

    setSubmittingMaterial(true)
    try {
      const descWithMeta = finalFileSize ? `${materialDesc.trim()} (Dung lượng: ${finalFileSize})`.trim() : materialDesc.trim()
      const res = await teacherApi.uploadMaterial(selectedSessionId, {
        title: materialTitle.trim(),
        description: descWithMeta || undefined,
        materialType,
        fileUrl: finalFileUrl
      })

      if (res.success) {
        setIsMaterialModalOpen(false)
        setMaterialTitle('')
        setMaterialDesc('')
        setMaterialUrl('')
        setSelectedFile(null)
        // Reload class details to refresh materials
        if (selectedClassId) {
          loadClassDetail(selectedClassId)
        }
      } else {
        alert(res.message || 'Lỗi tải lên tài liệu')
      }
    } catch (err: unknown) {
      const e = err as { message?: string }
      alert(e.message || 'Lỗi tải lên tài liệu')
    } finally {
      setSubmittingMaterial(false)
    }
  }

  const handleDeleteMaterial = async (materialId: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa tài liệu này không? Học sinh sẽ không xem được tài liệu này nữa.')) {
      return
    }

    try {
      const res = await teacherApi.deleteMaterial(materialId)
      if (res.success) {
        if (selectedClassId) {
          loadClassDetail(selectedClassId)
        }
      }
    } catch (err: unknown) {
      const e = err as { message?: string }
      alert(e.message || 'Lỗi khi xóa tài liệu')
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—'
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0B1220] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-600 dark:text-[#A6B4C8]">
            Đang tải dữ liệu Cổng Giáo viên CH Academy...
          </p>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0B1220] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-[#151F31] rounded-3xl p-8 border border-slate-200 dark:border-[#2A3A50] text-center shadow-xl">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-800 dark:text-[#E8EEF7] mb-2">
            Không tìm thấy hồ sơ giảng viên
          </h2>
          <p className="text-sm text-slate-500 dark:text-[#A6B4C8] mb-6">
            {error || 'Tài khoản của bạn chưa được liên kết với hồ sơ Giáo viên nào.'}
          </p>
          <button
            onClick={handleLogout}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-md"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    )
  }

  const selectedSession = currentClassDetail?.sessions?.find((s) => s.id === selectedSessionId)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1220] text-slate-800 dark:text-[#E8EEF7] font-sans pb-16">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#151F31]/80 backdrop-blur-md border-b border-slate-200/80 dark:border-[#2A3A50]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="text-base font-black tracking-tight text-slate-900 dark:text-[#E8EEF7] flex items-center gap-2">
                <span>CH Academy</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
                  CỔNG GIÁO VIÊN
                </span>
              </div>
              <div className="text-xs text-slate-500 dark:text-[#A6B4C8]">
                Quản lý lớp học, điểm danh & tài liệu giảng dạy
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#2A3A50] text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
              title="Đăng xuất"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Teacher Welcome Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 sm:p-8 shadow-xl">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-indigo-200">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Không gian sư phạm chuyên nghiệp</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Thầy/Cô {profile.fullName}
              </h1>
              <p className="text-xs text-indigo-200 font-medium">
                {profile.specialization || 'Giảng viên chuyên môn CH Academy'}
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 pt-1">
                <span>Mã giảng viên: <strong className="font-mono text-white">{profile.teacherCode}</strong></span>
                <span>•</span>
                <span>SĐT: <strong className="text-white">{profile.phone || '—'}</strong></span>
                <span>•</span>
                <span>Email: <strong className="text-white">{profile.email || '—'}</strong></span>
              </div>
            </div>

            <div className="flex items-center gap-4 border-t sm:border-t-0 sm:border-l border-white/15 pt-4 sm:pt-0 sm:pl-8">
              <div className="text-center sm:text-right">
                <div className="text-2xl sm:text-3xl font-black text-indigo-300">
                  {profile.totalClasses}
                </div>
                <div className="text-[11px] uppercase tracking-wider text-slate-300 mt-0.5">
                  Lớp phụ trách
                </div>
              </div>
              <div className="text-center sm:text-right pl-4 sm:pl-6 border-l border-white/15">
                <div className="text-2xl sm:text-3xl font-black text-emerald-300">
                  {profile.activeStudents}
                </div>
                <div className="text-[11px] uppercase tracking-wider text-slate-300 mt-0.5">
                  Học sinh theo học
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-[#2A3A50]">
          <button
            onClick={() => setActiveTab('classes')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'classes'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-600 dark:text-[#A6B4C8] hover:bg-slate-100 dark:hover:bg-[#1C293D]'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Lớp dạy của tôi ({classes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('students')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'students'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-600 dark:text-[#A6B4C8] hover:bg-slate-100 dark:hover:bg-[#1C293D]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Danh sách Học sinh</span>
          </button>

          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'attendance'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-600 dark:text-[#A6B4C8] hover:bg-slate-100 dark:hover:bg-[#1C293D]'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Điểm danh Buổi học</span>
          </button>

          <button
            onClick={() => setActiveTab('materials')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'materials'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-600 dark:text-[#A6B4C8] hover:bg-slate-100 dark:hover:bg-[#1C293D]'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Tài liệu giảng dạy</span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'notifications'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-600 dark:text-[#A6B4C8] hover:bg-slate-100 dark:hover:bg-[#1C293D]'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Thông báo Ban quản trị ({notifications.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('announcements')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'announcements'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-600 dark:text-[#A6B4C8] hover:bg-slate-100 dark:hover:bg-[#1C293D]'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Phát thông báo Lớp</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'history'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-600 dark:text-[#A6B4C8] hover:bg-slate-100 dark:hover:bg-[#1C293D]'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Lịch sử & Chưa điểm danh</span>
            {unmarkedSessions.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold">
                {unmarkedSessions.length}
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: LỚP DẠY CỦA TÔI */}
        {activeTab === 'classes' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {classes.map((cls) => (
                <div
                  key={cls.id}
                  className="p-6 rounded-3xl bg-white dark:bg-[#151F31] border border-slate-200/80 dark:border-[#2A3A50] shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        {cls.courseName}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                        {cls.status}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-[#E8EEF7]">
                      {cls.name}
                    </h3>
                    <div className="text-xs text-slate-500 font-mono">
                      Mã lớp: <strong>{cls.code}</strong> • Phòng: {cls.room || 'Executive 302'}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-[#2A3A50] text-xs">
                    <div>
                      <span className="text-slate-400 block">Số học sinh:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{cls.enrolledStudents} học viên</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Số buổi học:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{cls.totalSessions} buổi</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => {
                        loadClassDetail(cls.id)
                        setActiveTab('attendance')
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold text-xs hover:bg-indigo-100 transition text-center"
                    >
                      Điểm danh lớp
                    </button>
                    <button
                      onClick={() => {
                        loadClassDetail(cls.id)
                        setActiveTab('materials')
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-slate-100 dark:bg-[#1C293D] text-slate-700 dark:text-[#E8EEF7] font-bold text-xs hover:bg-slate-200 transition text-center"
                    >
                      Đẩy tài liệu
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: HỌC SINH CỦA LỚP (KHÔNG HIỂN THỊ HỌC PHÍ) */}
        {activeTab === 'students' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Class Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#151F31] p-4 rounded-2xl border border-slate-200/80 dark:border-[#2A3A50]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Chọn lớp dạy:</span>
                <select
                  value={selectedClassId || ''}
                  onChange={(e) => loadClassDetail(Number(e.target.value))}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-xs font-bold text-slate-800 dark:text-[#E8EEF7]"
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({cls.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-xs text-slate-500">
                Hiển thị thông tin học viên & liên lạc phục vụ đào tạo sư phạm.
              </div>
            </div>

            {/* Students Table - ABSOLUTELY NO TUITION FEES */}
            <div className="bg-white dark:bg-[#151F31] rounded-3xl border border-slate-200/80 dark:border-[#2A3A50] shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-[#2A3A50] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-[#E8EEF7]">
                  Danh sách học sinh lớp {currentClassDetail?.name} ({currentClassDetail?.students?.length || 0} học viên)
                </h3>
                <button
                  type="button"
                  onClick={handleExportStudents}
                  disabled={!currentClassDetail?.students || currentClassDetail.students.length === 0}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] hover:bg-slate-50 dark:hover:bg-[#25354D] text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] shadow-xs transition disabled:opacity-40"
                  title="Xuất danh sách học sinh ra file CSV (Excel)"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Xuất danh sách (CSV)</span>
                </button>
              </div>

              {!currentClassDetail?.students || currentClassDetail.students.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400">
                  Lớp này hiện chưa có học sinh nào ghi danh.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 dark:bg-[#1C293D]/60 text-slate-600 dark:text-[#A6B4C8] border-b border-slate-200 dark:border-[#2A3A50]">
                        <th className="py-3 px-4 font-bold">Mã học sinh</th>
                        <th className="py-3 px-4 font-bold">Họ và tên</th>
                        <th className="py-3 px-4 font-bold">Giới tính</th>
                        <th className="py-3 px-4 font-bold">Ngày sinh</th>
                        <th className="py-3 px-4 font-bold">Điện thoại</th>
                        <th className="py-3 px-4 font-bold">Email</th>
                        <th className="py-3 px-4 font-bold">Ngày ghi danh</th>
                        <th className="py-3 px-4 font-bold">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#2A3A50]/60">
                      {currentClassDetail.students.map((stu) => (
                        <tr key={stu.studentId} className="hover:bg-slate-50/50 dark:hover:bg-[#1C293D]/30">
                          <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            {stu.studentCode}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-[#E8EEF7]">
                            {stu.fullName}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                            {stu.gender === 'FEMALE' ? 'Nữ' : 'Nam'}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                            {formatDate(stu.dateOfBirth)}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-700 dark:text-slate-200 font-semibold">
                            {stu.phone || '—'}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500">
                            {stu.email || '—'}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-500">
                            {formatDate(stu.enrollmentDate)}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                              {stu.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: ĐIỂM DANH BUỔI HỌC */}
        {activeTab === 'attendance' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Session & Class Selectors */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#151F31] p-4 rounded-2xl border border-slate-200/80 dark:border-[#2A3A50]">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lớp:</span>
                  <select
                    value={selectedClassId || ''}
                    onChange={(e) => loadClassDetail(Number(e.target.value))}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-xs font-bold text-slate-800 dark:text-[#E8EEF7]"
                  >
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} ({cls.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Buổi học:</span>
                  <select
                    value={selectedSessionId || ''}
                    onChange={(e) => selectSession(Number(e.target.value))}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-xs font-bold text-slate-800 dark:text-[#E8EEF7]"
                  >
                    {currentClassDetail?.sessions?.map((s, idx) => (
                      <option key={s.id} value={s.id}>
                        Buổi {idx + 1} - {formatDate(s.sessionDate)} ({s.startTime}-{s.endTime})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedSession && (
                <div className="text-xs text-slate-500">
                  Chủ đề: <strong className="text-slate-800 dark:text-slate-200">{selectedSession.topic}</strong>
                </div>
              )}
            </div>

            {/* Attendance Form Sheet */}
            <div className="bg-white dark:bg-[#151F31] rounded-3xl border border-slate-200/80 dark:border-[#2A3A50] shadow-sm p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-[#2A3A50]">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-[#E8EEF7]">
                    Bảng điểm danh & Đánh giá buổi học
                  </h3>
                  <p className="text-xs text-slate-500">
                    Chọn trạng thái tham gia và ghi chú nhận xét học tập cho từng học viên.
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleExportAttendance}
                    disabled={!currentClassDetail?.students || currentClassDetail.students.length === 0}
                    className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] hover:bg-slate-50 dark:hover:bg-[#25354D] text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] shadow-xs transition flex items-center gap-1.5 disabled:opacity-40"
                    title="Xuất bảng điểm danh ra file CSV (Excel)"
                  >
                    <Download size={14} className="text-emerald-600 dark:text-emerald-400" />
                    <span>Xuất điểm danh (CSV)</span>
                  </button>
                  <button
                    onClick={handleSaveAttendance}
                    disabled={savingAttendance}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Check size={14} />
                    <span>{savingAttendance ? 'Đang lưu...' : 'Lưu điểm danh & Nhận xét'}</span>
                  </button>
                </div>
              </div>

              {attendanceSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  <span>{attendanceSuccess}</span>
                </div>
              )}

              {!currentClassDetail?.students || currentClassDetail.students.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-6">
                  Không có học sinh trong lớp để điểm danh.
                </p>
              ) : (
                <div className="space-y-3">
                  {currentClassDetail.students.map((stu) => {
                    const currentStatus = attendanceChanges[stu.studentId]?.status || 'PRESENT'
                    const currentNote = attendanceChanges[stu.studentId]?.note || ''

                    return (
                      <div
                        key={stu.studentId}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-[#1C293D]/50 border border-slate-200/60 dark:border-[#2A3A50] flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="min-w-[220px]">
                          <div className="font-bold text-sm text-slate-900 dark:text-[#E8EEF7]">
                            {stu.fullName}
                          </div>
                          <div className="text-xs text-slate-500 font-mono">
                            {stu.studentCode} • {stu.phone || 'Chưa có SĐT'}
                          </div>
                        </div>

                        {/* Status Buttons */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleAttendanceStatusChange(stu.studentId, 'PRESENT')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                              currentStatus === 'PRESENT'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-white dark:bg-[#151F31] border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                            }`}
                          >
                            Có mặt
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAttendanceStatusChange(stu.studentId, 'LATE')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                              currentStatus === 'LATE'
                                ? 'bg-amber-500 text-white shadow-xs'
                                : 'bg-white dark:bg-[#151F31] border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                            }`}
                          >
                            Đi muộn
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAttendanceStatusChange(stu.studentId, 'EXCUSED')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                              currentStatus === 'EXCUSED'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-white dark:bg-[#151F31] border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                            }`}
                          >
                            Có phép
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAttendanceStatusChange(stu.studentId, 'ABSENT')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                              currentStatus === 'ABSENT'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'bg-white dark:bg-[#151F31] border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                            }`}
                          >
                            Vắng mặt
                          </button>
                        </div>

                        {/* Note Input */}
                        <div className="flex-1 max-w-md">
                          <input
                            type="text"
                            value={currentNote}
                            onChange={(e) => handleAttendanceNoteChange(stu.studentId, e.target.value)}
                            placeholder="Nhận xét học tập (VD: Làm bài tốt, phát âm chuẩn...)"
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#151F31] text-xs text-slate-800 dark:text-[#E8EEF7]"
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: TÀI LIỆU GIẢNG DẠY (ĐẨY TÀI LIỆU THEO TỪNG BUỔI HỌC) */}
        {activeTab === 'materials' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#151F31] p-4 rounded-2xl border border-slate-200/80 dark:border-[#2A3A50]">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lớp:</span>
                  <select
                    value={selectedClassId || ''}
                    onChange={(e) => loadClassDetail(Number(e.target.value))}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-xs font-bold text-slate-800 dark:text-[#E8EEF7]"
                  >
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} ({cls.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Buổi học:</span>
                  <select
                    value={selectedSessionId || ''}
                    onChange={(e) => selectSession(Number(e.target.value))}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-xs font-bold text-slate-800 dark:text-[#E8EEF7]"
                  >
                    {currentClassDetail?.sessions?.map((s, idx) => (
                      <option key={s.id} value={s.id}>
                        Buổi {idx + 1} - {formatDate(s.sessionDate)} ({s.startTime}-{s.endTime})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={() => setIsMaterialModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
              >
                <Plus size={14} />
                <span>Đẩy tài liệu mới</span>
              </button>
            </div>

            {/* Materials List for Selected Session */}
            <div className="bg-white dark:bg-[#151F31] rounded-3xl border border-slate-200/80 dark:border-[#2A3A50] shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#2A3A50]">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-[#E8EEF7]">
                    Tài liệu buổi học: {selectedSession?.topic || 'Buổi học'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Học viên trong lớp sẽ xem và tải được ngay lập tức các tài liệu này tại Cổng học viên.
                  </p>
                </div>
              </div>

              {!selectedSession?.materials || selectedSession.materials.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400">
                  Chưa có tài liệu nào được đẩy lên cho buổi học này. Bấm &quot;Đẩy tài liệu mới&quot; để thêm Slide hoặc bài tập.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedSession.materials.map((m) => (
                    <div
                      key={m.id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-[#1C293D]/50 border border-slate-200/80 dark:border-[#2A3A50] flex items-start justify-between gap-3 group"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          {renderMaterialBadge(m.materialType)}
                          <h4 className="text-sm font-bold text-slate-900 dark:text-[#E8EEF7]">
                            {m.title}
                          </h4>
                        </div>
                        {m.description && (
                          <p className="text-xs text-slate-500 dark:text-[#A6B4C8]">
                            {m.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 pt-1">
                          <a
                            href={m.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                          >
                            <ExternalLink size={12} />
                            <span>Mở liên kết file</span>
                          </a>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {formatDate(m.createdAt)}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteMaterial(m.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                        title="Xóa tài liệu này"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: BẢNG TIN & THÔNG BÁO TỪ BAN QUẢN TRỊ */}
        {activeTab === 'notifications' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#A6B4C8]">
                Thông báo điều hành & Hướng dẫn sư phạm
              </h3>
            </div>

            {notifications.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-[#151F31] rounded-3xl border border-slate-200 dark:border-[#2A3A50]">
                <Bell className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-600 dark:text-[#A6B4C8]">
                  Không có thông báo mới nào từ Ban quản trị
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      n.priority === 'URGENT'
                        ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900'
                        : n.priority === 'HIGH'
                        ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900'
                        : 'bg-white dark:bg-[#151F31] border-slate-200/80 dark:border-[#2A3A50]'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {n.priority === 'URGENT' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white">
                          KHẨN CẤP
                        </span>
                      )}
                      {n.priority === 'HIGH' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white">
                          QUAN TRỌNG
                        </span>
                      )}
                      <span className="text-[11px] font-mono text-slate-400">
                        {formatDate(n.createdAt)}
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-[#E8EEF7]">
                      {n.title}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-[#A6B4C8] mt-1.5 whitespace-pre-line leading-relaxed">
                      {n.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: PHÁT THÔNG BÁO CHO LỚP */}
        {activeTab === 'announcements' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {announcementSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {announcementSuccess}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form Compose Announcement */}
              <div className="lg:col-span-1 bg-white dark:bg-[#151F31] rounded-3xl border border-slate-200/80 dark:border-[#2A3A50] shadow-sm p-6 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-[#2A3A50]">
                  <Send className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-[#E8EEF7]">
                    Tạo thông báo lớp học
                  </h3>
                </div>

                <form onSubmit={handleSendAnnouncement} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-[#E8EEF7] mb-1">
                      Chọn lớp nhận thông báo *
                    </label>
                    <select
                      value={announcementClassId}
                      onChange={(e) => setAnnouncementClassId(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-slate-50/50 dark:bg-[#1C293D] text-slate-800 dark:text-[#E8EEF7]"
                      required
                    >
                      <option value="">-- Chọn lớp phụ trách --</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-[#E8EEF7] mb-1">
                      Mức độ ưu tiên
                    </label>
                    <select
                      value={announcementPriority}
                      onChange={(e) => setAnnouncementPriority(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-slate-50/50 dark:bg-[#1C293D] text-slate-800 dark:text-[#E8EEF7]"
                    >
                      <option value="NORMAL">Thông thường</option>
                      <option value="HIGH">Quan trọng</option>
                      <option value="URGENT">Khẩn cấp</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-[#E8EEF7] mb-1">
                      Tiêu đề thông báo *
                    </label>
                    <input
                      type="text"
                      required
                      value={announcementTitle}
                      onChange={(e) => setAnnouncementTitle(e.target.value)}
                      placeholder="VD: Dặn dò chuẩn bị bài thuyết trình ngày mai..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-slate-50/50 dark:bg-[#1C293D] text-slate-800 dark:text-[#E8EEF7]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-[#E8EEF7] mb-1">
                      Nội dung thông báo *
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={announcementContent}
                      onChange={(e) => setAnnouncementContent(e.target.value)}
                      placeholder="Nội dung chi tiết gửi học sinh trong lớp..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-slate-50/50 dark:bg-[#1C293D] text-slate-800 dark:text-[#E8EEF7]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={sendingAnnouncement}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
                  >
                    {sendingAnnouncement ? 'Đang gửi...' : 'Phát thông báo cho học sinh'}
                  </button>
                </form>
              </div>

              {/* List Sent Announcements */}
              <div className="lg:col-span-2 bg-white dark:bg-[#151F31] rounded-3xl border border-slate-200/80 dark:border-[#2A3A50] shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#2A3A50]">
                  <h3 className="text-base font-bold text-slate-900 dark:text-[#E8EEF7]">
                    Thông báo lớp đã phát hành ({sentAnnouncements.length})
                  </h3>
                  <button
                    onClick={loadSentAnnouncements}
                    className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                  >
                    Làm mới
                  </button>
                </div>

                {sentAnnouncements.length === 0 ? (
                  <div className="p-12 text-center text-xs text-slate-400">
                    Bạn chưa phát hành thông báo nào cho lớp.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sentAnnouncements.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-[#1C293D]/50 border border-slate-200/80 dark:border-[#2A3A50] flex items-start justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
                              {item.targetClassName || 'Lớp học'}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {formatDate(item.createdAt)}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-[#E8EEF7]">
                            {item.title}
                          </h4>
                          <p className="text-xs text-slate-600 dark:text-[#A6B4C8] whitespace-pre-line">
                            {item.content}
                          </p>
                        </div>

                        <button
                          onClick={() => handleDeleteAnnouncement(item.id)}
                          className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded border border-rose-200 dark:border-rose-800 shrink-0"
                        >
                          Thu hồi
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: LỊCH SỬ GIẢNG DẠY & CHƯA ĐIỂM DANH */}
        {activeTab === 'history' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Unmarked Sessions Section */}
            <div className="bg-white dark:bg-[#151F31] rounded-3xl border border-slate-200/80 dark:border-[#2A3A50] shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-[#2A3A50]">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-[#E8EEF7]">
                    Buổi học cần hoàn thành điểm danh ({unmarkedSessions.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Các buổi học đã diễn ra hoặc đang đến lịch nhưng giáo viên chưa lưu kết quả điểm danh.
                  </p>
                </div>
              </div>

              {unmarkedSessions.length === 0 ? (
                <div className="p-8 text-center text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Tuyệt vời! Bạn đã hoàn thành điểm danh cho tất cả các buổi học.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {unmarkedSessions.map((session) => (
                    <div
                      key={session.id}
                      className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {session.sessionDate} • {session.startTime?.slice(0, 5)} - {session.endTime?.slice(0, 5)}
                        </div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">
                          {session.topic}
                        </div>
                        <div className="text-[11px] text-slate-500">Phòng: {session.room || 'Executive 302'}</div>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedClassId(session.classId)
                          setSelectedSessionId(session.id)
                          setActiveTab('attendance')
                          loadClassDetail(session.classId)
                        }}
                        className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow transition shrink-0"
                      >
                        Điểm danh ngay
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Teaching Milestones */}
            <div className="bg-white dark:bg-[#151F31] rounded-3xl border border-slate-200/80 dark:border-[#2A3A50] shadow-sm p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-[#E8EEF7] flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Tổng hợp hoạt động giảng dạy
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#1C293D]/60 border border-slate-200/80 dark:border-[#2A3A50]">
                  <div className="text-xs text-slate-400 font-medium">Lớp đang phụ trách</div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{classes.length}</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#1C293D]/60 border border-slate-200/80 dark:border-[#2A3A50]">
                  <div className="text-xs text-slate-400 font-medium">Học sinh theo học</div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{profile?.activeStudents || 0}</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#1C293D]/60 border border-slate-200/80 dark:border-[#2A3A50]">
                  <div className="text-xs text-slate-400 font-medium">Thông báo lớp đã phát hành</div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{sentAnnouncements.length}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Upload Material Modal */}
      {isMaterialModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#151F31] rounded-3xl border border-slate-200 dark:border-[#2A3A50] max-w-lg w-full p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setIsMaterialModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1C293D]"
            >
              <X size={20} />
            </button>

            <h3 className="text-lg font-bold text-slate-900 dark:text-[#E8EEF7] mb-1">
              Đẩy tài liệu lên buổi học
            </h3>
            <p className="text-xs text-slate-500 dark:text-[#A6B4C8] mb-6">
              Tài liệu sẽ hiển thị ngay cho học viên của buổi học này để tải về học tập.
            </p>

            {/* Switch Source Type */}
            <div className="flex p-1 bg-slate-100 dark:bg-[#1C293D] rounded-2xl mb-4">
              <button
                type="button"
                onClick={() => setMaterialSourceType('FILE')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition ${
                  materialSourceType === 'FILE'
                    ? 'bg-white dark:bg-[#151F31] text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'
                }`}
              >
                <Upload size={14} />
                <span>Tải file từ máy tính</span>
              </button>
              <button
                type="button"
                onClick={() => setMaterialSourceType('URL')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition ${
                  materialSourceType === 'URL'
                    ? 'bg-white dark:bg-[#151F31] text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'
                }`}
              >
                <ExternalLink size={14} />
                <span>Nhập liên kết ngoài (URL)</span>
              </button>
            </div>

            <form onSubmit={handleUploadMaterial} className="space-y-4">
              {materialSourceType === 'FILE' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] mb-1">
                    Chọn tệp từ máy tính *
                  </label>
                  <div className="border-2 border-dashed border-slate-300 dark:border-[#2A3A50] hover:border-indigo-500 dark:hover:border-indigo-400 rounded-2xl p-4 text-center cursor-pointer bg-slate-50/50 dark:bg-[#1C293D]/40 transition relative">
                    <input
                      type="file"
                      id="teacher-material-file-upload"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.rar,.png,.jpg,.jpeg,.mp4"
                    />
                    {selectedFile ? (
                      <div className="flex items-center justify-center gap-3">
                        <FileText className="w-8 h-8 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        <div className="text-left">
                          <div className="text-xs font-bold text-slate-800 dark:text-[#E8EEF7] line-clamp-1">{selectedFile.name}</div>
                          <div className="text-[11px] text-slate-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB - Nhấn để đổi file khác</div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <Upload className="w-7 h-7 text-slate-400 mx-auto mb-1" />
                        <div className="text-xs font-semibold text-slate-700 dark:text-[#E8EEF7]">Nhấn để chọn file hoặc kéo thả vào đây</div>
                        <div className="text-[10px] text-slate-400">Hỗ trợ PDF, PowerPoint, Word, Excel, Video, Zip (tối đa 50MB)</div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] mb-1">
                    Đường dẫn liên kết (Google Drive / YouTube / OneDrive) *
                  </label>
                  <input
                    type="url"
                    required
                    value={materialUrl}
                    onChange={(e) => setMaterialUrl(e.target.value)}
                    placeholder="https://drive.google.com/file/d/..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-slate-50/50 dark:bg-[#1C293D] text-sm text-slate-800 dark:text-[#E8EEF7]"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] mb-1">
                  Tiêu đề tài liệu *
                </label>
                <input
                  type="text"
                  required
                  value={materialTitle}
                  onChange={(e) => setMaterialTitle(e.target.value)}
                  placeholder="VD: Slide bài giảng Buổi 2: Kỹ năng Pitching & Presentation"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-slate-50/50 dark:bg-[#1C293D] text-sm text-slate-800 dark:text-[#E8EEF7]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] mb-1">
                  Loại tài liệu
                </label>
                <select
                  value={materialType}
                  onChange={(e) => setMaterialType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-slate-50/50 dark:bg-[#1C293D] text-sm text-slate-800 dark:text-[#E8EEF7]"
                >
                  <option value="SLIDE">Slide bài giảng (PowerPoint / PDF)</option>
                  <option value="EXERCISE">Bài tập về nhà / Phiếu thực hành</option>
                  <option value="DOCUMENT">Tài liệu đọc thêm / Giáo trình</option>
                  <option value="VIDEO">Video bài giảng / Thu âm</option>
                  <option value="LINK">Liên kết ngoài / Link Zoom / Drive</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] mb-1">
                  Mô tả / Hướng dẫn học sinh (tùy chọn)
                </label>
                <textarea
                  rows={2}
                  value={materialDesc}
                  onChange={(e) => setMaterialDesc(e.target.value)}
                  placeholder="VD: Các bạn đọc trước trang 10-15 và hoàn thành bài tập số 3 trước 20h..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-slate-50/50 dark:bg-[#1C293D] text-sm text-slate-800 dark:text-[#E8EEF7]"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-[#2A3A50] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsMaterialModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#2A3A50] text-xs font-semibold text-slate-600 dark:text-[#A6B4C8]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingMaterial || uploadingFile}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
                >
                  {uploadingFile ? 'Đang tải file lên máy chủ...' : submittingMaterial ? 'Đang lưu tài liệu...' : 'Đẩy tài liệu lên'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default TeacherPortalPage
