import React, { useEffect, useState, useCallback } from 'react'
import { coursesApi } from '../../../api/courses'
import type { Course, CourseCategory, CreateCoursePayload } from '../../../types/course'
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Edit2,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  X,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Clock,
  Users
} from 'lucide-react'

export const CourseListPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([])
  const [categories, setCategories] = useState<CourseCategory[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Filters & Pagination
  const [keyword, setKeyword] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedAudience, setSelectedAudience] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [page, setPage] = useState<number>(0)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [totalElements, setTotalElements] = useState<number>(0)
  const pageSize = 10

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [isStatusModalOpen, setIsStatusModalOpen] = useState<boolean>(false)
  const [statusCourse, setStatusCourse] = useState<Course | null>(null)
  const [newStatus, setNewStatus] = useState<string>('ACTIVE')
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false)

  // Form state
  const [formData, setFormData] = useState<CreateCoursePayload>({
    categoryId: 0,
    code: '',
    name: '',
    description: '',
    targetAudience: 'ALL',
    level: 'BEGINNER',
    durationHours: 36,
    defaultTuitionFee: 3000000,
    learningOutcomes: '',
    maxStudents: 20,
    status: 'ACTIVE',
    isPublic: true
  })

  // Fetch categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await coursesApi.getCategories()
        if (res.success && res.data) {
          setCategories(res.data)
          if (res.data.length > 0 && formData.categoryId === 0) {
            setFormData(prev => ({ ...prev, categoryId: res.data[0].id }))
          }
        }
      } catch {
        // Silently fail or keep empty
      }
    }
    loadCategories()
  }, [])

  // Fetch courses
  const loadCourses = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await coursesApi.searchCourses({
        keyword: keyword.trim() || undefined,
        categoryId: selectedCategory ? Number(selectedCategory) : undefined,
        targetAudience: selectedAudience || undefined,
        status: selectedStatus || undefined,
        page,
        size: pageSize,
        sortBy: 'createdAt',
        direction: 'desc'
      })

      if (res.success && res.data) {
        setCourses(res.data.content || [])
        setTotalPages(res.data.totalPages || 1)
        setTotalElements(res.data.totalElements || 0)
      } else {
        setError(res.message || 'Không thể tải danh sách khóa học')
      }
    } catch {
      setError('Lỗi kết nối tới máy chủ khi tải danh sách khóa học')
    } finally {
      setLoading(false)
    }
  }, [keyword, selectedCategory, selectedAudience, selectedStatus, page])

  useEffect(() => {
    loadCourses()
  }, [loadCourses])

  const openCreateModal = () => {
    setEditingCourse(null)
    setFormData({
      categoryId: categories.length > 0 ? categories[0].id : 0,
      code: '',
      name: '',
      description: '',
      targetAudience: 'ALL',
      level: 'BEGINNER',
      durationHours: 36,
      defaultTuitionFee: 3000000,
      learningOutcomes: '',
      maxStudents: 20,
      status: 'ACTIVE',
      isPublic: true
    })
    setIsModalOpen(true)
  }

  const openEditModal = (course: Course) => {
    setEditingCourse(course)
    setFormData({
      categoryId: course.categoryId,
      code: course.code,
      name: course.name,
      description: course.description || '',
      targetAudience: course.targetAudience,
      level: course.level,
      durationHours: course.durationHours,
      defaultTuitionFee: course.defaultTuitionFee,
      learningOutcomes: course.learningOutcomes || '',
      maxStudents: course.maxStudents,
      status: course.status,
      isPublic: course.isPublic
    })
    setIsModalOpen(true)
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.code.trim() || !formData.name.trim() || !formData.categoryId) {
      alert('Vui lòng điền đầy đủ các thông tin bắt buộc (*)')
      return
    }

    setFormSubmitting(true)
    try {
      if (editingCourse) {
        const res = await coursesApi.updateCourse(editingCourse.id, formData)
        if (res.success) {
          setSuccessMsg(`Cập nhật khóa học "${res.data?.name}" thành công!`)
          setIsModalOpen(false)
          loadCourses()
        } else {
          alert(res.message || 'Cập nhật thất bại')
        }
      } else {
        const res = await coursesApi.createCourse(formData)
        if (res.success) {
          setSuccessMsg(`Tạo khóa học "${res.data?.name}" thành công!`)
          setIsModalOpen(false)
          loadCourses()
        } else {
          alert(res.message || 'Tạo mới thất bại')
        }
      }
    } catch {
      alert('Có lỗi xảy ra khi lưu khóa học')
    } finally {
      setFormSubmitting(false)
      setTimeout(() => setSuccessMsg(null), 4000)
    }
  }

  const openStatusModal = (course: Course) => {
    setStatusCourse(course)
    setNewStatus(course.status)
    setIsStatusModalOpen(true)
  }

  const handleStatusSubmit = async () => {
    if (!statusCourse) return
    try {
      const res = await coursesApi.updateCourseStatus(statusCourse.id, newStatus)
      if (res.success) {
        setSuccessMsg(`Đã cập nhật trạng thái khóa học "${statusCourse.code}" sang ${newStatus}`)
        setIsStatusModalOpen(false)
        loadCourses()
      } else {
        alert(res.message || 'Cập nhật trạng thái thất bại')
      }
    } catch {
      alert('Lỗi cập nhật trạng thái')
    } finally {
      setTimeout(() => setSuccessMsg(null), 4000)
    }
  }

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">Đang mở</span>
      case 'DRAFT':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Bản nháp</span>
      case 'SUSPENDED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">Tạm dừng</span>
      case 'ARCHIVED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">Lưu trữ</span>
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">{status}</span>
    }
  }

  const getAudienceLabel = (aud: string) => {
    switch (aud) {
      case 'KIDS': return 'Trẻ em (4-12)'
      case 'TEENS': return 'Thiếu niên'
      case 'ADULTS': return 'Người lớn'
      case 'ALL': return 'Mọi lứa tuổi'
      default: return aud
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-[#142B4A] flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-[#142B4A]" />
            Quản lý Khóa học & Đào tạo
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Thiết lập danh mục, lộ trình, học phí niêm yết và thời lượng cho các chương trình học.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#142B4A] hover:bg-[#1a3860] text-white rounded-lg text-sm font-medium shadow-sm transition-colors duration-200"
        >
          <Plus className="w-4 h-4" />
          Thêm khóa học mới
        </button>
      </div>

      {/* Success Notification Alert */}
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

      {/* Error Alert */}
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

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo mã hoặc tên khóa học..."
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value)
              setPage(0)
            }}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#142B4A] focus:border-transparent"
          />
        </div>

        {/* Category Filter */}
        <div className="w-full md:w-56">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value)
              setPage(0)
            }}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#142B4A]"
          >
            <option value="">Tất cả danh mục</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Target Audience Filter */}
        <div className="w-full md:w-44">
          <select
            value={selectedAudience}
            onChange={(e) => {
              setSelectedAudience(e.target.value)
              setPage(0)
            }}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#142B4A]"
          >
            <option value="">Mọi lứa tuổi</option>
            <option value="KIDS">Trẻ em</option>
            <option value="TEENS">Thiếu niên</option>
            <option value="ADULTS">Người lớn</option>
            <option value="ALL">Chung</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-40">
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value)
              setPage(0)
            }}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#142B4A]"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang mở</option>
            <option value="DRAFT">Bản nháp</option>
            <option value="SUSPENDED">Tạm dừng</option>
            <option value="ARCHIVED">Lưu trữ</option>
          </select>
        </div>
      </div>

      {/* Course Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4">Mã</th>
                <th className="py-3 px-4">Tên khóa học & Danh mục</th>
                <th className="py-3 px-4">Đối tượng</th>
                <th className="py-3 px-4">Thời lượng</th>
                <th className="py-3 px-4 text-right">Học phí niêm yết</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-center">Hiển thị</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-4"><div className="h-4 bg-slate-200 rounded w-16"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-slate-200 rounded w-48 mb-2"></div><div className="h-3 bg-slate-100 rounded w-24"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-slate-200 rounded w-20"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-slate-200 rounded w-16"></div></td>
                    <td className="py-4 px-4 text-right"><div className="h-4 bg-slate-200 rounded w-24 ml-auto"></div></td>
                    <td className="py-4 px-4 text-center"><div className="h-5 bg-slate-200 rounded-full w-20 mx-auto"></div></td>
                    <td className="py-4 px-4 text-center"><div className="h-4 bg-slate-200 rounded w-6 mx-auto"></div></td>
                    <td className="py-4 px-4 text-right"><div className="h-4 bg-slate-200 rounded w-12 ml-auto"></div></td>
                  </tr>
                ))
              ) : courses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <BookOpen className="w-12 h-12 text-slate-300 mb-2" />
                      <p className="font-medium text-slate-700">Không tìm thấy khóa học nào phù hợp</p>
                      <p className="text-xs text-slate-400 mt-1">Thử thay đổi từ khóa hoặc bộ lọc tìm kiếm.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                courses.map((course) => (
                  <tr key={course.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-[#142B4A]">
                      {course.code}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900">{course.name}</div>
                      <div className="text-xs text-slate-500">{course.categoryName}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div>{getAudienceLabel(course.targetAudience)}</div>
                      <div className="text-xs text-slate-400 font-mono">{course.level}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {course.durationHours}h
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-slate-900">
                      {formatVND(course.defaultTuitionFee)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {getStatusBadge(course.status)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {course.isPublic ? (
                        <Eye className="w-4 h-4 text-emerald-600 mx-auto" title="Công khai trên website" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-slate-400 mx-auto" title="Ẩn khỏi website" />
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(course)}
                          className="p-1.5 text-slate-600 hover:text-[#142B4A] hover:bg-slate-100 rounded transition-colors"
                          title="Chỉnh sửa khóa học"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openStatusModal(course)}
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
            Hiển thị <span className="font-medium text-slate-900">{courses.length}</span> trên tổng số{' '}
            <span className="font-medium text-slate-900">{totalElements}</span> khóa học
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

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h2 className="text-lg font-bold text-[#142B4A]">
                {editingCourse ? 'Chỉnh sửa Khóa học' : 'Thêm Khóa học Mới'}
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
                {/* Code */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mã khóa học <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: ENG-KID-01"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono uppercase focus:ring-2 focus:ring-[#142B4A] focus:outline-none"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Danh mục đào tạo <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#142B4A] focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên khóa học <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Tiếng Anh Khởi Động Cho Trẻ Em"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#142B4A] focus:outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mô tả tổng quan
                </label>
                <textarea
                  rows={2}
                  placeholder="Tóm tắt nội dung và phương pháp giảng dạy..."
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#142B4A] focus:outline-none"
                />
              </div>

              {/* Target Audience & Level */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Đối tượng học viên <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#142B4A] focus:outline-none"
                  >
                    <option value="ALL">Mọi lứa tuổi (ALL)</option>
                    <option value="KIDS">Trẻ em 4-12 tuổi (KIDS)</option>
                    <option value="TEENS">Thiếu niên (TEENS)</option>
                    <option value="ADULTS">Người lớn / Đi làm (ADULTS)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Trình độ đầu vào <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#142B4A] focus:outline-none"
                  >
                    <option value="BEGINNER">Căn bản / Mới bắt đầu</option>
                    <option value="INTERMEDIATE">Trung cấp</option>
                    <option value="ADVANCED">Nâng cao</option>
                    <option value="ALL_LEVELS">Mọi cấp độ</option>
                  </select>
                </div>
              </div>

              {/* Duration & Tuition & Max Students */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Thời lượng (giờ) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={formData.durationHours}
                    onChange={(e) => setFormData({ ...formData, durationHours: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#142B4A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Học phí niêm yết (VND) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={50000}
                    required
                    value={formData.defaultTuitionFee}
                    onChange={(e) => setFormData({ ...formData, defaultTuitionFee: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#142B4A] focus:outline-none font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sĩ số tối đa <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={formData.maxStudents}
                    onChange={(e) => setFormData({ ...formData, maxStudents: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#142B4A] focus:outline-none"
                  />
                </div>
              </div>

              {/* Learning Outcomes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mục tiêu đầu ra / Chuẩn kiến thức kỹ năng
                </label>
                <textarea
                  rows={3}
                  placeholder="- Điểm 1&#10;- Điểm 2..."
                  value={formData.learningOutcomes || ''}
                  onChange={(e) => setFormData({ ...formData, learningOutcomes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#142B4A] focus:outline-none font-mono text-xs"
                />
              </div>

              {/* Status and Public Checkbox */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={formData.isPublic}
                    onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                    className="w-4 h-4 text-[#142B4A] rounded border-slate-300 focus:ring-[#142B4A]"
                  />
                  <label htmlFor="isPublic" className="text-xs font-medium text-slate-700 cursor-pointer">
                    Công khai hiển thị trên trang chủ & danh mục website
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-700">Trạng thái:</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="px-2 py-1 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-[#142B4A]"
                  >
                    <option value="ACTIVE">Hoạt động</option>
                    <option value="DRAFT">Bản nháp</option>
                    <option value="SUSPENDED">Tạm dừng</option>
                    <option value="ARCHIVED">Lưu trữ</option>
                  </select>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 text-sm font-medium transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 bg-[#142B4A] hover:bg-[#1a3860] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {formSubmitting ? 'Đang lưu...' : editingCourse ? 'Lưu thay đổi' : 'Tạo khóa học'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Status Modal */}
      {isStatusModalOpen && statusCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-200 p-6 space-y-4">
            <h3 className="text-base font-bold text-[#142B4A]">
              Cập nhật Trạng thái Khóa học
            </h3>
            <p className="text-xs text-slate-600">
              Khóa học: <span className="font-semibold text-slate-900">{statusCourse.name}</span> ({statusCourse.code})
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
                <option value="ACTIVE">Hoạt động (ACTIVE)</option>
                <option value="DRAFT">Bản nháp (DRAFT)</option>
                <option value="SUSPENDED">Tạm dừng (SUSPENDED)</option>
                <option value="ARCHIVED">Lưu trữ (ARCHIVED)</option>
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
