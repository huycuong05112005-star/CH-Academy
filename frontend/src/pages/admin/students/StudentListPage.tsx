import React, { useEffect, useState, useCallback } from 'react'
import { studentsApi } from '../../../api/students'
import type { Student, Guardian, CreateStudentPayload } from '../../../types/student'
import {
  Users,
  Plus,
  Search,
  Edit2,
  AlertCircle,
  CheckCircle2,
  X,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Shield,
  Phone,
  Mail,
  UserCheck
} from 'lucide-react'

export const StudentListPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([])
  const [guardians, setGuardians] = useState<Guardian[]>([])
  const [loading, setLoading] = useState<boolean>(true)
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

  // Load guardians list
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
  }, [])

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
        } else {
          alert(res.message || 'Cập nhật thất bại')
        }
      } else {
        const res = await studentsApi.createStudent(payload)
        if (res.success) {
          setSuccessMsg(`Tạo mới học viên "${res.data?.fullName}" (${res.data?.studentCode}) thành công!`)
          setIsModalOpen(false)
          loadStudents()
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
      } else {
        alert(res.message || 'Cập nhật trạng thái thất bại')
      }
    } catch {
      alert('Lỗi cập nhật trạng thái')
    } finally {
      setTimeout(() => setSuccessMsg(null), 4000)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">Đang học</span>
      case 'INACTIVE':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Tạm nghỉ</span>
      case 'GRADUATED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Tốt nghiệp</span>
      case 'DROPPED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">Thôi học</span>
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">{status}</span>
    }
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

  // Summary counts
  const countKid = students.filter(s => s.targetType === 'KID').length
  const countAdult = students.filter(s => s.targetType === 'ADULT').length
  const countActive = students.filter(s => s.status === 'ACTIVE').length

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-[#142B4A] flex items-center gap-2">
            <Users className="w-7 h-7 text-[#142B4A]" />
            Quản lý Học viên & Người giám hộ
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Theo dõi hồ sơ người học, phân loại lứa tuổi và liên kết thông tin phụ huynh/người giám hộ.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#142B4A] hover:bg-[#1a3860] text-white rounded-lg text-sm font-medium shadow-sm transition-colors duration-200"
        >
          <Plus className="w-4 h-4" />
          Thêm học viên mới
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Tổng học viên</div>
          <div className="text-2xl font-bold text-[#142B4A] mt-1">{totalElements}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs text-emerald-600 font-medium">Đang theo học</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{countActive}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs text-purple-600 font-medium">Học viên nhí (KID)</div>
          <div className="text-2xl font-bold text-purple-700 mt-1">{countKid}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs text-blue-600 font-medium">Người lớn (ADULT)</div>
          <div className="text-2xl font-bold text-blue-700 mt-1">{countAdult}</div>
        </div>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-lg flex items-center justify-between text-sm shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-lg flex items-center justify-between text-sm shadow-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-600 hover:text-rose-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filters Toolbar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo mã học viên, họ tên hoặc số điện thoại..."
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value)
              setPage(0)
            }}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#142B4A]"
          />
        </div>

        <div className="w-full md:w-48">
          <select
            value={selectedTargetType}
            onChange={(e) => {
              setSelectedTargetType(e.target.value)
              setPage(0)
            }}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#142B4A]"
          >
            <option value="">Tất cả phân loại</option>
            <option value="KID">Trẻ em (KID)</option>
            <option value="ADULT">Người lớn (ADULT)</option>
          </select>
        </div>

        <div className="w-full md:w-44">
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value)
              setPage(0)
            }}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#142B4A]"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang học</option>
            <option value="INACTIVE">Tạm nghỉ</option>
            <option value="GRADUATED">Đã tốt nghiệp</option>
            <option value="DROPPED">Thôi học</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4">Mã HV</th>
                <th className="py-3 px-4">Họ và tên</th>
                <th className="py-3 px-4">Phân loại</th>
                <th className="py-3 px-4">Ngày sinh & Giới tính</th>
                <th className="py-3 px-4">Liên hệ</th>
                <th className="py-3 px-4">Người giám hộ</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-4"><div className="h-4 bg-slate-200 rounded w-16"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-slate-200 rounded w-32"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-slate-200 rounded w-16"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-slate-200 rounded w-24"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-slate-200 rounded w-28"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-slate-200 rounded w-32"></div></td>
                    <td className="py-4 px-4 text-center"><div className="h-4 bg-slate-200 rounded-full w-16 mx-auto"></div></td>
                    <td className="py-4 px-4 text-right"><div className="h-4 bg-slate-200 rounded w-12 ml-auto"></div></td>
                  </tr>
                ))
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <Users className="w-12 h-12 text-slate-300 mb-2" />
                      <p className="font-medium text-slate-700">Chưa có học viên nào phù hợp</p>
                      <p className="text-xs text-slate-400 mt-1">Thử thay đổi từ khóa hoặc bộ lọc tìm kiếm.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                students.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-[#142B4A]">
                      {s.studentCode}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900">{s.fullName}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      {s.targetType === 'KID' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                          <Shield className="w-3 h-3" />
                          Trẻ em
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                          Người lớn
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div>{s.dateOfBirth || '—'}</div>
                      <div className="text-xs text-slate-400">{getGenderLabel(s.gender)}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {s.phone && (
                        <div className="flex items-center gap-1 text-xs">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {s.phone}
                        </div>
                      )}
                      {s.email && (
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <Mail className="w-3 h-3" />
                          {s.email}
                        </div>
                      )}
                      {!s.phone && !s.email && <span className="text-xs text-slate-400">Qua người giám hộ</span>}
                    </td>
                    <td className="py-3.5 px-4">
                      {s.guardians && s.guardians.length > 0 ? (
                        <div>
                          <div className="font-medium text-xs text-slate-900">
                            {s.guardians[0].fullName}{' '}
                            <span className="text-slate-400 font-normal">
                              ({getRelationshipLabel(s.guardians[0].relationshipType)})
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 font-mono">{s.guardians[0].phone}</div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Chưa liên kết</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {getStatusBadge(s.status)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => setDetailStudent(s)}
                          className="p-1.5 text-slate-600 hover:text-[#142B4A] hover:bg-slate-100 rounded transition-colors"
                          title="Xem chi tiết hồ sơ"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(s)}
                          className="p-1.5 text-slate-600 hover:text-[#142B4A] hover:bg-slate-100 rounded transition-colors"
                          title="Chỉnh sửa hồ sơ"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openStatusModal(s)}
                          className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-slate-100 rounded transition-colors"
                          title="Đổi trạng thái"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-600">
          <div>
            Hiển thị <span className="font-medium text-slate-900">{students.length}</span> trên tổng số{' '}
            <span className="font-medium text-slate-900">{totalElements}</span> học viên
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(prev => Math.max(0, prev - 1))}
              disabled={page === 0 || loading}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Trước
            </button>
            <span className="text-xs text-slate-500">
              Trang {page + 1} / {totalPages || 1}
            </span>
            <button
              onClick={() => setPage(prev => Math.min(totalPages - 1, prev + 1))}
              disabled={page >= totalPages - 1 || loading}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none flex items-center gap-1"
            >
              Sau
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Create / Edit Student Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h2 className="text-lg font-bold text-[#142B4A]">
                {editingStudent ? 'Chỉnh sửa Hồ sơ Học viên' : 'Thêm Hồ sơ Học viên Mới'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mã học viên <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: HV20240001"
                    value={formData.studentCode}
                    onChange={(e) => setFormData({ ...formData, studentCode: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono uppercase focus:ring-2 focus:ring-[#142B4A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Họ và tên học viên <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Nguyễn Văn An"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#142B4A] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phân loại đối tượng <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.targetType}
                    onChange={(e) => setFormData({ ...formData, targetType: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#142B4A]"
                  >
                    <option value="ADULT">Người lớn (ADULT)</option>
                    <option value="KID">Trẻ em (KID)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ngày sinh
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth || ''}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#142B4A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Giới tính <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#142B4A]"
                  >
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                    <option value="OTHER">Khác</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    placeholder="0912345678"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#142B4A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="hocvien@email.com"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#142B4A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Địa chỉ cư trú
                </label>
                <input
                  type="text"
                  placeholder="Số nhà, đường, quận/huyện, tỉnh/thành..."
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#142B4A]"
                />
              </div>

              {/* Guardian Section for KID */}
              {formData.targetType === 'KID' && (
                <div className="p-4 bg-purple-50/60 rounded-xl border border-purple-200 space-y-3">
                  <div className="flex items-center gap-2 text-purple-900 font-semibold text-xs">
                    <Shield className="w-4 h-4 text-purple-700" />
                    Thông tin Phụ huynh / Người giám hộ (Bảo vệ trẻ em)
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Chọn người giám hộ đã có:
                      </label>
                      <select
                        value={selectedGuardianId}
                        onChange={(e) => setSelectedGuardianId(Number(e.target.value))}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-[#142B4A]"
                      >
                        <option value={0}>-- Chọn người giám hộ từ danh bạ --</option>
                        {guardians.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.fullName} - {g.phone} ({g.guardianCode})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Mối quan hệ:
                      </label>
                      <select
                        value={selectedRelation}
                        onChange={(e) => setSelectedRelation(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-[#142B4A]"
                      >
                        <option value="FATHER">Bố (FATHER)</option>
                        <option value="MOTHER">Mẹ (MOTHER)</option>
                        <option value="GUARDIAN">Người giám hộ</option>
                        <option value="OTHER">Khác</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="primaryContact"
                      checked={isPrimaryContact}
                      onChange={(e) => setIsPrimaryContact(e.target.checked)}
                      className="w-3.5 h-3.5 text-[#142B4A] rounded"
                    />
                    <label htmlFor="primaryContact" className="text-xs text-slate-700 cursor-pointer">
                      Đánh dấu là người liên hệ chính khi trung tâm thông báo lịch học & tài chính
                    </label>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ghi chú nội bộ
                </label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú về thói quen học tập, lưu ý sức khỏe hoặc yêu cầu phụ huynh..."
                  value={formData.internalNotes || ''}
                  onChange={(e) => setFormData({ ...formData, internalNotes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#142B4A]"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 text-sm font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 bg-[#142B4A] hover:bg-[#1a3860] text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {formSubmitting ? 'Đang lưu...' : editingStudent ? 'Lưu thay đổi' : 'Tạo hồ sơ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Drawer Modal */}
      {detailStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-lg font-bold text-[#142B4A]">Chi tiết Hồ sơ Học viên</h3>
              <button onClick={() => setDetailStudent(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Mã học viên:</span>
                <span className="font-mono font-bold text-[#142B4A]">{detailStudent.studentCode}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Họ và tên:</span>
                <span className="font-semibold text-slate-900">{detailStudent.fullName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Phân loại:</span>
                <span className="font-medium text-slate-800">{detailStudent.targetType === 'KID' ? 'Trẻ em' : 'Người lớn'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Ngày sinh:</span>
                <span className="text-slate-800">{detailStudent.dateOfBirth || 'Chưa cập nhật'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Số điện thoại:</span>
                <span className="font-mono text-slate-800">{detailStudent.phone || 'Chưa cập nhật'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Email:</span>
                <span className="text-slate-800">{detailStudent.email || 'Chưa cập nhật'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Trạng thái:</span>
                <span>{getStatusBadge(detailStudent.status)}</span>
              </div>

              {detailStudent.internalNotes && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700">
                  <span className="font-semibold block mb-1">Ghi chú nội bộ:</span>
                  {detailStudent.internalNotes}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setDetailStudent(null)}
                className="px-4 py-1.5 bg-[#142B4A] text-white rounded-lg text-xs font-medium hover:bg-[#1a3860]"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Status Modal */}
      {isStatusModalOpen && statusStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-200 p-6 space-y-4">
            <h3 className="text-base font-bold text-[#142B4A]">
              Cập nhật Trạng thái Học viên
            </h3>
            <p className="text-xs text-slate-600">
              Học viên: <span className="font-semibold text-slate-900">{statusStudent.fullName}</span> ({statusStudent.studentCode})
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Chọn trạng thái mới
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#142B4A] focus:outline-none"
              >
                <option value="ACTIVE">Đang học (ACTIVE)</option>
                <option value="INACTIVE">Tạm nghỉ (INACTIVE)</option>
                <option value="GRADUATED">Tốt nghiệp (GRADUATED)</option>
                <option value="DROPPED">Thôi học (DROPPED)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsStatusModalOpen(false)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 text-xs font-medium"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleStatusSubmit}
                className="px-4 py-1.5 bg-[#142B4A] hover:bg-[#1a3860] text-white rounded-lg text-xs font-medium"
              >
                Cập nhật
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
