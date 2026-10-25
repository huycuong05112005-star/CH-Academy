import React, { useEffect, useState, useCallback } from 'react'
import { studentsApi } from '../../../api/students'
import { classesApi } from '../../../api/classes'
import { coursesApi } from '../../../api/courses'
import type { Student, Guardian, CreateStudentPayload, StudentStats, AccountProvisionResponse } from '../../../types/student'
import type { ClassItem } from '../../../types/class'
import type { Course } from '../../../types/course'
import { Badge } from '../../../components/ui/Badge'
import { StatCard } from '../../../components/ui/StatCard'
import { TableSkeleton } from '../../../components/ui/LoadingSkeleton'
import { EmptyState } from '../../../components/ui/EmptyState'
import {
  Users,
  Plus,
  Search,
  Edit2,
  AlertCircle,
  CheckCircle2,
  X,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Shield,
  Phone,
  Mail,
  UserCheck,
  Eye,
  EyeOff,
  Sparkles,
  GraduationCap,
  CreditCard,
  Key,
  Send,
  BookOpen,
  Copy,
  Check,
  Download
} from 'lucide-react'
import { exportToCsv } from '../../../utils/exportCsv'

export const StudentListPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([])
  const [stats, setStats] = useState<StudentStats | null>(null)
  const [guardians, setGuardians] = useState<Guardian[]>([])
  const [classList, setClassList] = useState<ClassItem[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [statsLoading, setStatsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Filters & Pagination
  const [keyword, setKeyword] = useState<string>('')
  const [selectedTargetType, setSelectedTargetType] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [page, setPage] = useState<number>(0)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [totalElements, setTotalElements] = useState<number>(0)
  const pageSize = 10

  // Modals
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [detailStudent, setDetailStudent] = useState<Student | null>(null)
  const [isStatusModalOpen, setIsStatusModalOpen] = useState<boolean>(false)
  const [statusStudent, setStatusStudent] = useState<Student | null>(null)
  const [newStatus, setNewStatus] = useState<string>('ACTIVE')
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false)

  // Guardian select inside student form
  const [selectedGuardianId, setSelectedGuardianId] = useState<number>(0)
  const [selectedRelation, setSelectedRelation] = useState<string>('FATHER')
  const [isPrimaryContact, setIsPrimaryContact] = useState<boolean>(true)

  // Enroll & Pay Modal
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState<boolean>(false)
  const [enrollStudent, setEnrollStudent] = useState<Student | null>(null)
  const [selectedClassId, setSelectedClassId] = useState<number>(0)
  const [tuitionFee, setTuitionFee] = useState<number>(0)
  const [paidAmount, setPaidAmount] = useState<number>(0)
  const [paymentMethod, setPaymentMethod] = useState<string>('BANK_TRANSFER')
  const [referenceNumber, setReferenceNumber] = useState<string>('')
  const [enrollNotes, setEnrollNotes] = useState<string>('')
  const [provisionAccountOnEnroll, setProvisionAccountOnEnroll] = useState<boolean>(true)
  const [enrollSubmitting, setEnrollSubmitting] = useState<boolean>(false)

  // Quick Provision Modal
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState<boolean>(false)
  const [provisionStudent, setProvisionStudent] = useState<Student | null>(null)
  const [customPassword, setCustomPassword] = useState<string>('')
  const [provisionSubmitting, setProvisionSubmitting] = useState<boolean>(false)
  const [provisionResult, setProvisionResult] = useState<AccountProvisionResponse | null>(null)
  const [copiedPassword, setCopiedPassword] = useState<boolean>(false)
  const [showPasswordMap, setShowPasswordMap] = useState<Record<number, boolean>>({})
  const [copiedAccountMap, setCopiedAccountMap] = useState<Record<number, boolean>>({})

  const toggleShowPassword = (studentId: number) => {
    setShowPasswordMap(prev => ({ ...prev, [studentId]: !prev[studentId] }))
  }

  const copyAccountInfo = (student: Student) => {
    const text = `Tài khoản: ${student.username}\nMật khẩu: ${student.rawPassword || 'Chưa cập nhật'}`
    navigator.clipboard.writeText(text)
    setCopiedAccountMap(prev => ({ ...prev, [student.id]: true }))
    setTimeout(() => {
      setCopiedAccountMap(prev => ({ ...prev, [student.id]: false }))
    }, 2000)
  }

  const handleExportStudents = () => {
    const headers = [
      'Mã học viên',
      'Họ và tên',
      'Email',
      'Số điện thoại',
      'Ngày sinh',
      'Giới tính',
      'Đối tượng',
      'Trạng thái',
      'Tên đăng nhập',
      'Mật khẩu khởi tạo',
      'Ngày tạo'
    ]
    const rows = students.map(s => [
      s.studentCode,
      s.fullName,
      s.email || 'Chưa có',
      s.phone || 'Chưa có',
      s.dateOfBirth || '',
      s.gender === 'MALE' ? 'Nam' : s.gender === 'FEMALE' ? 'Nữ' : 'Khác',
      s.targetType === 'KID' ? 'Trẻ em / Thiếu nhi' : 'Người lớn',
      s.status === 'ACTIVE' ? 'Đang học' : s.status === 'GRADUATED' ? 'Đã tốt nghiệp' : s.status === 'DROPPED' ? 'Đã nghỉ' : 'Tạm dừng',
      s.username || 'Chưa cấp',
      s.rawPassword || 'Chưa cấp',
      s.createdAt ? s.createdAt.substring(0, 10) : ''
    ])
    exportToCsv('Danh_sach_hoc_vien', headers, rows)
  }

  // Form state
  const [formData, setFormData] = useState<CreateStudentPayload>({
    studentCode: '',
    fullName: '',
    dateOfBirth: '',
    gender: 'MALE',
    phone: '',
    email: '',
    address: '',
    targetType: 'ADULT',
    status: 'ACTIVE',
    internalNotes: ''
  })

  // Format currency
  const formatVND = (amount?: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0)
  }

  // Load aggregate stats from real API
  const loadStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const res = await studentsApi.getStats()
      if (res.success && res.data) {
        setStats(res.data)
      }
    } catch {
      // Non-fatal, fallback
    } finally {
      setStatsLoading(false)
    }
  }, [])

  // Load auxiliary data
  useEffect(() => {
    const loadAuxData = async () => {
      try {
        const guardianRes = await studentsApi.getAllGuardians().catch(() => null)
        if (guardianRes && guardianRes.success && guardianRes.data) setGuardians(guardianRes.data)

        const classRes = await classesApi.searchClasses({ size: 100 }).catch(() => null)
        if (classRes && classRes.success && classRes.data) setClassList(classRes.data.content || [])

        const courseRes = await coursesApi.searchCourses({ size: 100 }).catch(() => null)
        if (courseRes && courseRes.success && courseRes.data) setCourses(courseRes.data.content || [])
      } catch {
        // Silently ignore
      }
    }
    loadAuxData()
    loadStats()
  }, [loadStats])

  // Load students list
  const loadStudents = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await studentsApi.searchStudents({
        keyword: keyword.trim() || undefined,
        targetType: selectedTargetType || undefined,
        status: selectedStatus || undefined,
        page,
        size: pageSize,
        sortBy: 'createdAt',
        direction: 'desc'
      })

      if (res.success && res.data) {
        setStudents(res.data.content || [])
        setTotalPages(res.data.totalPages || 1)
        setTotalElements(res.data.totalElements || 0)
      } else {
        setError(res.message || 'Không thể tải danh sách học viên')
      }
    } catch {
      setError('Lỗi kết nối máy chủ khi tải danh sách học viên')
    } finally {
      setLoading(false)
    }
  }, [keyword, selectedTargetType, selectedStatus, page])

  useEffect(() => {
    loadStudents()
  }, [loadStudents])

  const handleResetFilters = () => {
    setKeyword('')
    setSelectedTargetType('')
    setSelectedStatus('')
    setPage(0)
  }

  const openCreateModal = () => {
    setEditingStudent(null)
    setFormData({
      studentCode: '',
      fullName: '',
      dateOfBirth: '',
      gender: 'MALE',
      phone: '',
      email: '',
      address: '',
      targetType: 'ADULT',
      status: 'ACTIVE',
      internalNotes: ''
    })
    setSelectedGuardianId(0)
    setIsModalOpen(true)
  }

  const openEditModal = (s: Student) => {
    setEditingStudent(s)
    setFormData({
      studentCode: s.studentCode,
      fullName: s.fullName,
      dateOfBirth: s.dateOfBirth || '',
      gender: s.gender,
      phone: s.phone || '',
      email: s.email || '',
      address: s.address || '',
      targetType: s.targetType,
      status: s.status,
      internalNotes: s.internalNotes || ''
    })
    if (s.guardians && s.guardians.length > 0) {
      setSelectedGuardianId(s.guardians[0].guardianId)
      setSelectedRelation(s.guardians[0].relationshipType)
      setIsPrimaryContact(s.guardians[0].isPrimaryContact)
    } else {
      setSelectedGuardianId(0)
    }
    setIsModalOpen(true)
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.studentCode.trim() || !formData.fullName.trim()) {
      alert('Vui lòng điền đầy đủ các thông tin bắt buộc (*)')
      return
    }

    setFormSubmitting(true)
    try {
      const payload: CreateStudentPayload = {
        ...formData,
        studentCode: formData.studentCode.trim().toUpperCase(),
        fullName: formData.fullName.trim()
      }

      if (formData.targetType === 'KID' && selectedGuardianId > 0) {
        payload.guardians = [
          {
            guardianId: selectedGuardianId,
            relationshipType: selectedRelation,
            isPrimaryContact
          }
        ]
      }

      if (editingStudent) {
        const res = await studentsApi.updateStudent(editingStudent.id, payload)
        if (res.success) {
          setSuccessMsg(`Cập nhật hồ sơ học viên "${res.data?.fullName}" thành công!`)
          setIsModalOpen(false)
          loadStudents()
          loadStats()
        } else {
          alert(res.message || 'Cập nhật thất bại')
        }
      } else {
        const res = await studentsApi.createStudent(payload)
        if (res.success) {
          setSuccessMsg(`Tạo mới học viên "${res.data?.fullName}" (${res.data?.studentCode}) thành công!`)
          setIsModalOpen(false)
          loadStudents()
          loadStats()
        } else {
          alert(res.message || 'Tạo mới thất bại')
        }
      }
    } catch {
      alert('Có lỗi xảy ra khi lưu hồ sơ học viên')
    } finally {
      setFormSubmitting(false)
      setTimeout(() => setSuccessMsg(null), 4000)
    }
  }

  const openStatusModal = (s: Student) => {
    setStatusStudent(s)
    setNewStatus(s.status)
    setIsStatusModalOpen(true)
  }

  const handleStatusSubmit = async () => {
    if (!statusStudent) return
    try {
      const res = await studentsApi.updateStudentStatus(statusStudent.id, newStatus)
      if (res.success) {
        setSuccessMsg(`Đã cập nhật trạng thái học viên "${statusStudent.studentCode}" sang ${newStatus}`)
        setIsStatusModalOpen(false)
        loadStudents()
        loadStats()
      } else {
        alert(res.message || 'Cập nhật trạng thái thất bại')
      }
    } catch {
      alert('Lỗi cập nhật trạng thái')
    } finally {
      setTimeout(() => setSuccessMsg(null), 4000)
    }
  }

  // Open Enroll & Pay Modal
  const openEnrollModal = (s: Student) => {
    setEnrollStudent(s)
    setSelectedClassId(0)
    setTuitionFee(0)
    setPaidAmount(0)
    setPaymentMethod('BANK_TRANSFER')
    setReferenceNumber('')
    setEnrollNotes('')
    setProvisionAccountOnEnroll(!s.hasUserAccount)
    setIsEnrollModalOpen(true)
  }

  // On class selection in Enroll Modal
  const handleSelectClass = (classIdStr: string) => {
    const cid = Number(classIdStr)
    setSelectedClassId(cid)
    const selectedClass = classList.find((c) => c.id === cid)
    if (selectedClass) {
      const course = courses.find((cr) => cr.id === selectedClass.courseId)
      const fee = course?.defaultTuitionFee || 0
      setTuitionFee(fee)
      setPaidAmount(fee) // Default to 100% full payment
    } else {
      setTuitionFee(0)
      setPaidAmount(0)
    }
  }

  // Submit Enroll & Pay
  const handleEnrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!enrollStudent || !selectedClassId) {
      alert('Vui lòng chọn lớp học muốn ghi danh!')
      return
    }

    setEnrollSubmitting(true)
    try {
      const res = await studentsApi.enrollAndPay(enrollStudent.id, {
        classId: selectedClassId,
        paidAmount: Number(paidAmount),
        paymentMethod,
        referenceNumber: referenceNumber.trim() || undefined,
        notes: enrollNotes.trim() || undefined,
        provisionAccount: provisionAccountOnEnroll
      })

      if (res.success) {
        setSuccessMsg(`Đã ghi danh lớp học và ghi nhận thanh toán cho học viên "${enrollStudent.fullName}"!`)
        setIsEnrollModalOpen(false)
        loadStudents()
        loadStats()
      } else {
        alert(res.message || 'Ghi danh & thu học phí thất bại')
      }
    } catch (err: unknown) {
      const e = err as { message?: string }
      alert(e.message || 'Có lỗi xảy ra khi thực hiện ghi danh')
    } finally {
      setEnrollSubmitting(false)
      setTimeout(() => setSuccessMsg(null), 5000)
    }
  }

  // Open Provision Modal
  const openProvisionModal = (s: Student) => {
    setProvisionStudent(s)
    setCustomPassword('')
    setProvisionResult(null)
    setCopiedPassword(false)
    setIsProvisionModalOpen(true)
  }

  // Submit Provision
  const handleProvisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!provisionStudent) return

    setProvisionSubmitting(true)
    try {
      const res = await studentsApi.provisionAccount(provisionStudent.id, customPassword.trim() || undefined)
      if (res.success && res.data) {
        setProvisionResult(res.data)
        loadStudents()
      } else {
        alert(res.message || 'Cấp tài khoản thất bại')
      }
    } catch (err: unknown) {
      const e = err as { message?: string }
      alert(e.message || 'Lỗi cấp tài khoản')
    } finally {
      setProvisionSubmitting(false)
    }
  }

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="success" dot>Đang học</Badge>
      case 'INACTIVE':
        return <Badge variant="warning" dot>Tạm nghỉ</Badge>
      case 'GRADUATED':
        return <Badge variant="info" dot>Tốt nghiệp</Badge>
      case 'DROPPED':
        return <Badge variant="danger" dot>Thôi học</Badge>
      default:
        return <Badge variant="neutral">{status}</Badge>
    }
  }

  const renderTuitionBadge = (s: Student) => {
    if (!s.totalTuition || s.totalTuition === 0) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
          Chưa ghi danh
        </span>
      )
    }
    const status = s.tuitionStatus
    if (status === 'PAID') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
          <CheckCircle2 className="w-3 h-3" /> Đã hoàn thành
        </span>
      )
    }
    if (status === 'PARTIALLY_PAID') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
          Còn thiếu {formatVND(s.remainingTuition)}
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
        Chưa nộp học phí
      </span>
    )
  }

  const renderTargetTypeBadge = (type: string) => {
    if (type === 'KID') {
      return <Badge variant="purple">Trẻ em (KID)</Badge>
    }
    return <Badge variant="neutral">Người lớn (ADULT)</Badge>
  }

  const getGenderLabel = (gender: string) => {
    switch (gender) {
      case 'MALE': return 'Nam'
      case 'FEMALE': return 'Nữ'
      default: return 'Khác'
    }
  }

  const getRelationshipLabel = (rel: string) => {
    switch (rel) {
      case 'FATHER': return 'Bố'
      case 'MOTHER': return 'Mẹ'
      case 'GUARDIAN': return 'Người giám hộ'
      default: return 'Người thân'
    }
  }

  const isFiltering = keyword.trim() !== '' || selectedTargetType !== '' || selectedStatus !== ''

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#2A3A50]">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-[#A6B4C8] uppercase tracking-wider mb-1">
            <span>Học viên & Tuyển sinh</span>
            <span>/</span>
            <span className="text-[#142B4A] dark:text-[#38BDF8]">Danh sách</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#142B4A] dark:text-[#E8EEF7] flex items-center gap-2.5">
            <Users className="w-7 h-7 text-[#142B4A] dark:text-[#38BDF8]" />
            Quản lý Học viên & Người giám hộ
          </h1>
          <p className="text-sm text-slate-600 dark:text-[#A6B4C8] mt-1">
            Tự động quản lý khóa học, theo dõi học phí nộp/còn thiếu và cấp phát tài khoản học viên gửi Email.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportStudents}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border border-emerald-300 dark:border-emerald-700/60 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 text-sm font-semibold shadow-xs transition-all"
          >
            <Download size={16} />
            <span>Xuất file Excel (CSV)</span>
          </button>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#142B4A] dark:bg-[#38BDF8] hover:bg-[#1D4168] dark:hover:bg-[#0284C7] text-white dark:text-[#0B1220] rounded-xl text-sm font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#3977B8]"
          >
            <Plus size={16} />
            <span>Thêm học viên mới</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Tổng hồ sơ"
          value={stats ? stats.totalStudents : totalElements}
          icon={Users}
          subtitle="Hồ sơ được lưu trữ"
          loading={statsLoading && loading}
        />
        <StatCard
          title="Đang theo học"
          value={stats ? stats.activeStudents : 0}
          icon={UserCheck}
          subtitle="Trạng thái ACTIVE"
          badge={<Badge variant="success">Hoạt động</Badge>}
          loading={statsLoading}
        />
        <StatCard
          title="Đã xếp lớp"
          value={stats ? stats.enrolledStudents : 0}
          icon={GraduationCap}
          subtitle="Có lịch học đang diễn ra"
          badge={<Badge variant="info">Đang học</Badge>}
          loading={statsLoading}
        />
        <StatCard
          title="Phân loại lứa tuổi"
          value={stats ? `${stats.kidStudents} Nhí / ${stats.adultStudents} Lớn` : '0 / 0'}
          icon={Sparkles}
          subtitle="KID vs ADULT thực tế"
          loading={statsLoading}
        />
      </div>

      {/* Alerts */}
      {successMsg && (
        <div
          role="status"
          className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-sm shadow-xs animate-in fade-in"
        >
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="flex items-center gap-3 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-sm shadow-xs animate-in fade-in"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600 dark:text-rose-400" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#151F31] border border-slate-200/80 dark:border-[#2A3A50] shadow-xs flex flex-wrap items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value)
              setPage(0)
            }}
            placeholder="Tìm theo mã học viên, họ tên, SĐT hoặc email..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-slate-50/50 dark:bg-[#1C293D] text-sm text-[#142B4A] dark:text-[#E8EEF7] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#142B4A] dark:focus:ring-[#38BDF8]"
          />
        </div>

        {/* Target Type Filter */}
        <select
          value={selectedTargetType}
          onChange={(e) => {
            setSelectedTargetType(e.target.value)
            setPage(0)
          }}
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-sm text-[#142B4A] dark:text-[#E8EEF7] focus:outline-none focus:ring-2 focus:ring-[#142B4A] dark:focus:ring-[#38BDF8]"
        >
          <option value="">Tất cả đối tượng</option>
          <option value="ADULT">Người lớn (ADULT)</option>
          <option value="KID">Trẻ em (KID)</option>
        </select>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => {
            setSelectedStatus(e.target.value)
            setPage(0)
          }}
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-sm text-[#142B4A] dark:text-[#E8EEF7] focus:outline-none focus:ring-2 focus:ring-[#142B4A] dark:focus:ring-[#38BDF8]"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="ACTIVE">Đang học (ACTIVE)</option>
          <option value="INACTIVE">Tạm nghỉ (INACTIVE)</option>
          <option value="GRADUATED">Tốt nghiệp (GRADUATED)</option>
          <option value="DROPPED">Thôi học (DROPPED)</option>
        </select>

        {/* Reset button */}
        {isFiltering && (
          <button
            onClick={handleResetFilters}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-slate-100 dark:bg-[#1C293D] hover:bg-slate-200 text-slate-700 dark:text-[#A6B4C8] text-xs font-semibold transition-colors"
            title="Xóa bộ lọc"
          >
            <RotateCcw size={14} />
            <span>Đặt lại</span>
          </button>
        )}

        {/* Result Counter */}
        <div className="text-xs text-slate-500 dark:text-[#A6B4C8] font-medium whitespace-nowrap self-center px-1">
          Hiển thị <span className="font-bold text-[#142B4A] dark:text-[#E8EEF7]">{students.length}</span> / {totalElements}
        </div>
      </div>

      {/* Main Content: Table or Loading */}
      {loading ? (
        <TableSkeleton rows={6} columns={7} />
      ) : students.length === 0 ? (
        <EmptyState
          title={isFiltering ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có học viên nào'}
          description={
            isFiltering
              ? 'Không có hồ sơ học viên nào khớp với điều kiện tìm kiếm hoặc bộ lọc hiện tại.'
              : 'Trung tâm chưa ghi nhận học viên nào. Hãy bấm "Thêm học viên mới" để khởi tạo hồ sơ đầu tiên.'
          }
          action={
            isFiltering
              ? { label: 'Xóa bộ lọc', onClick: handleResetFilters, icon: RotateCcw }
              : { label: 'Thêm học viên mới', onClick: openCreateModal, icon: Plus }
          }
        />
      ) : (
        <div className="bg-white dark:bg-[#151F31] rounded-2xl border border-slate-200/80 dark:border-[#2A3A50] shadow-xs overflow-hidden">
          <div className="overflow-x-auto rounded-2xl">
            <table className="w-full text-left border-collapse text-table min-w-[1100px]">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-[#1C293D] border-b border-slate-200 dark:border-[#2A3A50] text-xs font-semibold text-slate-500 dark:text-[#A6B4C8] uppercase tracking-wider">
                  <th className="py-3.5 px-4 min-w-[220px]">Học viên</th>
                  <th className="py-3.5 px-4 min-w-[230px]">Khóa học & Học phí</th>
                  <th className="py-3.5 px-4 w-[150px] whitespace-nowrap">Tài khoản Web</th>
                  <th className="py-3.5 px-4 w-[160px] whitespace-nowrap">Liên hệ</th>
                  <th className="py-3.5 px-4 w-[170px] whitespace-nowrap">Người giám hộ</th>
                  <th className="py-3.5 px-4 w-[120px] text-center whitespace-nowrap">Trạng thái</th>
                  <th className="py-3.5 px-4 w-[130px] text-right whitespace-nowrap">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#2A3A50]/60">
                {students.map((student) => {
                  const guardian = student.guardians && student.guardians.length > 0 ? student.guardians[0] : null
                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-[#1C293D]/40 transition-colors"
                    >
                      {/* Name & Code */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#142B4A] to-[#1D4168] dark:from-[#38BDF8] dark:to-[#0284C7] text-white dark:text-[#0B1220] font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-xs">
                            {student.fullName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-[#142B4A] dark:text-[#E8EEF7] leading-tight">
                              {student.fullName}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-[#A6B4C8] font-mono mt-0.5 flex items-center gap-1.5">
                              <span>{student.studentCode}</span>
                              <span>•</span>
                              {renderTargetTypeBadge(student.targetType)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Course & Tuition */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          {student.enrolledCourseName ? (
                            <div>
                              <div className="text-xs font-bold text-[#142B4A] dark:text-[#38BDF8] flex items-center gap-1">
                                <BookOpen size={12} className="flex-shrink-0" />
                                <span className="truncate max-w-[190px]">{student.enrolledCourseName}</span>
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono">
                                Lớp: {student.enrolledClassName || '—'}
                              </div>
                              <div className="mt-1 flex items-center gap-2">
                                {renderTuitionBadge(student)}
                              </div>
                              <div className="text-[10px] text-slate-500 mt-0.5">
                                Đã nộp: <strong className="text-emerald-600">{formatVND(student.paidTuition)}</strong> / {formatVND(student.totalTuition)}
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <span className="text-xs text-slate-400 italic block">Chưa ghi danh</span>
                              <button
                                onClick={() => openEnrollModal(student)}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#142B4A] dark:text-[#38BDF8] hover:underline"
                              >
                                <Plus size={11} />
                                <span>Ghi danh & Đóng học phí</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Account Portal Status */}
                      <td className="py-3.5 px-4">
                        {student.hasUserAccount ? (
                          <div className="space-y-1.5 min-w-[170px]">
                            <div className="flex items-center justify-between gap-1">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                                <CheckCircle2 size={10} /> Đã cấp TK
                              </span>
                              <button
                                onClick={() => copyAccountInfo(student)}
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
                                title="Sao chép tài khoản và mật khẩu"
                              >
                                {copiedAccountMap[student.id] ? (
                                  <>
                                    <Check size={10} className="text-emerald-600 dark:text-emerald-400" />
                                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Đã chép</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy size={10} />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>
                            </div>
                            
                            <div className="text-[11px] font-mono font-medium text-slate-700 dark:text-[#E8EEF7] truncate max-w-[160px]">
                              TK: <span className="text-blue-600 dark:text-sky-400 font-bold">{student.username}</span>
                            </div>

                            <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-600 dark:text-[#A6B4C8]">
                              <span className="text-slate-400 text-[10px]">MK:</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {showPasswordMap[student.id]
                                  ? (student.rawPassword || 'Chưa lưu MK cũ')
                                  : '••••••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleShowPassword(student.id)}
                                className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                                title={showPasswordMap[student.id] ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                              >
                                {showPasswordMap[student.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                              </button>
                            </div>

                            <button
                              onClick={() => openProvisionModal(student)}
                              className="text-[10px] text-slate-400 hover:text-blue-600 dark:hover:text-sky-400 flex items-center gap-0.5 underline pt-0.5"
                            >
                              <Key size={10} /> Đổi MK / Gửi lại mail
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                              Chưa cấp
                            </span>
                            <button
                              onClick={() => openProvisionModal(student)}
                              className="block text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline"
                            >
                              Cấp TK & Gửi mail
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Contact Phone & Email */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1 text-xs">
                          {student.phone ? (
                            <a
                              href={`tel:${student.phone}`}
                              className="flex items-center gap-1.5 text-slate-700 dark:text-[#E8EEF7] hover:text-[#3977B8] dark:hover:text-[#38BDF8]"
                            >
                              <Phone size={13} className="text-slate-400" />
                              <span>{student.phone}</span>
                            </a>
                          ) : (
                            <span className="text-slate-400 italic">Chưa có SĐT</span>
                          )}
                          {student.email && (
                            <a
                              href={`mailto:${student.email}`}
                              className="flex items-center gap-1.5 text-slate-500 dark:text-[#A6B4C8] hover:text-[#3977B8] dark:hover:text-[#38BDF8] truncate max-w-[170px]"
                            >
                              <Mail size={13} className="text-slate-400 flex-shrink-0" />
                              <span className="truncate">{student.email}</span>
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Guardian */}
                      <td className="py-3.5 px-4">
                        {guardian ? (
                          <div className="space-y-0.5 text-xs">
                            <div className="font-semibold text-slate-800 dark:text-[#E8EEF7] flex items-center gap-1.5">
                              <Shield size={13} className="text-indigo-500" />
                              <span>{guardian.fullName}</span>
                              <span className="text-[11px] px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-normal">
                                {getRelationshipLabel(guardian.relationshipType)}
                              </span>
                            </div>
                            <div className="text-slate-500 dark:text-[#A6B4C8] pl-5 font-mono">
                              {guardian.phone}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Không có người giám hộ</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {renderStatusBadge(student.status)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => setDetailStudent(student)}
                            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-[#142B4A] dark:hover:text-[#38BDF8] hover:bg-slate-100 dark:hover:bg-[#1C293D] transition-colors"
                            title="Xem chi tiết hồ sơ"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => openEnrollModal(student)}
                            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-[#1C293D] transition-colors"
                            title="Ghi danh & Thu học phí"
                          >
                            <CreditCard size={16} />
                          </button>
                          <button
                            onClick={() => openProvisionModal(student)}
                            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-[#1C293D] transition-colors"
                            title="Cấp tài khoản & Gửi Mail"
                          >
                            <Key size={16} />
                          </button>
                          <button
                            onClick={() => openEditModal(student)}
                            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-[#142B4A] dark:hover:text-[#38BDF8] hover:bg-slate-100 dark:hover:bg-[#1C293D] transition-colors"
                            title="Chỉnh sửa hồ sơ"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => openStatusModal(student)}
                            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-[#1C293D] transition-colors"
                            title="Thay đổi trạng thái"
                          >
                            <UserCheck size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Toolbar */}
          <div className="px-4 py-3.5 bg-slate-50/50 dark:bg-[#1C293D]/50 border-t border-slate-200 dark:border-[#2A3A50] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 dark:text-[#A6B4C8]">
            <div>
              Trang <span className="font-bold text-[#142B4A] dark:text-[#E8EEF7]">{page + 1}</span> / {totalPages} (Tổng số {totalElements} bản ghi)
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#151F31] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-[#1C293D] font-medium transition-colors"
              >
                <ChevronLeft size={14} />
                <span>Trước</span>
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#151F31] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-[#1C293D] font-medium transition-colors"
              >
                <span>Sau</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Detail Modal */}
      {detailStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#151F31] rounded-2xl border border-slate-200 dark:border-[#2A3A50] max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setDetailStudent(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1C293D]"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3.5 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-[#142B4A] dark:bg-[#38BDF8] text-white dark:text-[#0B1220] font-bold text-lg flex items-center justify-center shadow-md">
                {detailStudent.fullName.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#142B4A] dark:text-[#E8EEF7]">{detailStudent.fullName}</h3>
                <div className="text-xs text-slate-500 dark:text-[#A6B4C8] font-mono">{detailStudent.studentCode}</div>
              </div>
            </div>

            {/* Automation Summary Card */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#1C293D] border border-slate-200 dark:border-[#2A3A50] space-y-2 text-xs mb-4">
              <div className="font-bold text-[#142B4A] dark:text-[#38BDF8] uppercase tracking-wider text-[11px]">
                Khóa học & Học phí
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Khóa & Lớp:</span>
                <span className="font-semibold">{detailStudent.enrolledCourseName ? `${detailStudent.enrolledCourseName} (${detailStudent.enrolledClassName})` : 'Chưa ghi danh'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tổng học phí:</span>
                <span className="font-bold">{formatVND(detailStudent.totalTuition)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Đã thanh toán:</span>
                <span className="font-bold text-emerald-600">{formatVND(detailStudent.paidTuition)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Còn thiếu:</span>
                <span className={`font-bold ${(detailStudent.remainingTuition || 0) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {formatVND(detailStudent.remainingTuition)}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-[#2A3A50]">
                <span className="text-slate-500">Tài khoản Web:</span>
                <span className="font-mono text-cyan-600 dark:text-cyan-400 font-semibold">
                  {detailStudent.hasUserAccount ? `@${detailStudent.username}` : 'Chưa cấp'}
                </span>
              </div>
            </div>

            <div className="space-y-2.5 text-xs border-t border-b border-slate-100 dark:border-[#2A3A50] py-3">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-[#A6B4C8]">Trạng thái:</span>
                <span>{renderStatusBadge(detailStudent.status)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-[#A6B4C8]">Đối tượng:</span>
                <span>{renderTargetTypeBadge(detailStudent.targetType)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-[#A6B4C8]">Giới tính & Ngày sinh:</span>
                <span className="font-semibold text-slate-800 dark:text-[#E8EEF7]">
                  {getGenderLabel(detailStudent.gender)} • {detailStudent.dateOfBirth || 'Chưa cập nhật'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-[#A6B4C8]">Số điện thoại:</span>
                <span className="font-semibold text-slate-800 dark:text-[#E8EEF7]">{detailStudent.phone || 'Chưa cập nhật'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-[#A6B4C8]">Hòm thư Email:</span>
                <span className="font-semibold text-slate-800 dark:text-[#E8EEF7]">{detailStudent.email || 'Chưa cập nhật'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-[#A6B4C8]">Địa chỉ:</span>
                <span className="font-semibold text-slate-800 dark:text-[#E8EEF7] text-right max-w-[260px]">{detailStudent.address || 'Chưa cập nhật'}</span>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setDetailStudent(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] text-sm font-semibold text-slate-700 dark:text-[#E8EEF7] hover:bg-slate-100 dark:hover:bg-[#1C293D]"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ENROLL & PAY (Automatic Tuition & Account) */}
      {isEnrollModalOpen && enrollStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white dark:bg-[#151F31] rounded-3xl border border-slate-200 dark:border-[#2A3A50] max-w-xl w-full p-6 shadow-2xl relative my-8">
            <button
              onClick={() => setIsEnrollModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1C293D]"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center">
                <CreditCard size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#142B4A] dark:text-[#E8EEF7]">
                  Ghi danh Lớp học & Thu học phí
                </h3>
                <p className="text-xs text-slate-500 dark:text-[#A6B4C8]">
                  Học viên: <strong className="text-[#142B4A] dark:text-[#E8EEF7]">{enrollStudent.fullName}</strong> ({enrollStudent.studentCode})
                </p>
              </div>
            </div>

            <form onSubmit={handleEnrollSubmit} className="space-y-4">
              {/* Select Class */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] mb-1">
                  Chọn Lớp học ghi danh <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={selectedClassId}
                  onChange={(e) => handleSelectClass(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-sm text-[#142B4A] dark:text-[#E8EEF7] focus:ring-2 focus:ring-[#142B4A]"
                >
                  <option value="0">-- Chọn lớp học --</option>
                  {classList.map((cl) => {
                    const course = courses.find((c) => c.id === cl.courseId)
                    return (
                      <option key={cl.id} value={cl.id}>
                        {cl.name} ({cl.code}) — {course?.name || 'Khóa học'} {course?.defaultTuitionFee ? `[${formatVND(course.defaultTuitionFee)}]` : ''}
                      </option>
                    )
                  })}
                </select>
              </div>

              {/* Tuition Auto Calculation Display */}
              {tuitionFee > 0 && (
                <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block">Học phí niêm yết:</span>
                    <span className="text-base font-black text-[#142B4A] dark:text-[#38BDF8]">
                      {formatVND(tuitionFee)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Số tiền còn thiếu dự kiến:</span>
                    <span className={`text-base font-black ${tuitionFee - paidAmount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {formatVND(Math.max(0, tuitionFee - paidAmount))}
                    </span>
                  </div>
                </div>
              )}

              {/* Payment Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] mb-1">
                    Số tiền thanh toán ngay (VND)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50000"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-sm font-bold text-emerald-600 dark:text-emerald-400"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Gợi ý: Điền đủ học phí nếu đã đóng 100%, hoặc điền tiền cọc.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] mb-1">
                    Hình thức thanh toán
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-sm text-[#142B4A] dark:text-[#E8EEF7]"
                  >
                    <option value="BANK_TRANSFER">Chuyển khoản Ngân hàng (BANK_TRANSFER)</option>
                    <option value="CASH">Tiền mặt (CASH)</option>
                    <option value="POS">Quẹt thẻ POS</option>
                  </select>
                </div>
              </div>

              {/* Reference number & Note */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] mb-1">
                    Mã GD ngân hàng / Số biên lai
                  </label>
                  <input
                    type="text"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    placeholder="VD: MB-93821038"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-sm text-[#142B4A] dark:text-[#E8EEF7] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] mb-1">
                    Ghi chú phiếu thu
                  </label>
                  <input
                    type="text"
                    value={enrollNotes}
                    onChange={(e) => setEnrollNotes(e.target.value)}
                    placeholder="Ghi chú thêm nếu có..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-sm text-[#142B4A] dark:text-[#E8EEF7]"
                  />
                </div>
              </div>

              {/* Automatic Provision Checkbox */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1C293D] border border-slate-200 dark:border-[#2A3A50] flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-slate-800 dark:text-[#E8EEF7] flex items-center gap-1.5">
                    <Key size={14} className="text-sky-500" />
                    <span>Tự động cấp tài khoản & Gửi email xác nhận</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-[#A6B4C8]">
                    Hệ thống sẽ gửi tài khoản và mật khẩu đăng nhập vào hòm thư: <strong>{enrollStudent.email || 'Chưa có email'}</strong>
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={provisionAccountOnEnroll}
                  onChange={(e) => setProvisionAccountOnEnroll(e.target.checked)}
                  className="w-4 h-4 rounded text-[#142B4A] focus:ring-[#142B4A]"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-[#2A3A50] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEnrollModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] text-sm font-semibold text-slate-700 dark:text-[#E8EEF7] hover:bg-slate-100 dark:hover:bg-[#1C293D]"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={enrollSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
                >
                  {enrollSubmitting ? 'Đang ghi nhận...' : 'Xác nhận Ghi danh & Thu tiền'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PROVISION ACCOUNT & SEND EMAIL */}
      {isProvisionModalOpen && provisionStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#151F31] rounded-3xl border border-slate-200 dark:border-[#2A3A50] max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsProvisionModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1C293D]"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-[#38BDF8] flex items-center justify-center">
                <Key size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#142B4A] dark:text-[#E8EEF7]">
                  Cấp tài khoản & Gửi Email
                </h3>
                <p className="text-xs text-slate-500 dark:text-[#A6B4C8]">
                  Học viên: <strong className="text-slate-800 dark:text-white">{provisionStudent.fullName}</strong>
                </p>
              </div>
            </div>

            {provisionResult ? (
              <div className="space-y-4 animate-in fade-in">
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs space-y-2">
                  <div className="font-bold text-emerald-800 dark:text-emerald-300 text-sm flex items-center gap-1.5">
                    <CheckCircle2 size={16} /> Cấp tài khoản thành công!
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-emerald-200/60">
                    <span className="text-slate-600">Tên đăng nhập:</span>
                    <strong className="font-mono text-emerald-900 dark:text-emerald-200 text-sm">
                      {provisionResult.username}
                    </strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Mật khẩu:</span>
                    <div className="flex items-center gap-1">
                      <strong className="font-mono text-emerald-900 dark:text-emerald-200 text-sm">
                        {provisionResult.plainPassword}
                      </strong>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(provisionResult.plainPassword || '')
                          setCopiedPassword(true)
                          setTimeout(() => setCopiedPassword(false), 2000)
                        }}
                        className="p-1 text-slate-500 hover:text-emerald-700"
                        title="Copy mật khẩu"
                      >
                        {copiedPassword ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Trạng thái gửi Email:</span>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                      {provisionResult.emailSent ? 'Đã gửi email thành công' : 'Đã ghi nhận (Không gửi mail)'}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => setIsProvisionModalOpen(false)}
                    className="px-4 py-2 bg-[#142B4A] dark:bg-[#38BDF8] text-white dark:text-[#0B1220] rounded-xl text-xs font-semibold"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleProvisionSubmit} className="space-y-4">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1C293D] text-xs text-slate-600 dark:text-[#A6B4C8] space-y-1">
                  <div>Email nhận tài khoản: <strong>{provisionStudent.email || '(Chưa có email - vui lòng bổ sung email)'}</strong></div>
                  <div>Quyền hệ thống: <strong className="text-blue-600 font-mono">ROLE_STUDENT</strong></div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] mb-1">
                    Mật khẩu tùy chỉnh (Để trống để tự tạo mật khẩu ngẫu nhiên)
                  </label>
                  <input
                    type="text"
                    value={customPassword}
                    onChange={(e) => setCustomPassword(e.target.value)}
                    placeholder="VD: Cha@2026 hoặc bỏ trống"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-sm text-[#142B4A] dark:text-[#E8EEF7]"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-[#2A3A50] flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsProvisionModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] text-xs font-semibold text-slate-700 dark:text-[#E8EEF7]"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={provisionSubmitting}
                    className="px-4 py-2 rounded-xl bg-[#142B4A] dark:bg-[#38BDF8] text-white dark:text-[#0B1220] text-xs font-semibold shadow-xs flex items-center gap-1.5"
                  >
                    <Send size={13} />
                    <span>{provisionSubmitting ? 'Đang cấp...' : 'Cấp tài khoản & Gửi'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white dark:bg-[#151F31] rounded-2xl border border-slate-200 dark:border-[#2A3A50] max-w-2xl w-full p-6 shadow-2xl relative my-8">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1C293D]"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-bold text-[#142B4A] dark:text-[#E8EEF7] mb-1">
              {editingStudent ? 'Cập nhật Hồ sơ Học viên' : 'Thêm Hồ sơ Học viên Mới'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-[#A6B4C8] mb-5">
              Điền các thông tin định danh và liên hệ của người học.
            </p>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] mb-1">
                    Mã học viên <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.studentCode}
                    onChange={(e) => setFormData({ ...formData, studentCode: e.target.value })}
                    placeholder="VD: HV20240001"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-sm text-[#142B4A] dark:text-[#E8EEF7] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] mb-1">
                    Họ và tên <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="VD: Nguyễn Văn An"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-sm text-[#142B4A] dark:text-[#E8EEF7]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] mb-1">
                    Nhóm đối tượng
                  </label>
                  <select
                    value={formData.targetType}
                    onChange={(e) => setFormData({ ...formData, targetType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-sm text-[#142B4A] dark:text-[#E8EEF7]"
                  >
                    <option value="ADULT">Người lớn (ADULT)</option>
                    <option value="KID">Trẻ em (KID)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] mb-1">
                    Giới tính
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-sm text-[#142B4A] dark:text-[#E8EEF7]"
                  >
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                    <option value="OTHER">Khác</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] mb-1">
                    Ngày sinh
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-sm text-[#142B4A] dark:text-[#E8EEF7]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="VD: 0987654321"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-sm text-[#142B4A] dark:text-[#E8EEF7]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] mb-1">
                    Hòm thư Email (để gửi thông tin tài khoản)
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="VD: student@example.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-sm text-[#142B4A] dark:text-[#E8EEF7]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] mb-1">
                  Địa chỉ thường trú
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="VD: 123 Đường Cầu Giấy, Hà Nội"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-sm text-[#142B4A] dark:text-[#E8EEF7]"
                />
              </div>

              {/* Kid Guardian Linking */}
              {formData.targetType === 'KID' && (
                <div className="p-4 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-900 dark:text-purple-300">
                    <Shield size={14} />
                    <span>Liên kết Phụ huynh / Người giám hộ</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        Chọn phụ huynh đã có
                      </label>
                      <select
                        value={selectedGuardianId}
                        onChange={(e) => setSelectedGuardianId(Number(e.target.value))}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-xs text-[#142B4A] dark:text-[#E8EEF7]"
                      >
                        <option value="0">-- Chưa chọn phụ huynh --</option>
                        {guardians.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.fullName} ({g.phone})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        Mối quan hệ
                      </label>
                      <select
                        value={selectedRelation}
                        onChange={(e) => setSelectedRelation(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-xs text-[#142B4A] dark:text-[#E8EEF7]"
                      >
                        <option value="FATHER">Bố</option>
                        <option value="MOTHER">Mẹ</option>
                        <option value="GUARDIAN">Người giám hộ</option>
                        <option value="OTHER">Người thân khác</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] mb-1">
                  Ghi chú nội bộ
                </label>
                <textarea
                  rows={2}
                  value={formData.internalNotes}
                  onChange={(e) => setFormData({ ...formData, internalNotes: e.target.value })}
                  placeholder="Ghi chú về học lực, nhu cầu đặc biệt..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-sm text-[#142B4A] dark:text-[#E8EEF7]"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-[#2A3A50] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] text-sm font-semibold text-slate-700 dark:text-[#E8EEF7] hover:bg-slate-100 dark:hover:bg-[#1C293D]"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#142B4A] dark:bg-[#38BDF8] text-white dark:text-[#0B1220] text-sm font-semibold hover:bg-[#1D4168] dark:hover:bg-[#0284C7] shadow-sm disabled:opacity-50"
                >
                  {formSubmitting ? 'Đang lưu...' : editingStudent ? 'Lưu cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status Modal */}
      {isStatusModalOpen && statusStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#151F31] rounded-2xl border border-slate-200 dark:border-[#2A3A50] max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsStatusModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1C293D]"
            >
              <X size={18} />
            </button>

            <h3 className="text-base font-bold text-[#142B4A] dark:text-[#E8EEF7] mb-1">
              Đổi trạng thái học viên
            </h3>
            <p className="text-xs text-slate-500 dark:text-[#A6B4C8] mb-4">
              Cập nhật trạng thái học tập của học viên <span className="font-bold text-[#142B4A] dark:text-[#E8EEF7]">{statusStudent.fullName}</span> ({statusStudent.studentCode}).
            </p>

            <div className="space-y-3 mb-5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#E8EEF7]">
                Chọn trạng thái mới:
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-sm text-[#142B4A] dark:text-[#E8EEF7]"
              >
                <option value="ACTIVE">Đang học (ACTIVE)</option>
                <option value="INACTIVE">Tạm nghỉ (INACTIVE)</option>
                <option value="GRADUATED">Tốt nghiệp (GRADUATED)</option>
                <option value="DROPPED">Thôi học (DROPPED)</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsStatusModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] hover:bg-slate-100 dark:hover:bg-[#1C293D]"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleStatusSubmit}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
              >
                Cập nhật trạng thái
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Details Modal */}
      {detailStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#151F31] rounded-3xl border border-slate-200 dark:border-[#2A3A50] max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setDetailStudent(null)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1C293D] transition"
            >
              <X size={20} />
            </button>

            {/* Header */}
            <div className="flex items-center gap-4 pb-6 border-b border-slate-100 dark:border-[#2A3A50]">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#142B4A] to-[#1D4168] dark:from-[#38BDF8] dark:to-[#0284C7] text-white dark:text-[#0B1220] font-black text-xl flex items-center justify-center shadow-md">
                {detailStudent.fullName.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-[#142B4A] dark:text-[#E8EEF7]">
                    {detailStudent.fullName}
                  </h3>
                  {renderStatusBadge(detailStudent.status)}
                </div>
                <div className="text-xs text-slate-500 dark:text-[#A6B4C8] font-mono mt-1 flex items-center gap-2">
                  <span>Mã: <strong className="text-slate-700 dark:text-slate-300">{detailStudent.studentCode}</strong></span>
                  <span>•</span>
                  {renderTargetTypeBadge(detailStudent.targetType)}
                </div>
              </div>
            </div>

            <div className="py-6 space-y-6">
              {/* Account Credentials Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-blue-900 dark:text-blue-300">
                    <Key size={16} />
                    <span>Tài khoản Đăng nhập Hệ thống (Cổng Học Viên)</span>
                  </div>
                  {detailStudent.hasUserAccount && (
                    <button
                      onClick={() => copyAccountInfo(detailStudent)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-white dark:bg-[#1C293D] border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 shadow-xs transition"
                    >
                      {copiedAccountMap[detailStudent.id] ? (
                        <>
                          <Check size={13} className="text-emerald-600 dark:text-emerald-400" />
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">Đã sao chép!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} />
                          <span>Sao chép TK & MK</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {detailStudent.hasUserAccount ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-white dark:bg-[#151F31] p-3 rounded-xl border border-blue-100 dark:border-blue-900/60">
                        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                          Tên đăng nhập
                        </div>
                        <div className="text-sm font-mono font-bold text-blue-600 dark:text-sky-400 mt-0.5">
                          {detailStudent.username}
                        </div>
                      </div>

                      <div className="bg-white dark:bg-[#151F31] p-3 rounded-xl border border-blue-100 dark:border-blue-900/60 flex items-center justify-between">
                        <div>
                          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                            Mật khẩu hiện tại
                          </div>
                          <div className="text-sm font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                            {showPasswordMap[detailStudent.id]
                              ? (detailStudent.rawPassword || 'Chưa lưu MK cũ')
                              : '••••••••••••'}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleShowPassword(detailStudent.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1C293D] transition"
                          title={showPasswordMap[detailStudent.id] ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                        >
                          {showPasswordMap[detailStudent.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 text-xs text-slate-500 dark:text-[#A6B4C8]">
                      <span>💡 <em>Mật khẩu được đồng bộ tự động ngay cả khi học viên tự đổi mật khẩu.</em></span>
                      <button
                        onClick={() => {
                          const s = detailStudent
                          setDetailStudent(null)
                          openProvisionModal(s)
                        }}
                        className="text-xs font-semibold text-blue-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                      >
                        <RotateCcw size={12} /> Đổi mật khẩu mới
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-[#151F31] rounded-xl border border-dashed border-blue-300 dark:border-blue-800">
                    <span className="text-xs text-slate-500 italic">
                      Học viên này chưa được cấp tài khoản Cổng Web.
                    </span>
                    <button
                      onClick={() => {
                        const s = detailStudent
                        setDetailStudent(null)
                        openProvisionModal(s)
                      }}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition"
                    >
                      Cấp tài khoản ngay
                    </button>
                  </div>
                )}
              </div>

              {/* Course & Finance Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#1C293D]/50 border border-slate-200 dark:border-[#2A3A50] space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-[#E8EEF7]">
                  <BookOpen size={14} className="text-emerald-500" />
                  <span>Khóa học & Học phí</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500">Khóa học:</span>
                    <p className="font-bold text-[#142B4A] dark:text-[#E8EEF7] mt-0.5">
                      {detailStudent.enrolledCourseName || 'Chưa ghi danh'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Lớp học:</span>
                    <p className="font-bold text-[#142B4A] dark:text-[#E8EEF7] mt-0.5">
                      {detailStudent.enrolledClassName || '—'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Học phí:</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                      {formatVND(detailStudent.totalTuition)}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Trạng thái đóng phí:</span>
                    <div className="mt-0.5">
                      {renderTuitionBadge(detailStudent)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Personal Details */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-[#E8EEF7]">
                  Thông tin liên hệ & Hồ sơ
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1C293D]/30 border border-slate-100 dark:border-[#2A3A50]">
                    <span className="text-slate-400">Giới tính:</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                      {getGenderLabel(detailStudent.gender)}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1C293D]/30 border border-slate-100 dark:border-[#2A3A50]">
                    <span className="text-slate-400">Ngày sinh:</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                      {detailStudent.dateOfBirth || '—'}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1C293D]/30 border border-slate-100 dark:border-[#2A3A50]">
                    <span className="text-slate-400">Số điện thoại:</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                      {detailStudent.phone || '—'}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1C293D]/30 border border-slate-100 dark:border-[#2A3A50]">
                    <span className="text-slate-400">Email:</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 truncate">
                      {detailStudent.email || '—'}
                    </p>
                  </div>
                  <div className="sm:col-span-2 p-3 rounded-xl bg-slate-50 dark:bg-[#1C293D]/30 border border-slate-100 dark:border-[#2A3A50]">
                    <span className="text-slate-400">Địa chỉ thường trú:</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                      {detailStudent.address || '—'}
                    </p>
                  </div>
                  {detailStudent.internalNotes && (
                    <div className="sm:col-span-2 p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                      <span className="text-amber-800 dark:text-amber-400 font-semibold">Ghi chú nội bộ:</span>
                      <p className="text-slate-700 dark:text-slate-300 mt-0.5">
                        {detailStudent.internalNotes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-[#2A3A50] flex items-center justify-end">
              <button
                type="button"
                onClick={() => setDetailStudent(null)}
                className="px-5 py-2.5 rounded-xl bg-[#142B4A] dark:bg-[#38BDF8] text-white dark:text-[#0B1220] font-semibold text-sm hover:opacity-90 transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StudentListPage
