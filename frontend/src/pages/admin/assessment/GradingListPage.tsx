import React, { useEffect, useState, useCallback } from 'react'
import { assessmentApi } from '../../../api/assessment'
import type { ExamItem, AttemptResultData } from '../../../types/assessment'
import {
  CheckSquare,
  CheckCircle2,
  Edit3,
  X
} from 'lucide-react'
import { apiClient } from '../../../api/client'

export const GradingListPage: React.FC = () => {
  const [attempts, setAttempts] = useState<any[]>([])
  const [exams, setExams] = useState<ExamItem[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedExamId, setSelectedExamId] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  // Modal Chấm Điểm
  const [selectedAttemptId, setSelectedAttemptId] = useState<number | null>(null)
  const [attemptDetail, setAttemptDetail] = useState<AttemptResultData | null>(null)
  const [essayScores, setEssayScores] = useState<Record<number, { score: number; feedback: string }>>({})
  const [submittingGrade, setSubmittingGrade] = useState(false)

  const fetchAttempts = useCallback(async () => {
    try {
      setLoading(true)
      const q = new URLSearchParams()
      if (selectedExamId) q.append('examId', selectedExamId)
      if (statusFilter) q.append('status', statusFilter)
      q.append('size', '50')

      const res = await apiClient.get<any>(`/assessment/grading/attempts?${q.toString()}`)
      if (res.success && res.data) {
        setAttempts(res.data.content || [])
      }
    } catch (err: unknown) {
      console.error('Failed to load attempts for grading:', err)
    } finally {
      setLoading(false)
    }
  }, [selectedExamId, statusFilter])

  useEffect(() => {
    fetchAttempts()
  }, [fetchAttempts])

  useEffect(() => {
    const loadExams = async () => {
      try {
        const res = await assessmentApi.searchExams({ size: 100 })
        if (res.success && res.data) {
          setExams(res.data.content || [])
        }
      } catch (err) {
        console.error('Error loading exams for grading:', err)
      }
    }
    loadExams()
  }, [])

  // Mở modal chấm bài
  const openGradingModal = async (attemptId: number) => {
    setSelectedAttemptId(attemptId)
    try {
      const res = await apiClient.get<AttemptResultData>(`/assessment/grading/attempts/${attemptId}`)
      if (res.success && res.data) {
        setAttemptDetail(res.data)
        const initialMap: Record<number, { score: number; feedback: string }> = {}
        res.data.answers.forEach((ans) => {
          if (ans.type === 'ESSAY') {
            initialMap[ans.questionId] = {
              score: ans.score || 0,
              feedback: ans.teacherFeedback || ''
            }
          }
        })
        setEssayScores(initialMap)
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Không thể tải chi tiết bài làm')
    }
  }

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAttemptId || !attemptDetail) return
    setSubmittingGrade(true)
    try {
      const items = Object.entries(essayScores).map(([qId, val]) => ({
        questionId: Number(qId),
        score: Number(val.score),
        teacherFeedback: val.feedback.trim()
      }))

      const res = await assessmentApi.submitManualGrade(selectedAttemptId, items)
      if (res.success) {
        alert('Đã cập nhật điểm số và nhận xét thành công!')
        setSelectedAttemptId(null)
        setAttemptDetail(null)
        fetchAttempts()
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Lỗi khi lưu điểm')
    } finally {
      setSubmittingGrade(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#151F31] p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <CheckSquare className="w-7 h-7 text-[#142B4A] dark:text-[#38BDF8]" />
            Chấm Thi & Đánh Giá Tự Luận
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Duyệt bài làm của học viên, chấm bài tự luận theo Rubric chuẩn hóa và ghi nhận xét phản hồi
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-[#151F31] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-3">
        <select
          value={selectedExamId}
          onChange={(e) => setSelectedExamId(e.target.value)}
          className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 outline-none flex-1"
        >
          <option value="">Tất cả đề kiểm tra</option>
          {exams.map((ex) => (
            <option key={ex.id} value={ex.id}>{ex.title} ({ex.code})</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 outline-none"
        >
          <option value="">Tất cả trạng thái chấm</option>
          <option value="GRADING">Chờ chấm tự luận</option>
          <option value="GRADED">Đã hoàn thành chấm</option>
          <option value="SUBMITTED">Đã nộp bài</option>
        </select>
      </div>

      {/* Danh Sách Bài Nộp */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="w-10 h-10 border-4 border-[#142B4A] dark:border-[#38BDF8] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">Đang tải danh sách bài làm...</p>
        </div>
      ) : attempts.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-[#151F31] rounded-3xl border border-slate-200 dark:border-slate-800">
          <CheckSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-base font-bold text-slate-700 dark:text-slate-200">Không có bài làm nào cần xử lý</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#151F31] rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-4 px-6 font-bold">Thí sinh</th>
                  <th className="py-4 px-6 font-bold">Đề kiểm tra</th>
                  <th className="py-4 px-6 font-bold">Lượt</th>
                  <th className="py-4 px-6 font-bold">Điểm đạt</th>
                  <th className="py-4 px-6 font-bold">Trạng thái</th>
                  <th className="py-4 px-6 font-bold">Thời gian nộp</th>
                  <th className="py-4 px-6 font-bold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {attempts.map((at) => (
                  <tr key={at.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {at.studentName || at.student?.fullName || 'Học viên'}
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        {at.studentCode || at.student?.studentCode || '—'}
                      </div>
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-800 dark:text-slate-200 max-w-xs truncate">
                      {at.examTitle || at.exam?.title || 'Đề kiểm tra'}
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-600 dark:text-slate-400">
                      Lượt {at.attemptNumber}
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-black text-[#142B4A] dark:text-[#38BDF8] text-base">
                        {at.totalScore}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold"> / {at.maxScore} đ</span>
                      <div className="text-xs font-bold text-slate-500">({at.percentage}%)</div>
                    </td>
                    <td className="py-4 px-6">
                      {at.status === 'GRADING' ? (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                          Chờ chấm tự luận
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          Đã chấm ({at.isPassed ? 'Đạt' : 'Chưa đạt'})
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-500">
                      {at.submittedAt ? new Date(at.submittedAt).toLocaleString('vi-VN') : 'Đang làm'}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => openGradingModal(at.id)}
                        className="px-4 py-2 rounded-xl bg-[#142B4A] dark:bg-[#38BDF8] text-white dark:text-[#0B1220] font-bold text-xs shadow hover:opacity-90 transition inline-flex items-center gap-1.5"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Chấm bài
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL CHẤM BÀI CHI TIẾT */}
      {selectedAttemptId && attemptDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#151F31] rounded-3xl p-6 sm:p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
              <div>
                <span className="text-xs font-bold text-slate-400">CHẤM THI THEO RUBRIC</span>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {attemptDetail.studentName} ({attemptDetail.studentCode}) • {attemptDetail.examTitle}
                </h2>
              </div>
              <button
                onClick={() => {
                  setSelectedAttemptId(null)
                  setAttemptDetail(null)
                }}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGrade} className="space-y-6">
              {attemptDetail.answers.map((ans, idx) => (
                <div
                  key={ans.questionId}
                  className={`p-6 rounded-2xl border transition ${
                    ans.type === 'ESSAY'
                      ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50'
                      : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-sm">
                      Câu {idx + 1} • {ans.type}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      Tối đa: {ans.points} điểm
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
                    {ans.content}
                  </p>

                  {/* Bài làm của thí sinh */}
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm mb-4">
                    <span className="text-xs font-bold text-slate-400 block mb-1">BÀI LÀM CỦA HỌC VIÊN:</span>
                    <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {ans.studentTextAnswer || (ans.studentSelectedOptions ? `Đã chọn: ${ans.studentSelectedOptions}` : '(Bỏ trống)')}
                    </p>
                  </div>

                  {/* Nếu là câu Tự Luận -> Cho điểm và nhận xét */}
                  {ans.type === 'ESSAY' ? (
                    <div className="space-y-3 pt-3 border-t border-amber-200 dark:border-amber-900/40">
                      <div className="flex items-center gap-4">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Điểm chấm (0 - {ans.points}):
                        </label>
                        <input
                          type="number"
                          step="0.25"
                          min="0"
                          max={ans.points}
                          value={essayScores[ans.questionId]?.score ?? 0}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0
                            setEssayScores({
                              ...essayScores,
                              [ans.questionId]: {
                                ...essayScores[ans.questionId],
                                score: val
                              }
                            })
                          }}
                          className="w-24 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-center font-bold text-sm"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          Nhận xét chi tiết của giáo viên:
                        </label>
                        <textarea
                          rows={3}
                          value={essayScores[ans.questionId]?.feedback || ''}
                          onChange={(e) => {
                            setEssayScores({
                              ...essayScores,
                              [ans.questionId]: {
                                ...essayScores[ans.questionId],
                                feedback: e.target.value
                              }
                            })
                          }}
                          placeholder="Ghi nhận xét ưu điểm, lỗi sai hoặc góp ý cải thiện cho học viên..."
                          className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-none"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                      <CheckCircle2 className="w-4 h-4" />
                      Tự động chấm: {ans.score} / {ans.points} điểm
                    </div>
                  )}
                </div>
              ))}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAttemptId(null)
                    setAttemptDetail(null)
                  }}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingGrade}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow transition"
                >
                  {submittingGrade ? 'Đang lưu...' : 'Lưu kết quả chấm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
