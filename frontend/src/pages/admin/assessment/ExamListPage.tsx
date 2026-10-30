import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { assessmentApi } from '../../../api/assessment'
import { classesApi } from '../../../api/classes'
import type { ExamItem, QuestionItem, ExamStatus } from '../../../types/assessment'
import type { ClassItem } from '../../../types/class'
import {
  FileText,
  Plus,
  Search,
  Users,
  Eye,
  BarChart3,
  RotateCw,
  Send,
  X,
  Check,
  Copy
} from 'lucide-react'

export const ExamListPage: React.FC = () => {
  const navigate = useNavigate()
  const [exams, setExams] = useState<ExamItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingExam, setEditingExam] = useState<ExamItem | null>(null)

  // Available Questions & Classes
  const [availableQuestions, setAvailableQuestions] = useState<QuestionItem[]>([])
  const [availableClasses, setAvailableClasses] = useState<ClassItem[]>([])

  // Form Fields
  const [formTitle, setFormTitle] = useState('')
  const [formCode, setFormCode] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formDuration, setFormDuration] = useState(45)
  const [formPassPercent, setFormPassPercent] = useState(50)
  const [formMaxAttempts, setFormMaxAttempts] = useState(1)
  const [formShuffleQuestions, setFormShuffleQuestions] = useState(true)
  const [formShuffleOptions, setFormShuffleOptions] = useState(true)
  const [formShowResultMode, setFormShowResultMode] = useState<'IMMEDIATELY' | 'AFTER_CLOSED' | 'MANUAL'>('IMMEDIATELY')
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<number[]>([])
  const [questionPointsMap, setQuestionPointsMap] = useState<Record<number, number>>({})
  const [selectedClassIds, setSelectedClassIds] = useState<number[]>([])
  const [submitting, setSubmitting] = useState(false)

  // Preview Modal
  const [previewExam, setPreviewExam] = useState<ExamItem | null>(null)

  const fetchExams = useCallback(async () => {
    try {
      setLoading(true)
      const res = await assessmentApi.searchExams({
        status: statusFilter || undefined,
        search: search.trim() || undefined,
        size: 50
      })
      if (res.success && res.data) {
        setExams(res.data.content || [])
      }
    } catch (err: unknown) {
      console.error('Failed to load exams:', err)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, search])

  useEffect(() => {
    fetchExams()
  }, [fetchExams])

  // Load questions and classes for modal
  useEffect(() => {
    const loadDependencies = async () => {
      try {
        const [qRes, cRes] = await Promise.all([
          assessmentApi.searchQuestions({ size: 100 }),
          classesApi.searchClasses({ size: 100 })
        ])
        if (qRes.success && qRes.data) {
          setAvailableQuestions(qRes.data.content || [])
        }
        if (cRes.success && cRes.data) {
          setAvailableClasses(cRes.data.content || [])
        }
      } catch (err) {
        console.error('Error loading questions/classes for exam editor:', err)
      }
    }
    loadDependencies()
  }, [])

  const openCreateModal = () => {
    setEditingExam(null)
    setFormTitle('')
    setFormCode('EXAM-' + Date.now().toString().slice(-6))
    setFormDescription('')
    setFormDuration(45)
    setFormPassPercent(50)
    setFormMaxAttempts(1)
    setFormShuffleQuestions(true)
    setFormShuffleOptions(true)
    setFormShowResultMode('IMMEDIATELY')
    setSelectedQuestionIds([])
    setQuestionPointsMap({})
    setSelectedClassIds([])
    setIsModalOpen(true)
  }

  const openEditModal = (exam: ExamItem) => {
    setEditingExam(exam)
    setFormTitle(exam.title)
    setFormCode(exam.code)
    setFormDescription(exam.description || '')
    setFormDuration(exam.durationMinutes)
    setFormPassPercent(exam.passPercentage)
    setFormMaxAttempts(exam.maxAttempts)
    setFormShuffleQuestions(exam.shuffleQuestions)
    setFormShuffleOptions(exam.shuffleOptions)
    setFormShowResultMode(exam.showResultMode)

    const qIds = exam.questions?.map((q) => q.questionId) || []
    setSelectedQuestionIds(qIds)

    const pMap: Record<number, number> = {}
    exam.questions?.forEach((q) => {
      pMap[q.questionId] = q.points
    })
    setQuestionPointsMap(pMap)

    setSelectedClassIds(exam.assignedClassIds || [])
    setIsModalOpen(true)
  }

  const handleToggleQuestion = (q: QuestionItem) => {
    const isSelected = selectedQuestionIds.includes(q.id)
    if (isSelected) {
      setSelectedQuestionIds(selectedQuestionIds.filter((id) => id !== q.id))
      const nextMap = { ...questionPointsMap }
      delete nextMap[q.id]
      setQuestionPointsMap(nextMap)
    } else {
      setSelectedQuestionIds([...selectedQuestionIds, q.id])
      setQuestionPointsMap({
        ...questionPointsMap,
        [q.id]: q.defaultPoints || 1.0
      })
    }
  }

  const handleToggleClass = (classId: number) => {
    if (selectedClassIds.includes(classId)) {
      setSelectedClassIds(selectedClassIds.filter((id) => id !== classId))
    } else {
      setSelectedClassIds([...selectedClassIds, classId])
    }
  }

  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTitle.trim()) {
      alert('Vui lòng nhập tiêu đề đề thi')
      return
    }
    if (selectedQuestionIds.length === 0) {
      alert('Vui lòng chọn ít nhất 1 câu hỏi cho đề thi')
      return
    }

    setSubmitting(true)
    try {
      const questionsPayload = selectedQuestionIds.map((qId, idx) => ({
        questionId: qId,
        points: questionPointsMap[qId] || 1.0,
        sortOrder: idx + 1
      }))

      const payload: Partial<ExamItem> = {
        title: formTitle.trim(),
        code: formCode.trim(),
        description: formDescription.trim() || undefined,
        durationMinutes: Number(formDuration),
        passPercentage: Number(formPassPercent),
        maxAttempts: Number(formMaxAttempts),
        shuffleQuestions: formShuffleQuestions,
        shuffleOptions: formShuffleOptions,
        showResultMode: formShowResultMode,
        questions: questionsPayload as any,
        assignedClassIds: selectedClassIds
      }

      if (editingExam) {
        await assessmentApi.updateExam(editingExam.id, payload)
      } else {
        await assessmentApi.createExam(payload)
      }

      setIsModalOpen(false)
      fetchExams()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Lỗi khi lưu đề thi')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePublish = async (id: number) => {
    if (!window.confirm('Bạn có chắc muốn phát hành đề thi này? Học viên các lớp được giao sẽ có thể vào làm bài.')) return
    try {
      await assessmentApi.publishExam(id)
      fetchExams()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Không thể phát hành đề')
    }
  }

  const handleReGrade = async (id: number) => {
    if (!window.confirm('Kích hoạt chấm lại toàn bộ các bài thi đã nộp cho đề này?')) return
    try {
      const res = await assessmentApi.reGradeExam(id)
      alert(res.message || 'Chấm lại thành công!')
      fetchExams()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Lỗi chấm lại')
    }
  }

  const handleDuplicate = async (id: number) => {
    try {
      const res = await assessmentApi.duplicateExam(id)
      if (res.success) {
        alert(`Đã nhân bản đề thi thành bản nháp mới: ${res.data?.title}`)
        fetchExams()
      } else {
        alert(res.message || 'Lỗi khi nhân bản')
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Lỗi khi nhân bản')
    }
  }

  const getStatusBadge = (status: ExamStatus) => {
    switch (status) {
      case 'DRAFT':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">Bản nháp</span>
      case 'PUBLISHED':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">Đã phát hành</span>
      case 'CLOSED':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">Đã đóng</span>
      case 'ARCHIVED':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">Lưu trữ</span>
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#151F31] p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-[#142B4A] dark:text-[#38BDF8]" />
            Quản Lý Đề Thi & Đánh Giá
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Soạn thảo đề kiểm tra, giao bài theo lớp, cấu hình đảo đề và tự động tính điểm
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-5 py-2.5 rounded-xl bg-[#142B4A] dark:bg-[#38BDF8] text-white dark:text-[#0B1220] font-bold text-sm shadow-md hover:opacity-90 transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Tạo đề thi mới
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-[#151F31] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên đề thi, mã đề..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:border-[#142B4A] dark:focus:border-[#38BDF8]"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 outline-none"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="DRAFT">Bản nháp</option>
          <option value="PUBLISHED">Đã phát hành</option>
          <option value="CLOSED">Đã đóng</option>
          <option value="ARCHIVED">Lưu trữ</option>
        </select>
      </div>

      {/* Danh Sách Đề Thi */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="w-10 h-10 border-4 border-[#142B4A] dark:border-[#38BDF8] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">Đang tải danh sách đề thi...</p>
        </div>
      ) : exams.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-[#151F31] rounded-3xl border border-slate-200 dark:border-slate-800">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-base font-bold text-slate-700 dark:text-slate-200">Chưa có đề thi nào</p>
          <p className="text-xs text-slate-400 mt-1">Bấm nút "Tạo đề thi mới" để bắt đầu soạn đề.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {exams.map((exam) => (
            <div
              key={exam.id}
              className="bg-white dark:bg-[#151F31] p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[#142B4A] dark:text-[#38BDF8]">
                      {exam.code}
                    </span>
                    <span className="text-xs text-slate-400">v{exam.version}</span>
                  </div>
                  {getStatusBadge(exam.status)}
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 line-clamp-2">
                  {exam.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">
                  {exam.description || 'Không có mô tả chi tiết'}
                </p>

                {/* Thông số đề */}
                <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl mb-4 text-xs text-center">
                  <div>
                    <span className="text-slate-400 block">Thời lượng</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">{exam.durationMinutes} phút</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Số câu</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">{exam.questionCount} câu</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Tổng điểm</span>
                    <span className="font-bold text-[#142B4A] dark:text-[#38BDF8]">{exam.totalPoints} đ</span>
                  </div>
                </div>

                {/* Các lớp được giao */}
                <div className="text-xs text-slate-500 flex items-center gap-2 mb-4">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    Giao cho: <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {exam.assignedClassIds?.length > 0 ? `${exam.assignedClassIds.length} lớp học` : 'Chưa giao lớp nào'}
                    </span>
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPreviewExam(exam)}
                    className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition"
                    title="Xem trước đề thi"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => navigate(`/admin/assessment/analytics/${exam.id}`)}
                    className="p-2 rounded-xl text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition"
                    title="Báo cáo phân tích kết quả"
                  >
                    <BarChart3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleReGrade(exam.id)}
                    className="p-2 rounded-xl text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition"
                    title="Chấm lại toàn bộ bài thi"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDuplicate(exam.id)}
                    className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition"
                    title="Nhân bản (Sao chép) đề thi"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(exam)}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Sửa
                  </button>
                  {exam.status === 'DRAFT' && (
                    <button
                      onClick={() => handlePublish(exam.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition flex items-center gap-1"
                    >
                      <Send className="w-3 h-3" />
                      Phát hành
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL SOẠN / SỬA ĐỀ THI */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#151F31] rounded-3xl p-6 sm:p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {editingExam ? 'Chỉnh Sửa Đề Thi' : 'Tạo Đề Thi Mới'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExam} className="space-y-6">
              {/* Thông tin cơ bản */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                    Tên đề thi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Ví dụ: Kiểm tra giữa kỳ tiếng Anh chuyên sâu..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                    Mã đề thi
                  </label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm outline-none font-bold"
                  />
                </div>
              </div>

              {/* Cấu hình thi */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                    Thời lượng (phút)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="300"
                    value={formDuration}
                    onChange={(e) => setFormDuration(parseInt(e.target.value) || 45)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                    Điểm đỗ (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formPassPercent}
                    onChange={(e) => setFormPassPercent(parseFloat(e.target.value) || 50)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                    Số lần làm tối đa
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formMaxAttempts}
                    onChange={(e) => setFormMaxAttempts(parseInt(e.target.value) || 1)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                    Hiển thị kết quả
                  </label>
                  <select
                    value={formShowResultMode}
                    onChange={(e) => setFormShowResultMode(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm outline-none"
                  >
                    <option value="IMMEDIATELY">Xem ngay sau nộp</option>
                    <option value="AFTER_CLOSED">Sau khi đóng đề</option>
                    <option value="MANUAL">Chờ giáo viên duyệt</option>
                  </select>
                </div>
              </div>

              {/* Tùy chọn đảo đề */}
              <div className="flex flex-wrap gap-6 pt-2">
                <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formShuffleQuestions}
                    onChange={(e) => setFormShuffleQuestions(e.target.checked)}
                    className="w-4 h-4 text-[#142B4A] rounded"
                  />
                  <span>Trộn thứ tự câu hỏi (Shuffle Questions)</span>
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formShuffleOptions}
                    onChange={(e) => setFormShuffleOptions(e.target.checked)}
                    className="w-4 h-4 text-[#142B4A] rounded"
                  />
                  <span>Trộn thứ tự phương án A, B, C, D (Shuffle Options)</span>
                </label>
              </div>

              {/* Giao đề theo lớp */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-2">
                  Giao đề cho các lớp học ({selectedClassIds.length} lớp được chọn):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-36 overflow-y-auto p-3 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-900/50">
                  {availableClasses.map((cls) => {
                    const isSelected = selectedClassIds.includes(cls.id)
                    return (
                      <div
                        key={cls.id}
                        onClick={() => handleToggleClass(cls.id)}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer select-none transition flex items-center justify-between ${
                          isSelected
                            ? 'border-[#142B4A] dark:border-[#38BDF8] bg-[#142B4A]/10 text-[#142B4A] dark:text-white font-bold'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        <span className="truncate">{cls.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Chọn câu hỏi từ Question Bank */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                    Chọn câu hỏi ({selectedQuestionIds.length} câu đã chọn - Tổng:{' '}
                    {selectedQuestionIds.reduce((acc, id) => acc + (questionPointsMap[id] || 1.0), 0)} đ):
                  </label>
                  <span className="text-xs text-slate-400">Có thể tùy chỉnh điểm cho từng câu</span>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto p-3 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-900/50">
                  {availableQuestions.map((q) => {
                    const isSelected = selectedQuestionIds.includes(q.id)
                    return (
                      <div
                        key={q.id}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition ${
                          isSelected
                            ? 'border-[#142B4A] dark:border-[#38BDF8] bg-white dark:bg-slate-800'
                            : 'border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40'
                        }`}
                      >
                        <div
                          onClick={() => handleToggleQuestion(q)}
                          className="flex items-center gap-3 flex-1 cursor-pointer select-none"
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-[#142B4A] dark:bg-[#38BDF8] text-white border-transparent' : 'border-slate-300'
                          }`}>
                            {isSelected && <Check className="w-3 h-3" />}
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{q.content}</span>
                            <span className="text-slate-400 text-[10px]">{q.type} • {q.topic} • Độ khó: {q.difficulty}</span>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-slate-400">Điểm:</span>
                            <input
                              type="number"
                              step="0.25"
                              min="0.25"
                              value={questionPointsMap[q.id] || 1.0}
                              onChange={(e) => {
                                setQuestionPointsMap({
                                  ...questionPointsMap,
                                  [q.id]: parseFloat(e.target.value) || 1.0
                                })
                              }}
                              className="w-16 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 text-center font-bold text-xs"
                            />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-[#142B4A] dark:bg-[#38BDF8] text-white dark:text-[#0B1220] font-bold text-sm shadow hover:opacity-90"
                >
                  {submitting ? 'Đang lưu...' : 'Lưu đề thi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL XEM TRƯỚC ĐỀ THI (PREVIEW) */}
      {previewExam && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#151F31] rounded-3xl p-6 sm:p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
              <div>
                <span className="text-xs font-bold text-slate-400">XEM TRƯỚC BẢN PHÁT HÀNH</span>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{previewExam.title}</h2>
              </div>
              <button
                onClick={() => setPreviewExam(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {previewExam.questions?.map((q, idx) => (
                <div key={q.questionId} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-[#142B4A] dark:text-[#38BDF8]">Câu {idx + 1} ({q.points} điểm)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold">{q.type}</span>
                  </div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-3">{q.content}</p>

                  {q.options && q.options.length > 0 && (
                    <div className="space-y-1.5">
                      {q.options.map((opt) => (
                        <div key={opt.id || opt.optionCode} className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-xs flex items-center gap-2">
                          <span className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-700 font-bold flex items-center justify-center text-[10px]">{opt.optionCode}</span>
                          <span>{opt.content}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setPreviewExam(null)}
                className="px-6 py-2.5 rounded-xl bg-slate-800 text-white text-sm font-semibold"
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
