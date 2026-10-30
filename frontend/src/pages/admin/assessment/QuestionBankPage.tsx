import React, { useEffect, useState, useCallback, useRef } from 'react'
import { assessmentApi } from '../../../api/assessment'
import type {
  QuestionItem,
  QuestionType,
  QuestionDifficulty,
  QuestionImportPreview
} from '../../../types/assessment'
import {
  HelpCircle,
  Plus,
  Search,
  Trash2,
  Edit3,
  Download,
  X,
  Check,
  FileSpreadsheet,
  UploadCloud,
  AlertCircle,
  CheckCircle2,
  XCircle,
  FileDown,
  Loader2,
  RefreshCw,
  AlertTriangle
} from 'lucide-react'

export const QuestionBankPage: React.FC = () => {
  const [questions, setQuestions] = useState<QuestionItem[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [difficultyFilter, setDifficultyFilter] = useState<string>('')
  const [topicFilter, setTopicFilter] = useState<string>('')

  // Create/Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<QuestionItem | null>(null)
  const [formType, setFormType] = useState<QuestionType>('SINGLE_CHOICE')
  const [formDifficulty, setFormDifficulty] = useState<QuestionDifficulty>('MEDIUM')
  const [formTopic, setFormTopic] = useState('Business English')
  const [formContent, setFormContent] = useState('')
  const [formPoints, setFormPoints] = useState(1.0)
  const [formExplanation, setFormExplanation] = useState('')
  const [formAnswerKey, setFormAnswerKey] = useState('')
  const [formRubric, setFormRubric] = useState('')
  const [formOptions, setFormOptions] = useState<Array<{ optionCode: string; content: string; isCorrect: boolean }>>([
    { optionCode: 'A', content: '', isCorrect: true },
    { optionCode: 'B', content: '', isCorrect: false },
    { optionCode: 'C', content: '', isCorrect: false },
    { optionCode: 'D', content: '', isCorrect: false }
  ])
  const [submitting, setSubmitting] = useState(false)

  // Excel Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [importStep, setImportStep] = useState<'UPLOAD' | 'PREVIEW'>('UPLOAD')
  const [importFile, setImportFile] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState<QuestionImportPreview | null>(null)
  const [selectedRowIndices, setSelectedRowIndices] = useState<Set<number>>(new Set())
  const [isParsing, setIsParsing] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [successToast, setSuccessToast] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchQuestions = useCallback(async () => {
    try {
      setLoading(true)
      const res = await assessmentApi.searchQuestions({
        type: typeFilter || undefined,
        difficulty: difficultyFilter || undefined,
        topic: topicFilter || undefined,
        search: search.trim() || undefined,
        size: 50
      })
      if (res.success && res.data) {
        setQuestions(res.data.content || [])
      }
    } catch (err: unknown) {
      console.error('Failed to load questions:', err)
    } finally {
      setLoading(false)
    }
  }, [typeFilter, difficultyFilter, topicFilter, search])

  useEffect(() => {
    fetchQuestions()
  }, [fetchQuestions])

  const openCreateModal = () => {
    setEditingQuestion(null)
    setFormType('SINGLE_CHOICE')
    setFormDifficulty('MEDIUM')
    setFormTopic('Business English')
    setFormContent('')
    setFormPoints(1.0)
    setFormExplanation('')
    setFormAnswerKey('')
    setFormRubric('')
    setFormOptions([
      { optionCode: 'A', content: '', isCorrect: true },
      { optionCode: 'B', content: '', isCorrect: false },
      { optionCode: 'C', content: '', isCorrect: false },
      { optionCode: 'D', content: '', isCorrect: false }
    ])
    setIsModalOpen(true)
  }

  const openEditModal = (q: QuestionItem) => {
    setEditingQuestion(q)
    setFormType(q.type)
    setFormDifficulty(q.difficulty)
    setFormTopic(q.topic || 'Business English')
    setFormContent(q.content)
    setFormPoints(q.defaultPoints)
    setFormExplanation(q.explanation || '')
    setFormAnswerKey(q.answerKey || '')
    setFormRubric(q.rubricJson || '')

    if (q.options && q.options.length > 0) {
      setFormOptions(
        q.options.map((opt) => ({
          optionCode: opt.optionCode,
          content: opt.content,
          isCorrect: !!opt.isCorrect
        }))
      )
    } else {
      setFormOptions([
        { optionCode: 'A', content: '', isCorrect: true },
        { optionCode: 'B', content: '', isCorrect: false }
      ])
    }
    setIsModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa câu hỏi này?')) return
    try {
      await assessmentApi.deleteQuestion(id)
      fetchQuestions()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Lỗi xóa câu hỏi')
    }
  }

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formContent.trim()) {
      alert('Vui lòng nhập nội dung câu hỏi!')
      return
    }

    setSubmitting(true)
    try {
      const payload: Partial<QuestionItem> = {
        type: formType,
        difficulty: formDifficulty,
        topic: formTopic.trim(),
        content: formContent.trim(),
        defaultPoints: Number(formPoints),
        explanation: formExplanation.trim() || undefined,
        answerKey: formAnswerKey.trim() || undefined,
        rubricJson: formRubric.trim() || undefined,
        options: (formType === 'SINGLE_CHOICE' || formType === 'MULTIPLE_CHOICE' || formType === 'TRUE_FALSE')
          ? formOptions.map((o, idx) => ({
              optionCode: o.optionCode,
              content: o.content.trim(),
              isCorrect: o.isCorrect,
              sortOrder: idx + 1
            }))
          : []
      }

      if (editingQuestion) {
        await assessmentApi.updateQuestion(editingQuestion.id, payload)
      } else {
        await assessmentApi.createQuestion(payload)
      }

      setIsModalOpen(false)
      fetchQuestions()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Lỗi lưu câu hỏi')
    } finally {
      setSubmitting(false)
    }
  }

  // Export JSON
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(questions, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', `question_bank_export_${Date.now()}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  // Excel Import Actions
  const handleOpenImportModal = () => {
    setImportStep('UPLOAD')
    setImportFile(null)
    setPreviewData(null)
    setImportError(null)
    setSelectedRowIndices(new Set())
    setIsImportModalOpen(true)
  }

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
    } catch (err) {
      alert('Không thể tải file mẫu Excel: ' + (err instanceof Error ? err.message : 'Lỗi kết nối'))
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const f = e.target.files[0]
      if (f.size > 10 * 1024 * 1024) {
        setImportError('Kích thước file không được vượt quá 10MB.')
        return
      }
      setImportFile(f)
      setImportError(null)
    }
  }

  const handlePreviewUpload = async () => {
    if (!importFile) {
      setImportError('Vui lòng chọn file Excel hoặc CSV để tải lên.')
      return
    }

    try {
      setIsParsing(true)
      setImportError(null)
      const res = await assessmentApi.previewQuestionImport(importFile)
      if (res.success && res.data) {
        setPreviewData(res.data)
        const validIndices = new Set<number>()
        res.data.rows.forEach((r, idx) => {
          if (r.valid) validIndices.add(idx)
        })
        setSelectedRowIndices(validIndices)
        setImportStep('PREVIEW')
      } else {
        setImportError(res.message || 'Không thể đọc file. Vui lòng kiểm tra định dạng.')
      }
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Lỗi khi kiểm tra file Excel')
    } finally {
      setIsParsing(false)
    }
  }

  const handleToggleRow = (idx: number) => {
    const next = new Set(selectedRowIndices)
    if (next.has(idx)) {
      next.delete(idx)
    } else {
      next.add(idx)
    }
    setSelectedRowIndices(next)
  }

  const handleSelectAllValid = () => {
    if (!previewData) return
    const next = new Set<number>()
    previewData.rows.forEach((r, idx) => {
      if (r.valid) next.add(idx)
    })
    setSelectedRowIndices(next)
  }

  const handleDeselectAll = () => {
    setSelectedRowIndices(new Set())
  }

  const handleConfirmImport = async () => {
    if (!previewData) return
    const selectedRows = previewData.rows.filter((_, idx) => selectedRowIndices.has(idx))
    if (selectedRows.length === 0) {
      alert('Vui lòng chọn ít nhất 1 câu hỏi hợp lệ để nhập.')
      return
    }

    try {
      setIsConfirming(true)
      const res = await assessmentApi.confirmQuestionImport({
        selectedRows
      })
      if (res.success) {
        setIsImportModalOpen(false)
        setPreviewData(null)
        setImportFile(null)
        setSuccessToast(`Đã nhập thành công ${res.data} câu hỏi vào ngân hàng!`)
        setTimeout(() => setSuccessToast(null), 5000)
        fetchQuestions() // Update state without reloading full app
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Lỗi khi lưu câu hỏi vào hệ thống')
    } finally {
      setIsConfirming(false)
    }
  }

  const getDifficultyBadge = (diff: QuestionDifficulty) => {
    switch (diff) {
      case 'EASY':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">Dễ</span>
      case 'MEDIUM':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">Trung bình</span>
      case 'HARD':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">Khó</span>
      case 'EXPERT':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">Chuyên sâu</span>
      default:
        return null
    }
  }

  const getTypeBadge = (type: QuestionType) => {
    switch (type) {
      case 'SINGLE_CHOICE':
        return <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">Trắc nghiệm đơn</span>
      case 'MULTIPLE_CHOICE':
        return <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">Nhiều đáp án</span>
      case 'TRUE_FALSE':
        return <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">Đúng/Sai</span>
      case 'FILL_IN_BLANK':
        return <span className="text-xs font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">Điền khuyết</span>
      case 'SHORT_ANSWER':
        return <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">Trả lời ngắn</span>
      case 'ESSAY':
        return <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">Tự luận</span>
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-5 right-5 z-50 p-4 rounded-2xl bg-emerald-600 text-white shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-sm font-bold">{successToast}</span>
          <button onClick={() => setSuccessToast(null)} className="ml-2 p-1 hover:bg-white/20 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#151F31] p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#142B4A] dark:text-[#38BDF8]">
              <HelpCircle className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Ngân Hàng Câu Hỏi
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Quản lý kho câu hỏi trắc nghiệm, tự luận, đúng sai và nhập liệu hàng loạt từ file Excel
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleDownloadTemplate}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center gap-1.5"
            title="Tải mẫu Excel chuẩn để điền câu hỏi"
          >
            <FileDown className="w-4 h-4 text-emerald-600" />
            <span>Mẫu Excel</span>
          </button>

          <button
            onClick={handleOpenImportModal}
            className="px-4 py-2.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 font-bold text-xs sm:text-sm hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition flex items-center gap-2 shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Nhập từ Excel</span>
          </button>

          <button
            onClick={handleExportJson}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Xuất JSON</span>
          </button>

          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-xl bg-[#142B4A] dark:bg-[#38BDF8] text-white dark:text-[#0B1220] font-bold text-xs sm:text-sm shadow-md hover:opacity-90 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo câu hỏi</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-[#151F31] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo nội dung, mã câu..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm focus:outline-none focus:border-[#142B4A] dark:focus:border-[#38BDF8]"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-700 dark:text-slate-300 outline-none"
        >
          <option value="">Tất cả loại câu hỏi</option>
          <option value="SINGLE_CHOICE">Trắc nghiệm đơn</option>
          <option value="MULTIPLE_CHOICE">Nhiều đáp án</option>
          <option value="TRUE_FALSE">Đúng / Sai</option>
          <option value="FILL_IN_BLANK">Điền khuyết</option>
          <option value="SHORT_ANSWER">Trả lời ngắn</option>
          <option value="ESSAY">Tự luận</option>
        </select>

        <select
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-700 dark:text-slate-300 outline-none"
        >
          <option value="">Tất cả độ khó</option>
          <option value="EASY">Dễ</option>
          <option value="MEDIUM">Trung bình</option>
          <option value="HARD">Khó</option>
          <option value="EXPERT">Chuyên sâu</option>
        </select>

        <input
          type="text"
          value={topicFilter}
          onChange={(e) => setTopicFilter(e.target.value)}
          placeholder="Lọc theo chủ đề (Topic)..."
          className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-700 dark:text-slate-300 outline-none"
        />
      </div>

      {/* Question List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white dark:bg-[#151F31] rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="w-10 h-10 border-4 border-[#142B4A] dark:border-[#38BDF8] border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-sm font-bold text-slate-500">Đang tải danh sách câu hỏi...</p>
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-[#151F31] rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <HelpCircle className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">Không tìm thấy câu hỏi nào</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Chưa có câu hỏi nào khớp với bộ lọc, hoặc ngân hàng đang trống. Bạn có thể tạo mới hoặc tải file Excel lên.
          </p>
          <div className="flex items-center justify-center gap-3 mt-4">
            <button
              onClick={handleOpenImportModal}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition"
            >
              Nhập từ Excel
            </button>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 rounded-xl bg-[#142B4A] text-white font-bold text-xs hover:opacity-90 transition"
            >
              Tạo câu hỏi đầu tiên
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-500">
              Hiển thị {questions.length} câu hỏi
            </span>
          </div>

          {questions.map((q, idx) => (
            <div
              key={q.id}
              className="bg-white dark:bg-[#151F31] p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-black text-slate-400 font-mono">#{idx + 1}</span>
                  {getTypeBadge(q.type)}
                  {getDifficultyBadge(q.difficulty)}
                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {q.topic || 'Chung'}
                  </span>
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 ml-1">
                    {q.defaultPoints} điểm
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => openEditModal(q)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition"
                    title="Chỉnh sửa"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(q.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
                    title="Xóa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="font-semibold text-sm sm:text-base text-slate-900 dark:text-white leading-relaxed mb-3">
                {q.content}
              </div>

              {/* Options */}
              {q.options && q.options.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  {q.options.map((opt) => (
                    <div
                      key={opt.optionCode}
                      className={`p-2.5 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-between border ${
                        opt.isCorrect
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 font-bold'
                          : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                          opt.isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}>
                          {opt.optionCode}
                        </span>
                        <span>{opt.content}</span>
                      </div>
                      {opt.isCorrect && (
                        <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {q.answerKey && (
                <div className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl mt-3 flex items-center gap-2">
                  <span className="font-bold text-emerald-600">Đáp án chuẩn:</span>
                  <span>{q.answerKey}</span>
                </div>
              )}

              {q.explanation && (
                <p className="text-xs text-slate-500 italic mt-2">
                  <span className="font-bold text-slate-600 dark:text-slate-400">Giải thích: </span>
                  {q.explanation}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: TẠO / SỬA CÂU HỎI (RESPONSIVE CHUẨN) */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#151F31] rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col border border-slate-200 dark:border-slate-800 shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-auto">
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                {editingQuestion ? 'Chỉnh Sửa Câu Hỏi' : 'Tạo Câu Hỏi Mới'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSaveQuestion} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                    Loại câu hỏi
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as QuestionType)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm outline-none font-medium"
                  >
                    <option value="SINGLE_CHOICE">Trắc nghiệm 1 đáp án</option>
                    <option value="MULTIPLE_CHOICE">Trắc nghiệm nhiều đáp án</option>
                    <option value="TRUE_FALSE">Đúng / Sai</option>
                    <option value="SHORT_ANSWER">Trả lời ngắn</option>
                    <option value="ESSAY">Tự luận</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                    Độ khó
                  </label>
                  <select
                    value={formDifficulty}
                    onChange={(e) => setFormDifficulty(e.target.value as QuestionDifficulty)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm outline-none font-medium"
                  >
                    <option value="EASY">Dễ</option>
                    <option value="MEDIUM">Trung bình</option>
                    <option value="HARD">Khó</option>
                    <option value="EXPERT">Chuyên sâu</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                    Điểm mặc định
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    min="0.25"
                    max="100"
                    value={formPoints}
                    onChange={(e) => setFormPoints(parseFloat(e.target.value) || 1)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm outline-none font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  Chủ đề / Đơn vị kiến thức (Topic)
                </label>
                <input
                  type="text"
                  value={formTopic}
                  onChange={(e) => setFormTopic(e.target.value)}
                  placeholder="Ví dụ: Business English, Mạng máy tính, Java Core..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  Nội dung câu hỏi *
                </label>
                <textarea
                  rows={3}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Nhập nội dung đề bài câu hỏi..."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm outline-none"
                />
              </div>

              {/* Options Section for Choice Types */}
              {(formType === 'SINGLE_CHOICE' || formType === 'MULTIPLE_CHOICE' || formType === 'TRUE_FALSE') && (
                <div className="space-y-2.5 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Các phương án trả lời & Đáp án đúng
                    </label>
                    {formType !== 'TRUE_FALSE' && (
                      <button
                        type="button"
                        onClick={() => {
                          const nextCode = String.fromCharCode(65 + formOptions.length)
                          setFormOptions([...formOptions, { optionCode: nextCode, content: '', isCorrect: false }])
                        }}
                        className="text-xs font-bold text-blue-600 hover:underline"
                      >
                        + Thêm phương án
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {formOptions.map((opt, idx) => (
                      <div key={opt.optionCode} className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs shrink-0">
                          {opt.optionCode}
                        </span>
                        <input
                          type="text"
                          value={opt.content}
                          onChange={(e) => {
                            const next = [...formOptions]
                            next[idx].content = e.target.value
                            setFormOptions(next)
                          }}
                          placeholder={`Nội dung phương án ${opt.optionCode}`}
                          className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm outline-none"
                        />
                        <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer shrink-0 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
                          <input
                            type={formType === 'SINGLE_CHOICE' || formType === 'TRUE_FALSE' ? 'radio' : 'checkbox'}
                            name="correct_answer_group"
                            checked={opt.isCorrect}
                            onChange={(e) => {
                              const next = [...formOptions]
                              if (formType === 'SINGLE_CHOICE' || formType === 'TRUE_FALSE') {
                                next.forEach((o, i) => (o.isCorrect = i === idx))
                              } else {
                                next[idx].isCorrect = e.target.checked
                              }
                              setFormOptions(next)
                            }}
                          />
                          <span>Đúng</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Short Answer Key */}
              {formType === 'SHORT_ANSWER' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                    Đáp án chuẩn / Từ khóa chính xác *
                  </label>
                  <input
                    type="text"
                    value={formAnswerKey}
                    onChange={(e) => setFormAnswerKey(e.target.value)}
                    placeholder="Ví dụ: WAN, HTTP, TCP/IP..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm outline-none font-bold"
                  />
                </div>
              )}

              {/* Rubric */}
              {formType === 'ESSAY' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                    Rubric chấm điểm / Hướng dẫn chấm
                  </label>
                  <textarea
                    rows={2}
                    value={formRubric}
                    onChange={(e) => setFormRubric(e.target.value)}
                    placeholder="Tiêu chí chấm điểm tự luận..."
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  Lời giải / Hướng dẫn giải chi tiết
                </label>
                <textarea
                  rows={2}
                  value={formExplanation}
                  onChange={(e) => setFormExplanation(e.target.value)}
                  placeholder="Giải thích vì sao đáp án đúng..."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm outline-none"
                />
              </div>

              {/* Footer */}
              <div className="flex flex-wrap items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-[#142B4A] dark:bg-[#38BDF8] text-white dark:text-[#0B1220] font-bold text-xs sm:text-sm shadow hover:opacity-90 disabled:opacity-50"
                >
                  {submitting ? 'Đang lưu...' : 'Lưu câu hỏi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: NHẬP CÂU HỎI TỪ EXCEL (PILLAR 2 HOÀN CHỈNH) */}
      {/* ========================================================================= */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#151F31] rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col border border-slate-200 dark:border-slate-800 shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-auto">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <FileSpreadsheet className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    Nhập Ngân Hàng Câu Hỏi Từ Excel
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {importStep === 'UPLOAD'
                      ? 'Bước 1: Chọn file .xlsx, .xls hoặc .csv để đọc nội dung'
                      : 'Bước 2: Xem trước, kiểm tra tính hợp lệ và xác nhận nhập'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error banner in modal */}
            {importError && (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/50 border-b border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 font-semibold flex items-center gap-2 shrink-0">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
              {importStep === 'UPLOAD' ? (
                <div className="space-y-5">
                  {/* Download template notice */}
                  <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-[#142B4A] dark:text-[#38BDF8] flex items-center gap-1.5">
                        <FileDown className="w-4 h-4" />
                        Chưa có file mẫu Excel chuẩn?
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400">
                        Tải file mẫu có sẵn ví dụ cho trắc nghiệm 1 đáp án, nhiều đáp án, đúng/sai, trả lời ngắn và tự luận.
                      </p>
                    </div>
                    <button
                      onClick={handleDownloadTemplate}
                      className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-700 text-xs font-bold text-[#142B4A] dark:text-[#38BDF8] hover:bg-blue-50 shrink-0 shadow-sm"
                    >
                      Tải mẫu .xlsx chuẩn
                    </button>
                  </div>

                  {/* Dropzone area */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 sm:p-12 text-center hover:border-emerald-500 dark:hover:border-emerald-500 cursor-pointer transition bg-slate-50/50 dark:bg-slate-900/50"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <UploadCloud className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-3" />
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {importFile ? (
                        <span className="text-emerald-600 dark:text-emerald-400">{importFile.name}</span>
                      ) : (
                        'Kéo thả file vào đây hoặc bấm để duyệt file từ máy tính'
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Hỗ trợ định dạng .xlsx, .xls, .csv (Tối đa 10MB, tối đa 1.000 dòng câu hỏi)
                    </p>
                  </div>

                  {/* Format instructions */}
                  <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
                    <div className="font-bold text-slate-700 dark:text-slate-300">
                      Cấu trúc tiêu đề các cột chuẩn:
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
                      <span className="p-1 rounded bg-slate-200 dark:bg-slate-800">question_text (*)</span>
                      <span className="p-1 rounded bg-slate-200 dark:bg-slate-800">question_type (*)</span>
                      <span className="p-1 rounded bg-slate-200 dark:bg-slate-800">option_a ... option_f</span>
                      <span className="p-1 rounded bg-slate-200 dark:bg-slate-800">correct_answer (*)</span>
                      <span className="p-1 rounded bg-slate-200 dark:bg-slate-800">points</span>
                      <span className="p-1 rounded bg-slate-200 dark:bg-slate-800">difficulty</span>
                      <span className="p-1 rounded bg-slate-200 dark:bg-slate-800">topic</span>
                      <span className="p-1 rounded bg-slate-200 dark:bg-slate-800">explanation</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Step 2: PREVIEW */
                <div className="space-y-4">
                  {/* Summary Counters */}
                  {previewData && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                        <div className="text-[11px] font-semibold text-slate-500">Tổng số dòng đọc được</div>
                        <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                          {previewData.totalRows}
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center">
                        <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">Hợp lệ (Sẵn sàng)</div>
                        <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                          {previewData.validRowsCount}
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-center">
                        <div className="text-[11px] font-semibold text-rose-700 dark:text-rose-300">Không hợp lệ / Lỗi</div>
                        <div className="text-xl font-black text-rose-600 dark:text-rose-400 mt-0.5">
                          {previewData.invalidRowsCount}
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-center">
                        <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">Trùng lặp (Đã có)</div>
                        <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
                          {previewData.duplicateRowsCount}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSelectAllValid}
                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Chọn tất cả hợp lệ
                      </button>
                      <span className="text-slate-300">•</span>
                      <button
                        type="button"
                        onClick={handleDeselectAll}
                        className="text-xs font-bold text-slate-500 hover:underline"
                      >
                        Bỏ chọn tất cả
                      </button>
                    </div>

                    <div className="text-xs font-semibold text-slate-500">
                      Đã chọn: <strong className="text-slate-900 dark:text-white">{selectedRowIndices.size}</strong> câu hỏi dự kiến nhập
                    </div>
                  </div>

                  {/* Preview Table */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto max-h-[50vh]">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-900 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase tracking-wider font-bold text-[10px]">
                        <tr>
                          <th className="py-2.5 px-3 text-center w-10">Chọn</th>
                          <th className="py-2.5 px-3 w-12 text-center">#</th>
                          <th className="py-2.5 px-3 min-w-[240px]">Nội dung câu hỏi</th>
                          <th className="py-2.5 px-3 min-w-[100px]">Loại câu</th>
                          <th className="py-2.5 px-3 min-w-[80px]">Đáp án</th>
                          <th className="py-2.5 px-3 w-16 text-center">Điểm</th>
                          <th className="py-2.5 px-3 min-w-[90px]">Chủ đề</th>
                          <th className="py-2.5 px-3 min-w-[160px]">Trạng thái / Ghi chú lỗi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                        {previewData?.rows.map((row, idx) => (
                          <tr
                            key={idx}
                            className={`hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition ${
                              !row.valid ? 'bg-rose-50/30 dark:bg-rose-950/20' : row.duplicate ? 'bg-amber-50/30 dark:bg-amber-950/20' : ''
                            }`}
                          >
                            <td className="py-2.5 px-3 text-center">
                              <input
                                type="checkbox"
                                checked={selectedRowIndices.has(idx)}
                                disabled={!row.valid}
                                onChange={() => handleToggleRow(idx)}
                                className="rounded cursor-pointer"
                              />
                            </td>

                            <td className="py-2.5 px-3 text-center font-mono text-slate-400">
                              {row.rowNumber}
                            </td>

                            <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                              <div className="line-clamp-2">{row.questionText}</div>
                            </td>

                            <td className="py-2.5 px-3">
                              <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                                {row.questionType}
                              </span>
                            </td>

                            <td className="py-2.5 px-3 font-bold text-emerald-600 dark:text-emerald-400">
                              {row.correctAnswer || '—'}
                            </td>

                            <td className="py-2.5 px-3 text-center font-bold">
                              {row.points}
                            </td>

                            <td className="py-2.5 px-3 text-slate-500">
                              {row.topic}
                            </td>

                            <td className="py-2.5 px-3">
                              {row.valid && !row.duplicate && (
                                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Hợp lệ
                                </span>
                              )}
                              {row.valid && row.duplicate && (
                                <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                                  <AlertTriangle className="w-3.5 h-3.5" /> Đã tồn tại trong hệ thống
                                </span>
                              )}
                              {!row.valid && (
                                <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold" title={row.errorMessage}>
                                  <XCircle className="w-3.5 h-3.5 shrink-0" />
                                  <span className="line-clamp-1">{row.errorMessage}</span>
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
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
              {importStep === 'UPLOAD' ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsImportModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    disabled={!importFile || isParsing}
                    onClick={handlePreviewUpload}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs sm:text-sm shadow hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isParsing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Đang đọc & xác thực file...
                      </>
                    ) : (
                      'Tiến hành xem trước & kiểm tra'
                    )}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setImportStep('UPLOAD')}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Tải file khác
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsImportModalOpen(false)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Đóng
                    </button>
                    <button
                      type="button"
                      disabled={selectedRowIndices.size === 0 || isConfirming}
                      onClick={handleConfirmImport}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs sm:text-sm shadow hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      {isConfirming ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Đang lưu vào ngân hàng...
                        </>
                      ) : (
                        `Xác nhận nhập (${selectedRowIndices.size} câu hỏi)`
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default QuestionBankPage
