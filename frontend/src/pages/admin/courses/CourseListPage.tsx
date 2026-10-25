import React, { useEffect, useState, useCallback } from 'react'
import { coursesApi } from '../../../api/courses'
import type { Course, CourseCategory, CreateCoursePayload } from '../../../types/course'
import { Badge } from '../../../components/ui/Badge'
import { StatCard } from '../../../components/ui/StatCard'
import { TableSkeleton } from '../../../components/ui/LoadingSkeleton'
import { EmptyState } from '../../../components/ui/EmptyState'
import {
  BookOpen,
  Plus,
  Search,
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
  Layers,
  GraduationCap
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
      setError('Lỗi kết nối máy chủ khi tải danh sách khóa học')
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

  const openEditModal = (c: Course) => {
    setEditingCourse(c)
    setFormData({
      categoryId: c.categoryId,
      code: c.code,
      name: c.name,
      description: c.description || '',
      targetAudience: c.targetAudience,
      level: c.level,
      durationHours: c.durationHours,
      defaultTuitionFee: c.defaultTuitionFee,
      learningOutcomes: c.learningOutcomes || '',
      maxStudents: c.maxStudents,
      status: c.status,
      isPublic: c.isPublic
    })
    setIsModalOpen(true)
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.code.trim() || !formData.name.trim() || formData.categoryId === 0) {
      alert('Vui lòng điền đầy đủ các trường bắt buộc (*)')
      return
    }

    setFormSubmitting(true)
    try {
      const payload: CreateCoursePayload = {
        ...formData,
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim()
      }

      if (editingCourse) {
        const res = await coursesApi.updateCourse(editingCourse.id, payload)
        if (res.success) {
          setSuccessMsg(`Cập nhật khóa học "${res.data?.name}" thành công!`)
          setIsModalOpen(false)
          loadCourses()
        } else {
          alert(res.message || 'Cập nhật thất bại')
        }
      } else {
        const res = await coursesApi.createCourse(payload)
        if (res.success) {
          setSuccessMsg(`Tạo mới khóa học "${res.data?.name}" (${res.data?.code}) thành công!`)
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

  const openStatusModal = (c: Course) => {
    setStatusCourse(c)
    setNewStatus(c.status)
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

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="success" dot>Đang mở</Badge>
      case 'DRAFT':
        return <Badge variant="warning" dot>Bản nháp</Badge>
      case 'SUSPENDED':
        return <Badge variant="danger" dot>Tạm dừng</Badge>
      case 'ARCHIVED':
        return <Badge variant="neutral" dot>Lưu trữ</Badge>
      default:
        return <Badge variant="neutral">{status}</Badge>
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

  // Summary computed from data
  const countActive = courses.filter(c => c.status === 'ACTIVE').length
  const countPublic = courses.filter(c => c.isPublic).length

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#2A3A50]">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-[#A6B4C8] uppercase tracking-wider mb-1">
            <span>Đào tạo & Học vụ</span>
            <span>/</span>
            <span className="text-[#142B4A] dark:text-[#38BDF8]">Chương trình học</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#142B4A] dark:text-[#E8EEF7] flex items-center gap-2.5">
            <BookOpen className="w-7 h-7 text-[#142B4A] dark:text-[#38BDF8]" />
            Quản lý Khóa học & Đào tạo
          </h1>
          <p className="text-sm text-slate-600 dark:text-[#A6B4C8] mt-1">
            Thiết lập danh mục, lộ trình, học phí niêm yết và thời lượng cho các chương trình học.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#142B4A] dark:bg-[#38BDF8] hover:bg-[#1D4168] dark:hover:bg-[#0284C7] text-white dark:text-[#0B1220] rounded-xl text-sm font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#3977B8]"
        >
          <Plus size={16} />
          <span>Thêm khóa học mới</span>
        </button>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Tổng khóa học"
          value={totalElements}
          icon={BookOpen}
          subtitle="Chương trình đào tạo"
          loading={loading}
        />
        <StatCard
          title="Đang tuyển sinh"
          value={countActive}
          icon={GraduationCap}
          subtitle="Trạng thái ACTIVE"
          badge={<Badge variant="success">Đang mở</Badge>}
          loading={loading}
        />
        <StatCard
          title="Danh mục đào tạo"
          value={categories.length}
          icon={Layers}
          subtitle="Nhóm môn học"
        />
        <StatCard
          title="Công khai Website"
          value={countPublic}
          icon={Eye}
          subtitle="Hiển thị cho học viên"
          badge={<Badge variant="info">Online</Badge>}
          loading={loading}
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
            onClick={() => loadCourses()}
            className="px-3 py-1 bg-white dark:bg-[#1C293D] border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-lg text-xs font-semibold hover:bg-rose-50"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-[#151F31] p-4 rounded-2xl border border-slate-200/80 dark:border-[#2A3A50] shadow-xs flex flex-col md:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo mã hoặc tên khóa học..."
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value)
              setPage(0)
            }}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-slate-50/50 dark:bg-[#1C293D] text-sm text-[#142B4A] dark:text-[#E8EEF7] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#142B4A] dark:focus:ring-[#38BDF8] transition-colors"
          />
        </div>

        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value)
            setPage(0)
          }}
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-sm text-[#142B4A] dark:text-[#E8EEF7] focus:outline-none focus:ring-2 focus:ring-[#142B4A] dark:focus:ring-[#38BDF8]"
        >
          <option value="">Tất cả danh mục</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Target Audience Filter */}
        <select
          value={selectedAudience}
          onChange={(e) => {
            setSelectedAudience(e.target.value)
            setPage(0)
          }}
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-sm text-[#142B4A] dark:text-[#E8EEF7] focus:outline-none focus:ring-2 focus:ring-[#142B4A] dark:focus:ring-[#38BDF8]"
        >
          <option value="">Mọi lứa tuổi</option>
          <option value="KIDS">Trẻ em (4-12)</option>
          <option value="TEENS">Thiếu niên</option>
          <option value="ADULTS">Người lớn</option>
          <option value="ALL">Chung</option>
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
          <option value="ACTIVE">Đang mở</option>
          <option value="DRAFT">Bản nháp</option>
          <option value="SUSPENDED">Tạm dừng</option>
          <option value="ARCHIVED">Lưu trữ</option>
        </select>
      </div>

      {/* Main Content: Table or Skeleton or Empty */}
      {loading ? (
        <TableSkeleton rows={5} columns={8} />
      ) : courses.length === 0 ? (
        <EmptyState
          title="Không tìm thấy khóa học nào phù hợp"
          description="Thử thay đổi từ khóa hoặc bộ lọc tìm kiếm danh mục."
          icon={BookOpen}
          action={{ label: 'Thêm khóa học mới', onClick: openCreateModal, icon: Plus }}
        />
      ) : (
        <div className="bg-white dark:bg-[#151F31] rounded-2xl border border-slate-200/80 dark:border-[#2A3A50] shadow-xs overflow-hidden">
          <div className="overflow-x-auto rounded-2xl">
            <table className="w-full text-left border-collapse text-table min-w-[960px]">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-[#1C293D] border-b border-slate-200 dark:border-[#2A3A50] text-xs font-semibold text-slate-500 dark:text-[#A6B4C8] uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-[110px] whitespace-nowrap">Mã</th>
                  <th className="py-3.5 px-4 min-w-[240px]">Tên khóa học & Danh mục</th>
                  <th className="py-3.5 px-4 w-[150px] whitespace-nowrap">Đối tượng</th>
                  <th className="py-3.5 px-4 w-[110px] whitespace-nowrap">Thời lượng</th>
                  <th className="py-3.5 px-4 w-[140px] text-right whitespace-nowrap">Học phí niêm yết</th>
                  <th className="py-3.5 px-4 w-[125px] text-center whitespace-nowrap">Trạng thái</th>
                  <th className="py-3.5 px-4 w-[90px] text-center whitespace-nowrap">Hiển thị</th>
                  <th className="py-3.5 px-4 w-[110px] text-right whitespace-nowrap">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#2A3A50]/60">
                {courses.map((course) => (
                  <tr key={course.id} className="hover:bg-slate-50/60 dark:hover:bg-[#1C293D]/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#142B4A] dark:text-[#38BDF8]">
                      {course.code}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#142B4A] dark:text-[#E8EEF7]">{course.name}</div>
                      <div className="text-xs text-slate-500 dark:text-[#A6B4C8] mt-0.5">{course.categoryName}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-xs text-slate-700 dark:text-[#E8EEF7]">{getAudienceLabel(course.targetAudience)}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">{course.level}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-[#A6B4C8]">
                        <Clock size={13} className="text-slate-400" />
                        {course.durationHours}h
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-[#142B4A] dark:text-[#E8EEF7]">
                      {formatVND(course.defaultTuitionFee)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {renderStatusBadge(course.status)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {course.isPublic ? (
                        <span title="Công khai trên website" className="inline-block text-emerald-600 dark:text-emerald-400">
                          <Eye size={16} className="mx-auto" />
                        </span>
                      ) : (
                        <span title="Ẩn khỏi website" className="inline-block text-slate-400">
                          <EyeOff size={16} className="mx-auto" />
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(course)}
                          className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-[#142B4A] dark:hover:text-[#38BDF8] hover:bg-slate-100 dark:hover:bg-[#1C293D] transition-colors"
                          title="Chỉnh sửa khóa học"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => openStatusModal(course)}
                          className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-[#1C293D] transition-colors"
                          title="Đổi trạng thái"
                        >
                          <RefreshCw size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Toolbar */}
          <div className="px-4 py-3.5 bg-slate-50/50 dark:bg-[#1C293D]/50 border-t border-slate-200 dark:border-[#2A3A50] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 dark:text-[#A6B4C8]">
            <div>
              Trang <span className="font-bold text-[#142B4A] dark:text-[#E8EEF7]">{page + 1}</span> / {totalPages} (Tổng số {totalElements} khóa học)
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
              {editingCourse ? 'Cập nhật Khóa học' : 'Thêm Khóa học Mới'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-[#A6B4C8] mb-5">
              Thiết lập thông tin khóa học, học phí và lộ trình đào tạo.
            </p>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] mb-1">
                    Danh mục khóa học *
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-sm text-[#142B4A] dark:text-[#E8EEF7]"
                    required
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] mb-1">
                    Mã khóa học *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingCourse}
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="VD: ENG-KID-01"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-sm text-[#142B4A] dark:text-[#E8EEF7] disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] mb-1">
                    Tên khóa học *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="VD: Tiếng Anh Khởi Động Cho Trẻ Em"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-sm text-[#142B4A] dark:text-[#E8EEF7]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] mb-1">
                    Đối tượng
                  </label>
                  <select
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value as 'KIDS' | 'TEENS' | 'ADULTS' | 'ALL' })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-sm text-[#142B4A] dark:text-[#E8EEF7]"
                  >
                    <option value="ALL">Mọi lứa tuổi</option>
                    <option value="KIDS">Trẻ em (4-12)</option>
                    <option value="TEENS">Thiếu niên</option>
                    <option value="ADULTS">Người lớn</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] mb-1">
                    Cấp độ (Level)
                  </label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-sm text-[#142B4A] dark:text-[#E8EEF7]"
                  >
                    <option value="BEGINNER">Cơ bản (Beginner)</option>
                    <option value="INTERMEDIATE">Trung cấp (Intermediate)</option>
                    <option value="ADVANCED">Nâng cao (Advanced)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] mb-1">
                    Thời lượng (Giờ)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.durationHours}
                    onChange={(e) => setFormData({ ...formData, durationHours: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-sm text-[#142B4A] dark:text-[#E8EEF7]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] mb-1">
                    Học phí niêm yết (VNĐ)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={100000}
                    value={formData.defaultTuitionFee}
                    onChange={(e) => setFormData({ ...formData, defaultTuitionFee: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-sm text-[#142B4A] dark:text-[#E8EEF7]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] mb-1">
                  Mô tả khóa học
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Tổng quan về nội dung và lộ trình chương trình học..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-sm text-[#142B4A] dark:text-[#E8EEF7]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] mb-1">
                  Chuẩn đầu ra (Learning Outcomes)
                </label>
                <textarea
                  rows={2}
                  value={formData.learningOutcomes}
                  onChange={(e) => setFormData({ ...formData, learningOutcomes: e.target.value })}
                  placeholder="Kỹ năng, chứng chỉ hoặc trình độ học viên đạt được sau khóa học..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-sm text-[#142B4A] dark:text-[#E8EEF7]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={formData.isPublic}
                  onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                  className="w-4 h-4 rounded text-[#142B4A] dark:text-[#38BDF8]"
                />
                <label htmlFor="isPublic" className="text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] cursor-pointer">
                  Công khai khóa học này trên website để học viên xem thông tin và đăng ký
                </label>
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
                  {formSubmitting ? 'Đang lưu...' : editingCourse ? 'Lưu cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status Modal */}
      {isStatusModalOpen && statusCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#151F31] rounded-2xl border border-slate-200 dark:border-[#2A3A50] max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsStatusModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1C293D]"
            >
              <X size={18} />
            </button>

            <h3 className="text-base font-bold text-[#142B4A] dark:text-[#E8EEF7] mb-1">
              Đổi trạng thái khóa học
            </h3>
            <p className="text-xs text-slate-500 dark:text-[#A6B4C8] mb-4">
              Cập nhật trạng thái tuyển sinh cho khóa <span className="font-bold text-[#142B4A] dark:text-[#E8EEF7]">{statusCourse.name}</span> ({statusCourse.code}).
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
                <option value="ACTIVE">Đang mở tuyển sinh (ACTIVE)</option>
                <option value="DRAFT">Bản nháp (DRAFT)</option>
                <option value="SUSPENDED">Tạm dừng (SUSPENDED)</option>
                <option value="ARCHIVED">Lưu trữ (ARCHIVED)</option>
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
