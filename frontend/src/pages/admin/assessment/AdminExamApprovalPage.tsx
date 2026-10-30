import React, { useState, useEffect, useMemo } from 'react'
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  FileText,
  Search,
  Eye,
  Check,
  RotateCcw,
  History,
  Sparkles,
  RefreshCw,
  CheckSquare
} from 'lucide-react'
import { assessmentApi } from '../../../api/assessment'
import { coursesApi } from '../../../api/courses'
import { classesApi } from '../../../api/classes'
import type { ExamItem, ExamReviewItem, ApprovalStats } from '../../../types/assessment'
import type { Course } from '../../../types/course'
import type { ClassItem } from '../../../types/class'

export const AdminExamApprovalPage: React.FC = () => {
  // State
  const [stats, setStats] = useState<ApprovalStats>({
    pendingReviewCount: 0,
    approvedCount: 0,
    changesRequestedCount: 0,
    rejectedCount: 0,
    draftCount: 0,
    publishedCount: 0
  })
  const [exams, setExams] = useState<ExamItem[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [actionLoading, setActionLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('PENDING_REVIEW')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedCourseId, setSelectedCourseId] = useState<string>('')
  const [page, setPage] = useState<number>(0)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [totalElements, setTotalElements] = useState<number>(0)

  // Drawer / Modal for Review
  const [selectedExam, setSelectedExam] = useState<ExamItem | null>(null)
  const [reviewHistory, setReviewHistory] = useState<ExamReviewItem[]>([])
  const [historyLoading, setHistoryLoading] = useState<boolean>(false)
  const [activeReviewTab, setActiveReviewTab] = useState<'DETAILS' | 'QUESTIONS' | 'PREVIEW' | 'HISTORY'>('DETAILS')

  // Action Dialogs
  const [actionType, setActionType] = useState<'APPROVE' | 'REQUEST_CHANGES' | 'REJECT' | null>(null)
  const [actionComment, setActionComment] = useState<string>('')
  const [actionError, setActionError] = useState<string | null>(null)

  // Load Initial Data & Metadata
  useEffect(() => {
    loadMetadata()
  }, [])

  useEffect(() => {
    loadStats()
    loadExams()
  }, [statusFilter, selectedCourseId, page])

  const loadMetadata = async () => {
    try {
      const [coursesRes, classesRes] = await Promise.all([
        coursesApi.searchCourses({ size: 100 }).catch(() => ({ data: { content: [] } })),
        classesApi.searchClasses({ size: 100 }).catch(() => ({ data: { content: [] } }))
      ])
      if (coursesRes.data?.content) setCourses(coursesRes.data.content)
      if (classesRes.data?.content) setClasses(classesRes.data.content)
    } catch (err) {
      console.warn('Error loading metadata:', err)
    }
  }

  const loadStats = async () => {
    try {
      const res = await assessmentApi.getApprovalStats()
      if (res.data) {
        setStats(res.data)
      }
    } catch (err) {
      console.warn('Error loading stats:', err)
    }
  }

  const loadExams = async () => {
    setLoading(true)
    setError(null)
    try {
      const params: any = {
        page,
        size: 15,
        search: searchQuery.trim() || undefined
      }
      if (statusFilter && statusFilter !== 'ALL') {
        params.status = statusFilter
      }
      if (selectedCourseId) {
        params.courseId = Number(selectedCourseId)
      }

      const res = await assessmentApi.searchExams(params)
      if (res.data) {
        setExams(res.data.content || [])
        setTotalPages(res.data.totalPages || 1)
        setTotalElements(res.data.totalElements || 0)
      }
    } catch (err: any) {
      setError(err?.message || 'Không thể tải danh sách đề thi.')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenReview = async (exam: ExamItem) => {
    setSelectedExam(exam)
    setActiveReviewTab('DETAILS')
    setHistoryLoading(true)
    try {
      // Reload single exam to get full questions
      const fullRes = await assessmentApi.getExam(exam.id)
      if (fullRes.data) {
        setSelectedExam(fullRes.data)
      }
      const historyRes = await assessmentApi.getReviewHistory(exam.id)
      if (historyRes.data) {
        setReviewHistory(historyRes.data)
      }
    } catch (err) {
      console.warn('Error loading exam details or history:', err)
    } finally {
      setHistoryLoading(false)
    }
  }

  const handleCloseReview = () => {
    setSelectedExam(null)
    setActionType(null)
    setActionComment('')
    setActionError(null)
  }

  // Automated Exam Logic / Quality Check
  const qualityCheck = useMemo(() => {
    if (!selectedExam) return { passed: false, items: [] }

    const questions = selectedExam.questions || []
    const items: { label: string; passed: boolean; message: string; critical: boolean }[] = []

    // 1. Question count
    const hasQuestions = questions.length > 0
    items.push({
      label: 'Số lượng câu hỏi',
      passed: hasQuestions,
      message: hasQuestions ? `Có ${questions.length} câu hỏi hợp lệ trong đề thi` : 'Đề thi chưa có bất kỳ câu hỏi nào!',
      critical: true
    })

    // 2. Total points
    const sumPoints = questions.reduce((sum, q) => sum + (Number(q.points) || 0), 0)
    const pointsValid = sumPoints > 0
    items.push({
      label: 'Cấu hình thang điểm',
      passed: pointsValid,
      message: pointsValid ? `Tổng điểm các câu hỏi: ${sumPoints.toFixed(1)} điểm` : 'Tổng điểm bằng 0 hoặc chưa cấu hình điểm!',
      critical: true
    })

    // 3. Questions without options/answers
    let questionsWithoutKey = 0
    questions.forEach((q) => {
      if (q.type === 'SINGLE_CHOICE' || q.type === 'MULTIPLE_CHOICE' || q.type === 'TRUE_FALSE') {
        const hasCorrectOption = q.options?.some((o) => o.isCorrect === true)
        if (!hasCorrectOption) questionsWithoutKey++
      }
    })
    items.push({
      label: 'Kiểm tra đáp án trắc nghiệm',
      passed: questionsWithoutKey === 0,
      message: questionsWithoutKey === 0
        ? 'Tất cả câu trắc nghiệm đều đã có đáp án đúng'
        : `Có ${questionsWithoutKey} câu hỏi trắc nghiệm chưa chọn đáp án đúng!`,
      critical: true
    })

    // 4. Duplicate question check
    const contentSet = new Set<string>()
    let duplicates = 0
    questions.forEach((q) => {
      const trimmed = (q.content || '').trim().toLowerCase()
      if (trimmed) {
        if (contentSet.has(trimmed)) duplicates++
        else contentSet.add(trimmed)
      }
    })
    items.push({
      label: 'Kiểm tra trùng lặp câu hỏi',
      passed: duplicates === 0,
      message: duplicates === 0 ? 'Không phát hiện nội dung câu hỏi bị trùng lặp' : `Phát hiện ${duplicates} câu hỏi có nội dung giống nhau`,
      critical: false
    })

    // 5. Duration
    const durationValid = selectedExam.durationMinutes > 0 && selectedExam.durationMinutes <= 360
    items.push({
      label: 'Thời gian làm bài',
      passed: durationValid,
      message: durationValid ? `${selectedExam.durationMinutes} phút` : 'Thời lượng làm bài không hợp lệ (phải từ 1 - 360 phút)',
      critical: true
    })

    const allCriticalPassed = items.filter((i) => i.critical).every((i) => i.passed)
    return { passed: allCriticalPassed, items }
  }, [selectedExam])

  // Execute Approval Actions
  const handleExecuteAction = async () => {
    if (!selectedExam || !actionType) return

    setActionError(null)

    if (actionType === 'REQUEST_CHANGES' && !actionComment.trim()) {
      setActionError('Vui lòng nhập chi tiết nội dung cần Giảng viên chỉnh sửa!')
      return
    }

    if (actionType === 'REJECT' && !actionComment.trim()) {
      setActionError('Vui lòng nhập lý do từ chối đề thi!')
      return
    }

    setActionLoading(true)
    try {
      if (actionType === 'APPROVE') {
        await assessmentApi.approveExam(selectedExam.id, { comment: actionComment.trim() })
        setSuccessMsg(`Đã phê duyệt đề thi [${selectedExam.code}] thành công!`)
      } else if (actionType === 'REQUEST_CHANGES') {
        await assessmentApi.requestChanges(selectedExam.id, { comment: actionComment.trim() })
        setSuccessMsg(`Đã gửi yêu cầu chỉnh sửa đề thi [${selectedExam.code}] cho Giảng viên.`)
      } else if (actionType === 'REJECT') {
        await assessmentApi.rejectExam(selectedExam.id, { reason: actionComment.trim() })
        setSuccessMsg(`Đã từ chối đề thi [${selectedExam.code}].`)
      }

      handleCloseReview()
      loadStats()
      loadExams()
      setTimeout(() => setSuccessMsg(null), 5000)
    } catch (err: any) {
      setActionError(err?.message || 'Có lỗi xảy ra khi thực hiện hành động.')
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5 animate-pulse" /> Chờ Admin duyệt
          </span>
        )
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" /> Đã duyệt (Sẵn sàng giao)
          </span>
        )
      case 'CHANGES_REQUESTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
            <RotateCcw className="w-3.5 h-3.5" /> Yêu cầu sửa lại
          </span>
        )
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
            <XCircle className="w-3.5 h-3.5" /> Bị từ chối
          </span>
        )
      case 'PUBLISHED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
            <Sparkles className="w-3.5 h-3.5" /> Đã giao cho lớp
          </span>
        )
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/30">
            <FileText className="w-3.5 h-3.5" /> Bản nháp
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-500 border border-slate-500/20">
            {status}
          </span>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5 text-xs font-semibold text-primary uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" /> Ban Kiểm Soát Đào Tạo
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Trung Tâm Duyệt Đề Thi & Khảo Thí
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Quy trình phê duyệt nội dung đề thi bắt buộc trước khi Giảng viên phát hành cho học viên
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { loadStats(); loadExams(); }}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all shadow-sm active:scale-95"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {successMsg && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-sm animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {/* 4 Interactive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* PENDING_REVIEW */}
        <div
          onClick={() => { setStatusFilter('PENDING_REVIEW'); setPage(0); }}
          className={`cursor-pointer group p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
            statusFilter === 'PENDING_REVIEW'
              ? 'bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border-amber-500 shadow-lg shadow-amber-500/10 ring-2 ring-amber-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-amber-400/50 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 tracking-wide uppercase">
              Cần Duyệt Ngay
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {stats.pendingReviewCount}
            </span>
            <span className="text-xs text-slate-500">đề thi chờ</span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Giảng viên đã gửi và đang chờ Admin duyệt
          </p>
        </div>

        {/* APPROVED */}
        <div
          onClick={() => { setStatusFilter('APPROVED'); setPage(0); }}
          className={`cursor-pointer group p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
            statusFilter === 'APPROVED'
              ? 'bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-500 shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-emerald-400/50 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tracking-wide uppercase">
              Đã Phê Duyệt
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {stats.approvedCount}
            </span>
            <span className="text-xs text-slate-500">đủ chuẩn</span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Đã sẵn sàng để Giảng viên giao cho lớp
          </p>
        </div>

        {/* CHANGES_REQUESTED */}
        <div
          onClick={() => { setStatusFilter('CHANGES_REQUESTED'); setPage(0); }}
          className={`cursor-pointer group p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
            statusFilter === 'CHANGES_REQUESTED'
              ? 'bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border-blue-500 shadow-lg shadow-blue-500/10 ring-2 ring-blue-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-blue-400/50 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 tracking-wide uppercase">
              Yêu Cầu Chỉnh Sửa
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
              <RotateCcw className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {stats.changesRequestedCount}
            </span>
            <span className="text-xs text-slate-500">đề trả lại</span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Giảng viên đang điều chỉnh theo góp ý
          </p>
        </div>

        {/* REJECTED */}
        <div
          onClick={() => { setStatusFilter('REJECTED'); setPage(0); }}
          className={`cursor-pointer group p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
            statusFilter === 'REJECTED'
              ? 'bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent border-rose-500 shadow-lg shadow-rose-500/10 ring-2 ring-rose-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-rose-400/50 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 tracking-wide uppercase">
              Bị Từ Chối
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/15 flex items-center justify-center text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {stats.rejectedCount}
            </span>
            <span className="text-xs text-slate-500">đề hủy bỏ</span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Không đạt chuẩn khảo thí và bị hủy
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadExams()}
            placeholder="Tìm theo tên đề thi, mã đề, hoặc nội dung..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-800 dark:text-slate-100"
          />
        </div>

        {/* Course Filter */}
        <div className="w-full md:w-56">
          <select
            value={selectedCourseId}
            onChange={(e) => { setSelectedCourseId(e.target.value); setPage(0); }}
            className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-800 dark:text-slate-100"
          >
            <option value="">Tất cả khóa học</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter Tab Buttons */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto w-full md:w-auto">
          {[
            { id: 'PENDING_REVIEW', label: 'Chờ duyệt' },
            { id: 'APPROVED', label: 'Đã duyệt' },
            { id: 'CHANGES_REQUESTED', label: 'Cần sửa' },
            { id: 'REJECTED', label: 'Từ chối' },
            { id: 'ALL', label: 'Tất cả' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setStatusFilter(tab.id); setPage(0); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === tab.id
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table Content */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-500">Đang tải danh sách đề thi...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-500">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
            <p className="font-semibold">{error}</p>
          </div>
        ) : exams.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4 text-slate-400">
              <CheckSquare className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              Không có đề thi nào trong danh mục này
            </h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              {statusFilter === 'PENDING_REVIEW'
                ? 'Tuyệt vời! Không có đề thi nào đang tồn đọng chờ phê duyệt.'
                : 'Thử chuyển bộ lọc trạng thái hoặc từ khóa tìm kiếm.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-semibold text-xs border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Mã & Tên đề thi</th>
                  <th className="py-3.5 px-4">Khóa học / Lớp</th>
                  <th className="py-3.5 px-4">Giảng viên nộp</th>
                  <th className="py-3.5 px-4 text-center">Số câu / Thang điểm</th>
                  <th className="py-3.5 px-4 text-center">Thời lượng</th>
                  <th className="py-3.5 px-4">Trạng thái</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {exams.map((exam) => (
                  <tr
                    key={exam.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {exam.title}
                        {exam.version > 1 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-primary/10 text-primary border border-primary/20">
                            v{exam.version}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">
                        {exam.code}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-medium text-slate-700 dark:text-slate-300">
                        {exam.courseName || 'Khóa chung'}
                      </div>
                      <div className="text-xs text-slate-500">
                        {exam.sessionTopic ? `Buổi: ${exam.sessionTopic}` : 'Toàn khóa'}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-xs">
                          {(exam.createdByName || 'G')[0]}
                        </div>
                        <div>
                          <div className="font-medium text-slate-800 dark:text-slate-200">
                            {exam.createdByName || 'Giảng viên'}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {exam.submittedAt
                              ? new Date(exam.submittedAt).toLocaleDateString('vi-VN')
                              : exam.createdAt
                              ? new Date(exam.createdAt).toLocaleDateString('vi-VN')
                              : ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {exam.questionCount || exam.questions?.length || 0}
                      </span>{' '}
                      <span className="text-xs text-slate-400">câu</span>
                      <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        {exam.totalPoints || 10} điểm
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {exam.durationMinutes}p
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {getStatusBadge(exam.status)}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => handleOpenReview(exam)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-primary/10 hover:bg-primary text-primary hover:text-white transition-all shadow-sm active:scale-95"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Xem xét & Duyệt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Tổng cộng {totalElements} đề thi (Trang {page + 1}/{totalPages})
            </span>
            <div className="flex gap-1">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="px-3 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
              >
                Trước
              </button>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
              >
                Tiếp
              </button>
            </div>
          </div>
        )}
      </div>

      {/* REVIEW DRAWER / MODAL */}
      {selectedExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-4xl max-h-[92vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-slate-50/50 dark:bg-slate-800/40">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {getStatusBadge(selectedExam.status)}
                  <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                    [{selectedExam.code}]
                  </span>
                  {selectedExam.version > 1 && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-primary/10 text-primary">
                      Phiên bản v{selectedExam.version}
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  {selectedExam.title}
                </h2>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                  <span>Khóa học: <b className="text-slate-700 dark:text-slate-300">{selectedExam.courseName || 'Khóa chung'}</b></span>
                  <span>Giảng viên nộp: <b className="text-slate-700 dark:text-slate-300">{selectedExam.createdByName || 'N/A'}</b></span>
                  <span>Thời lượng: <b className="text-slate-700 dark:text-slate-300">{selectedExam.durationMinutes} phút</b></span>
                </div>
              </div>
              <button
                onClick={handleCloseReview}
                className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 flex items-center justify-center transition-all"
              >
                ✕
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="px-5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 bg-white dark:bg-slate-900 overflow-x-auto">
              {[
                { id: 'DETAILS', label: 'Tổng quan & Kiểm tra chất lượng', icon: ShieldCheck },
                { id: 'QUESTIONS', label: `Bộ câu hỏi (${selectedExam.questions?.length || 0})`, icon: FileText },
                { id: 'PREVIEW', label: 'Xem trước giao diện thi', icon: Eye },
                { id: 'HISTORY', label: 'Lịch sử & Audit log', icon: History }
              ].map((tab) => {
                const Icon = tab.icon
                const active = activeReviewTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveReviewTab(tab.id as any)}
                    className={`flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                      active
                        ? 'border-primary text-primary'
                        : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                )
              })}
            </div>

            {/* Modal Content Scroll Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* TAB 1: DETAILS & QUALITY CHECK */}
              {activeReviewTab === 'DETAILS' && (
                <div className="space-y-6">
                  {/* Automated Quality Check Card */}
                  <div className={`p-5 rounded-2xl border ${
                    qualityCheck.passed
                      ? 'bg-emerald-500/5 border-emerald-500/30'
                      : 'bg-rose-500/5 border-rose-500/30'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {qualityCheck.passed ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-rose-500" />
                        )}
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          Kiểm tra tính hợp lệ & Logic tự động (Automated Quality Guard)
                        </h4>
                      </div>
                      <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                        qualityCheck.passed
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                          : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                      }`}>
                        {qualityCheck.passed ? 'ĐỦ ĐIỀU KIỆN PHÊ DUYỆT' : 'PHÁT HIỆN LỖI LOGIC'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                      {qualityCheck.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs flex items-start gap-2.5"
                        >
                          {item.passed ? (
                            <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                          )}
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {item.label}
                            </span>
                            <p className="text-slate-500 mt-0.5">{item.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Exam Settings Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Cấu hình bài kiểm tra
                      </h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Mục tiêu qua môn:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{selectedExam.passPercentage}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Số lần thi tối đa:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{selectedExam.maxAttempts} lần</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Trộn thứ tự câu hỏi:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{selectedExam.shuffleQuestions ? 'Bật' : 'Tắt'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Trộn thứ tự đáp án:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{selectedExam.shuffleOptions ? 'Bật' : 'Tắt'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Công bố kết quả:</span>
                          <span className="font-bold text-primary">
                            {selectedExam.showResultMode === 'IMMEDIATELY' ? 'Biết điểm ngay khi nộp' : 'Sau khi đóng đề thi'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Phạm vi phân công dự kiến
                      </h4>
                      <p className="text-xs text-slate-500">
                        Sau khi được Admin phê duyệt, Giảng viên sẽ chỉ định lớp cụ thể để phát hành:
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {selectedExam.assignedClassIds && selectedExam.assignedClassIds.length > 0 ? (
                          selectedExam.assignedClassIds.map((cId) => {
                            const cls = classes.find((c) => c.id === cId)
                            return (
                              <span
                                key={cId}
                                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-primary/10 text-primary border border-primary/20"
                              >
                                {cls?.name || `Lớp #${cId}`}
                              </span>
                            )
                          })
                        ) : (
                          <span className="text-xs text-slate-400 italic">
                            Chưa chọn lớp cụ thể (Giảng viên sẽ chọn khi phát hành)
                          </span>
                        )}
                      </div>

                      {/* Display change request feedback if present */}
                      {selectedExam.reviewFeedback && (
                        <div className="mt-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-500/30 text-xs">
                          <b className="text-blue-700 dark:text-blue-300">Ý kiến yêu cầu sửa đổi trước đó:</b>
                          <p className="mt-1 text-slate-700 dark:text-slate-300">{selectedExam.reviewFeedback}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: QUESTIONS LIST */}
              {activeReviewTab === 'QUESTIONS' && (
                <div className="space-y-4">
                  {(selectedExam.questions || []).map((q, qIdx) => (
                    <div
                      key={q.questionId || qIdx}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-primary text-white font-black flex items-center justify-center text-xs">
                            {qIdx + 1}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {q.type}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/15 text-amber-600">
                            {q.difficulty || 'MEDIUM'}
                          </span>
                        </div>
                        <div className="font-bold text-emerald-600 dark:text-emerald-400">
                          {q.points} điểm
                        </div>
                      </div>

                      <div className="text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
                        {q.content}
                      </div>

                      {/* Options */}
                      {q.options && q.options.length > 0 && (
                        <div className="space-y-2 pt-2">
                          {q.options.map((opt) => (
                            <div
                              key={opt.id || opt.optionCode}
                              className={`p-2.5 rounded-xl text-xs flex items-center justify-between border ${
                                opt.isCorrect
                                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-900 dark:text-emerald-200 font-bold'
                                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <span className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[11px] ${
                                  opt.isCorrect
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                                }`}>
                                  {opt.optionCode}
                                </span>
                                <span>{opt.content}</span>
                              </div>
                              {opt.isCorrect && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                  <Check className="w-3.5 h-3.5" /> Đáp án đúng
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 3: STUDENT PREVIEW */}
              {activeReviewTab === 'PREVIEW' && (
                <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-6">
                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-xs text-primary font-medium flex items-center gap-2">
                    <Eye className="w-4 h-4 flex-shrink-0" />
                    Giao diện mô phỏng chính xác cách học viên nhìn thấy bài kiểm tra này khi làm bài online.
                  </div>

                  <div className="space-y-6">
                    {(selectedExam.questions || []).map((q, qIdx) => (
                      <div key={qIdx} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                          <span>CÂU HỎI {qIdx + 1} / {selectedExam.questions.length}</span>
                          <span className="text-primary">{q.points} điểm</span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {q.content}
                        </h4>

                        {q.type === 'ESSAY' ? (
                          <textarea
                            disabled
                            placeholder="Khu vực học viên nhập bài làm tự luận..."
                            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs h-24"
                          />
                        ) : (
                          <div className="space-y-2">
                            {(q.options || []).map((opt) => (
                              <label
                                key={opt.optionCode}
                                className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer text-xs"
                              >
                                <input
                                  type={q.type === 'MULTIPLE_CHOICE' ? 'checkbox' : 'radio'}
                                  name={`preview_q_${qIdx}`}
                                  className="w-4 h-4 text-primary"
                                />
                                <span className="font-bold">{opt.optionCode}.</span>
                                <span>{opt.content}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: AUDIT HISTORY */}
              {activeReviewTab === 'HISTORY' && (
                <div className="space-y-4">
                  {historyLoading ? (
                    <div className="text-center p-8">
                      <RefreshCw className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                      <p className="text-xs text-slate-500">Đang tải nhật ký kiểm duyệt...</p>
                    </div>
                  ) : reviewHistory.length === 0 ? (
                    <div className="text-center p-8 text-slate-500 text-sm">
                      Chưa có lịch sử kiểm duyệt nào cho đề thi này.
                    </div>
                  ) : (
                    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                      {reviewHistory.map((item) => (
                        <div key={item.id} className="relative">
                          <div className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 ${
                            item.action === 'APPROVE' ? 'bg-emerald-500' :
                            item.action === 'REQUEST_CHANGES' ? 'bg-blue-500' :
                            item.action === 'REJECT' ? 'bg-rose-500' : 'bg-primary'
                          }`} />
                          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                                {item.action === 'SUBMIT_FOR_REVIEW' && 'Nộp đề chờ duyệt'}
                                {item.action === 'APPROVE' && 'Phê duyệt đề thi'}
                                {item.action === 'REQUEST_CHANGES' && 'Yêu cầu chỉnh sửa'}
                                {item.action === 'REJECT' && 'Từ chối đề thi'}
                                {item.action === 'PUBLISH' && 'Phát hành cho học viên'}
                              </span>
                              <span className="text-slate-400 font-mono">
                                {new Date(item.createdAt).toLocaleString('vi-VN')}
                              </span>
                            </div>
                            <div className="text-slate-500">
                              Người thao tác: <b className="text-slate-700 dark:text-slate-300">{item.actorName || 'Hệ thống'}</b> ({item.actorRole})
                            </div>
                            {item.comment && (
                              <div className="mt-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                                {item.comment}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ACTION DIALOG OVERLAY (If user clicks Approve, Request Changes, or Reject) */}
            {actionType && (
              <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {actionType === 'APPROVE' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    {actionType === 'REQUEST_CHANGES' && <RotateCcw className="w-4 h-4 text-blue-500" />}
                    {actionType === 'REJECT' && <XCircle className="w-4 h-4 text-rose-500" />}
                    {actionType === 'APPROVE' && 'Xác nhận phê duyệt đề thi'}
                    {actionType === 'REQUEST_CHANGES' && 'Yêu cầu Giảng viên chỉnh sửa nội dung'}
                    {actionType === 'REJECT' && 'Từ chối đề thi này'}
                  </h4>
                  <button
                    onClick={() => { setActionType(null); setActionComment(''); }}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    Hủy bỏ
                  </button>
                </div>

                <p className="text-xs text-slate-500">
                  {actionType === 'APPROVE' && 'Đề thi sau khi duyệt sẽ chuyển sang trạng thái APPROVED và Giảng viên được phép phân công cho các lớp học.'}
                  {actionType === 'REQUEST_CHANGES' && 'Vui lòng nêu cụ thể những điểm cần sửa đổi (câu hỏi, đáp án, thời gian, rubric) để Giảng viên hoàn thiện.'}
                  {actionType === 'REJECT' && 'Ghi rõ lý do không phê duyệt đề thi này. Đề thi sẽ bị đánh dấu REJECTED.'}
                </p>

                <textarea
                  value={actionComment}
                  onChange={(e) => setActionComment(e.target.value)}
                  placeholder={
                    actionType === 'APPROVE'
                      ? 'Lời khen ngợi hoặc lưu ý thêm cho Giảng viên (tùy chọn)...'
                      : actionType === 'REQUEST_CHANGES'
                      ? 'Nêu cụ thể câu hỏi hoặc nội dung cần chỉnh sửa (BẮT BUỘC)...'
                      : 'Nêu lý do từ chối phê duyệt đề thi này (BẮT BUỘC)...'
                  }
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-primary/20 focus:outline-none h-20"
                />

                {actionError && (
                  <div className="text-xs text-rose-500 font-medium">
                    {actionError}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => { setActionType(null); setActionComment(''); }}
                    className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Đóng
                  </button>
                  <button
                    onClick={handleExecuteAction}
                    disabled={actionLoading}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md active:scale-95 transition-all ${
                      actionType === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-700' :
                      actionType === 'REQUEST_CHANGES' ? 'bg-blue-600 hover:bg-blue-700' :
                      'bg-rose-600 hover:bg-rose-700'
                    }`}
                  >
                    {actionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    Xác nhận {actionType === 'APPROVE' ? 'Phê duyệt' : actionType === 'REQUEST_CHANGES' ? 'Gửi yêu cầu sửa' : 'Từ chối'}
                  </button>
                </div>
              </div>
            )}

            {/* Modal Bottom Actions (When no action dialog is open) */}
            {!actionType && (
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
                <span className="text-xs text-slate-400">
                  Thao tác kiểm duyệt có hiệu lực ngay và lưu vào Audit Log hệ thống
                </span>
                <div className="flex items-center gap-2">
                  {/* Allow approval actions only if PENDING_REVIEW or CHANGES_REQUESTED */}
                  {(selectedExam.status === 'PENDING_REVIEW' || selectedExam.status === 'CHANGES_REQUESTED') && (
                    <>
                      <button
                        onClick={() => { setActionType('REJECT'); setActionComment(''); }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-500/10 hover:bg-rose-500 hover:text-white transition-all active:scale-95"
                      >
                        <XCircle className="w-4 h-4" />
                        Từ chối
                      </button>
                      <button
                        onClick={() => { setActionType('REQUEST_CHANGES'); setActionComment(''); }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-blue-600 bg-blue-500/10 hover:bg-blue-500 hover:text-white transition-all active:scale-95"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Yêu cầu sửa lại
                      </button>
                      <button
                        onClick={() => { setActionType('APPROVE'); setActionComment(''); }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Phê duyệt đề thi
                      </button>
                    </>
                  )}
                  {selectedExam.status === 'APPROVED' && (
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Đã được duyệt
                    </span>
                  )}
                  <button
                    onClick={handleCloseReview}
                    className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 ml-2"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
export default AdminExamApprovalPage
