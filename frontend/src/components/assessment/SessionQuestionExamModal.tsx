import React, { useState, useEffect, useCallback, useRef } from 'react'
import { classesApi } from '../../api/classes'
import { assessmentApi } from '../../api/assessment'
import type { ClassItem, ClassSessionItem } from '../../types/class'
import type {
  QuestionItem,
  ExamItem,
  QuestionType,
  QuestionDifficulty,
  QuestionImportPreview
} from '../../types/assessment'
import {
  X,
  Calendar,
  Clock,
  FileText,
  FileQuestion,
  Plus,
  Search,
  Copy,
  Check,
  CheckCircle2,
  UploadCloud,
  FileSpreadsheet,
  Download,
  Trash2,
  Edit3,
  Send,
  Layers,
  RefreshCw,
  Eye,
  FolderPlus
} from 'lucide-react'

interface SessionQuestionExamModalProps {
  classItem: ClassItem
  initialSessionId?: number
  onClose: () => void
}

export const SessionQuestionExamModal: React.FC<SessionQuestionExamModalProps> = ({
  classItem,
  initialSessionId,
  onClose
}) => {
  // Session list & active session
  const [sessions, setSessions] = useState<ClassSessionItem[]>([])
  const [selectedSession, setSelectedSession] = useState<ClassSessionItem | null>(null)
  const [loadingSessions, setLoadingSessions] = useState(true)

  // Active tab: 'QUESTIONS' | 'EXAMS'
  const [activeTab, setActiveTab] = useState<'QUESTIONS' | 'EXAMS'>('QUESTIONS')

  // Questions of current session
  const [questions, setQuestions] = useState<QuestionItem[]>([])
  const [loadingQuestions, setLoadingQuestions] = useState(false)
  const [questionSearch, setQuestionSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState('')
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<number[]>([])

  // Exams of current session
  const [exams, setExams] = useState<ExamItem[]>([])
  const [loadingExams, setLoadingExams] = useState(false)

  // Notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Sub-modal states
  // 1. Create Question Modal
  const [isCreateQModalOpen, setIsCreateQModalOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<QuestionItem | null>(null)
  const [qType, setQType] = useState<QuestionType>('SINGLE_CHOICE')
  const [qDifficulty, setQDifficulty] = useState<QuestionDifficulty>('MEDIUM')
  const [qTopic, setQTopic] = useState('')
  const [qContent, setQContent] = useState('')
  const [qPoints, setQPoints] = useState(1.0)
  const [qExplanation, setQExplanation] = useState('')
  const [qOptions, setQOptions] = useState<Array<{ optionCode: string; content: string; isCorrect: boolean }>>([
    { optionCode: 'A', content: '', isCorrect: true },
    { optionCode: 'B', content: '', isCorrect: false },
    { optionCode: 'C', content: '', isCorrect: false },
    { optionCode: 'D', content: '', isCorrect: false }
  ])
  const [savingQuestion, setSavingQuestion] = useState(false)

  // 2. Import Excel Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState<QuestionImportPreview | null>(null)
  const [selectedImportRows, setSelectedImportRows] = useState<Set<number>>(new Set())
  const [isParsingExcel, setIsParsingExcel] = useState(false)
  const [isConfirmingImport, setIsConfirmingImport] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 3. Quick Create Exam from Selected Questions Modal
  const [isQuickExamModalOpen, setIsQuickExamModalOpen] = useState(false)
  const [examTitle, setExamTitle] = useState('')
  const [examCode, setExamCode] = useState('')
  const [examDuration, setExamDuration] = useState(45)
  const [examPassPercent, setExamPassPercent] = useState(50)
  const [examStatus, setExamStatus] = useState<'DRAFT' | 'PUBLISHED'>('DRAFT')
  const [savingExam, setSavingExam] = useState(false)

  // 4. Reuse / Borrow Questions from Course Bank Modal
  const [isBorrowModalOpen, setIsBorrowModalOpen] = useState(false)
  const [bankQuestions, setBankQuestions] = useState<QuestionItem[]>([])
  const [loadingBankQuestions, setLoadingBankQuestions] = useState(false)
  const [selectedBorrowIds, setSelectedBorrowIds] = useState<number[]>([])

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Fetch sessions for this class
  const fetchSessions = useCallback(async () => {
    try {
      setLoadingSessions(true)
      const res = await classesApi.getClassSessions(classItem.id)
      if (res.success && res.data) {
        setSessions(res.data)
        if (res.data.length > 0) {
          if (initialSessionId) {
            const found = res.data.find((s) => s.id === initialSessionId)
            setSelectedSession(found || res.data[0])
          } else {
            setSelectedSession(res.data[0])
          }
        }
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Không thể tải danh sách buổi học')
    } finally {
      setLoadingSessions(false)
    }
  }, [classItem.id, initialSessionId])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  // Fetch questions for selected session
  const fetchQuestions = useCallback(async () => {
    if (!selectedSession) return
    try {
      setLoadingQuestions(true)
      const res = await assessmentApi.searchQuestions({
        sessionId: selectedSession.id,
        search: questionSearch.trim() || undefined,
        type: typeFilter || undefined,
        difficulty: difficultyFilter || undefined,
        size: 100
      })
      if (res.success && res.data) {
        setQuestions(res.data.content || [])
      }
    } catch (err: unknown) {
      console.error(err)
    } finally {
      setLoadingQuestions(false)
    }
  }, [selectedSession, questionSearch, typeFilter, difficultyFilter])

  // Fetch exams for selected session
  const fetchExams = useCallback(async () => {
    if (!selectedSession) return
    try {
      setLoadingExams(true)
      const res = await assessmentApi.searchExams({
        sessionId: selectedSession.id,
        size: 50
      })
      if (res.success && res.data) {
        setExams(res.data.content || [])
      }
    } catch (err: unknown) {
      console.error(err)
    } finally {
      setLoadingExams(false)
    }
  }, [selectedSession])

  useEffect(() => {
    if (selectedSession) {
      setSelectedQuestionIds([])
      if (activeTab === 'QUESTIONS') {
        fetchQuestions()
      } else {
        fetchExams()
      }
    }
  }, [selectedSession, activeTab, fetchQuestions, fetchExams])

  // Open Create Question Modal
  const handleOpenCreateQuestion = () => {
    setEditingQuestion(null)
    setQType('SINGLE_CHOICE')
    setQDifficulty('MEDIUM')
    setQTopic(selectedSession?.topic || classItem.courseName || 'Kiến thức chung')
    setQContent('')
    setQPoints(1.0)
    setQExplanation('')
    setQOptions([
      { optionCode: 'A', content: '', isCorrect: true },
      { optionCode: 'B', content: '', isCorrect: false },
      { optionCode: 'C', content: '', isCorrect: false },
      { optionCode: 'D', content: '', isCorrect: false }
    ])
    setIsCreateQModalOpen(true)
  }

  // Open Edit Question Modal
  const handleOpenEditQuestion = (q: QuestionItem) => {
    setEditingQuestion(q)
    setQType(q.type)
    setQDifficulty(q.difficulty)
    setQTopic(q.topic)
    setQContent(q.content)
    setQPoints(q.defaultPoints || 1.0)
    setQExplanation(q.explanation || '')
    if (q.options && q.options.length > 0) {
      setQOptions(q.options.map(o => ({
        optionCode: o.optionCode,
        content: o.content,
        isCorrect: !!o.isCorrect
      })))
    } else {
      setQOptions([
        { optionCode: 'A', content: '', isCorrect: true },
        { optionCode: 'B', content: '', isCorrect: false }
      ])
    }
    setIsCreateQModalOpen(true)
  }

  // Save Question (Create or Edit)
  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSession) return
    if (!qContent.trim()) {
      alert('Vui lòng nhập nội dung câu hỏi')
      return
    }

    if (qType === 'SINGLE_CHOICE' || qType === 'MULTIPLE_CHOICE' || qType === 'TRUE_FALSE') {
      const emptyOpt = qOptions.some(o => !o.content.trim())
      if (emptyOpt) {
        alert('Vui lòng nhập đầy đủ nội dung cho các phương án đáp án')
        return
      }
      const hasCorrect = qOptions.some(o => o.isCorrect)
      if (!hasCorrect) {
        alert('Phải chọn ít nhất một đáp án đúng')
        return
      }
    }

    try {
      setSavingQuestion(true)
      const payload: Partial<QuestionItem> = {
        sessionId: selectedSession.id,
        courseId: classItem.courseId,
        topic: qTopic.trim() || 'Buổi học ' + selectedSession.sessionNumber,
        type: qType,
        difficulty: qDifficulty,
        content: qContent.trim(),
        defaultPoints: Number(qPoints),
        explanation: qExplanation.trim() || null,
        options: (qType === 'ESSAY' || qType === 'SHORT_ANSWER') ? [] : qOptions.map((o, idx) => ({
          optionCode: o.optionCode || String.fromCharCode(65 + idx),
          content: o.content.trim(),
          isCorrect: o.isCorrect,
          sortOrder: idx + 1
        }))
      }

      if (editingQuestion) {
        await assessmentApi.updateQuestion(editingQuestion.id, payload)
        showToast('Cập nhật câu hỏi thành công!')
      } else {
        await assessmentApi.createQuestion(payload)
        showToast('Tạo câu hỏi mới cho buổi học thành công!')
      }

      setIsCreateQModalOpen(false)
      fetchQuestions()
      fetchSessions()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Lỗi khi lưu câu hỏi')
    } finally {
      setSavingQuestion(false)
    }
  }

  // Duplicate Question
  const handleDuplicateQuestion = async (q: QuestionItem) => {
    if (!selectedSession) return
    try {
      const payload: Partial<QuestionItem> = {
        sessionId: selectedSession.id,
        courseId: classItem.courseId,
        topic: q.topic,
        type: q.type,
        difficulty: q.difficulty,
        content: `[Bản sao] ${q.content}`,
        defaultPoints: q.defaultPoints,
        explanation: q.explanation,
        options: q.options?.map((o, idx) => ({
          optionCode: o.optionCode,
          content: o.content,
          isCorrect: o.isCorrect,
          sortOrder: idx + 1
        }))
      }
      await assessmentApi.createQuestion(payload)
      showToast('Đã nhân bản câu hỏi!')
      fetchQuestions()
      fetchSessions()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Lỗi khi nhân bản câu hỏi')
    }
  }

  // Delete Question
  const handleDeleteQuestion = async (id: number) => {
    if (!window.confirm('Bạn có chắc muốn xóa câu hỏi này khỏi buổi học?')) return
    try {
      await assessmentApi.deleteQuestion(id)
      showToast('Đã xóa câu hỏi!')
      setSelectedQuestionIds(prev => prev.filter(qid => qid !== id))
      fetchQuestions()
      fetchSessions()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Không thể xóa câu hỏi')
    }
  }

  // Open Quick Exam Creation from Selected Questions
  const handleOpenQuickExam = () => {
    if (selectedQuestionIds.length === 0) {
      alert('Vui lòng chọn ít nhất 1 câu hỏi để tạo đề thi')
      return
    }
    const topic = selectedSession?.topic || `Buổi ${selectedSession?.sessionNumber}`
    setExamTitle(`Đề kiểm tra ${topic}`)
    setExamCode(`EX-${classItem.code}-S${selectedSession?.sessionNumber}-${Date.now().toString().slice(-4)}`)
    setExamDuration(selectedQuestionIds.length * 2 > 15 ? selectedQuestionIds.length * 2 : 15)
    setExamPassPercent(50)
    setExamStatus('DRAFT')
    setIsQuickExamModalOpen(true)
  }

  // Save Quick Exam
  const handleSaveQuickExam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSession) return
    if (!examTitle.trim()) {
      alert('Vui lòng nhập tên đề thi')
      return
    }

    try {
      setSavingExam(true)
      const selectedQuestions = questions.filter(q => selectedQuestionIds.includes(q.id))
      const totalPoints = selectedQuestions.reduce((sum, q) => sum + (q.defaultPoints || 1.0), 0)

      const payload: Partial<ExamItem> = {
        sessionId: selectedSession.id,
        courseId: classItem.courseId,
        title: examTitle.trim(),
        code: examCode.trim() || `EXAM-${Date.now()}`,
        description: `Đề thi buổi học ${selectedSession.sessionNumber} - Lớp ${classItem.name}`,
        durationMinutes: Number(examDuration),
        passPercentage: Number(examPassPercent),
        maxAttempts: 1,
        shuffleQuestions: true,
        shuffleOptions: true,
        showResultMode: 'IMMEDIATELY',
        status: examStatus,
        assignedClassIds: [classItem.id],
        questions: selectedQuestions.map((q, idx) => ({
          questionId: q.id,
          points: q.defaultPoints || 1.0,
          sortOrder: idx + 1,
          content: q.content
        })),
        totalPoints
      }

      await assessmentApi.createExam(payload)
      showToast('Tạo đề thi từ các câu hỏi đã chọn thành công!')
      setIsQuickExamModalOpen(false)
      setSelectedQuestionIds([])
      setActiveTab('EXAMS')
      fetchExams()
      fetchSessions()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Lỗi khi tạo đề thi')
    } finally {
      setSavingExam(false)
    }
  }

  // Duplicate Exam
  const handleDuplicateExam = async (examId: number) => {
    try {
      const res = await assessmentApi.duplicateExam(examId)
      if (res.success) {
        showToast(`Đã sao chép đề thi: ${res.data?.title}`)
        fetchExams()
        fetchSessions()
      } else {
        alert(res.message || 'Sao chép đề thi thất bại')
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Lỗi khi nhân bản đề thi')
    }
  }

  // Publish Exam
  const handlePublishExam = async (examId: number) => {
    if (!window.confirm('Bạn có chắc muốn phát hành đề thi này? Học viên lớp sẽ có thể vào làm bài.')) return
    try {
      await assessmentApi.publishExam(examId)
      showToast('Đã phát hành đề thi thành công!')
      fetchExams()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Không thể phát hành đề')
    }
  }

  // Download Excel Template
  const handleDownloadTemplate = async () => {
    try {
      const blob = await assessmentApi.downloadQuestionTemplate()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'mau_cau_hoi_ch_academy.xlsx'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Lỗi tải template Excel')
    }
  }

  // Handle Excel File Selected
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]
    setImportFile(file)
    setIsParsingExcel(true)
    setErrorMessage(null)

    try {
      const res = await assessmentApi.previewQuestionImport(file, classItem.courseId, selectedSession?.id)
      if (res.success && res.data) {
        setPreviewData(res.data)
        const validIndices = new Set<number>()
        res.data.rows.forEach(r => {
          if (r.valid) validIndices.add(r.rowNumber)
        })
        setSelectedImportRows(validIndices)
      } else {
        setErrorMessage(res.message || 'Không thể đọc file Excel')
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Lỗi xử lý file')
    } finally {
      setIsParsingExcel(false)
    }
  }

  // Confirm Excel Import
  const handleConfirmImport = async () => {
    if (!previewData || !selectedSession) return
    const selectedRows = previewData.rows.filter(r => selectedImportRows.has(r.rowNumber) && r.valid)
    if (selectedRows.length === 0) {
      alert('Không có dòng hợp lệ nào được chọn để nhập')
      return
    }

    try {
      setIsConfirmingImport(true)
      const res = await assessmentApi.confirmQuestionImport({
        courseId: classItem.courseId,
        sessionId: selectedSession.id,
        selectedRows
      })
      if (res.success) {
        showToast(`Đã nhập thành công ${res.data ?? selectedRows.length} câu hỏi vào buổi học!`)
        setIsImportModalOpen(false)
        setImportFile(null)
        setPreviewData(null)
        fetchQuestions()
        fetchSessions()
      } else {
        alert(res.message || 'Nhập câu hỏi thất bại')
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Lỗi khi nhập câu hỏi')
    } finally {
      setIsConfirmingImport(false)
    }
  }

  // Load Borrowable questions from Course bank
  const handleOpenBorrowModal = async () => {
    setIsBorrowModalOpen(true)
    setSelectedBorrowIds([])
    try {
      setLoadingBankQuestions(true)
      const res = await assessmentApi.searchQuestions({
        courseId: classItem.courseId,
        size: 100
      })
      if (res.success && res.data) {
        // filter out questions already in this session
        const currentIds = new Set(questions.map(q => q.id))
        setBankQuestions((res.data.content || []).filter(q => !currentIds.has(q.id)))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingBankQuestions(false)
    }
  }

  // Borrow / Copy selected bank questions to this session
  const handleConfirmBorrow = async () => {
    if (!selectedSession || selectedBorrowIds.length === 0) return
    try {
      const toCopy = bankQuestions.filter(q => selectedBorrowIds.includes(q.id))
      for (const q of toCopy) {
        const payload: Partial<QuestionItem> = {
          sessionId: selectedSession.id,
          courseId: classItem.courseId,
          topic: q.topic || selectedSession.topic || 'Buổi học',
          type: q.type,
          difficulty: q.difficulty,
          content: q.content,
          defaultPoints: q.defaultPoints,
          explanation: q.explanation,
          options: q.options?.map((o, idx) => ({
            optionCode: o.optionCode,
            content: o.content,
            isCorrect: o.isCorrect,
            sortOrder: idx + 1
          }))
        }
        await assessmentApi.createQuestion(payload)
      }
      showToast(`Đã sao chép ${toCopy.length} câu hỏi vào buổi học này!`)
      setIsBorrowModalOpen(false)
      fetchQuestions()
      fetchSessions()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Lỗi khi sao chép câu hỏi')
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white dark:bg-[#0F172A] rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-800 dark:text-slate-100">
        
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-[#1E293B]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#142B4A] dark:bg-[#38BDF8] text-white dark:text-[#0F172A] flex items-center justify-center font-bold shadow-sm">
              <FileQuestion className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Quản Lý Câu Hỏi & Đề Thi Theo Buổi Học
                </h2>
                <span className="px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                  {classItem.code}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Lớp: <strong className="text-slate-700 dark:text-slate-200">{classItem.name}</strong> • Khóa: {classItem.courseName || classItem.courseCode}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast alert */}
        {toastMessage && (
          <div className="bg-emerald-500 text-white text-xs font-bold px-4 py-2 flex items-center gap-2 justify-center shadow-inner animate-fade-in">
            <CheckCircle2 className="w-4 h-4" />
            {toastMessage}
          </div>
        )}
        {errorMessage && (
          <div className="bg-rose-500 text-white text-xs font-bold px-4 py-2 flex items-center justify-between shadow-inner animate-fade-in">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="text-white hover:opacity-80">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Main Body Grid: Left Timeline / Right Content */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          
          {/* Left Column: Sessions List */}
          <div className="w-full md:w-80 border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#131F33] flex flex-col shrink-0">
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#315E91] dark:text-[#38BDF8]" />
                Danh sách buổi học ({sessions.length})
              </span>
              <button
                onClick={fetchSessions}
                className="hover:text-slate-800 dark:hover:text-white p-1"
                title="Tải lại buổi học"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingSessions ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {loadingSessions ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#142B4A]" />
                  Đang tải buổi học...
                </div>
              ) : sessions.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400 italic">
                  Lớp học này chưa có buổi học nào trong hệ thống.
                </div>
              ) : (
                sessions.map((session) => {
                  const isSelected = selectedSession?.id === session.id
                  return (
                    <button
                      key={session.id}
                      onClick={() => setSelectedSession(session)}
                      className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                        isSelected
                          ? 'bg-white dark:bg-[#1E293B] border-[#142B4A] dark:border-[#38BDF8] shadow-sm'
                          : 'bg-transparent border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-xs font-black px-2 py-0.5 rounded-md ${
                          isSelected
                            ? 'bg-[#142B4A] text-white dark:bg-[#38BDF8] dark:text-[#0F172A]'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}>
                          Buổi {session.sessionNumber}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                          {session.sessionDate}
                        </span>
                      </div>

                      <div className="text-xs font-bold text-slate-800 dark:text-white line-clamp-1">
                        {session.topic || 'Chưa cập nhật chủ đề'}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {session.startTime?.slice(0, 5)} - {session.endTime?.slice(0, 5)}
                        </span>
                        <div className="flex items-center gap-1 font-semibold text-[10px]">
                          <span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                            {session.questionCount || 0} câu
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                            {session.examCount || 0} đề
                          </span>
                        </div>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* Right Column: Active Session Workspace */}
          <div className="flex-1 flex flex-col bg-white dark:bg-[#0F172A] overflow-hidden">
            {selectedSession ? (
              <>
                {/* Active Session Info Banner */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-[#1E293B]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-[#142B4A] text-white dark:bg-[#38BDF8] dark:text-[#0F172A]">
                        Buổi học #{selectedSession.sessionNumber}
                      </span>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                        {selectedSession.topic || 'Chủ đề: Kiến thức & Ôn tập buổi học'}
                      </h3>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span>Ngày: <strong>{selectedSession.sessionDate}</strong> ({selectedSession.startTime?.slice(0, 5)} - {selectedSession.endTime?.slice(0, 5)})</span>
                      {selectedSession.room && <span>Phòng: <strong>{selectedSession.room}</strong></span>}
                      {selectedSession.teacherName && <span>GV: <strong>{selectedSession.teacherName}</strong></span>}
                    </div>
                  </div>

                  {/* Tabs Switcher */}
                  <div className="inline-flex p-1 bg-slate-200 dark:bg-slate-800 rounded-xl text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setActiveTab('QUESTIONS')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                        activeTab === 'QUESTIONS'
                          ? 'bg-white dark:bg-[#0F172A] text-[#142B4A] dark:text-[#38BDF8] shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      <FileQuestion className="w-3.5 h-3.5" />
                      <span>Câu hỏi ({questions.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('EXAMS')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                        activeTab === 'EXAMS'
                          ? 'bg-white dark:bg-[#0F172A] text-[#142B4A] dark:text-[#38BDF8] shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Đề thi ({exams.length})</span>
                    </button>
                  </div>
                </div>

                {/* Tab 1 Content: Questions */}
                {activeTab === 'QUESTIONS' && (
                  <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    {/* Action Bar */}
                    <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-[#0F172A]">
                      <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[260px]">
                        <div className="relative flex-1 min-w-[160px]">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            type="text"
                            value={questionSearch}
                            onChange={(e) => setQuestionSearch(e.target.value)}
                            placeholder="Tìm câu hỏi theo nội dung..."
                            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:border-[#142B4A]"
                          />
                        </div>

                        <select
                          value={typeFilter}
                          onChange={(e) => setTypeFilter(e.target.value)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs"
                        >
                          <option value="">Tất cả dạng</option>
                          <option value="SINGLE_CHOICE">Trắc nghiệm 1 đáp án</option>
                          <option value="MULTIPLE_CHOICE">Trắc nghiệm nhiều đáp án</option>
                          <option value="TRUE_FALSE">Đúng / Sai</option>
                          <option value="ESSAY">Tự luận</option>
                        </select>

                        <select
                          value={difficultyFilter}
                          onChange={(e) => setDifficultyFilter(e.target.value)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs"
                        >
                          <option value="">Tất cả độ khó</option>
                          <option value="EASY">Dễ</option>
                          <option value="MEDIUM">Trung bình</option>
                          <option value="HARD">Khó</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleOpenBorrowModal}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5"
                          title="Lấy câu hỏi có sẵn từ ngân hàng khóa học"
                        >
                          <FolderPlus className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Lấy từ ngân hàng</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsImportModalOpen(true)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5"
                          title="Nhập file Excel vào buổi học này"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Nhập Excel</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleOpenCreateQuestion}
                          className="px-3.5 py-1.5 rounded-lg bg-[#142B4A] dark:bg-[#38BDF8] text-white dark:text-[#0F172A] hover:opacity-90 text-xs font-bold flex items-center gap-1.5 shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Tạo câu hỏi</span>
                        </button>
                      </div>
                    </div>

                    {/* Batch Selection Banner if any question checked */}
                    {selectedQuestionIds.length > 0 && (
                      <div className="bg-blue-50 dark:bg-blue-950/60 border-b border-blue-200 dark:border-blue-900 px-4 py-2 flex items-center justify-between text-xs text-blue-900 dark:text-blue-200 animate-fade-in">
                        <div className="flex items-center gap-2 font-bold">
                          <span>Đã chọn {selectedQuestionIds.length} câu hỏi của buổi</span>
                          <button
                            onClick={() => setSelectedQuestionIds([])}
                            className="text-xs text-blue-600 hover:underline font-normal"
                          >
                            (Bỏ chọn)
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={handleOpenQuickExam}
                          className="px-3 py-1 bg-[#142B4A] dark:bg-[#38BDF8] text-white dark:text-[#0F172A] rounded-lg text-xs font-bold hover:opacity-95 flex items-center gap-1.5 shadow-xs"
                        >
                          <Layers className="w-3.5 h-3.5" />
                          <span>Tạo đề thi từ các câu đã chọn ({selectedQuestionIds.length})</span>
                        </button>
                      </div>
                    )}

                    {/* Question List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {loadingQuestions ? (
                        <div className="text-center py-12 text-slate-400 text-xs">
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#142B4A]" />
                          Đang tải câu hỏi của buổi học...
                        </div>
                      ) : questions.length === 0 ? (
                        <div className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                          <FileQuestion className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Buổi học chưa có câu hỏi nào</h4>
                          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto mb-4">
                            Bạn có thể tạo câu hỏi trực tiếp, tải file Excel lên hoặc sao chép câu hỏi từ ngân hàng khóa học để soạn đề thi.
                          </p>
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={handleOpenCreateQuestion}
                              className="px-3 py-1.5 bg-[#142B4A] dark:bg-[#38BDF8] text-white dark:text-[#0F172A] text-xs font-bold rounded-lg hover:opacity-90 inline-flex items-center gap-1.5"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Tạo câu hỏi đầu tiên
                            </button>
                            <button
                              onClick={() => setIsImportModalOpen(true)}
                              className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center gap-1.5"
                            >
                              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                              Nhập Excel
                            </button>
                          </div>
                        </div>
                      ) : (
                        questions.map((q, qIndex) => {
                          const isChecked = selectedQuestionIds.includes(q.id)
                          return (
                            <div
                              key={q.id}
                              className={`p-3.5 rounded-xl border transition-all ${
                                isChecked
                                  ? 'border-blue-400 dark:border-blue-500 bg-blue-50/20 dark:bg-blue-950/20'
                                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1E293B]/50 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <div className="flex items-start gap-2.5">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedQuestionIds(prev => [...prev, q.id])
                                      } else {
                                        setSelectedQuestionIds(prev => prev.filter(id => id !== q.id))
                                      }
                                    }}
                                    className="mt-1 w-4 h-4 rounded text-[#142B4A] focus:ring-[#142B4A]"
                                  />
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                        Câu {qIndex + 1}
                                      </span>
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                        {q.type === 'SINGLE_CHOICE' ? 'Trắc nghiệm 1 đáp án' : q.type === 'MULTIPLE_CHOICE' ? 'Nhiều đáp án' : q.type === 'TRUE_FALSE' ? 'Đúng/Sai' : 'Tự luận'}
                                      </span>
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                        q.difficulty === 'EASY' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                                        q.difficulty === 'MEDIUM' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                                        'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                      }`}>
                                        {q.difficulty === 'EASY' ? 'Dễ' : q.difficulty === 'MEDIUM' ? 'Trung bình' : 'Khó'}
                                      </span>
                                      <span className="text-[10px] font-mono text-slate-400">
                                        ({q.defaultPoints} điểm)
                                      </span>
                                    </div>
                                    <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                                      {q.content}
                                    </div>
                                  </div>
                                </div>

                                {/* Row Actions */}
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    onClick={() => handleDuplicateQuestion(q)}
                                    title="Nhân bản câu hỏi"
                                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleOpenEditQuestion(q)}
                                    title="Chỉnh sửa câu hỏi"
                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteQuestion(q.id)}
                                    title="Xóa câu hỏi"
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Options preview */}
                              {q.options && q.options.length > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-6 pt-1 text-xs">
                                  {q.options.map((opt) => (
                                    <div
                                      key={opt.optionCode}
                                      className={`p-1.5 rounded-lg border text-[11px] flex items-center justify-between ${
                                        opt.isCorrect
                                          ? 'border-emerald-200 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 font-semibold'
                                          : 'border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                                      }`}
                                    >
                                      <span><strong>{opt.optionCode}.</strong> {opt.content}</span>
                                      {opt.isCorrect && <Check className="w-3 h-3 text-emerald-600 shrink-0" />}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* Tab 2 Content: Exams */}
                {activeTab === 'EXAMS' && (
                  <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    {/* Action Bar */}
                    <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-[#0F172A]">
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Danh sách các bài thi được gán cho buổi học này ({exams.length} đề thi)
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (questions.length === 0) {
                            alert('Buổi học chưa có câu hỏi nào. Hãy tạo hoặc nhập câu hỏi trước!')
                            setActiveTab('QUESTIONS')
                            return
                          }
                          setSelectedQuestionIds(questions.map(q => q.id))
                          handleOpenQuickExam()
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-[#142B4A] dark:bg-[#38BDF8] text-white dark:text-[#0F172A] hover:opacity-90 text-xs font-bold flex items-center gap-1.5 shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tạo đề thi mới cho buổi</span>
                      </button>
                    </div>

                    {/* Exams Grid */}
                    <div className="flex-1 overflow-y-auto p-4">
                      {loadingExams ? (
                        <div className="text-center py-12 text-slate-400 text-xs">
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#142B4A]" />
                          Đang tải đề thi của buổi...
                        </div>
                      ) : exams.length === 0 ? (
                        <div className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                          <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Chưa có đề thi nào trong buổi học</h4>
                          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto mb-4">
                            Chuyển sang tab "Câu hỏi" để chọn các câu hỏi của buổi và bấm "Tạo đề thi" hoặc tạo đề thi mới ngay bây giờ.
                          </p>
                          <button
                            onClick={() => {
                              if (questions.length > 0) {
                                setSelectedQuestionIds(questions.map(q => q.id))
                                handleOpenQuickExam()
                              } else {
                                setActiveTab('QUESTIONS')
                              }
                            }}
                            className="px-4 py-2 bg-[#142B4A] dark:bg-[#38BDF8] text-white dark:text-[#0F172A] text-xs font-bold rounded-lg hover:opacity-90 inline-flex items-center gap-1.5"
                          >
                            <Plus className="w-4 h-4" />
                            {questions.length > 0 ? 'Tạo đề từ tất cả câu hỏi của buổi' : 'Soạn câu hỏi cho buổi'}
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {exams.map((exam) => (
                            <div
                              key={exam.id}
                              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1E293B]/60 shadow-xs flex flex-col justify-between"
                            >
                              <div>
                                <div className="flex items-center justify-between gap-2 mb-2">
                                  <span className="text-xs font-mono font-bold text-[#142B4A] dark:text-[#38BDF8] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                                    {exam.code}
                                  </span>
                                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                    exam.status === 'PUBLISHED'
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                      : exam.status === 'DRAFT'
                                      ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                      : 'bg-rose-100 text-rose-800'
                                  }`}>
                                    {exam.status === 'PUBLISHED' ? 'Đã phát hành' : exam.status === 'DRAFT' ? 'Bản nháp' : 'Đã đóng'}
                                  </span>
                                </div>

                                <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1 mb-1">
                                  {exam.title}
                                </h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                                  {exam.description || 'Đề kiểm tra thuộc buổi học.'}
                                </p>

                                <div className="grid grid-cols-3 gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 text-center text-xs mb-3">
                                  <div>
                                    <span className="text-[10px] text-slate-400 block">Thời lượng</span>
                                    <strong className="text-slate-800 dark:text-slate-200">{exam.durationMinutes}p</strong>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-slate-400 block">Số câu</span>
                                    <strong className="text-slate-800 dark:text-slate-200">{exam.questionCount} câu</strong>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-slate-400 block">Tổng điểm</span>
                                    <strong className="text-[#142B4A] dark:text-[#38BDF8]">{exam.totalPoints} đ</strong>
                                  </div>
                                </div>
                              </div>

                              {/* Exam Actions */}
                              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <button
                                  type="button"
                                  onClick={() => handleDuplicateExam(exam.id)}
                                  className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-[#142B4A] dark:hover:text-[#38BDF8] inline-flex items-center gap-1 p-1"
                                  title="Sao chép toàn bộ đề thi này thành bản nháp mới"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Nhân bản đề</span>
                                </button>

                                <div className="flex items-center gap-1.5">
                                  {exam.status === 'DRAFT' && (
                                    <button
                                      type="button"
                                      onClick={() => handlePublishExam(exam.id)}
                                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1"
                                    >
                                      <Send className="w-3 h-3" />
                                      Phát hành
                                    </button>
                                  )}
                                  <a
                                    href={`/admin/assessment/analytics/${exam.id}`}
                                    className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1"
                                  >
                                    <Eye className="w-3 h-3" />
                                    Xem kết quả
                                  </a>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
                Vui lòng chọn một buổi học từ danh sách bên trái.
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#1E293B] flex items-center justify-between text-xs">
          <div className="text-slate-500">
            Khóa học: <span className="font-semibold text-slate-700 dark:text-slate-300">{classItem.courseName || classItem.courseCode}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>

      {/* SUB-MODAL 1: CREATE / EDIT QUESTION */}
      {isCreateQModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0F172A] rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800">
            <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-[#1E293B]">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingQuestion ? 'Chỉnh Sửa Câu Hỏi' : 'Tạo Câu Hỏi Mới Cho Buổi Học'}
              </h3>
              <button onClick={() => setIsCreateQModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Dạng câu hỏi</label>
                  <select
                    value={qType}
                    onChange={(e) => setQType(e.target.value as QuestionType)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    <option value="SINGLE_CHOICE">Trắc nghiệm 1 đáp án</option>
                    <option value="MULTIPLE_CHOICE">Trắc nghiệm nhiều đáp án</option>
                    <option value="TRUE_FALSE">Đúng / Sai</option>
                    <option value="ESSAY">Tự luận</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Độ khó</label>
                  <select
                    value={qDifficulty}
                    onChange={(e) => setQDifficulty(e.target.value as QuestionDifficulty)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    <option value="EASY">Dễ</option>
                    <option value="MEDIUM">Trung bình</option>
                    <option value="HARD">Khó</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Chủ đề câu hỏi</label>
                  <input
                    type="text"
                    value={qTopic}
                    onChange={(e) => setQTopic(e.target.value)}
                    placeholder="VD: Grammar, Vocabulary, Topic buổi..."
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Điểm mặc định</label>
                  <input
                    type="number"
                    step="0.25"
                    min="0.25"
                    value={qPoints}
                    onChange={(e) => setQPoints(parseFloat(e.target.value) || 1)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Nội dung câu hỏi <span className="text-red-500">*</span></label>
                <textarea
                  required
                  rows={3}
                  value={qContent}
                  onChange={(e) => setQContent(e.target.value)}
                  placeholder="Nhập nội dung đề bài câu hỏi..."
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              {/* Options for Choice questions */}
              {(qType === 'SINGLE_CHOICE' || qType === 'MULTIPLE_CHOICE' || qType === 'TRUE_FALSE') && (
                <div>
                  <label className="block font-semibold mb-1">Các lựa chọn đáp án & Chọn đáp án đúng:</label>
                  <div className="space-y-2">
                    {qOptions.map((opt, oIdx) => (
                      <div key={oIdx} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (qType === 'SINGLE_CHOICE' || qType === 'TRUE_FALSE') {
                              setQOptions(qOptions.map((o, i) => ({ ...o, isCorrect: i === oIdx })))
                            } else {
                              setQOptions(qOptions.map((o, i) => i === oIdx ? ({ ...o, isCorrect: !o.isCorrect }) : o))
                            }
                          }}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold shrink-0 transition-all ${
                            opt.isCorrect
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                          title={opt.isCorrect ? 'Đáp án đúng' : 'Nhấp để chọn làm đáp án đúng'}
                        >
                          {opt.optionCode}
                        </button>
                        <input
                          type="text"
                          required
                          value={opt.content}
                          onChange={(e) => {
                            const val = e.target.value
                            setQOptions(qOptions.map((o, i) => i === oIdx ? ({ ...o, content: val }) : o))
                          }}
                          placeholder={`Nội dung lựa chọn ${opt.optionCode}...`}
                          className="flex-1 p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold mb-1">Giải thích đáp án (tùy chọn)</label>
                <textarea
                  rows={2}
                  value={qExplanation}
                  onChange={(e) => setQExplanation(e.target.value)}
                  placeholder="Giải thích vì sao đáp án đúng, kiến thức cần nhớ..."
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateQModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingQuestion}
                  className="px-4 py-1.5 bg-[#142B4A] dark:bg-[#38BDF8] text-white dark:text-[#0F172A] font-bold rounded-lg hover:opacity-90 disabled:opacity-50"
                >
                  {savingQuestion ? 'Đang lưu...' : 'Lưu câu hỏi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-MODAL 2: IMPORT EXCEL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0F172A] rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800">
            <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-[#1E293B]">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Nhập Câu Hỏi Bằng Excel Cho Buổi #{selectedSession?.sessionNumber}
                </h3>
              </div>
              <button onClick={() => setIsImportModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Template Download & Instructions */}
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-xl flex items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-emerald-900 dark:text-emerald-200">File mẫu chuẩn CH Academy (.xlsx, .csv)</h4>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                    Hỗ trợ các cột: Nội dung, Dạng câu (SINGLE_CHOICE, MULTIPLE_CHOICE, TRUE_FALSE, ESSAY), Độ khó, Lựa chọn A/B/C/D, Đáp án đúng, Điểm, Giải thích.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shrink-0 flex items-center gap-1.5 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  Tải file mẫu
                </button>
              </div>

              {/* Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-[#142B4A] dark:hover:border-[#38BDF8] rounded-xl p-6 text-center cursor-pointer transition bg-slate-50/50 dark:bg-slate-900/40"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".xlsx,.csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="font-bold text-slate-700 dark:text-slate-300">
                  {importFile ? importFile.name : 'Nhấp hoặc kéo thả file Excel vào đây'}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">Hỗ trợ định dạng .xlsx và .csv (tối đa 10MB)</p>
              </div>

              {/* Loading indicator */}
              {isParsingExcel && (
                <div className="text-center py-4 text-slate-500 flex items-center justify-center gap-2 font-semibold">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#142B4A]" />
                  Đang kiểm tra và xác thực dữ liệu file Excel...
                </div>
              )}

              {/* Preview Rows Table */}
              {previewData && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Kết quả kiểm tra: <span className="text-emerald-600">{previewData.validRowsCount} hợp lệ</span> • <span className="text-rose-600">{previewData.invalidRowsCount} lỗi</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const allValid = new Set<number>()
                        previewData.rows.forEach(r => { if (r.valid) allValid.add(r.rowNumber) })
                        setSelectedImportRows(allValid)
                      }}
                      className="text-blue-600 hover:underline font-semibold"
                    >
                      Chọn tất cả dòng hợp lệ
                    </button>
                  </div>

                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 font-bold text-slate-600 dark:text-slate-300">
                        <tr>
                          <th className="p-2 w-8"></th>
                          <th className="p-2 w-12">Dòng</th>
                          <th className="p-2">Nội dung câu hỏi</th>
                          <th className="p-2 w-24">Dạng</th>
                          <th className="p-2 w-28">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {previewData.rows.map((row) => (
                          <tr key={row.rowNumber} className={row.valid ? 'hover:bg-slate-50 dark:hover:bg-slate-800/50' : 'bg-rose-50/40 dark:bg-rose-950/20'}>
                            <td className="p-2">
                              {row.valid && (
                                <input
                                  type="checkbox"
                                  checked={selectedImportRows.has(row.rowNumber)}
                                  onChange={(e) => {
                                    const next = new Set(selectedImportRows)
                                    if (e.target.checked) next.add(row.rowNumber)
                                    else next.delete(row.rowNumber)
                                    setSelectedImportRows(next)
                                  }}
                                  className="w-3.5 h-3.5 rounded text-[#142B4A]"
                                />
                              )}
                            </td>
                            <td className="p-2 font-mono text-slate-500">{row.rowNumber}</td>
                            <td className="p-2 line-clamp-1">{row.questionText}</td>
                            <td className="p-2 font-mono text-[10px]">{row.questionType}</td>
                            <td className="p-2">
                              {row.valid ? (
                                <span className="text-emerald-600 font-bold flex items-center gap-1">
                                  <Check className="w-3 h-3" /> Hợp lệ
                                </span>
                              ) : (
                                <span className="text-rose-600 font-bold" title={row.errorMessage || ''}>
                                  {row.errorMessage || 'Lỗi dữ liệu'}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  disabled={!previewData || selectedImportRows.size === 0 || isConfirmingImport}
                  onClick={handleConfirmImport}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isConfirmingImport ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Đang nhập dữ liệu...
                    </>
                  ) : (
                    `Xác nhận nhập (${selectedImportRows.size} câu)`
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODAL 3: QUICK EXAM CREATION */}
      {isQuickExamModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0F172A] rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800">
            <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-[#1E293B]">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Tạo Đề Thi Từ {selectedQuestionIds.length} Câu Hỏi Đã Chọn
              </h3>
              <button onClick={() => setIsQuickExamModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickExam} className="p-5 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Tên đề thi <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Mã đề thi</label>
                <input
                  type="text"
                  value={examCode}
                  onChange={(e) => setExamCode(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Thời gian làm bài (phút)</label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    value={examDuration}
                    onChange={(e) => setExamDuration(parseInt(e.target.value) || 15)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Điểm đạt (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={examPassPercent}
                    onChange={(e) => setExamPassPercent(parseInt(e.target.value) || 50)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Trạng thái ban đầu</label>
                <select
                  value={examStatus}
                  onChange={(e) => setExamStatus(e.target.value as 'DRAFT' | 'PUBLISHED')}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                >
                  <option value="DRAFT">Lưu bản nháp (Giáo viên xem lại trước khi giao)</option>
                  <option value="PUBLISHED">Phát hành ngay (Học viên lớp có thể làm bài ngay)</option>
                </select>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-300">
                <span className="font-bold">Lớp áp dụng:</span> {classItem.name} ({classItem.code}) • Buổi học #{selectedSession?.sessionNumber}
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsQuickExamModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingExam}
                  className="px-4 py-1.5 bg-[#142B4A] dark:bg-[#38BDF8] text-white dark:text-[#0F172A] font-bold rounded-lg hover:opacity-90 disabled:opacity-50"
                >
                  {savingExam ? 'Đang tạo...' : 'Tạo đề thi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-MODAL 4: BORROW QUESTIONS FROM COURSE BANK */}
      {isBorrowModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0F172A] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800">
            <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-[#1E293B]">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Lấy Câu Hỏi Từ Ngân Hàng Khóa Học Vào Buổi #{selectedSession?.sessionNumber}
                </h3>
              </div>
              <button onClick={() => setIsBorrowModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3 text-xs">
              <p className="text-slate-500">
                Chọn các câu hỏi dưới đây để sao chép vào buổi học này mà không làm ảnh hưởng ngân hàng gốc:
              </p>

              {loadingBankQuestions ? (
                <div className="text-center py-8 text-slate-400">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#142B4A]" />
                  Đang tải ngân hàng câu hỏi...
                </div>
              ) : bankQuestions.length === 0 ? (
                <div className="p-8 text-center text-slate-400 italic">
                  Không còn câu hỏi khả dụng nào trong khóa học này.
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {bankQuestions.map((bq) => {
                    const isChecked = selectedBorrowIds.includes(bq.id)
                    return (
                      <div
                        key={bq.id}
                        onClick={() => {
                          if (isChecked) {
                            setSelectedBorrowIds(prev => prev.filter(id => id !== bq.id))
                          } else {
                            setSelectedBorrowIds(prev => [...prev, bq.id])
                          }
                        }}
                        className={`p-3 cursor-pointer flex items-start gap-2.5 transition ${
                          isChecked ? 'bg-indigo-50/60 dark:bg-indigo-950/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="mt-1 w-4 h-4 rounded text-indigo-600"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-mono text-[10px] text-slate-400">{bq.code}</span>
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold">
                              {bq.topic || 'Chung'}
                            </span>
                          </div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-2">
                            {bq.content}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBorrowModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={selectedBorrowIds.length === 0}
                  onClick={handleConfirmBorrow}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg disabled:opacity-50"
                >
                  Sao chép {selectedBorrowIds.length} câu hỏi vào buổi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
