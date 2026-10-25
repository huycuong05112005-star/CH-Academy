import React, { useEffect, useState, useCallback } from 'react'
import { studentsApi } from '../../../api/students'
import type { Student, Guardian, CreateStudentPayload, StudentStats } from '../../../types/student'
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
  Sparkles,
  GraduationCap
} from 'lucide-react'

export const StudentListPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([])
  const [stats, setStats] = useState<StudentStats | null>(null)
  const [guardians, setGuardians] = useState<Guardian[]>([])
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

  // Load aggregate stats from real API
  const loadStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const res = await studentsApi.getStats()
      if (res.success && res.data) {
        setStats(res.data)
      }
    } catch {
      // Non-fatal, fallback to page elements
    } finally {
      setStatsLoading(false)
    }
  }, [])

  // Load guardians list for linking
  useEffect(() => {
    const loadGuardians = async () => {
      try {
        const res = await studentsApi.getAllGuardians()
        if (res.success && res.data) {
          setGuardians(res.data)
        }
      } catch {
        // Silently ignore
      }
    }
    loadGuardians()
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
            Theo dõi hồ sơ người học, đối chiếu lứa tuổi và liên kết thông tin phụ huynh/người giám hộ.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#142B4A] dark:bg-[#38BDF8] hover:bg-[#1D4168] dark:hover:bg-[#0284C7] text-white dark:text-[#0B1220] rounded-xl text-sm font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#3977B8]"
        >
          <Plus size={16} />
          <span>Thêm học viên mới</span>
        </button>
      </div>

      {/* KPI Overview Strip (Real Database Metrics) */}
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
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-center justify-between text-sm shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-800 dark:hover:text-emerald-200">
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 flex items-center justify-between text-sm shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertCircle size={18} className="text-rose-600 dark:text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => loadStudents()}
            className="px-3 py-1 bg-white dark:bg-[#1C293D] border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-lg text-xs font-semibold hover:bg-rose-50"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Search & Filters Toolbar */}
      <div className="bg-white dark:bg-[#151F31] p-4 rounded-2xl border border-slate-200/80 dark:border-[#2A3A50] shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo mã học viên, họ tên hoặc số điện thoại..."
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value)
              setPage(0)
            }}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-slate-50/50 dark:bg-[#1C293D] text-sm text-[#142B4A] dark:text-[#E8EEF7] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#142B4A] dark:focus:ring-[#38BDF8] transition-colors"
          />
        </div>

        {/* Age Group Filter */}
        <select
          value={selectedTargetType}
          onChange={(e) => {
            setSelectedTargetType(e.target.value)
            setPage(0)
          }}
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-sm text-[#142B4A] dark:text-[#E8EEF7] focus:outline-none focus:ring-2 focus:ring-[#142B4A] dark:focus:ring-[#38BDF8]"
        >
          <option value="">Tất cả lứa tuổi</option>
          <option value="KID">Trẻ em (KID)</option>
          <option value="ADULT">Người lớn (ADULT)</option>
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
          {/* Desktop Table View */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-table">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-[#1C293D] border-b border-slate-200 dark:border-[#2A3A50] text-xs font-semibold text-slate-500 dark:text-[#A6B4C8] uppercase tracking-wider">
                  <th className="py-3.5 px-4">Học viên</th>
                  <th className="py-3.5 px-4">Độ tuổi & Giới tính</th>
                  <th className="py-3.5 px-4">Thông tin Liên hệ</th>
                  <th className="py-3.5 px-4">Người giám hộ</th>
                  <th className="py-3.5 px-4">Trạng thái</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
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
                            <div className="text-xs text-slate-500 dark:text-[#A6B4C8] font-mono mt-0.5">
                              {student.studentCode}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* TargetType & Gender */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          {renderTargetTypeBadge(student.targetType)}
                          <div className="text-xs text-slate-500 dark:text-[#A6B4C8]">
                            {student.dateOfBirth ? (
                              <span>{student.dateOfBirth} • {getGenderLabel(student.gender)}</span>
                            ) : (
                              <span>{getGenderLabel(student.gender)}</span>
                            )}
                          </div>
                        </div>
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
                              className="flex items-center gap-1.5 text-slate-500 dark:text-[#A6B4C8] hover:text-[#3977B8] dark:hover:text-[#38BDF8] truncate max-w-[180px]"
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

      {/* Student Detail Modal / Drawer */}
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

            <div className="space-y-3.5 text-xs border-t border-b border-slate-100 dark:border-[#2A3A50] py-4">
              <div className="flex justify-between py-1 border-b border-slate-50 dark:border-[#2A3A50]/40">
                <span className="text-slate-500 dark:text-[#A6B4C8]">Trạng thái hồ sơ:</span>
                <span>{renderStatusBadge(detailStudent.status)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50 dark:border-[#2A3A50]/40">
                <span className="text-slate-500 dark:text-[#A6B4C8]">Nhóm đối tượng:</span>
                <span>{renderTargetTypeBadge(detailStudent.targetType)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50 dark:border-[#2A3A50]/40">
                <span className="text-slate-500 dark:text-[#A6B4C8]">Giới tính & Ngày sinh:</span>
                <span className="font-semibold text-slate-800 dark:text-[#E8EEF7]">
                  {getGenderLabel(detailStudent.gender)} • {detailStudent.dateOfBirth || 'Chưa cập nhật'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50 dark:border-[#2A3A50]/40">
                <span className="text-slate-500 dark:text-[#A6B4C8]">Số điện thoại:</span>
                <span className="font-semibold text-slate-800 dark:text-[#E8EEF7]">{detailStudent.phone || 'Chưa cập nhật'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50 dark:border-[#2A3A50]/40">
                <span className="text-slate-500 dark:text-[#A6B4C8]">Hòm thư Email:</span>
                <span className="font-semibold text-slate-800 dark:text-[#E8EEF7]">{detailStudent.email || 'Chưa cập nhật'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50 dark:border-[#2A3A50]/40">
                <span className="text-slate-500 dark:text-[#A6B4C8]">Địa chỉ liên hệ:</span>
                <span className="font-semibold text-slate-800 dark:text-[#E8EEF7] text-right max-w-[260px]">{detailStudent.address || 'Chưa cập nhật'}</span>
              </div>
              {detailStudent.internalNotes && (
                <div className="py-1">
                  <span className="text-slate-500 dark:text-[#A6B4C8] block mb-1">Ghi chú nội bộ:</span>
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#1C293D] text-slate-700 dark:text-[#E8EEF7]">
                    {detailStudent.internalNotes}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end">
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
                    Mã học viên *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingStudent}
                    value={formData.studentCode}
                    onChange={(e) => setFormData({ ...formData, studentCode: e.target.value })}
                    placeholder="VD: HV20240001"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-sm text-[#142B4A] dark:text-[#E8EEF7] disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] mb-1">
                    Họ và tên *
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
                    Nhóm đối tượng *
                  </label>
                  <select
                    value={formData.targetType}
                    onChange={(e) => setFormData({ ...formData, targetType: e.target.value as 'KID' | 'ADULT' })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-sm text-[#142B4A] dark:text-[#E8EEF7]"
                  >
                    <option value="ADULT">Người lớn (ADULT)</option>
                    <option value="KID">Trẻ em (KID)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] mb-1">
                    Giới tính *
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'MALE' | 'FEMALE' | 'OTHER' })}
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
                    placeholder="VD: 0988123456"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-sm text-[#142B4A] dark:text-[#E8EEF7]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] mb-1">
                    Hòm thư Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="VD: hocvien@chacademy.edu.vn"
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
                  placeholder="VD: 123 Phố Huế, Hai Bà Trưng, Hà Nội"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-sm text-[#142B4A] dark:text-[#E8EEF7]"
                />
              </div>

              {/* Guardian Selection for KID */}
              {formData.targetType === 'KID' && (
                <div className="p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/20 space-y-3">
                  <div className="text-xs font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
                    <Shield size={15} />
                    <span>Liên kết Người giám hộ (Phụ huynh)</span>
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
    </div>
  )
}
