import React, { useState, useEffect } from 'react'
import {
  FileText,
  Plus,
  Copy,
  Send,
  Sparkles,
  CheckCircle2,
  Clock,
  RotateCcw,
  XCircle,
  Eye,
  Edit3,
  Trash2,
  Search,
  RefreshCw,
  HelpCircle
} from 'lucide-react'
import { assessmentApi } from '../../../api/assessment'
import type {
  ExamItem,
  ExamQuestionItem,
  QuestionItem,
  QuestionType,
  QuestionDifficulty,
  ExamStatus
} from '../../../types/assessment'
import type { TeacherClassItem } from '../../../types/teacher'

interface Props {
  teacherClasses: TeacherClassItem[]
  initialStatusFilter?: string
}

export const TeacherExamStudioTab: React.FC<Props> = ({ teacherClasses, initialStatusFilter }) => {
  // Exam list state
  const [exams, setExams] = useState<ExamItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter || 'ALL')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedCourseId, setSelectedCourseId] = useState<number | ''>('')
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  // Editor Modal State
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false)
  const [editingExamId, setEditingExamId] = useState<number | null>(null)
  const [examForm, setExamForm] = useState<{
    title: string
    code: string
    description: string
    courseId: number | ''
    sessionId: number | ''
    durationMinutes: number
    passPercentage: number
    maxAttempts: number
    shuffleQuestions: boolean
    shuffleOptions: boolean
    showResultMode: 'IMMEDIATELY' | 'AFTER_CLOSED' | 'MANUAL'
    questions: ExamQuestionItem[]
  }>({
    title: '',
    code: '',
    description: '',
    courseId: '',
    sessionId: '',
    durationMinutes: 45,
    passPercentage: 60,
    maxAttempts: 1,
    shuffleQuestions: false,
    shuffleOptions: false,
    showResultMode: 'IMMEDIATELY',
    questions: []
  })
  const [savingExam, setSavingExam] = useState<boolean>(false)

  // Bank Selector Modal State
  const [isBankModalOpen, setIsBankModalOpen] = useState<boolean>(false)
  const [bankQuestions, setBankQuestions] = useState<QuestionItem[]>([])
  const [loadingBank, setLoadingBank] = useState<boolean>(false)
  const [selectedBankQIds, setSelectedBankQIds] = useState<Set<number>>(new Set())
  const [bankSearch, setBankSearch] = useState<string>('')
  const [bankType, setBankType] = useState<string>('')
  const [bankDifficulty, setBankDifficulty] = useState<string>('')

  // Publish Modal State
  const [isPublishModalOpen, setIsPublishModalOpen] = useState<boolean>(false)
  const [publishingExam, setPublishingExam] = useState<ExamItem | null>(null)
  const [selectedPublishClassIds, setSelectedPublishClassIds] = useState<number[]>([])
  const [submittingPublish, setSubmittingPublish] = useState<boolean>(false)

  // Student Preview Modal State
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false)
  const [previewExam, setPreviewExam] = useState<ExamItem | null>(null)

  // Add Manual Question Sub-form State
  const [isManualQuestionModalOpen, setIsManualQuestionModalOpen] = useState<boolean>(false)
  const [manualQ, setManualQ] = useState<{
    content: string
    type: QuestionType
    difficulty: QuestionDifficulty
    points: number
    topic: string
    options: { optionCode: string; content: string; isCorrect: boolean }[]
  }>({
    content: '',
    type: 'SINGLE_CHOICE',
    difficulty: 'MEDIUM',
    points: 1,
    topic: 'Chung',
    options: [
      { optionCode: 'A', content: '', isCorrect: true },
      { optionCode: 'B', content: '', isCorrect: false },
      { optionCode: 'C', content: '', isCorrect: false },
      { optionCode: 'D', content: '', isCorrect: false }
    ]
  })

  useEffect(() => {
    loadExams()
  }, [statusFilter, selectedCourseId])

  const loadExams = async () => {
    setLoading(true)
    setActionError(null)
    try {
      const params: any = {
        size: 50
      }
      if (statusFilter && statusFilter !== 'ALL') {
        params.status = statusFilter
      }
      if (selectedCourseId) {
        params.courseId = Number(selectedCourseId)
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim()
      }

      const res = await assessmentApi.searchExams(params)
      if (res.data) {
        setExams(res.data.content || [])
      }
    } catch (err: any) {
      setActionError(err?.message || 'Không thể tải danh sách đề thi.')
    } finally {
      setLoading(false)
    }
  }

  // Open Create / Edit
  const handleOpenCreate = () => {
    setEditingExamId(null)
    const codeGen = `EXAM-${Date.now().toString().slice(-6)}`
    setExamForm({
      title: '',
      code: codeGen,
      description: '',
      courseId: teacherClasses[0]?.courseId || '',
      sessionId: '',
      durationMinutes: 45,
      passPercentage: 60,
      maxAttempts: 1,
      shuffleQuestions: false,
      shuffleOptions: false,
      showResultMode: 'IMMEDIATELY',
      questions: []
    })
    setIsEditorOpen(true)
  }

  const handleOpenEdit = async (exam: ExamItem) => {
    try {
      const full = await assessmentApi.getExam(exam.id)
      const data = full.data || exam
      setEditingExamId(data.id)
      setExamForm({
        title: data.title,
        code: data.code,
        description: data.description || '',
        courseId: data.courseId || '',
        sessionId: data.sessionId || '',
        durationMinutes: data.durationMinutes || 45,
        passPercentage: data.passPercentage || 60,
        maxAttempts: data.maxAttempts || 1,
        shuffleQuestions: data.shuffleQuestions || false,
        shuffleOptions: data.shuffleOptions || false,
        showResultMode: data.showResultMode || 'IMMEDIATELY',
        questions: data.questions || []
      })
      setIsEditorOpen(true)
    } catch (err) {
      alert('Không thể tải chi tiết đề thi.')
    }
  }

  // Duplicate Exam
  const handleDuplicate = async (examId: number) => {
    if (!confirm('Bạn có muốn sao chép đề thi này thành bản nháp mới?')) return
    try {
      await assessmentApi.duplicateExam(examId)
      setActionSuccess('Đã nhân bản đề thi thành công!')
      loadExams()
      setTimeout(() => setActionSuccess(null), 4000)
    } catch (err: any) {
      alert(err?.message || 'Lỗi khi nhân bản đề thi.')
    }
  }

  // Save Exam (Create or Update)
  const handleSaveExam = async (andSubmit = false) => {
    if (!examForm.title.trim()) {
      alert('Vui lòng nhập tên đề thi!')
      return
    }

    if (andSubmit && examForm.questions.length === 0) {
      alert('Đề thi phải có ít nhất 1 câu hỏi trước khi gửi duyệt!')
      return
    }

    setSavingExam(true)
    try {
      const payload: Partial<ExamItem> = {
        title: examForm.title.trim(),
        code: examForm.code.trim(),
        description: examForm.description.trim() || undefined,
        courseId: examForm.courseId ? Number(examForm.courseId) : undefined,
        sessionId: examForm.sessionId ? Number(examForm.sessionId) : undefined,
        durationMinutes: Number(examForm.durationMinutes),
        passPercentage: Number(examForm.passPercentage),
        maxAttempts: Number(examForm.maxAttempts),
        shuffleQuestions: examForm.shuffleQuestions,
        shuffleOptions: examForm.shuffleOptions,
        showResultMode: examForm.showResultMode,
        questions: examForm.questions.map((q, idx) => ({
          ...q,
          sortOrder: idx + 1
        }))
      }

      let savedId = editingExamId
      if (editingExamId) {
        await assessmentApi.updateExam(editingExamId, payload)
      } else {
        const res = await assessmentApi.createExam(payload)
        savedId = res.data.id
      }

      if (andSubmit && savedId) {
        await assessmentApi.submitForReview(savedId)
        setActionSuccess('Đã lưu và gửi đề thi lên Ban Quản Trị phê duyệt!')
      } else {
        setActionSuccess('Đã lưu bản nháp đề thi thành công!')
      }

      setIsEditorOpen(false)
      loadExams()
      setTimeout(() => setActionSuccess(null), 4000)
    } catch (err: any) {
      alert(err?.message || 'Có lỗi xảy ra khi lưu đề thi.')
    } finally {
      setSavingExam(false)
    }
  }

  // Submit Exam For Review directly from list
  const handleSubmitForReview = async (exam: ExamItem) => {
    if ((exam.questionCount || exam.questions?.length || 0) === 0) {
      alert('Đề thi chưa có câu hỏi nào. Vui lòng mở chỉnh sửa và thêm câu hỏi trước khi gửi duyệt!')
      return
    }

    if (!confirm(`Bạn có chắc chắn muốn gửi đề thi [${exam.title}] lên Ban Quản Trị phê duyệt?`)) return
    try {
      await assessmentApi.submitForReview(exam.id)
      setActionSuccess(`Đã gửi đề thi [${exam.code}] lên Admin kiểm duyệt!`)
      loadExams()
      setTimeout(() => setActionSuccess(null), 4000)
    } catch (err: any) {
      alert(err?.message || 'Lỗi khi gửi duyệt đề thi.')
    }
  }

  // Publish Exam to Classes
  const handleOpenPublishModal = (exam: ExamItem) => {
    if (exam.status !== 'APPROVED') {
      alert('Chỉ đề thi đã được Admin phê duyệt (APPROVED) mới có thể giao cho lớp!')
      return
    }
    setPublishingExam(exam)
    setSelectedPublishClassIds(exam.assignedClassIds || [])
    setIsPublishModalOpen(true)
  }

  const handleExecutePublish = async () => {
    if (!publishingExam) return
    if (selectedPublishClassIds.length === 0) {
      alert('Vui lòng chọn ít nhất một lớp học để phát hành đề thi!')
      return
    }

    setSubmittingPublish(true)
    try {
      await assessmentApi.publishExam(publishingExam.id, selectedPublishClassIds)
      setActionSuccess(`Đã phát hành đề thi [${publishingExam.title}] cho các lớp thành công! Học viên có thể làm bài.`)
      setIsPublishModalOpen(false)
      setPublishingExam(null)
      loadExams()
      setTimeout(() => setActionSuccess(null), 5000)
    } catch (err: any) {
      alert(err?.message || 'Lỗi khi phát hành đề thi.')
    } finally {
      setSubmittingPublish(false)
    }
  }

  // Question Bank Picker
  const handleOpenBankModal = async () => {
    setIsBankModalOpen(true)
    setSelectedBankQIds(new Set())
    setLoadingBank(true)
    try {
      const res = await assessmentApi.searchQuestions({
        courseId: examForm.courseId ? Number(examForm.courseId) : undefined,
        size: 50
      })
      if (res.data) {
        setBankQuestions(res.data.content || [])
      }
    } catch (err) {
      console.warn('Error loading bank questions:', err)
    } finally {
      setLoadingBank(false)
    }
  }

  const handleFilterBankQuestions = async () => {
    setLoadingBank(true)
    try {
      const res = await assessmentApi.searchQuestions({
        courseId: examForm.courseId ? Number(examForm.courseId) : undefined,
        search: bankSearch.trim() || undefined,
        type: bankType || undefined,
        difficulty: bankDifficulty || undefined,
        size: 50
      })
      if (res.data) {
        setBankQuestions(res.data.content || [])
      }
    } catch (err) {
      console.warn('Error searching bank questions:', err)
    } finally {
      setLoadingBank(false)
    }
  }

  const handleAddSelectedFromBank = () => {
    const selectedList = bankQuestions.filter((q) => selectedBankQIds.has(q.id))
    const mappedQuestions: ExamQuestionItem[] = selectedList.map((q, idx) => ({
      questionId: q.id,
      code: q.code,
      type: q.type,
      difficulty: q.difficulty,
      topic: q.topic,
      content: q.content,
      points: q.defaultPoints || 1,
      sortOrder: examForm.questions.length + idx + 1,
      options: q.options
    }))

    setExamForm((prev) => ({
      ...prev,
      questions: [...prev.questions, ...mappedQuestions]
    }))

    setIsBankModalOpen(false)
  }

  // Add Manual Question
  const handleAddManualQuestion = () => {
    if (!manualQ.content.trim()) {
      alert('Vui lòng nhập nội dung câu hỏi!')
      return
    }

    const newQuestion: ExamQuestionItem = {
      questionId: 0 - (examForm.questions.length + 1), // temp negative ID
      type: manualQ.type,
      difficulty: manualQ.difficulty,
      content: manualQ.content.trim(),
      points: Number(manualQ.points) || 1,
      sortOrder: examForm.questions.length + 1,
      options: manualQ.type === 'ESSAY' ? [] : manualQ.options.map((o) => ({
        optionCode: o.optionCode,
        content: o.content.trim(),
        isCorrect: o.isCorrect
      }))
    }

    setExamForm((prev) => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }))

    setIsManualQuestionModalOpen(false)
    setManualQ({
      content: '',
      type: 'SINGLE_CHOICE',
      difficulty: 'MEDIUM',
      points: 1,
      topic: 'Chung',
      options: [
        { optionCode: 'A', content: '', isCorrect: true },
        { optionCode: 'B', content: '', isCorrect: false },
        { optionCode: 'C', content: '', isCorrect: false },
        { optionCode: 'D', content: '', isCorrect: false }
      ]
    })
  }

  // Remove question from form
  const handleRemoveQuestion = (idx: number) => {
    setExamForm((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== idx)
    }))
  }

  // Total points calculation
  const totalCalculatedPoints = examForm.questions.reduce(
    (sum, q) => sum + (Number(q.points) || 0),
    0
  )

  const getStatusBadge = (status: ExamStatus) => {
    switch (status) {
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
            <FileText className="w-3 h-3" /> Bản nháp
          </span>
        )
      case 'PENDING_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <Clock className="w-3 h-3 animate-pulse" /> Đang chờ duyệt
          </span>
        )
      case 'CHANGES_REQUESTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
            <RotateCcw className="w-3 h-3" /> Admin yêu cầu sửa
          </span>
        )
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" /> Đã duyệt (Sẵn sàng giao)
          </span>
        )
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
            <XCircle className="w-3 h-3" /> Bị từ chối
          </span>
        )
      case 'PUBLISHED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
            <Sparkles className="w-3 h-3" /> Đã giao cho lớp
          </span>
        )
      default:
        return <span className="px-2 py-0.5 rounded text-xs bg-slate-200">{status}</span>
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-indigo-900/60 via-slate-900 to-slate-900 border border-indigo-500/30 shadow-lg text-white">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Không Gian Soạn Đề Chuyên Nghiệp (Exam Studio)
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Quản Lý & Soạn Thảo Đề Thi Trực Tuyến
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Tạo đề mới, chọn câu hỏi từ ngân hàng, xem trước giao diện học viên và gửi Ban Quản Trị phê duyệt trước khi giao cho lớp.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md active:scale-95 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            Tạo Đề Thi Mới
          </button>
        </div>
      </div>

      {/* Success Alert */}
      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-sm flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Error Alert */}
      {actionError && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-500/30 text-rose-800 dark:text-rose-200 text-sm flex items-center gap-3 animate-fadeIn">
          <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadExams()}
            placeholder="Tìm theo tên đề thi, mã đề..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white"
          />
        </div>

        {/* Course Filter Dropdown */}
        <select
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value ? Number(e.target.value) : '')}
          className="px-3 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="">Tất cả khóa học</option>
          {Array.from(
            new Map(
              teacherClasses
                .filter((c) => c.courseId && c.courseName)
                .map((c) => [c.courseId, { id: c.courseId, name: c.courseName }])
            ).values()
          ).map((crs) => (
            <option key={crs.id} value={crs.id}>
              {crs.name}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto w-full md:w-auto">
          {[
            { id: 'ALL', label: 'Tất cả' },
            { id: 'DRAFT', label: 'Bản nháp' },
            { id: 'PENDING_REVIEW', label: 'Chờ duyệt' },
            { id: 'CHANGES_REQUESTED', label: 'Cần sửa' },
            { id: 'APPROVED', label: 'Đã duyệt (Giao đề)' },
            { id: 'PUBLISHED', label: 'Đã phát hành' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
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

      {/* Exam List Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-500">Đang tải danh sách đề thi...</p>
          </div>
        ) : exams.length === 0 ? (
          <div className="p-16 text-center">
            <FileText className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Chưa có đề thi nào trong danh mục này
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Nhấn nút "Tạo Đề Thi Mới" ở góc phải để bắt đầu thiết kế bài kiểm tra cho học viên.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-semibold text-xs border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Tên & Mã đề</th>
                  <th className="py-3.5 px-4">Khóa học / Chủ đề</th>
                  <th className="py-3.5 px-4 text-center">Số câu</th>
                  <th className="py-3.5 px-4 text-center">Thời lượng</th>
                  <th className="py-3.5 px-4">Trạng thái phê duyệt</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {exams.map((exam) => (
                  <tr key={exam.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {exam.title}
                        {exam.version > 1 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                            v{exam.version}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">
                        {exam.code}
                      </div>

                      {/* Prominent banner if CHANGES_REQUESTED */}
                      {exam.status === 'CHANGES_REQUESTED' && exam.reviewFeedback && (
                        <div className="mt-2 p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-500/30 text-xs">
                          <span className="font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1">
                            <RotateCcw className="w-3 h-3" /> Góp ý từ Ban Quản Trị:
                          </span>
                          <p className="text-slate-700 dark:text-slate-300 mt-0.5">{exam.reviewFeedback}</p>
                        </div>
                      )}

                      {/* Prominent banner if REJECTED */}
                      {exam.status === 'REJECTED' && exam.rejectionReason && (
                        <div className="mt-2 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-500/30 text-xs">
                          <span className="font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> Lý do từ chối:
                          </span>
                          <p className="text-slate-700 dark:text-slate-300 mt-0.5">{exam.rejectionReason}</p>
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-4 text-xs">
                      <div className="font-semibold text-slate-700 dark:text-slate-300">
                        {exam.courseName || 'Khóa chung'}
                      </div>
                      <div className="text-slate-400 mt-0.5">
                        {exam.sessionTopic || 'Theo phân công'}
                      </div>
                    </td>

                    <td className="py-4 px-4 text-center">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {exam.questionCount || exam.questions?.length || 0}
                      </span>
                      <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        {exam.totalPoints || 10}đ
                      </div>
                    </td>

                    <td className="py-4 px-4 text-center text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {exam.durationMinutes} phút
                    </td>

                    <td className="py-4 px-4">
                      {getStatusBadge(exam.status)}
                    </td>

                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* If DRAFT or CHANGES_REQUESTED: Can Edit & Submit For Review */}
                        {(exam.status === 'DRAFT' || exam.status === 'CHANGES_REQUESTED') && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(exam)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
                              title="Chỉnh sửa đề"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleSubmitForReview(exam)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition active:scale-95"
                            >
                              <Send className="w-3.5 h-3.5" />
                              Gửi duyệt
                            </button>
                          </>
                        )}

                        {/* If APPROVED: Show Publish button to assign to classes */}
                        {exam.status === 'APPROVED' && (
                          <button
                            onClick={() => handleOpenPublishModal(exam)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition active:scale-95"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            Giao đề cho lớp
                          </button>
                        )}

                        {/* Duplicate Button */}
                        <button
                          onClick={() => handleDuplicate(exam.id)}
                          className="px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                          title="Sao chép đề thi"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        {/* Preview Button */}
                        <button
                          onClick={async () => {
                            const res = await assessmentApi.getExam(exam.id)
                            setPreviewExam(res.data || exam)
                            setIsPreviewOpen(true)
                          }}
                          className="px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                          title="Xem trước như học viên"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* EXAM AUTHORING STUDIO MODAL (Create / Edit) */}
      {/* ======================================================== */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-5xl max-h-[94vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/40">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {editingExamId ? 'Chỉnh Sửa Đề Thi' : 'Soạn Đề Thi Mới'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Cấu hình thông tin, thời lượng và quản lý danh sách câu hỏi trong đề
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Basic Settings */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Tên bài kiểm tra *
                  </label>
                  <input
                    type="text"
                    required
                    value={examForm.title}
                    onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
                    placeholder="VD: Kiểm tra giữa kỳ: Kỹ năng thuyết trình & Đàm phán"
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Mã đề thi *
                  </label>
                  <input
                    type="text"
                    required
                    value={examForm.code}
                    onChange={(e) => setExamForm({ ...examForm, code: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Khóa học liên quan
                  </label>
                  <select
                    value={examForm.courseId}
                    onChange={(e) => setExamForm({ ...examForm, courseId: e.target.value ? Number(e.target.value) : '' })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="">Chọn khóa học...</option>
                    {teacherClasses.map((c) => (
                      <option key={c.id} value={c.courseId || ''}>
                        {c.courseName || c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Thời lượng làm bài (phút) *
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={240}
                    value={examForm.durationMinutes}
                    onChange={(e) => setExamForm({ ...examForm, durationMinutes: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Tỷ lệ điểm đạt (%) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={examForm.passPercentage}
                    onChange={(e) => setExamForm({ ...examForm, passPercentage: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Advanced exam rules */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={examForm.shuffleQuestions}
                    onChange={(e) => setExamForm({ ...examForm, shuffleQuestions: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600"
                  />
                  <span>Xáo trộn câu hỏi</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={examForm.shuffleOptions}
                    onChange={(e) => setExamForm({ ...examForm, shuffleOptions: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600"
                  />
                  <span>Xáo trộn đáp án</span>
                </label>

                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Xem kết quả:</span>
                  <select
                    value={examForm.showResultMode}
                    onChange={(e) => setExamForm({ ...examForm, showResultMode: e.target.value as any })}
                    className="px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs"
                  >
                    <option value="IMMEDIATELY">Biết ngay khi nộp</option>
                    <option value="AFTER_CLOSED">Sau khi hết hạn</option>
                    <option value="MANUAL">Chờ giảng viên duyệt</option>
                  </select>
                </div>
              </div>

              {/* Question list management */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Danh Sách Câu Hỏi Trong Đề</span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                        {examForm.questions.length} câu • Tổng {totalCalculatedPoints.toFixed(1)} điểm
                      </span>
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleOpenBankModal}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 transition"
                    >
                      + Chọn từ Ngân hàng câu hỏi
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsManualQuestionModalOpen(true)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 transition"
                    >
                      + Thêm câu hỏi thủ công
                    </button>
                  </div>
                </div>

                {examForm.questions.length === 0 ? (
                  <div className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                    <HelpCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs font-medium text-slate-500">
                      Đề thi chưa có câu hỏi nào. Nhấn "+ Chọn từ Ngân hàng câu hỏi" hoặc "+ Thêm câu hỏi thủ công".
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {examForm.questions.map((q, qIdx) => (
                      <div
                        key={qIdx}
                        className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4 shadow-xs"
                      >
                        <div className="flex items-start gap-3 flex-1">
                          <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                            {qIdx + 1}
                          </span>
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="px-2 py-0.5 rounded font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px]">
                                {q.type}
                              </span>
                              <span className="px-2 py-0.5 rounded font-bold bg-amber-500/10 text-amber-600 text-[10px]">
                                {q.difficulty || 'MEDIUM'}
                              </span>
                            </div>
                            <div className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                              {q.content}
                            </div>
                            {/* Options summary */}
                            {q.options && q.options.length > 0 && (
                              <div className="flex flex-wrap gap-2 pt-1">
                                {q.options.map((opt) => (
                                  <span
                                    key={opt.optionCode}
                                    className={`px-2 py-0.5 rounded text-[11px] ${
                                      opt.isCorrect
                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold border border-emerald-500/30'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                    }`}
                                  >
                                    {opt.optionCode}. {opt.content}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="flex items-center gap-1 text-xs">
                            <span className="text-slate-400">Điểm:</span>
                            <input
                              type="number"
                              step="0.5"
                              min="0.5"
                              max="100"
                              value={q.points}
                              onChange={(e) => {
                                const newPts = Number(e.target.value)
                                setExamForm((prev) => ({
                                  ...prev,
                                  questions: prev.questions.map((item, i) =>
                                    i === qIdx ? { ...item, points: newPts } : item
                                  )
                                }))
                              }}
                              className="w-16 px-2 py-1 text-center font-bold text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveQuestion(qIdx)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                            title="Xóa câu hỏi khỏi đề"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
              <span className="text-xs text-slate-400">
                Lưu nháp để hoàn thiện sau hoặc Gửi duyệt để Admin phê duyệt
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-300"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  disabled={savingExam}
                  onClick={() => handleSaveExam(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white transition active:scale-95"
                >
                  {savingExam ? 'Đang lưu...' : 'Lưu Bản Nháp'}
                </button>
                <button
                  type="button"
                  disabled={savingExam || examForm.questions.length === 0}
                  onClick={() => handleSaveExam(true)}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition active:scale-95 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  Lưu & Gửi Admin Duyệt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* QUESTION BANK PICKER MODAL */}
      {/* ======================================================== */}
      {isBankModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-3xl max-h-[85vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Chọn Câu Hỏi Từ Ngân Hàng
                </h3>
                <p className="text-xs text-slate-400">
                  Lựa chọn câu hỏi chuẩn hóa để đưa vào đề thi
                </p>
              </div>
              <button onClick={() => setIsBankModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            {/* Filter */}
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-wrap gap-2">
              <input
                type="text"
                value={bankSearch}
                onChange={(e) => setBankSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleFilterBankQuestions()}
                placeholder="Tìm nội dung câu hỏi..."
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex-1"
              />
              <select
                value={bankType}
                onChange={(e) => setBankType(e.target.value)}
                className="px-2 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              >
                <option value="">Tất cả loại câu</option>
                <option value="SINGLE_CHOICE">Trắc nghiệm 1 đáp án</option>
                <option value="MULTIPLE_CHOICE">Nhiều đáp án</option>
                <option value="TRUE_FALSE">Đúng / Sai</option>
                <option value="ESSAY">Tự luận</option>
              </select>
              <select
                value={bankDifficulty}
                onChange={(e) => setBankDifficulty(e.target.value)}
                className="px-2 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              >
                <option value="">Tất cả độ khó</option>
                <option value="EASY">Dễ</option>
                <option value="MEDIUM">Trung bình</option>
                <option value="HARD">Khó</option>
                <option value="EXPERT">Nâng cao</option>
              </select>
              <button
                type="button"
                onClick={handleFilterBankQuestions}
                className="px-3 py-1.5 text-xs font-bold rounded-xl bg-indigo-600 text-white"
              >
                Lọc
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {loadingBank ? (
                <div className="p-8 text-center text-xs text-slate-400">Đang tải câu hỏi...</div>
              ) : bankQuestions.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">Không tìm thấy câu hỏi phù hợp.</div>
              ) : (
                bankQuestions.map((q) => {
                  const isSelected = selectedBankQIds.has(q.id)
                  return (
                    <div
                      key={q.id}
                      onClick={() => {
                        const next = new Set(selectedBankQIds)
                        if (isSelected) next.delete(q.id)
                        else next.add(q.id)
                        setSelectedBankQIds(next)
                      }}
                      className={`p-3 rounded-2xl border text-xs cursor-pointer transition flex items-start gap-3 ${
                        isSelected
                          ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-900 dark:text-indigo-200'
                          : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="mt-0.5 rounded text-indigo-600"
                      />
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700">
                            {q.type}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {q.code}
                          </span>
                        </div>
                        <p className="font-medium">{q.content}</p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Đã chọn {selectedBankQIds.size} câu hỏi
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsBankModalOpen(false)}
                  className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={selectedBankQIds.size === 0}
                  onClick={handleAddSelectedFromBank}
                  className="px-4 py-1.5 text-xs font-bold rounded-xl bg-indigo-600 text-white disabled:opacity-50"
                >
                  Thêm vào đề thi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MANUAL QUESTION MODAL */}
      {/* ======================================================== */}
      {isManualQuestionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Thêm Câu Hỏi Mới Vào Đề
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Nội dung câu hỏi *</label>
                <textarea
                  rows={3}
                  value={manualQ.content}
                  onChange={(e) => setManualQ({ ...manualQ, content: e.target.value })}
                  placeholder="Nhập nội dung câu hỏi..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Dạng câu hỏi</label>
                  <select
                    value={manualQ.type}
                    onChange={(e) => setManualQ({ ...manualQ, type: e.target.value as any })}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="SINGLE_CHOICE">Trắc nghiệm 1 đáp án</option>
                    <option value="MULTIPLE_CHOICE">Nhiều đáp án</option>
                    <option value="TRUE_FALSE">Đúng / Sai</option>
                    <option value="ESSAY">Tự luận</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold block mb-1">Điểm câu hỏi</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={manualQ.points}
                    onChange={(e) => setManualQ({ ...manualQ, points: Number(e.target.value) })}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Options for MCQ */}
              {manualQ.type !== 'ESSAY' && (
                <div className="space-y-2 pt-2">
                  <label className="font-bold block">Các đáp án lựa chọn (Tích chọn đáp án đúng):</label>
                  {manualQ.options.map((opt, oIdx) => (
                    <div key={opt.optionCode} className="flex items-center gap-2">
                      <input
                        type={manualQ.type === 'MULTIPLE_CHOICE' ? 'checkbox' : 'radio'}
                        name="correctManual"
                        checked={opt.isCorrect}
                        onChange={() => {
                          if (manualQ.type === 'MULTIPLE_CHOICE') {
                            setManualQ({
                              ...manualQ,
                              options: manualQ.options.map((item, i) =>
                                i === oIdx ? { ...item, isCorrect: !item.isCorrect } : item
                              )
                            })
                          } else {
                            setManualQ({
                              ...manualQ,
                              options: manualQ.options.map((item, i) =>
                                i === oIdx ? { ...item, isCorrect: true } : { ...item, isCorrect: false }
                              )
                            })
                          }
                        }}
                        className="w-4 h-4 text-indigo-600"
                      />
                      <span className="font-bold w-4 text-slate-500">{opt.optionCode}.</span>
                      <input
                        type="text"
                        value={opt.content}
                        onChange={(e) => {
                          const val = e.target.value
                          setManualQ({
                            ...manualQ,
                            options: manualQ.options.map((item, i) =>
                              i === oIdx ? { ...item, content: val } : item
                            )
                          })
                        }}
                        placeholder={`Nội dung đáp án ${opt.optionCode}...`}
                        className="flex-1 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsManualQuestionModalOpen(false)}
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleAddManualQuestion}
                className="px-4 py-1.5 text-xs font-bold rounded-xl bg-indigo-600 text-white"
              >
                Thêm câu hỏi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PUBLISH EXAM TO CLASSES MODAL */}
      {/* ======================================================== */}
      {isPublishModalOpen && publishingExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Phát Hành Đề Thi Cho Lớp Học
                </h3>
                <p className="text-xs text-slate-500">
                  Đề thi: <b>{publishingExam.title}</b> ({publishingExam.durationMinutes} phút)
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-800 dark:text-emerald-200">
              Đề thi này đã được Ban Quản Trị phê duyệt. Hãy chọn các lớp học bạn phụ trách để giao bài kiểm tra này.
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Chọn lớp học được giao bài thi này:
              </label>
              <div className="max-h-48 overflow-y-auto space-y-2 p-1">
                {teacherClasses.map((cls) => {
                  const isChecked = selectedPublishClassIds.includes(cls.id)
                  return (
                    <label
                      key={cls.id}
                      className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition ${
                        isChecked
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-900 dark:text-emerald-200'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setSelectedPublishClassIds(selectedPublishClassIds.filter((id) => id !== cls.id))
                            } else {
                              setSelectedPublishClassIds([...selectedPublishClassIds, cls.id])
                            }
                          }}
                          className="w-4 h-4 rounded text-emerald-600"
                        />
                        <span className="font-bold">{cls.name}</span>
                        <span className="text-[11px] text-slate-400">({cls.code})</span>
                      </div>
                      <span className="text-[11px] text-slate-400">{cls.enrolledStudents} học viên</span>
                    </label>
                  )
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsPublishModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={submittingPublish || selectedPublishClassIds.length === 0}
                onClick={handleExecutePublish}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition disabled:opacity-50"
              >
                {submittingPublish ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                Xác Nhận Phát Hành
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* STUDENT PREVIEW MODAL */}
      {/* ======================================================== */}
      {isPreviewOpen && previewExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-3xl max-h-[88vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
              <div>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  Xem Trước Giao Diện Thi Của Học Viên
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {previewExam.title} ({previewExam.durationMinutes} phút)
                </h3>
              </div>
              <button onClick={() => setIsPreviewOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {(previewExam.questions || []).map((q, qIdx) => (
                <div key={qIdx} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                    <span>CÂU HỎI {qIdx + 1} / {previewExam.questions.length}</span>
                    <span className="text-indigo-600 font-bold">{q.points} điểm</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-relaxed">
                    {q.content}
                  </h4>

                  {q.type === 'ESSAY' ? (
                    <textarea
                      disabled
                      placeholder="Khu vực học viên soạn thảo bài làm tự luận..."
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
                            name={`view_q_${qIdx}`}
                            className="w-4 h-4 text-indigo-600"
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

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                Đóng xem trước
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default TeacherExamStudioTab
