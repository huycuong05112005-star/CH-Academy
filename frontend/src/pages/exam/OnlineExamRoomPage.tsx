import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { assessmentApi } from '../../api/assessment'
import type {
  StartAttemptResponseData,
  AttemptResultData
} from '../../types/assessment'
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Flag,
  ArrowLeft,
  ArrowRight,
  Send,
  CloudCheck,
  RotateCcw,
  ShieldAlert,
  Award,
  BookOpen,
  Check
} from 'lucide-react'
import { ThemeSwitcher } from '../../components/ui/ThemeSwitcher'
import { Tilt3DCard } from '../../components/3d/Tilt3DCard'

export const OnlineExamRoomPage: React.FC = () => {
  const { examId } = useParams<{ examId: string }>()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [examData, setExamData] = useState<StartAttemptResponseData | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  // Lưu trữ câu trả lời của học viên
  const [answers, setAnswers] = useState<Record<number, {
    selectedOptions: string[]
    textAnswer: string
    isFlagged: boolean
  }>>({})

  // Trạng thái lưu đám mây
  const [saveStatus, setSaveStatus] = useState<'SAVED' | 'SAVING' | 'ERROR'>('SAVED')

  // Timer
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const timerRef = useRef<any | null>(null)

  // Submit Modal & Result
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [examResult, setExamResult] = useState<AttemptResultData | null>(null)

  // Khởi tạo và load dữ liệu bài thi
  useEffect(() => {
    let isMounted = true
    const initExam = async () => {
      if (!examId) return
      try {
        setLoading(true)
        setError(null)
        const res = await assessmentApi.startOrResumeAttempt(Number(examId))
        if (isMounted && res.success && res.data) {
          const data = res.data
          setExamData(data)
          setTimeLeft(data.remainingSeconds || data.durationMinutes * 60)

          // Load answers nếu có resume
          const initialAnswers: Record<number, { selectedOptions: string[]; textAnswer: string; isFlagged: boolean }> = {}
          data.questions.forEach((q) => {
            const saved = data.existingAnswers?.[q.questionId]
            initialAnswers[q.questionId] = {
              selectedOptions: saved?.selectedOptionIds ? saved.selectedOptionIds.split(',').filter(Boolean) : [],
              textAnswer: saved?.textAnswer || '',
              isFlagged: Boolean(saved?.isMarkedForReview)
            }
          })
          setAnswers(initialAnswers)
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Không thể tải phòng thi'
          setError(msg)
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    initExam()
    return () => {
      isMounted = false
    }
  }, [examId])

  // Tự động nộp bài khi hết giờ
  const handleAutoSubmit = useCallback(async () => {
    if (!examData || isSubmitting || examResult) return
    setIsSubmitting(true)
    try {
      const res = await assessmentApi.submitAttempt(examData.attemptId)
      if (res.success && res.data) {
        setExamResult(res.data)
      }
    } catch (err) {
      console.error('Auto submit failed:', err)
    } finally {
      setIsSubmitting(false)
    }
  }, [examData, isSubmitting, examResult])

  // Đếm ngược thời gian
  useEffect(() => {
    if (examResult) return // Đã nộp bài thì dừng đếm

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          handleAutoSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [examResult, handleAutoSubmit])

  // Debounced Autosave
  const triggerSave = useCallback(async (qId: number, options: string[], text: string, flagged: boolean) => {
    if (!examData) return
    setSaveStatus('SAVING')
    try {
      await assessmentApi.saveAnswer(examData.attemptId, {
        questionId: qId,
        selectedOptionIds: options.join(','),
        textAnswer: text,
        isMarkedForReview: flagged
      })
      setSaveStatus('SAVED')
    } catch {
      setSaveStatus('ERROR')
    }
  }, [examData])

  // Cập nhật câu trả lời Single Choice
  const handleSelectSingle = (qId: number, optId: number) => {
    const current = answers[qId] || { selectedOptions: [], textAnswer: '', isFlagged: false }
    const updated = { ...current, selectedOptions: [String(optId)] }
    setAnswers((prev) => ({ ...prev, [qId]: updated }))
    triggerSave(qId, updated.selectedOptions, updated.textAnswer, updated.isFlagged)
  }

  // Cập nhật câu trả lời Multiple Choice
  const handleToggleMultiple = (qId: number, optId: number) => {
    const current = answers[qId] || { selectedOptions: [], textAnswer: '', isFlagged: false }
    const optStr = String(optId)
    const exists = current.selectedOptions.includes(optStr)
    const nextOptions = exists
      ? current.selectedOptions.filter((id) => id !== optStr)
      : [...current.selectedOptions, optStr]
    const updated = { ...current, selectedOptions: nextOptions }
    setAnswers((prev) => ({ ...prev, [qId]: updated }))
    triggerSave(qId, updated.selectedOptions, updated.textAnswer, updated.isFlagged)
  }

  // Cập nhật Text Answer
  const handleTextChange = (qId: number, val: string) => {
    const current = answers[qId] || { selectedOptions: [], textAnswer: '', isFlagged: false }
    const updated = { ...current, textAnswer: val }
    setAnswers((prev) => ({ ...prev, [qId]: updated }))
  }

  const handleTextBlur = (qId: number) => {
    const current = answers[qId]
    if (current) {
      triggerSave(qId, current.selectedOptions, current.textAnswer, current.isFlagged)
    }
  }

  // Bật/tắt cờ xem lại
  const handleToggleFlag = (qId: number) => {
    const current = answers[qId] || { selectedOptions: [], textAnswer: '', isFlagged: false }
    const updated = { ...current, isFlagged: !current.isFlagged }
    setAnswers((prev) => ({ ...prev, [qId]: updated }))
    triggerSave(qId, updated.selectedOptions, updated.textAnswer, updated.isFlagged)
  }

  // Nộp bài thủ công
  const handleManualSubmit = async () => {
    if (!examData || isSubmitting) return
    setIsSubmitting(true)
    try {
      const res = await assessmentApi.submitAttempt(examData.attemptId)
      if (res.success && res.data) {
        setExamResult(res.data)
        setShowSubmitModal(false)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Nộp bài không thành công'
      alert(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Format thời gian đếm ngược MM:SS
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // Tính số câu đã hoàn thành
  const completedCount = examData?.questions.filter((q) => {
    const a = answers[q.questionId]
    if (!a) return false
    return a.selectedOptions.length > 0 || a.textAnswer.trim().length > 0
  }).length || 0

  const flaggedCount = examData?.questions.filter((q) => answers[q.questionId]?.isFlagged).length || 0

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0B1220] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 border-4 border-[#142B4A] dark:border-[#38BDF8] border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Đang tải phòng thi trực tuyến...</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Đang đồng bộ đề thi và cấu hình bảo mật từ server...</p>
      </div>
    )
  }

  if (error || !examData) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0B1220] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-rose-100 dark:bg-rose-950/50 text-rose-600 rounded-2xl flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Không thể tham gia bài thi</h2>
        <p className="text-slate-600 dark:text-slate-300 mt-2 max-w-md">{error}</p>
        <button
          onClick={() => navigate('/student')}
          className="mt-6 px-6 py-2.5 bg-[#142B4A] dark:bg-[#38BDF8] text-white dark:text-[#0B1220] rounded-xl font-semibold hover:opacity-90 transition"
        >
          Quay lại Cổng học viên
        </button>
      </div>
    )
  }

  // MÀN HÌNH KẾT QUẢ SAU KHI NỘP BÀI
  if (examResult) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0B1220] py-10 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
          {/* Header Kết Quả */}
          <div className="bg-white dark:bg-[#151F31] rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl text-center relative overflow-hidden">
            <div className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center mb-4 ${
              examResult.isPassed
                ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                : 'bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400'
            }`}>
              <Award className="w-10 h-10" />
            </div>

            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold tracking-wider mb-2 ${
              examResult.isPassed
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
            }`}>
              {examResult.isPassed ? 'ĐẠT YÊU CẦU' : 'CHƯA ĐẠT'}
            </span>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {examResult.examTitle}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Thí sinh: <span className="font-semibold text-slate-800 dark:text-slate-200">{examResult.studentName}</span> ({examResult.studentCode})
            </p>

            {/* Thẻ Điểm Số Lớn với Chiều Sâu 3D */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 max-w-2xl mx-auto">
              <Tilt3DCard maxTilt={5}>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#1E293B] border border-slate-100 dark:border-slate-700 h-full">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Điểm số</span>
                  <p className="text-2xl font-black text-[#142B4A] dark:text-[#38BDF8] mt-1">
                    {examResult.totalScore} / {examResult.maxScore}
                  </p>
                </div>
              </Tilt3DCard>

              <Tilt3DCard maxTilt={5}>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#1E293B] border border-slate-100 dark:border-slate-700 h-full">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Phần trăm</span>
                  <p className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">
                    {examResult.percentage}%
                  </p>
                </div>
              </Tilt3DCard>

              <Tilt3DCard maxTilt={5}>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#1E293B] border border-slate-100 dark:border-slate-700 h-full">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Số câu đúng</span>
                  <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                    {examResult.correctCount} / {examResult.answers.length}
                  </p>
                </div>
              </Tilt3DCard>

              <Tilt3DCard maxTilt={5}>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#1E293B] border border-slate-100 dark:border-slate-700 h-full">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Thời gian thi</span>
                  <p className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">
                    {Math.floor(examResult.durationSeconds / 60)}p {examResult.durationSeconds % 60}s
                  </p>
                </div>
              </Tilt3DCard>
            </div>

            <div className="mt-8 flex justify-center gap-4">
              <button
                onClick={() => navigate('/student')}
                className="px-6 py-3 rounded-xl bg-[#142B4A] dark:bg-[#38BDF8] text-white dark:text-[#0B1220] font-bold shadow hover:opacity-90 transition inline-flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Về Cổng Học Viên
              </button>
            </div>
          </div>

          {/* Chi tiết Lời giải & Đáp án nếu được phép công bố */}
          {examResult.canReviewAnswers ? (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#142B4A] dark:text-[#38BDF8]" />
                Xem lại bài làm & Lời giải chi tiết
              </h3>

              {examResult.answers.map((ans, idx) => (
                <div
                  key={ans.questionId}
                  className={`bg-white dark:bg-[#151F31] rounded-2xl p-6 border transition shadow-sm ${
                    ans.isCorrect
                      ? 'border-emerald-200 dark:border-emerald-900/40'
                      : 'border-rose-200 dark:border-rose-900/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      Câu {idx + 1} • {ans.type}
                    </span>
                    <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                      ans.isCorrect
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                        : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                    }`}>
                      {ans.score} / {ans.points} điểm
                    </span>
                  </div>

                  <p className="text-base font-medium text-slate-900 dark:text-white mb-4 whitespace-pre-wrap">
                    {ans.content}
                  </p>

                  {/* Options nếu có */}
                  {ans.options && ans.options.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {ans.options.map((opt) => {
                        const isStudentChoice = ans.studentSelectedOptions?.split(',').includes(String(opt.id))
                        const isCorrectOption = Boolean(opt.isCorrect)

                        let optionStyle = 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300'
                        if (isCorrectOption) {
                          optionStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 font-semibold'
                        } else if (isStudentChoice && !isCorrectOption) {
                          optionStyle = 'border-rose-500 bg-rose-50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200'
                        }

                        return (
                          <div
                            key={opt.id}
                            className={`p-3.5 rounded-xl border flex items-center justify-between text-sm ${optionStyle}`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center font-bold text-xs shadow-sm">
                                {opt.optionCode}
                              </span>
                              <span>{opt.content}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {isStudentChoice && (
                                <span className="text-xs px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium">
                                  Bạn đã chọn
                                </span>
                              )}
                              {isCorrectOption && (
                                <Check className="w-4 h-4 text-emerald-600" />
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Text answer nếu là điền khuyết / tự luận */}
                  {ans.studentTextAnswer && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl mb-3 text-sm">
                      <span className="text-xs font-semibold text-slate-500">Bài làm của bạn:</span>
                      <p className="mt-1 font-medium text-slate-800 dark:text-slate-200">{ans.studentTextAnswer}</p>
                    </div>
                  )}

                  {ans.correctAnswer && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl mb-3 text-sm border border-emerald-200 dark:border-emerald-900/30">
                      <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Đáp án chuẩn:</span>
                      <p className="mt-1 font-bold text-emerald-900 dark:text-emerald-200">{ans.correctAnswer}</p>
                    </div>
                  )}

                  {ans.explanation && (
                    <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/20 rounded-xl text-sm border border-blue-200 dark:border-blue-900/30">
                      <span className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wide">Lời giải chi tiết:</span>
                      <p className="mt-1 text-slate-700 dark:text-slate-300">{ans.explanation}</p>
                    </div>
                  )}

                  {ans.teacherFeedback && (
                    <div className="p-3.5 bg-purple-50/70 dark:bg-purple-950/20 rounded-xl text-sm border border-purple-200 dark:border-purple-900/30 mt-3">
                      <span className="text-xs font-bold text-purple-800 dark:text-purple-300 uppercase tracking-wide">Nhận xét của giáo viên:</span>
                      <p className="mt-1 text-purple-900 dark:text-purple-200">{ans.teacherFeedback}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-900 text-center">
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                Đáp án và lời giải chi tiết sẽ được công bố sau khi thời hạn của kỳ thi kết thúc theo quy định của trung tâm.
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // PHÒNG THI ĐANG LÀM
  const currentQuestion = examData.questions[currentIndex]
  const currentAnswer = answers[currentQuestion.questionId] || { selectedOptions: [], textAnswer: '', isFlagged: false }

  const isLowTime = timeLeft < 300 // < 5 phút
  const isCriticalTime = timeLeft < 60 // < 1 phút

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#0B1220] flex flex-col font-sans transition-colors">
      {/* Top Bar Cố Định */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#151F31]/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 shadow-sm px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#142B4A] dark:bg-[#38BDF8] flex items-center justify-center text-white dark:text-[#0B1220] font-black text-sm">
            CH
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white line-clamp-1">
              {examData.examTitle}
            </h1>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>Mã đề: {examData.examCode}</span>
              <span>•</span>
              {saveStatus === 'SAVED' && (
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <CloudCheck className="w-3.5 h-3.5" /> Đã lưu đám mây
                </span>
              )}
              {saveStatus === 'SAVING' && (
                <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <RotateCcw className="w-3.5 h-3.5 animate-spin" /> Đang lưu...
                </span>
              )}
              {saveStatus === 'ERROR' && (
                <span className="inline-flex items-center gap-1 text-rose-600 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" /> Mất kết nối - sẽ thử lại
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Đồng Hồ Đếm Ngược & Action */}
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-mono text-base sm:text-lg font-black border transition ${
            isCriticalTime
              ? 'bg-rose-500 text-white border-rose-600 animate-pulse'
              : isLowTime
              ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-300'
              : 'bg-slate-100 dark:bg-slate-800 text-[#142B4A] dark:text-[#38BDF8] border-slate-200 dark:border-slate-700'
          }`}>
            <Clock className="w-5 h-5" />
            <span>{formatTime(timeLeft)}</span>
          </div>

          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Nộp bài</span>
          </button>

          <ThemeSwitcher />
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* VÙNG CÂU HỎI CHÍNH (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card Câu Hỏi */}
          <div className="bg-white dark:bg-[#151F31] rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-md card-depth-3d">
            {/* Header câu hỏi */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <span className="text-base sm:text-lg font-black text-[#142B4A] dark:text-[#38BDF8]">
                  Câu {currentIndex + 1}
                </span>
                <span className="text-xs px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase">
                  {currentQuestion.type}
                </span>
                <span className="text-xs font-bold text-slate-400">
                  {currentQuestion.points} điểm
                </span>
              </div>

              {/* Nút Flag xem lại */}
              <button
                onClick={() => handleToggleFlag(currentQuestion.questionId)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                  currentAnswer.isFlagged
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-400'
                    : 'bg-slate-50 dark:bg-slate-800/50 text-slate-500 border-slate-200 dark:border-slate-700 hover:text-amber-600'
                }`}
              >
                <Flag className={`w-3.5 h-3.5 ${currentAnswer.isFlagged ? 'fill-amber-500' : ''}`} />
                <span>{currentAnswer.isFlagged ? 'Đã đánh dấu cờ' : 'Đánh dấu xem lại'}</span>
              </button>
            </div>

            {/* Nội dung đề bài */}
            <div className="py-6 text-base sm:text-lg font-medium text-slate-900 dark:text-slate-100 leading-relaxed whitespace-pre-wrap">
              {currentQuestion.content}
            </div>

            {/* Render phương án tương ứng từng loại */}
            {/* 1. SINGLE CHOICE & TRUE/FALSE */}
            {(currentQuestion.type === 'SINGLE_CHOICE' || currentQuestion.type === 'TRUE_FALSE') && (
              <div className="space-y-3 pt-2">
                {currentQuestion.options?.map((opt) => {
                  const isChecked = currentAnswer.selectedOptions.includes(String(opt.id))
                  return (
                    <label
                      key={opt.id}
                      onClick={() => handleSelectSingle(currentQuestion.questionId, opt.id!)}
                      className={`flex items-center gap-3.5 p-4 rounded-2xl border-2 cursor-pointer transition select-none ${
                        isChecked
                          ? 'border-[#142B4A] dark:border-[#38BDF8] bg-[#142B4A]/5 dark:bg-[#38BDF8]/10 text-[#142B4A] dark:text-white font-semibold'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs border ${
                        isChecked
                          ? 'bg-[#142B4A] dark:bg-[#38BDF8] text-white dark:text-[#0B1220] border-transparent'
                          : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}>
                        {opt.optionCode}
                      </div>
                      <span className="text-sm sm:text-base leading-normal">{opt.content}</span>
                    </label>
                  )
                })}
              </div>
            )}

            {/* 2. MULTIPLE CHOICE */}
            {currentQuestion.type === 'MULTIPLE_CHOICE' && (
              <div className="space-y-3 pt-2">
                <p className="text-xs text-slate-400 mb-2 italic">Chọn một hoặc nhiều phương án đúng:</p>
                {currentQuestion.options?.map((opt) => {
                  const isChecked = currentAnswer.selectedOptions.includes(String(opt.id))
                  return (
                    <label
                      key={opt.id}
                      onClick={() => handleToggleMultiple(currentQuestion.questionId, opt.id!)}
                      className={`flex items-center gap-3.5 p-4 rounded-2xl border-2 cursor-pointer transition select-none ${
                        isChecked
                          ? 'border-[#142B4A] dark:border-[#38BDF8] bg-[#142B4A]/5 dark:bg-[#38BDF8]/10 text-[#142B4A] dark:text-white font-semibold'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs border ${
                        isChecked
                          ? 'bg-[#142B4A] dark:bg-[#38BDF8] text-white dark:text-[#0B1220] border-transparent'
                          : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}>
                        {isChecked ? <Check className="w-3.5 h-3.5" /> : opt.optionCode}
                      </div>
                      <span className="text-sm sm:text-base leading-normal">{opt.content}</span>
                    </label>
                  )
                })}
              </div>
            )}

            {/* 3. FILL IN BLANK & SHORT ANSWER */}
            {(currentQuestion.type === 'FILL_IN_BLANK' || currentQuestion.type === 'SHORT_ANSWER') && (
              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-500 mb-2">
                  Nhập câu trả lời của bạn:
                </label>
                <input
                  type="text"
                  value={currentAnswer.textAnswer}
                  onChange={(e) => handleTextChange(currentQuestion.questionId, e.target.value)}
                  onBlur={() => handleTextBlur(currentQuestion.questionId)}
                  placeholder="Điền từ/cụm từ chính xác..."
                  className="w-full px-4 py-3.5 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 focus:border-[#142B4A] dark:focus:border-[#38BDF8] outline-none text-base text-slate-900 dark:text-white transition font-medium"
                />
              </div>
            )}

            {/* 4. ESSAY */}
            {currentQuestion.type === 'ESSAY' && (
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-500">Soạn thảo bài viết:</label>
                  <span className="text-xs text-slate-400">
                    Số từ: {currentAnswer.textAnswer.trim() ? currentAnswer.textAnswer.trim().split(/\s+/).length : 0} từ
                  </span>
                </div>
                <textarea
                  rows={8}
                  value={currentAnswer.textAnswer}
                  onChange={(e) => handleTextChange(currentQuestion.questionId, e.target.value)}
                  onBlur={() => handleTextBlur(currentQuestion.questionId)}
                  placeholder="Viết câu trả lời tự luận tại đây theo đúng yêu cầu đề bài..."
                  className="w-full p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 focus:border-[#142B4A] dark:focus:border-[#38BDF8] outline-none text-sm sm:text-base text-slate-900 dark:text-white transition leading-relaxed resize-y"
                />
              </div>
            )}

            {/* Nút Điều Hướng Câu Trước / Câu Sau */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
              <button
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((prev) => prev - 1)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Câu trước
              </button>

              <button
                disabled={currentIndex === examData.questions.length - 1}
                onClick={() => setCurrentIndex((prev) => prev + 1)}
                className="px-5 py-2.5 rounded-xl bg-[#142B4A] dark:bg-[#38BDF8] text-white dark:text-[#0B1220] font-semibold text-sm hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-2"
              >
                Câu sau
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* SIDEBAR ĐIỀU HƯỚNG CÂU HỎI (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-[#151F31] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-md">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base mb-4">
              Danh sách câu hỏi
            </h3>

            {/* Thanh tiến độ */}
            <div className="mb-5">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 font-medium">
                <span>Tiến độ hoàn thành</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {completedCount} / {examData.questions.length} câu
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#142B4A] dark:bg-[#38BDF8] transition-all duration-300"
                  style={{ width: `${(completedCount / examData.questions.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Lưới câu hỏi */}
            <div className="grid grid-cols-5 gap-2.5">
              {examData.questions.map((q, idx) => {
                const ans = answers[q.questionId]
                const isAnswered = ans && (ans.selectedOptions.length > 0 || ans.textAnswer.trim().length > 0)
                const isFlagged = ans?.isFlagged
                const isCurrent = idx === currentIndex

                let btnStyle = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-transparent hover:border-slate-300'
                if (isCurrent) {
                  btnStyle = 'ring-2 ring-[#142B4A] dark:ring-[#38BDF8] border-transparent font-black bg-slate-200 dark:bg-slate-700'
                }
                if (isAnswered) {
                  btnStyle = 'bg-[#142B4A] dark:bg-[#38BDF8] text-white dark:text-[#0B1220] font-bold border-transparent'
                  if (isCurrent) {
                    btnStyle += ' ring-2 ring-offset-2 ring-[#142B4A] dark:ring-[#38BDF8]'
                  }
                }

                return (
                  <button
                    key={q.questionId}
                    onClick={() => setCurrentIndex(idx)}
                    className={`relative h-11 rounded-xl flex items-center justify-center text-sm font-bold transition border ${btnStyle}`}
                  >
                    {idx + 1}
                    {isFlagged && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-500 border-2 border-white dark:border-[#151F31] flex items-center justify-center" />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Chú thích */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-md bg-[#142B4A] dark:bg-[#38BDF8]" />
                <span>Đã trả lời ({completedCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600" />
                <span>Chưa trả lời ({examData.questions.length - completedCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-amber-500" />
                <span>Đánh dấu xem lại ({flaggedCount})</span>
              </div>
            </div>

            {/* Nút nộp bài to ở sidebar */}
            <button
              onClick={() => setShowSubmitModal(true)}
              className="mt-6 w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md transition flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              Nộp bài kiểm tra
            </button>
          </div>
        </div>
      </main>

      {/* MODAL XÁC NHẬN NỘP BÀI */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#151F31] rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-extrabold text-center text-slate-900 dark:text-white mb-2">
              Xác nhận nộp bài thi?
            </h3>

            <p className="text-sm text-slate-600 dark:text-slate-300 text-center mb-6">
              Bạn có chắc chắn muốn kết thúc bài làm và nộp ngay không? Kết quả sẽ được ghi nhận và không thể sửa lại.
            </p>

            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 mb-6 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Số câu đã trả lời:</span>
                <span className="font-bold text-emerald-600">{completedCount} / {examData.questions.length}</span>
              </div>
              {examData.questions.length - completedCount > 0 && (
                <div className="flex justify-between text-rose-600 font-semibold">
                  <span>Số câu còn bỏ trống:</span>
                  <span>{examData.questions.length - completedCount} câu</span>
                </div>
              )}
              {flaggedCount > 0 && (
                <div className="flex justify-between text-amber-600 font-semibold">
                  <span>Số câu còn gắn cờ xem lại:</span>
                  <span>{flaggedCount} câu</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                disabled={isSubmitting}
                onClick={() => setShowSubmitModal(false)}
                className="py-3 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Làm tiếp
              </button>
              <button
                disabled={isSubmitting}
                onClick={handleManualSubmit}
                className="py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
              >
                {isSubmitting ? <RotateCcw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Xác nhận nộp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
