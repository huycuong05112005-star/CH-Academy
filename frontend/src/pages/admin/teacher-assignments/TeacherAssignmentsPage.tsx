import React, { useEffect, useState } from 'react'
import { teacherAssignmentsApi, type TeacherAssignmentItem } from '../../../api/teacherAssignments'
import { classesApi } from '../../../api/classes'
import { teacherApi } from '../../../api/teacher'
import type { TeacherAdminItem, CreateTeacherPayload } from '../../../types/teacher'
import type { ClassItem } from '../../../types/class'
import { exportToCsv } from '../../../utils/exportCsv'
import {
  UserCheck,
  Plus,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Download,
  Eye,
  EyeOff,
  Copy,
  Check,
  Mail,
  Phone,
  BookOpen,
  Users,
  Search,
  Key,
  ShieldCheck
} from 'lucide-react'

export const TeacherAssignmentsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'teachers' | 'assignments'>('teachers')

  // Data states
  const [teachers, setTeachers] = useState<TeacherAdminItem[]>([])
  const [assignments, setAssignments] = useState<TeacherAssignmentItem[]>([])
  const [classList, setClassList] = useState<{ id: number; name: string; code: string }[]>([])
  const [loading, setLoading] = useState(true)

  // Search & Filter
  const [teacherSearch, setTeacherSearch] = useState('')
  const [assignmentSearch, setAssignmentSearch] = useState('')

  // Modals
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showCreateTeacherModal, setShowCreateTeacherModal] = useState(false)

  // Passwords visibility and copy
  const [showPasswordMap, setShowPasswordMap] = useState<Record<number, boolean>>({})
  const [copiedMap, setCopiedMap] = useState<Record<number, boolean>>({})

  // Form states - Create Teacher
  const [teacherForm, setTeacherForm] = useState<CreateTeacherPayload>({
    teacherCode: '',
    fullName: '',
    email: '',
    phone: '',
    specialization: '',
    bio: ''
  })
  const [teacherSubmitting, setTeacherSubmitting] = useState(false)
  const [teacherError, setTeacherError] = useState<string | null>(null)

  // Form states - Assignment
  const [selectedClassId, setSelectedClassId] = useState<number | ''>('')
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | ''>('')
  const [role, setRole] = useState('PRIMARY')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [assignSubmitting, setAssignSubmitting] = useState(false)
  const [assignError, setAssignError] = useState<string | null>(null)

  const [globalSuccess, setGlobalSuccess] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [teachersRes, assignmentsRes, classesRes] = await Promise.all([
        teacherApi.getAllTeachers().catch(() => ({ success: false, data: [] })),
        teacherAssignmentsApi.getAllAssignments().catch(() => []),
        classesApi.searchClasses({ page: 0, size: 100 }).catch(() => ({ success: false, data: { content: [] } }))
      ])

      if (teachersRes && teachersRes.data) {
        setTeachers(teachersRes.data)
      }
      setAssignments(assignmentsRes || [])
      if (classesRes?.data?.content) {
        setClassList(classesRes.data.content.map((c: ClassItem) => ({ id: c.id, name: c.name, code: c.code })))
      }
    } catch (err) {
      console.error('Failed to load data', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const togglePassword = (teacherId: number) => {
    setShowPasswordMap(prev => ({ ...prev, [teacherId]: !prev[teacherId] }))
  }

  const handleCopyAccount = (teacher: TeacherAdminItem) => {
    const text = `Tài khoản: ${teacher.username || 'gv.' + teacher.teacherCode.toLowerCase()}\nMật khẩu: (Đã mã hóa BCrypt an toàn - liên hệ quản trị nếu cần đặt lại)`
    navigator.clipboard.writeText(text)
    setCopiedMap(prev => ({ ...prev, [teacher.id]: true }))
    setTimeout(() => {
      setCopiedMap(prev => ({ ...prev, [teacher.id]: false }))
    }, 2000)
  }

  // Create Teacher
  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!teacherForm.teacherCode.trim() || !teacherForm.fullName.trim()) {
      setTeacherError('Vui lòng điền mã giảng viên và họ tên')
      return
    }

    setTeacherSubmitting(true)
    setTeacherError(null)
    try {
      const payload: CreateTeacherPayload = {
        teacherCode: teacherForm.teacherCode.trim(),
        fullName: teacherForm.fullName.trim(),
        email: teacherForm.email?.trim() || undefined,
        phone: teacherForm.phone?.trim() || undefined,
        specialization: teacherForm.specialization?.trim() || undefined,
        bio: teacherForm.bio?.trim() || undefined
      }
      const res = await teacherApi.createTeacher(payload)
      setGlobalSuccess(`Đã thêm giảng viên ${res.data.fullName} và khởi tạo tài khoản đăng nhập thành công!`)
      setShowCreateTeacherModal(false)
      setTeacherForm({
        teacherCode: '',
        fullName: '',
        email: '',
        phone: '',
        specialization: '',
        bio: ''
      })
      fetchData()
    } catch (err: any) {
      setTeacherError(err.message || 'Lỗi khi tạo giảng viên')
    } finally {
      setTeacherSubmitting(false)
    }
  }

  // Assign Teacher to Class
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClassId || !selectedTeacherId) {
      setAssignError('Vui lòng chọn lớp học và giảng viên phụ trách')
      return
    }

    setAssignSubmitting(true)
    setAssignError(null)
    try {
      await teacherAssignmentsApi.assignTeacher({
        classId: Number(selectedClassId),
        teacherId: Number(selectedTeacherId),
        role,
        startDate,
        notes: notes.trim() || undefined
      })
      setGlobalSuccess('Phân công giảng viên vào lớp thành công!')
      setShowAssignModal(false)
      setSelectedClassId('')
      setSelectedTeacherId('')
      setNotes('')
      fetchData()
    } catch (err: any) {
      setAssignError(err.response?.data?.message || err.message || 'Lỗi khi phân công giảng viên')
    } finally {
      setAssignSubmitting(false)
    }
  }

  const handleEndAssignment = async (id: number) => {
    if (!window.confirm('Bạn có chắc muốn kết thúc phân công giảng viên này?')) return
    try {
      await teacherAssignmentsApi.endAssignment(id, 'Admin kết thúc phân công')
      setGlobalSuccess('Đã kết thúc phân công giảng viên.')
      fetchData()
    } catch (err) {
      alert('Không thể kết thúc phân công.')
    }
  }

  // Export Teachers CSV
  const handleExportTeachers = () => {
    const headers = [
      'Mã giảng viên',
      'Họ và tên',
      'Số điện thoại',
      'Email',
      'Chuyên môn',
      'Tài khoản đăng nhập',
      'Mật khẩu khởi tạo',
      'Trạng thái'
    ]
    const rows = filteredTeachers.map(t => [
      t.teacherCode,
      t.fullName,
      t.phone || 'Chưa cập nhật',
      t.email || 'Chưa cập nhật',
      t.specialization || 'Chưa cập nhật',
      t.username || `gv.${t.teacherCode.toLowerCase()}`,
      'Mã hóa BCrypt an toàn',
      t.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm dừng'
    ])
    exportToCsv('Danh_sach_giang_vien', headers, rows)
  }

  // Export Assignments CSV
  const handleExportAssignments = () => {
    const headers = [
      'Lớp học',
      'Mã lớp',
      'Giảng viên',
      'Mã giảng viên',
      'Vai trò',
      'Ngày bắt đầu',
      'Trạng thái',
      'Ghi chú',
      'Người phân công'
    ]
    const rows = filteredAssignments.map(a => [
      a.className,
      a.classCode,
      a.teacherName,
      a.teacherCode,
      a.role === 'PRIMARY' ? 'Giảng viên chính' : a.role === 'ASSISTANT' ? 'Trợ giảng' : a.role,
      a.startDate,
      a.status === 'ACTIVE' ? 'Đang giảng dạy' : 'Đã kết thúc',
      a.notes || '',
      a.assignedByName || 'Admin'
    ])
    exportToCsv('Danh_sach_phan_cong_giang_vien', headers, rows)
  }

  const filteredTeachers = teachers.filter(t => {
    const q = teacherSearch.toLowerCase()
    return (
      t.fullName.toLowerCase().includes(q) ||
      t.teacherCode.toLowerCase().includes(q) ||
      (t.email && t.email.toLowerCase().includes(q)) ||
      (t.phone && t.phone.includes(q)) ||
      (t.specialization && t.specialization.toLowerCase().includes(q))
    )
  })

  const filteredAssignments = assignments.filter(a => {
    const q = assignmentSearch.toLowerCase()
    return (
      a.className.toLowerCase().includes(q) ||
      a.classCode.toLowerCase().includes(q) ||
      a.teacherName.toLowerCase().includes(q) ||
      a.teacherCode.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#2A3A50]">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-[#A6B4C8] uppercase tracking-wider mb-1">
            <span>Đào tạo & Học vụ</span>
            <span>/</span>
            <span className="text-[#142B4A] dark:text-[#38BDF8]">Đội ngũ giảng viên</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#142B4A] dark:text-[#E8EEF7] flex items-center gap-2.5">
            <UserCheck className="w-7 h-7 text-[#142B4A] dark:text-[#38BDF8]" />
            Quản Lý Giảng Viên & Phân Công Lớp
          </h1>
          <p className="text-sm text-slate-600 dark:text-[#A6B4C8] mt-1">
            Quản lý hồ sơ giảng viên, cấp tài khoản Teacher Portal tự động, điều phối lịch dạy và xuất file dữ liệu.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 text-sm font-medium rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#151F31] text-slate-700 dark:text-[#E8EEF7] hover:bg-slate-50 dark:hover:bg-[#1E293B] shadow-xs transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>

          {activeTab === 'teachers' ? (
            <>
              <button
                onClick={handleExportTeachers}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 text-sm font-semibold rounded-xl border border-emerald-300 dark:border-emerald-700/60 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 shadow-xs transition"
              >
                <Download className="w-4 h-4" />
                Xuất file Excel (CSV)
              </button>
              <button
                onClick={() => {
                  setTeacherError(null)
                  setShowCreateTeacherModal(true)
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#142B4A] dark:bg-[#38BDF8] hover:bg-[#1D4168] dark:hover:bg-[#0284C7] text-white dark:text-[#0B1220] text-sm font-semibold rounded-xl shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                Thêm giảng viên mới
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleExportAssignments}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 text-sm font-semibold rounded-xl border border-emerald-300 dark:border-emerald-700/60 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 shadow-xs transition"
              >
                <Download className="w-4 h-4" />
                Xuất phân công (CSV)
              </button>
              <button
                onClick={() => {
                  setAssignError(null)
                  setShowAssignModal(true)
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#142B4A] dark:bg-[#38BDF8] hover:bg-[#1D4168] dark:hover:bg-[#0284C7] text-white dark:text-[#0B1220] text-sm font-semibold rounded-xl shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                Phân công lớp mới
              </button>
            </>
          )}
        </div>
      </div>

      {/* Global Success Notification */}
      {globalSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{globalSuccess}</span>
          </div>
          <button onClick={() => setGlobalSuccess(null)} className="text-emerald-600 hover:text-emerald-800 dark:hover:text-emerald-200">
            ×
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-[#151F31] rounded-2xl border border-slate-200/80 dark:border-[#2A3A50] shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#142B4A] dark:text-[#38BDF8] flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-[#A6B4C8] font-medium">Tổng giảng viên</div>
            <div className="text-xl font-bold text-slate-900 dark:text-[#E8EEF7]">{teachers.length}</div>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-[#151F31] rounded-2xl border border-slate-200/80 dark:border-[#2A3A50] shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-[#A6B4C8] font-medium">Đang hoạt động</div>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {teachers.filter(t => t.status === 'ACTIVE').length}
            </div>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-[#151F31] rounded-2xl border border-slate-200/80 dark:border-[#2A3A50] shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-[#A6B4C8] font-medium">Lớp đang phân công</div>
            <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
              {assignments.filter(a => a.status === 'ACTIVE').length}
            </div>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-[#151F31] rounded-2xl border border-slate-200/80 dark:border-[#2A3A50] shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-[#A6B4C8] font-medium">Tài khoản Teacher</div>
            <div className="text-xl font-bold text-amber-600 dark:text-amber-400">
              {teachers.length} / {teachers.length}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-4 border-b border-slate-200 dark:border-[#2A3A50]">
        <button
          onClick={() => setActiveTab('teachers')}
          className={`pb-3 px-2 text-sm font-semibold border-b-2 flex items-center gap-2 transition ${
            activeTab === 'teachers'
              ? 'border-[#142B4A] dark:border-[#38BDF8] text-[#142B4A] dark:text-[#38BDF8]'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Danh Sách & Tài Khoản Giảng Viên ({teachers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('assignments')}
          className={`pb-3 px-2 text-sm font-semibold border-b-2 flex items-center gap-2 transition ${
            activeTab === 'assignments'
              ? 'border-[#142B4A] dark:border-[#38BDF8] text-[#142B4A] dark:text-[#38BDF8]'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Phân Công Lớp Học ({assignments.length})</span>
        </button>
      </div>

      {/* TAB 1: TEACHER LIST & ACCOUNTS */}
      {activeTab === 'teachers' && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-[#151F31] p-3 rounded-2xl border border-slate-200/80 dark:border-[#2A3A50] shadow-xs">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm theo tên, mã giảng viên, email, số điện thoại..."
                value={teacherSearch}
                onChange={e => setTeacherSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-slate-50 dark:bg-[#0E1726] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3977B8]"
              />
            </div>
            <div className="text-xs text-slate-500 dark:text-[#A6B4C8]">
              Hiển thị <span className="font-semibold text-slate-800 dark:text-white">{filteredTeachers.length}</span> giảng viên
            </div>
          </div>

          {/* Teachers Table */}
          <div className="bg-white dark:bg-[#151F31] rounded-2xl shadow-xs border border-slate-200/80 dark:border-[#2A3A50] overflow-hidden">
            <div className="overflow-x-auto rounded-2xl">
              <table className="w-full text-left text-sm min-w-[1050px]">
                <thead className="bg-slate-50 dark:bg-[#0E1726]/60 border-b border-slate-200 dark:border-[#2A3A50] text-slate-600 dark:text-[#A6B4C8] font-semibold text-xs uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4 min-w-[180px]">Giảng viên</th>
                    <th className="py-3 px-4 w-[180px] whitespace-nowrap">Thông tin liên hệ</th>
                    <th className="py-3 px-4 min-w-[200px]">Chuyên môn / Lĩnh vực</th>
                    <th className="py-3 px-4 w-[140px] whitespace-nowrap">Tài khoản Portal</th>
                    <th className="py-3 px-4 w-[170px] whitespace-nowrap">Mật khẩu khởi tạo</th>
                    <th className="py-3 px-4 w-[120px] text-center whitespace-nowrap">Trạng thái</th>
                    <th className="py-3 px-4 w-[110px] text-right whitespace-nowrap">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#2A3A50]">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#142B4A] dark:text-[#38BDF8] mb-2" />
                        Đang tải danh sách giảng viên...
                      </td>
                    </tr>
                  ) : filteredTeachers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500 dark:text-slate-400">
                        Chưa tìm thấy giảng viên nào phù hợp.
                      </td>
                    </tr>
                  ) : (
                    filteredTeachers.map(t => {
                      const isCopied = copiedMap[t.id]
                      const displayUsername = t.username || `gv.${t.teacherCode.toLowerCase()}`

                      return (
                        <tr key={t.id} className="hover:bg-slate-50/60 dark:hover:bg-[#1E293B]/40 transition">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900 dark:text-white">{t.fullName}</div>
                            <div className="text-xs font-mono text-[#142B4A] dark:text-[#38BDF8] font-medium">{t.teacherCode}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                              <Mail className="w-3.5 h-3.5 text-slate-400" />
                              <span>{t.email || 'Chưa cập nhật email'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              <span>{t.phone || 'Chưa cập nhật SĐT'}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-xs font-medium text-slate-800 dark:text-slate-200 max-w-xs">
                              {t.specialization || 'Giảng viên trung tâm'}
                            </div>
                            {t.bio && (
                              <div className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5" title={t.bio}>
                                {t.bio}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#0E1726] border border-slate-200 dark:border-[#2A3A50] text-slate-800 dark:text-slate-200 font-semibold">
                              {displayUsername}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-semibold">
                                Mã hóa BCrypt
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {t.status === 'ACTIVE' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
                                <CheckCircle2 className="w-3 h-3" />
                                Hoạt động
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                                <XCircle className="w-3 h-3" />
                                Tạm dừng
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleCopyAccount(t)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                                isCopied
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300'
                                  : 'bg-white dark:bg-[#0E1726] border-slate-200 dark:border-[#2A3A50] text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                              <span>{isCopied ? 'Đã sao chép' : 'Copy Acc'}</span>
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ASSIGNMENT LIST */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-[#151F31] p-3 rounded-2xl border border-slate-200/80 dark:border-[#2A3A50] shadow-xs">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm theo tên lớp, mã lớp, tên giảng viên..."
                value={assignmentSearch}
                onChange={e => setAssignmentSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-slate-50 dark:bg-[#0E1726] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3977B8]"
              />
            </div>
            <div className="text-xs text-slate-500 dark:text-[#A6B4C8]">
              Hiển thị <span className="font-semibold text-slate-800 dark:text-white">{filteredAssignments.length}</span> phân công
            </div>
          </div>

          <div className="bg-white dark:bg-[#151F31] rounded-2xl shadow-xs border border-slate-200/80 dark:border-[#2A3A50] overflow-hidden">
            <div className="overflow-x-auto rounded-2xl">
              <table className="w-full text-left text-sm min-w-[1000px]">
                <thead className="bg-slate-50 dark:bg-[#0E1726]/60 border-b border-slate-200 dark:border-[#2A3A50] text-slate-600 dark:text-[#A6B4C8] font-semibold text-xs uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4 min-w-[200px]">Lớp học</th>
                    <th className="py-3 px-4 min-w-[180px]">Giảng viên phụ trách</th>
                    <th className="py-3 px-4 w-[130px] whitespace-nowrap">Vai trò</th>
                    <th className="py-3 px-4 w-[120px] whitespace-nowrap">Ngày bắt đầu</th>
                    <th className="py-3 px-4 w-[120px] text-center whitespace-nowrap">Trạng thái</th>
                    <th className="py-3 px-4 min-w-[180px]">Ghi chú & Người phân công</th>
                    <th className="py-3 px-4 w-[110px] text-right whitespace-nowrap">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#2A3A50]">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#142B4A] dark:text-[#38BDF8] mb-2" />
                        Đang tải danh sách phân công...
                      </td>
                    </tr>
                  ) : filteredAssignments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500 dark:text-slate-400">
                        Chưa có giảng viên nào được phân công.
                      </td>
                    </tr>
                  ) : (
                    filteredAssignments.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50/60 dark:hover:bg-[#1E293B]/40 transition">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900 dark:text-white">{a.className}</div>
                          <div className="text-xs font-mono text-slate-400">{a.classCode}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{a.teacherName}</div>
                          <div className="text-xs font-mono text-[#142B4A] dark:text-[#38BDF8]">{a.teacherCode}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800">
                            {a.role === 'PRIMARY' ? 'Chính khóa' : a.role === 'ASSISTANT' ? 'Trợ giảng' : a.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs font-mono text-slate-600 dark:text-slate-300">
                          {a.startDate}
                        </td>
                        <td className="py-3 px-4">
                          {a.status === 'ACTIVE' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Đang giảng dạy
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400">
                              <XCircle className="w-3.5 h-3.5" />
                              Đã kết thúc
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400 max-w-xs">
                          <div>{a.notes || '—'}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">Bởi: {a.assignedByName}</div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {a.status === 'ACTIVE' && (
                            <button
                              onClick={() => handleEndAssignment(a.id)}
                              className="px-2.5 py-1 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg border border-rose-200 dark:border-rose-800 transition"
                            >
                              Kết thúc
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD NEW TEACHER */}
      {showCreateTeacherModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#151F31] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-[#2A3A50] space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#2A3A50] pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#142B4A] dark:text-[#38BDF8]" />
                Thêm Giảng Viên & Cấp Tài Khoản Mới
              </h3>
              <button
                onClick={() => setShowCreateTeacherModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ×
              </button>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
              <div>
                Hệ thống sẽ <strong>tự động tạo tài khoản người dùng</strong> với username là{' '}
                <code className="px-1.5 py-0.5 rounded bg-white/70 dark:bg-[#0E1726] font-mono font-bold">
                  gv.{teacherForm.teacherCode ? teacherForm.teacherCode.toLowerCase() : '<mã_gv>'}
                </code>{' '}
                và mật khẩu mặc định là{' '}
                <code className="px-1.5 py-0.5 rounded bg-white/70 dark:bg-[#0E1726] font-mono font-bold">
                  Teacher@123456
                </code>{' '}
                để giảng viên đăng nhập Teacher Portal ngay.
              </div>
            </div>

            {teacherError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl text-xs flex items-center gap-2 border border-rose-200 dark:border-rose-800">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {teacherError}
              </div>
            )}

            <form onSubmit={handleCreateTeacher} className="space-y-3.5 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mã giảng viên *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: GV2024004"
                    value={teacherForm.teacherCode}
                    onChange={e => setTeacherForm({ ...teacherForm, teacherCode: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-slate-50 dark:bg-[#0E1726] text-slate-900 dark:text-white uppercase font-mono font-medium focus:ring-2 focus:ring-[#3977B8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Họ và tên giảng viên *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Hoàng Minh Nhật"
                    value={teacherForm.fullName}
                    onChange={e => setTeacherForm({ ...teacherForm, fullName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-slate-50 dark:bg-[#0E1726] text-slate-900 dark:text-white focus:ring-2 focus:ring-[#3977B8]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email liên hệ
                  </label>
                  <input
                    type="email"
                    placeholder="minhnhat@chacademy.vn"
                    value={teacherForm.email}
                    onChange={e => setTeacherForm({ ...teacherForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-slate-50 dark:bg-[#0E1726] text-slate-900 dark:text-white focus:ring-2 focus:ring-[#3977B8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Số điện thoại (10 số)
                  </label>
                  <input
                    type="text"
                    placeholder="0918889904"
                    value={teacherForm.phone}
                    onChange={e => setTeacherForm({ ...teacherForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-slate-50 dark:bg-[#0E1726] text-slate-900 dark:text-white focus:ring-2 focus:ring-[#3977B8]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Chuyên môn / Lĩnh vực giảng dạy
                </label>
                <input
                  type="text"
                  placeholder="VD: IELTS 8.5, Giao tiếp chuyên sâu, TOEIC cấp tốc"
                  value={teacherForm.specialization}
                  onChange={e => setTeacherForm({ ...teacherForm, specialization: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-slate-50 dark:bg-[#0E1726] text-slate-900 dark:text-white focus:ring-2 focus:ring-[#3977B8]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tiểu sử / Giới thiệu
                </label>
                <textarea
                  rows={2}
                  placeholder="Kinh nghiệm công tác, chứng chỉ đào tạo quốc tế..."
                  value={teacherForm.bio}
                  onChange={e => setTeacherForm({ ...teacherForm, bio: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-slate-50 dark:bg-[#0E1726] text-slate-900 dark:text-white focus:ring-2 focus:ring-[#3977B8]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-[#2A3A50]">
                <button
                  type="button"
                  onClick={() => setShowCreateTeacherModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-[#1E293B]"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={teacherSubmitting}
                  className="px-5 py-2 bg-[#142B4A] dark:bg-[#38BDF8] hover:bg-[#1D4168] dark:hover:bg-[#0284C7] text-white dark:text-[#0B1220] text-xs font-bold rounded-xl shadow transition disabled:opacity-50"
                >
                  {teacherSubmitting ? 'Đang tạo...' : 'Lưu & Khởi tạo tài khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ASSIGN TEACHER TO CLASS */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#151F31] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-[#2A3A50] space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#2A3A50] pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#142B4A] dark:text-[#38BDF8]" />
                Phân Công Giảng Viên Vào Lớp
              </h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ×
              </button>
            </div>

            {assignError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl text-xs flex items-center gap-2 border border-rose-200 dark:border-rose-800">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {assignError}
              </div>
            )}

            <form onSubmit={handleCreateAssignment} className="space-y-3.5 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Chọn lớp học *
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-slate-50 dark:bg-[#0E1726] text-slate-900 dark:text-white"
                  required
                >
                  <option value="">-- Chọn lớp học --</option>
                  {classList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Chọn giảng viên phụ trách *
                </label>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-slate-50 dark:bg-[#0E1726] text-slate-900 dark:text-white"
                  required
                >
                  <option value="">-- Chọn giảng viên --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.fullName} ({t.teacherCode}) — {t.specialization || 'GV'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Vai trò giảng dạy
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-slate-50 dark:bg-[#0E1726] text-slate-900 dark:text-white"
                  >
                    <option value="PRIMARY">Giảng viên chính</option>
                    <option value="ASSISTANT">Trợ giảng</option>
                    <option value="SUBSTITUTE">Dạy thay</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ngày bắt đầu
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-slate-50 dark:bg-[#0E1726] text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ghi chú phân công
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ghi chú phân công chuyên môn, chỉ tiêu buổi dạy..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-slate-50 dark:bg-[#0E1726] text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-[#2A3A50]">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-[#1E293B]"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={assignSubmitting}
                  className="px-5 py-2 bg-[#142B4A] dark:bg-[#38BDF8] hover:bg-[#1D4168] dark:hover:bg-[#0284C7] text-white dark:text-[#0B1220] text-xs font-bold rounded-xl shadow transition disabled:opacity-50"
                >
                  {assignSubmitting ? 'Đang lưu...' : 'Xác nhận phân công'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
