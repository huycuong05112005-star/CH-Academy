import React, { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { classesApi } from '../../../api/classes'
import { coursesApi } from '../../../api/courses'
import { studentsApi } from '../../../api/students'
import type { ClassItem, Teacher, Enrollment, CreateClassRequest, ScheduleSlotRequest, CreateEnrollmentRequest } from '../../../types/class'
import type { Course } from '../../../types/course'
import type { Student } from '../../../types/student'
import {
  Calendar,
  Plus,
  Search,
  AlertCircle,
  CheckCircle2,
  X,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Users,
  GraduationCap,
  Clock,
  DoorOpen,
  UserCheck,
  Tag,
  Download,
  FileQuestion
} from 'lucide-react'
import { exportToCsv } from '../../../utils/exportCsv'
import { SessionQuestionExamModal } from '../../../components/assessment/SessionQuestionExamModal'
import { selectClassChat } from '../../../utils/chatSync'

export const ClassListPage: React.FC = () => {
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [students, setStudents] = useState<Student[]>([])

  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const [searchParams, setSearchParams] = useSearchParams()

  const parseStatusParam = (param: string | null) => {
    if (!param) return ''
    const upper = param.toUpperCase()
    if (upper === 'ACTIVE') return 'IN_PROGRESS'
    return upper
  }

  // Filters & Pagination
  const [keyword, setKeyword] = useState<string>(() => searchParams.get('keyword') || '')
  const [selectedStatus, setSelectedStatus] = useState<string>(() => parseStatusParam(searchParams.get('status')))
  const [selectedCourseId, setSelectedCourseId] = useState<string>(() => searchParams.get('courseId') || '')
  const [page, setPage] = useState<number>(0)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [totalElements, setTotalElements] = useState<number>(0)
  const pageSize = 10

  // Sync state if searchParams change in URL
  useEffect(() => {
    const statusParam = parseStatusParam(searchParams.get('status'))
    const kwParam = searchParams.get('keyword') || ''
    const cidParam = searchParams.get('courseId') || ''

    if (statusParam !== selectedStatus) setSelectedStatus(statusParam)
    if (kwParam !== keyword) setKeyword(kwParam)
    if (cidParam !== selectedCourseId) setSelectedCourseId(cidParam)
  }, [searchParams])

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false)
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState<boolean>(false)
  const [activeClassForEnroll, setActiveClassForEnroll] = useState<ClassItem | null>(null)
  const [sessionExamClass, setSessionExamClass] = useState<ClassItem | null>(null)
  const [enrolledStudents, setEnrolledStudents] = useState<Enrollment[]>([])
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false)

  // Create Class Form
  const [createForm, setCreateForm] = useState<CreateClassRequest>({
    courseId: 0,
    primaryTeacherId: undefined,
    code: '',
    name: '',
    maxCapacity: 15,
    room: '',
    startDate: '',
    endDate: '',
    status: 'PLANNING',
    schedules: []
  })

  // Schedule slot builder
  const [newSlot, setNewSlot] = useState<ScheduleSlotRequest>({
    dayOfWeek: 1, // Thứ 2
    startTime: '18:00',
    endTime: '19:30',
    room: ''
  })

  // Enroll Student Form
  const [enrollForm, setEnrollForm] = useState<CreateEnrollmentRequest>({
    classId: 0,
    studentId: 0,
    enrollmentDate: new Date().toISOString().split('T')[0],
    appliedTuitionFee: 0,
    discountAmount: 0,
    notes: ''
  })

  // Load dropdown references
  useEffect(() => {
    const loadReferences = async () => {
      try {
        const [courseRes, teacherRes, studentRes] = await Promise.all([
          coursesApi.searchCourses({ page: 0, size: 100 }),
          classesApi.getActiveTeachers(),
          studentsApi.searchStudents({ page: 0, size: 100 })
        ])

        if (courseRes.success && courseRes.data) {
          setCourses(courseRes.data.content || [])
        }
        if (teacherRes.success && teacherRes.data) {
          setTeachers(teacherRes.data)
        }
        if (studentRes.success && studentRes.data) {
          setStudents(studentRes.data.content || [])
        }
      } catch {
        // Silently ignore
      }
    }
    loadReferences()
  }, [])

  // Load Classes
  const loadClasses = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await classesApi.searchClasses({
        keyword: keyword.trim() || undefined,
        status: selectedStatus || undefined,
        courseId: selectedCourseId ? Number(selectedCourseId) : undefined,
        page,
        size: pageSize
      })

      if (res.success && res.data) {
        setClasses(res.data.content || [])
        setTotalPages(res.data.totalPages || 1)
        setTotalElements(res.data.totalElements || 0)
      } else {
        setError(res.message || 'Không thể tải danh sách lớp học')
      }
    } catch (err: unknown) {
      const e = err as { message?: string }
      setError(e.message || 'Lỗi kết nối máy chủ')
    } finally {
      setLoading(false)
    }
  }, [keyword, selectedStatus, selectedCourseId, page])

  useEffect(() => {
    loadClasses()
  }, [loadClasses])

  // Auto-open class detail if classId is in URL query
  useEffect(() => {
    const classIdParam = searchParams.get('classId')
    if (classIdParam && !isNaN(Number(classIdParam))) {
      const targetId = Number(classIdParam)
      const found = classes.find((c) => c.id === targetId)
      if (found) {
        setDetailClass(found)
      } else {
        classesApi.getClassById(targetId).then((res) => {
          if (res.success && res.data) {
            setDetailClass(res.data)
          }
        }).catch(() => {})
      }
    }
  }, [classes, searchParams])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(0)
    loadClasses()
  }

  // Add slot to schedules list
  const handleAddSlot = () => {
    if (newSlot.startTime >= newSlot.endTime) {
      setError('Giờ bắt đầu phải trước giờ kết thúc')
      return
    }
    const currentSchedules = createForm.schedules || []
    setCreateForm({
      ...createForm,
      schedules: [...currentSchedules, { ...newSlot, room: newSlot.room || createForm.room }]
    })
    setNewSlot({ dayOfWeek: 1, startTime: '18:00', endTime: '19:30', room: '' })
    setError(null)
  }

  const handleRemoveSlot = (index: number) => {
    const updated = (createForm.schedules || []).filter((_, i) => i !== index)
    setCreateForm({ ...createForm, schedules: updated })
  }

  // Create Class submit
  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createForm.courseId) {
      setError('Vui lòng chọn khóa học cho lớp')
      return
    }
    setFormSubmitting(true)
    setError(null)
    try {
      const res = await classesApi.createClass(createForm)
      if (res.success) {
        setSuccessMsg(`Tạo lớp học ${res.data?.name} thành công!`)
        setIsCreateModalOpen(false)
        setCreateForm({
          courseId: 0,
          primaryTeacherId: undefined,
          code: '',
          name: '',
          maxCapacity: 15,
          room: '',
          startDate: '',
          endDate: '',
          status: 'PLANNING',
          schedules: []
        })
        loadClasses()
      } else {
        setError(res.message || 'Tạo lớp học thất bại')
      }
    } catch (err: unknown) {
      const e = err as { message?: string }
      setError(e.message || 'Lỗi khi tạo lớp học')
    } finally {
      setFormSubmitting(false)
    }
  }

  // Open Enroll Modal
  const handleOpenEnrollModal = async (classItem: ClassItem) => {
    setActiveClassForEnroll(classItem)
    const selectedCourse = courses.find((c) => c.id === classItem.courseId)
    setEnrollForm({
      classId: classItem.id,
      studentId: 0,
      enrollmentDate: new Date().toISOString().split('T')[0],
      appliedTuitionFee: selectedCourse?.defaultTuitionFee || 0,
      discountAmount: 0,
      notes: ''
    })
    try {
      const res = await classesApi.getEnrollments(classItem.id)
      if (res.success && res.data) {
        setEnrolledStudents(res.data)
      }
    } catch {
      setEnrolledStudents([])
    }
    setIsEnrollModalOpen(true)
  }

  // Enroll submit
  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!enrollForm.studentId) {
      setError('Vui lòng chọn học viên cần ghi danh')
      return
    }
    setFormSubmitting(true)
    setError(null)
    try {
      const res = await classesApi.enrollStudent(enrollForm)
      if (res.success) {
        setSuccessMsg(`Ghi danh học viên ${res.data?.studentFullName} thành công!`)
        // reload enrollments
        if (activeClassForEnroll) {
          const updatedList = await classesApi.getEnrollments(activeClassForEnroll.id)
          if (updatedList.success && updatedList.data) {
            setEnrolledStudents(updatedList.data)
          }
        }
        loadClasses()
      } else {
        setError(res.message || 'Ghi danh thất bại')
      }
    } catch (err: unknown) {
      const e = err as { message?: string }
      setError(e.message || 'Lỗi ghi danh')
    } finally {
      setFormSubmitting(false)
    }
  }

  const getDayName = (dow: number) => {
    switch (dow) {
      case 1: return 'Thứ 2'
      case 2: return 'Thứ 3'
      case 3: return 'Thứ 4'
      case 4: return 'Thứ 5'
      case 5: return 'Thứ 6'
      case 6: return 'Thứ 7'
      case 7: return 'Chủ Nhật'
      default: return `Thứ ${dow}`
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PLANNING':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">Dự kiến</span>
      case 'OPEN_FOR_ENROLLMENT':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">Đang tuyển sinh</span>
      case 'IN_PROGRESS':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">Đang học</span>
      case 'COMPLETED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">Đã kết thúc</span>
      case 'CANCELLED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">Đã hủy</span>
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">{status}</span>
    }
  }

  // View Mode: LIST or TIMETABLE
  const [viewMode, setViewMode] = useState<'LIST' | 'TIMETABLE'>('LIST')
  const [detailClass, setDetailClass] = useState<ClassItem | null>(null)

  // Đồng bộ chọn lớp vào Widget Chat nhóm lớp
  useEffect(() => {
    if (detailClass?.id) {
      selectClassChat(detailClass.id, {
        className: detailClass.name,
        courseName: detailClass.courseName
      })
    }
  }, [detailClass])

  // Calculate real metrics from loaded data
  const countInProgress = classes.filter((c) => c.status === 'IN_PROGRESS').length
  const countEnrollment = classes.filter((c) => c.status === 'OPEN_FOR_ENROLLMENT' || c.status === 'PLANNING').length
  const totalEnrolledStudents = classes.reduce((sum, c) => sum + (c.enrolledCount || 0), 0)

  // Timetable helper: group schedules by day of week (1: T2, ..., 7: CN)
  const daysOfWeek = [
    { day: 1, name: 'Thứ Hai', short: 'T2' },
    { day: 2, name: 'Thứ Ba', short: 'T3' },
    { day: 3, name: 'Thứ Tư', short: 'T4' },
    { day: 4, name: 'Thứ Năm', short: 'T5' },
    { day: 5, name: 'Thứ Sáu', short: 'T6' },
    { day: 6, name: 'Thứ Bảy', short: 'T7' },
    { day: 7, name: 'Chủ Nhật', short: 'CN' }
  ]

  const getSchedulesForDay = (day: number) => {
    const list: { classItem: ClassItem; schedule: any }[] = []
    classes.forEach((c) => {
      if (c.schedules) {
        c.schedules.forEach((s) => {
          if (s.dayOfWeek === day) {
            list.push({ classItem: c, schedule: s })
          }
        })
      }
    })
    return list.sort((a, b) => a.schedule.startTime.localeCompare(b.schedule.startTime))
  }

  const handleExportClasses = () => {
    const headers = [
      'Mã lớp',
      'Tên lớp học',
      'Khóa học',
      'Giảng viên chính',
      'Phòng học',
      'Ngày khai giảng',
      'Ngày kết thúc',
      'Sĩ số tối đa',
      'Đã ghi danh',
      'Trạng thái'
    ]

    const statusMap: Record<string, string> = {
      PLANNING: 'Lên kế hoạch',
      OPEN_FOR_ENROLLMENT: 'Đang mở đăng ký',
      IN_PROGRESS: 'Đang giảng dạy',
      COMPLETED: 'Đã hoàn thành',
      CANCELLED: 'Đã hủy'
    }

    const rows = classes.map(c => [
      c.code,
      c.name,
      c.courseName || '',
      c.primaryTeacherName || 'Chưa phân công',
      c.room || '',
      c.startDate || '',
      c.endDate || '',
      c.maxCapacity,
      c.enrolledCount || 0,
      statusMap[c.status] || c.status
    ])

    exportToCsv('Danh_sach_lop_hoc', headers, rows)
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Page Header */}
      <div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1.5 font-medium">
          <span>Quản trị</span>
          <span>/</span>
          <span className="text-[#142B4A]">Lớp học</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#142B4A]">Lớp học & Lịch học</h1>
            <p className="text-sm text-gray-500 mt-1">
              Quản lý các đợt mở lớp, phân công giáo viên giảng dạy, xếp lịch học và quản lý ghi danh
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto">
            <button
              onClick={handleExportClasses}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 border border-emerald-300 dark:border-emerald-700/60 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 text-sm font-semibold rounded-lg transition-colors shadow-xs cursor-pointer whitespace-nowrap shrink-0"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>Xuất file Excel (CSV)</span>
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#142B4A] text-white text-sm font-semibold rounded-lg hover:bg-[#1a3860] transition-colors shadow-sm cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Tạo lớp học mới</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Tổng số lớp</div>
            <div className="text-xl font-bold text-gray-900">{totalElements}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Đang giảng dạy</div>
            <div className="text-xl font-bold text-gray-900">{countInProgress}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Tuyển sinh / Sắp mở</div>
            <div className="text-xl font-bold text-gray-900">{countEnrollment}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Tổng học viên đang học</div>
            <div className="text-xl font-bold text-gray-900">{totalEnrolledStudents}</div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between text-green-800 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-green-600 hover:text-green-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between text-red-800 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Toolbar & View Mode Switcher */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-gray-100">
          {/* Segmented View Switcher */}
          <div className="inline-flex p-1 bg-slate-100 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewMode('LIST')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${viewMode === 'LIST'
                  ? 'bg-white text-[#142B4A] shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Danh sách lớp ({totalElements})</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('TIMETABLE')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${viewMode === 'TIMETABLE'
                  ? 'bg-white text-[#142B4A] shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Thời khóa biểu tuần</span>
            </button>
          </div>

          <div className="text-xs text-gray-500 font-medium">
            Hiển thị <strong>{classes.length}</strong> trên <strong>{totalElements}</strong> lớp
          </div>
        </div>

        {/* Filter Form */}
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo mã lớp, tên lớp, phòng..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#142B4A]"
            />
          </div>

          <div>
            <select
              value={selectedCourseId}
              onChange={(e) => {
                setSelectedCourseId(e.target.value)
                setPage(0)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#142B4A]"
            >
              <option value="">Tất cả khóa học</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value)
                setPage(0)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#142B4A]"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="PLANNING">Dự kiến</option>
              <option value="OPEN_FOR_ENROLLMENT">Đang tuyển sinh</option>
              <option value="IN_PROGRESS">Đang học</option>
              <option value="COMPLETED">Đã kết thúc</option>
              <option value="CANCELLED">Đã hủy</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-[#142B4A] text-white text-sm font-semibold rounded-lg hover:bg-[#1a3860] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Search className="w-4 h-4" />
              Lọc
            </button>
            <button
              type="button"
              onClick={() => {
                setKeyword('')
                setSelectedStatus('')
                setSelectedCourseId('')
                setPage(0)
                setSearchParams({})
              }}
              title="Đặt lại bộ lọc"
              className="p-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Active Filter Badges Banner */}
        {(keyword.trim() !== '' || selectedStatus !== '' || selectedCourseId !== '') && (
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-100 text-xs text-sky-800 dark:text-sky-300">
            <span className="font-semibold text-gray-500">Đang lọc theo:</span>
            {selectedStatus && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-100 dark:bg-sky-900/60 font-medium">
                Trạng thái: <strong>{selectedStatus === 'IN_PROGRESS' ? 'Đang học' : selectedStatus === 'OPEN_FOR_ENROLLMENT' ? 'Đang tuyển sinh' : selectedStatus}</strong>
                <button type="button" onClick={() => { setSelectedStatus(''); setPage(0); }} className="hover:text-sky-950 cursor-pointer"><X size={12} /></button>
              </span>
            )}
            {selectedCourseId && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-100 dark:bg-sky-900/60 font-medium">
                Khóa học: <strong>{courses.find(c => c.id === Number(selectedCourseId))?.name || selectedCourseId}</strong>
                <button type="button" onClick={() => { setSelectedCourseId(''); setPage(0); }} className="hover:text-sky-950 cursor-pointer"><X size={12} /></button>
              </span>
            )}
            {keyword && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-100 dark:bg-sky-900/60 font-medium">
                Từ khóa: <strong>"{keyword}"</strong>
                <button type="button" onClick={() => { setKeyword(''); setPage(0); }} className="hover:text-sky-950 cursor-pointer"><X size={12} /></button>
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                setKeyword('')
                setSelectedStatus('')
                setSelectedCourseId('')
                setPage(0)
                setSearchParams({})
              }}
              className="ml-auto text-xs font-semibold text-sky-700 dark:text-sky-300 hover:underline cursor-pointer"
            >
              Xóa tất cả bộ lọc
            </button>
          </div>
        )}
      </div>

      {/* View 1: WEEKLY TIMETABLE MATRIX */}
      {viewMode === 'TIMETABLE' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-base font-bold text-[#142B4A] flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#315E91]" />
                Lịch Học Các Lớp Trong Tuần
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Xem ma trận phân bổ ca học, phòng học và giáo viên giảng dạy từ Thứ Hai đến Chủ Nhật
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
            {daysOfWeek.map((d) => {
              const daySlots = getSchedulesForDay(d.day)
              return (
                <div key={d.day} className="bg-slate-50/70 rounded-xl border border-slate-200 overflow-hidden flex flex-col min-h-[280px]">
                  <div className="p-2.5 bg-slate-100 border-b border-slate-200 text-center">
                    <span className="font-bold text-xs text-[#142B4A] block">{d.name}</span>
                    <span className="text-[10px] text-gray-500 font-medium">({daySlots.length} ca học)</span>
                  </div>

                  <div className="p-2 flex-1 space-y-2 overflow-y-auto">
                    {daySlots.length === 0 ? (
                      <div className="text-center py-8 text-gray-400 text-xs italic">
                        Không có ca học
                      </div>
                    ) : (
                      daySlots.map(({ classItem, schedule }, sIdx) => (
                        <div
                          key={sIdx}
                          onClick={() => setDetailClass(classItem)}
                          className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-xs hover:border-[#142B4A] hover:shadow-sm transition-all cursor-pointer text-left"
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-[11px] font-bold text-[#142B4A] flex items-center gap-1">
                              <Clock className="w-3 h-3 text-[#315E91]" />
                              {schedule.startTime} - {schedule.endTime}
                            </span>
                            <span className="text-[10px] font-mono font-semibold text-gray-500">
                              {classItem.code}
                            </span>
                          </div>

                          <div className="font-semibold text-xs text-gray-900 line-clamp-1 mb-1">
                            {classItem.name}
                          </div>

                          <div className="text-[11px] text-gray-600 flex items-center gap-1 mb-0.5">
                            <GraduationCap className="w-3 h-3 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{classItem.primaryTeacherName || 'Chưa phân công'}</span>
                          </div>

                          {schedule.room && (
                            <div className="text-[10px] text-gray-500 flex items-center gap-1">
                              <DoorOpen className="w-3 h-3 text-gray-400 flex-shrink-0" />
                              <span className="truncate">{schedule.room}</span>
                            </div>
                          )}

                          <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px]">
                            <span className="text-gray-500">Sĩ số:</span>
                            <span className="font-semibold text-gray-800">
                              {classItem.enrolledCount}/{classItem.maxCapacity}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* View 2: CLASSES DATA TABLE */}
      {viewMode === 'LIST' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-500">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#142B4A]" />
              Đang tải danh sách lớp học...
            </div>
          ) : classes.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-gray-700 mb-1">Chưa có lớp học nào</h3>
              <p className="text-sm text-gray-500 mb-4">
                Không tìm thấy lớp học phù hợp với bộ lọc hiện tại. Bạn có thể tạo lớp mới ngay bây giờ.
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#142B4A] text-white text-sm font-medium rounded-lg hover:bg-[#1a3860] transition-colors"
              >
                <Plus className="w-4 h-4" />
                Tạo lớp học mới
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl">
              <table className="w-full text-left border-collapse text-sm min-w-[1050px]">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-[#1C293D] border-b border-slate-200 dark:border-[#2A3A50] text-xs font-semibold text-slate-500 dark:text-[#A6B4C8] uppercase tracking-wider">
                    <th className="py-3.5 px-4 w-[110px] whitespace-nowrap">Mã lớp</th>
                    <th className="py-3.5 px-4 min-w-[240px]">Tên lớp học & Khóa học</th>
                    <th className="py-3.5 px-4 min-w-[170px]">Giáo viên & Phòng</th>
                    <th className="py-3.5 px-4 min-w-[220px]">Lịch học định kỳ</th>
                    <th className="py-3.5 px-4 w-[150px] whitespace-nowrap">Sĩ số & Tiến độ</th>
                    <th className="py-3.5 px-4 w-[130px] text-center whitespace-nowrap">Trạng thái</th>
                    <th className="py-3.5 px-4 w-[140px] text-right whitespace-nowrap">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#2A3A50]/60">
                  {classes.map((cls) => {
                    const percent = Math.min(100, Math.round((cls.enrolledCount / cls.maxCapacity) * 100))
                    return (
                      <tr key={cls.id} className="hover:bg-slate-50/60 dark:hover:bg-[#1C293D]/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-semibold text-xs text-[#142B4A] dark:text-[#38BDF8] whitespace-nowrap">
                          <span className="px-2 py-1 bg-slate-100 dark:bg-[#1C293D] rounded border border-slate-200 dark:border-[#2A3A50]">
                            {cls.code}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-gray-900 dark:text-[#E8EEF7] hover:text-[#142B4A] dark:hover:text-[#38BDF8] cursor-pointer" onClick={() => setDetailClass(cls)}>
                            {cls.name}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-[#A6B4C8] flex items-center gap-1 mt-0.5">
                            <Tag className="w-3 h-3 text-[#315E91] dark:text-[#38BDF8]" />
                            <span className="font-medium text-slate-700 dark:text-[#E8EEF7]">{cls.courseName || cls.courseCode}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 text-gray-800 dark:text-[#E8EEF7] text-xs font-semibold">
                            <GraduationCap className="w-3.5 h-3.5 text-[#315E91] dark:text-[#38BDF8]" />
                            <span>{cls.primaryTeacherName || 'Chưa phân công'}</span>
                          </div>
                          {cls.room && (
                            <div className="flex items-center gap-1.5 text-slate-500 dark:text-[#A6B4C8] text-xs mt-0.5">
                              <DoorOpen className="w-3.5 h-3.5 text-slate-400" />
                              <span>{cls.room}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {!cls.schedules || cls.schedules.length === 0 ? (
                            <span className="text-xs text-slate-400 italic">Chưa xếp lịch</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {cls.schedules.map((s) => (
                                <span
                                  key={s.id}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-slate-100 dark:bg-[#1C293D] text-slate-700 dark:text-[#E8EEF7] border border-slate-200 dark:border-[#2A3A50] font-medium"
                                >
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  {getDayName(s.dayOfWeek)} ({s.startTime}-{s.endTime})
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] mb-1">
                            <span>{cls.enrolledCount}/{cls.maxCapacity} học viên</span>
                            <span className="text-slate-500 dark:text-[#A6B4C8]">{percent}%</span>
                          </div>
                          <div className="w-28 bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${percent >= 100
                                  ? 'bg-rose-500'
                                  : percent >= 75
                                    ? 'bg-amber-500'
                                    : 'bg-[#142B4A] dark:bg-[#38BDF8]'
                                }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {getStatusBadge(cls.status)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => setSessionExamClass(cls)}
                              title="Quản lý câu hỏi & đề thi theo buổi học"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                            >
                              <FileQuestion className="w-3.5 h-3.5" />
                              <span>Buổi học & Đề thi</span>
                            </button>
                            <button
                              onClick={() => setDetailClass(cls)}
                              title="Xem chi tiết lớp học"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                            >
                              <span>Chi tiết</span>
                            </button>
                            <button
                              onClick={() => handleOpenEnrollModal(cls)}
                              title="Quản lý học viên & ghi danh"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#142B4A] text-white hover:bg-[#1a3860] rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                            >
                              <Users className="w-3.5 h-3.5" />
                              <span>Ghi danh ({cls.enrolledCount})</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Footer */}
          {!loading && classes.length > 0 && (
            <div className="p-4 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-gray-500">
              <div>
                Hiển thị <strong>{classes.length}</strong> trên tổng số <strong>{totalElements}</strong> lớp học
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="p-1.5 border border-gray-300 rounded disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span>
                  Trang {page + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="p-1.5 border border-gray-300 rounded disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: CLASS DETAIL DRAWER */}
      {detailClass && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-[#142B4A] text-white flex items-center justify-center font-bold">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#142B4A]">{detailClass.name}</h2>
                  <p className="text-xs text-gray-500 font-mono">Mã lớp: {detailClass.code}</p>
                </div>
              </div>
              <button
                onClick={() => setDetailClass(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              {/* Status and Key Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-gray-500 block mb-0.5">Khóa học</span>
                  <span className="font-bold text-gray-900">{detailClass.courseName || detailClass.courseCode}</span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-0.5">Giáo viên</span>
                  <span className="font-bold text-gray-900">{detailClass.primaryTeacherName || 'Chưa phân công'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-0.5">Phòng học</span>
                  <span className="font-bold text-gray-900">{detailClass.room || 'Chưa xếp phòng'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-0.5">Trạng thái</span>
                  <div>{getStatusBadge(detailClass.status)}</div>
                </div>
              </div>

              {/* Date and Capacity */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 border border-gray-200 rounded-lg">
                  <span className="text-gray-500 block mb-1">Ngày bắt đầu</span>
                  <span className="font-semibold text-gray-800">{detailClass.startDate || 'Chưa thiết lập'}</span>
                </div>
                <div className="p-3 border border-gray-200 rounded-lg">
                  <span className="text-gray-500 block mb-1">Ngày kết thúc</span>
                  <span className="font-semibold text-gray-800">{detailClass.endDate || 'Chưa kết thúc'}</span>
                </div>
                <div className="p-3 border border-gray-200 rounded-lg">
                  <span className="text-gray-500 block mb-1">Sĩ số lớp</span>
                  <span className="font-bold text-[#142B4A]">
                    {detailClass.enrolledCount} / {detailClass.maxCapacity} học viên
                  </span>
                </div>
              </div>

              {/* Recurring Schedules */}
              <div>
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#315E91]" />
                  Lịch học hàng tuần
                </h3>
                {!detailClass.schedules || detailClass.schedules.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">Chưa xếp lịch học cụ thể.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {detailClass.schedules.map((s) => (
                      <div key={s.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs flex items-center justify-between">
                        <span className="font-bold text-[#142B4A]">{getDayName(s.dayOfWeek)}</span>
                        <span className="text-gray-700 font-semibold">{s.startTime} - {s.endTime}</span>
                        {s.room && <span className="text-gray-500 text-[11px]">({s.room})</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const target = detailClass
                    setDetailClass(null)
                    setSessionExamClass(target)
                  }}
                  className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <FileQuestion className="w-4 h-4" />
                  Buổi học & Đề thi
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const target = detailClass
                    setDetailClass(null)
                    handleOpenEnrollModal(target)
                  }}
                  className="px-4 py-2 bg-[#142B4A] text-white text-xs font-semibold rounded-lg hover:bg-[#1a3860] flex items-center gap-1.5 cursor-pointer"
                >
                  <Users className="w-4 h-4" />
                  Quản lý ghi danh ({detailClass.enrolledCount})
                </button>
              </div>
              <button
                type="button"
                onClick={() => setDetailClass(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-xs text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE CLASS */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <h2 className="text-lg font-bold text-[#142B4A]">Tạo lớp học & Xếp lịch lặp lại</h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Khóa học áp dụng <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={createForm.courseId}
                    onChange={(e) => setCreateForm({ ...createForm, courseId: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#142B4A]"
                  >
                    <option value="">-- Chọn khóa học --</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Giáo viên phụ trách chính</label>
                  <select
                    value={createForm.primaryTeacherId || ''}
                    onChange={(e) => setCreateForm({ ...createForm, primaryTeacherId: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#142B4A]"
                  >
                    <option value="">-- Chưa phân công --</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.fullName} ({t.teacherCode})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Mã lớp học <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: CLS-ENG-01"
                    value={createForm.code}
                    onChange={(e) => setCreateForm({ ...createForm, code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#142B4A]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Tên lớp học <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Lớp Tiếng Anh Giao Tiếp K01"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#142B4A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Sĩ số tối đa</label>
                  <input
                    type="number"
                    min="1"
                    value={createForm.maxCapacity}
                    onChange={(e) => setCreateForm({ ...createForm, maxCapacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#142B4A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Phòng học mặc định</label>
                  <input
                    type="text"
                    placeholder="VD: Phòng 201"
                    value={createForm.room || ''}
                    onChange={(e) => setCreateForm({ ...createForm, room: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#142B4A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Trạng thái lớp</label>
                  <select
                    value={createForm.status}
                    onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#142B4A]"
                  >
                    <option value="PLANNING">Dự kiến</option>
                    <option value="OPEN_FOR_ENROLLMENT">Đang tuyển sinh</option>
                    <option value="IN_PROGRESS">Đang học</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Ngày bắt đầu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={createForm.startDate}
                    onChange={(e) => setCreateForm({ ...createForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#142B4A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Ngày kết thúc dự kiến</label>
                  <input
                    type="date"
                    value={createForm.endDate || ''}
                    onChange={(e) => setCreateForm({ ...createForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#142B4A]"
                  />
                </div>
              </div>

              {/* Recurring Schedules Section */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-slate-600" />
                    Khung giờ học trong tuần (Schedules)
                  </h4>
                </div>

                {/* Added slots list */}
                {createForm.schedules && createForm.schedules.length > 0 && (
                  <div className="space-y-1.5">
                    {createForm.schedules.map((slot, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-white rounded border border-gray-200 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#142B4A]">{getDayName(slot.dayOfWeek)}</span>
                          <span className="text-gray-500">•</span>
                          <span>{slot.startTime} - {slot.endTime}</span>
                          {slot.room && <span className="text-gray-400">({slot.room})</span>}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveSlot(index)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add slot controls */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200">
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-0.5">Thứ</label>
                    <select
                      value={newSlot.dayOfWeek}
                      onChange={(e) => setNewSlot({ ...newSlot, dayOfWeek: Number(e.target.value) })}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs bg-white"
                    >
                      <option value="1">Thứ 2</option>
                      <option value="2">Thứ 3</option>
                      <option value="3">Thứ 4</option>
                      <option value="4">Thứ 5</option>
                      <option value="5">Thứ 6</option>
                      <option value="6">Thứ 7</option>
                      <option value="7">Chủ Nhật</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-0.5">Từ</label>
                    <input
                      type="time"
                      value={newSlot.startTime}
                      onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-0.5">Đến</label>
                    <input
                      type="time"
                      value={newSlot.endTime}
                      onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs bg-white"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleAddSlot}
                      className="w-full px-2 py-1.5 bg-[#142B4A] text-white rounded text-xs font-semibold hover:bg-[#1a3860]"
                    >
                      + Thêm lịch
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 bg-[#142B4A] text-white text-sm font-medium rounded-lg hover:bg-[#1a3860] transition-colors disabled:opacity-50"
                >
                  {formSubmitting ? 'Đang tạo...' : 'Tạo lớp học'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ENROLLMENTS & ENROLL FORM */}
      {isEnrollModalOpen && activeClassForEnroll && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div>
                <h2 className="text-base font-bold text-[#142B4A]">Quản lý Ghi danh học viên</h2>
                <p className="text-xs text-gray-500">
                  Lớp: <strong className="text-gray-700">{activeClassForEnroll.name}</strong> ({activeClassForEnroll.code}) • Sĩ số: {enrolledStudents.length}/{activeClassForEnroll.maxCapacity}
                </p>
              </div>
              <button onClick={() => setIsEnrollModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* Quick Enroll Form */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h3 className="text-xs font-bold text-[#142B4A] uppercase mb-3 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-green-700" />
                  Ghi danh học viên mới vào lớp này
                </h3>

                <form onSubmit={handleEnrollStudent} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        Chọn học viên <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={enrollForm.studentId}
                        onChange={(e) => setEnrollForm({ ...enrollForm, studentId: Number(e.target.value) })}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm bg-white"
                      >
                        <option value="0">-- Chọn học viên từ danh sách --</option>
                        {students.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.fullName} ({s.studentCode}) - {s.phone || 'Chưa có SĐT'}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">Ngày ghi danh</label>
                      <input
                        type="date"
                        value={enrollForm.enrollmentDate}
                        onChange={(e) => setEnrollForm({ ...enrollForm, enrollmentDate: e.target.value })}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">Học phí niêm yết (VNĐ)</label>
                      <input
                        type="number"
                        value={enrollForm.appliedTuitionFee || 0}
                        onChange={(e) => setEnrollForm({ ...enrollForm, appliedTuitionFee: Number(e.target.value) })}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">Giảm giá / Ưu đãi (VNĐ)</label>
                      <input
                        type="number"
                        value={enrollForm.discountAmount || 0}
                        onChange={(e) => setEnrollForm({ ...enrollForm, discountAmount: Number(e.target.value) })}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">Thực thu dự kiến</label>
                      <div className="px-3 py-1.5 bg-gray-100 rounded text-sm font-semibold text-green-700">
                        {Math.max(0, (enrollForm.appliedTuitionFee || 0) - (enrollForm.discountAmount || 0)).toLocaleString('vi-VN')} đ
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <input
                      type="text"
                      placeholder="Ghi chú ghi danh (ví dụ: áp dụng voucher khai trương)..."
                      value={enrollForm.notes || ''}
                      onChange={(e) => setEnrollForm({ ...enrollForm, notes: e.target.value })}
                      className="flex-1 mr-3 px-3 py-1.5 border border-gray-300 rounded text-sm bg-white"
                    />
                    <button
                      type="submit"
                      disabled={formSubmitting || enrolledStudents.length >= activeClassForEnroll.maxCapacity}
                      className="px-4 py-1.5 bg-green-700 text-white rounded text-xs font-semibold hover:bg-green-800 disabled:opacity-50"
                    >
                      {formSubmitting ? 'Đang ghi danh...' : 'Xác nhận ghi danh'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Enrolled Students Table */}
              <div>
                <h3 className="text-xs font-bold text-gray-700 uppercase mb-2">
                  Danh sách học viên trong lớp ({enrolledStudents.length} học viên)
                </h3>

                {enrolledStudents.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">Chưa có học viên nào được ghi danh vào lớp học này.</p>
                ) : (
                  <div className="border border-slate-200 dark:border-[#2A3A50] rounded-xl overflow-hidden overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse min-w-[500px]">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-[#1C293D] border-b border-slate-200 dark:border-[#2A3A50] text-slate-500 dark:text-[#A6B4C8] font-semibold">
                          <th className="py-2.5 px-3 w-[90px] whitespace-nowrap">Mã HV</th>
                          <th className="py-2.5 px-3 min-w-[140px]">Họ và tên</th>
                          <th className="py-2.5 px-3 w-[110px] whitespace-nowrap">Ngày ghi danh</th>
                          <th className="py-2.5 px-3 w-[120px] text-right whitespace-nowrap">Học phí thực</th>
                          <th className="py-2.5 px-3 w-[100px] text-center whitespace-nowrap">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-[#2A3A50]/60">
                        {enrolledStudents.map((enr) => (
                          <tr key={enr.id} className="hover:bg-slate-50/60 dark:hover:bg-[#1C293D]/40">
                            <td className="py-2.5 px-3 font-mono font-medium text-[#142B4A] dark:text-[#38BDF8]">
                              {enr.studentCode}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-[#E8EEF7]">
                              {enr.studentFullName}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 dark:text-[#A6B4C8] whitespace-nowrap font-mono">
                              {enr.enrollmentDate}
                            </td>
                            <td className="py-2.5 px-3 text-right font-medium text-slate-800 dark:text-[#E8EEF7] whitespace-nowrap">
                              {enr.finalFee ? Number(enr.finalFee).toLocaleString('vi-VN') + ' đ' : '0 đ'}
                            </td>
                            <td className="py-2.5 px-3 text-center whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                {enr.status === 'ENROLLED' ? 'Đang học' : enr.status}
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

            <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button
                onClick={() => setIsEnrollModalOpen(false)}
                className="px-4 py-1.5 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-100"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SESSION QUESTION & EXAM WORKSPACE */}
      {sessionExamClass && (
        <SessionQuestionExamModal
          classItem={sessionExamClass}
          onClose={() => setSessionExamClass(null)}
        />
      )}
    </div>
  )
}
