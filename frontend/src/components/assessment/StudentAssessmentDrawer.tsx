import React, { useEffect, useState } from 'react'
import { assessmentApi } from '../../api/assessment'
import type { StudentClassDetail, StudentExamRecord, StudentSessionAttendance, StudentReviewQuestion } from '../../types/assessment'
import {
  X,
  User,
  Calendar,
  AlertTriangle,
  FileText,
  FileQuestion,
  RefreshCw
} from 'lucide-react'

interface StudentAssessmentDrawerProps {
  studentId: number | null
  classId: number | null
  onClose: () => void
}

export const StudentAssessmentDrawer: React.FC<StudentAssessmentDrawerProps> = ({
  studentId,
  classId,
  onClose
}) => {
  const [data, setData] = useState<StudentClassDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'EXAMS' | 'ATTENDANCE' | 'QUESTIONS'>('EXAMS')
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null)

  useEffect(() => {
    if (!studentId || !classId) return
    const fetchDetail = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await assessmentApi.getStudentClassDetail(studentId, classId)
        if (res.success && res.data) {
          setData(res.data)
          if (res.data.examRecords.length > 0) {
            setSelectedExamId(res.data.examRecords[0].examId)
          }
        } else {
          setError(res.message || 'Không thể tải chi tiết học viên')
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Lỗi khi kết nối máy chủ')
      } finally {
        setLoading(false)
      }
    }
    fetchDetail()
  }, [studentId, classId])

  if (!studentId || !classId) return null

  const selectedExamRecord = data?.examRecords.find((r: StudentExamRecord) => r.examId === selectedExamId)

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end animate-fade-in">
      <div className="bg-white dark:bg-[#0F172A] w-full max-w-2xl h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 overflow-hidden">
        
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-[#1E293B]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#142B4A] dark:bg-[#38BDF8] text-white dark:text-[#0F172A] flex items-center justify-center font-black text-base shadow-sm">
              {data ? data.fullName.charAt(0) : <User className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  {data ? data.fullName : 'Hồ Sơ Đánh Giá Học Viên'}
                </h2>
                {data?.studentCode && (
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    {data.studentCode}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Lớp: <strong className="text-slate-700 dark:text-slate-200">{data?.className}</strong> ({data?.classCode})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content Body */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-[#142B4A] dark:text-[#38BDF8]" />
            <p className="text-xs font-bold">Đang tải lịch sử học tập & bài thi...</p>
          </div>
        ) : error || !data ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <AlertTriangle className="w-10 h-10 text-amber-500 mb-2" />
            <h4 className="text-sm font-bold text-slate-800 dark:text-white">Không thể tải dữ liệu</h4>
            <p className="text-xs text-slate-500 mt-1">{error}</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* KPI Summary Cards Bar */}
            <div className="p-4 bg-slate-50/70 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800 grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-[10px] text-slate-400 block font-semibold">Điểm TB</span>
                <span className="text-base font-black text-[#142B4A] dark:text-[#38BDF8]">
                  {data.averageScore ?? '—'}
                </span>
                <span className="text-[10px] text-slate-400 block">/ 10</span>
              </div>

              <div className="p-2.5 rounded-xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-[10px] text-slate-400 block font-semibold">Tỷ lệ đạt</span>
                <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                  {data.passRate ?? 0}%
                </span>
                <span className="text-[10px] text-slate-400 block">
                  {data.completedExamsCount} bài đã nộp
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-[10px] text-slate-400 block font-semibold">Chuyên cần</span>
                <span className="text-base font-black text-blue-600 dark:text-blue-400">
                  {data.attendanceRate ?? 0}%
                </span>
                <span className="text-[10px] text-slate-400 block">
                  {data.sessionAttendances.filter((s: StudentSessionAttendance) => s.status === 'PRESENT').length}/{data.sessionAttendances.length} buổi
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-[10px] text-slate-400 block font-semibold">Cao / Thấp</span>
                <span className="text-xs font-black text-slate-800 dark:text-slate-200 mt-1 block">
                  {data.highestScore} / {data.lowestScore}
                </span>
                <span className="text-[9px] text-slate-400 block">
                  {data.unattemptedExamsCount > 0 ? `${data.unattemptedExamsCount} chưa thi` : 'Đã làm đủ bài'}
                </span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="px-5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-6 text-xs font-bold bg-white dark:bg-[#0F172A]">
              <button
                type="button"
                onClick={() => setActiveTab('EXAMS')}
                className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'EXAMS'
                    ? 'border-[#142B4A] dark:border-[#38BDF8] text-[#142B4A] dark:text-[#38BDF8]'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Lịch sử bài kiểm tra ({data.examRecords.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ATTENDANCE')}
                className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'ATTENDANCE'
                    ? 'border-[#142B4A] dark:border-[#38BDF8] text-[#142B4A] dark:text-[#38BDF8]'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Điểm danh các buổi ({data.sessionAttendances.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('QUESTIONS')}
                className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'QUESTIONS'
                    ? 'border-[#142B4A] dark:border-[#38BDF8] text-[#142B4A] dark:text-[#38BDF8]'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <FileQuestion className="w-3.5 h-3.5" />
                <span>Chi tiết đáp án & lỗ hổng ({data.reviewQuestions.length})</span>
              </button>
            </div>

            {/* Tab 1: Exam Attempts */}
            {activeTab === 'EXAMS' && (
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {data.examRecords.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs italic">
                    Học viên chưa thực hiện bài kiểm tra nào trong lớp này.
                  </div>
                ) : (
                  data.examRecords.map((attempt: StudentExamRecord) => (
                    <div
                      key={attempt.examId}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1E293B]/50 hover:border-slate-300 dark:hover:border-slate-700 transition"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-xs font-bold text-[#142B4A] dark:text-[#38BDF8] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                              {attempt.examCode}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              attempt.isPassed
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}>
                              {attempt.isPassed ? 'ĐẠT' : 'CHƯA ĐẠT'}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            {attempt.examTitle}
                          </h4>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Nộp bài: {attempt.submittedAt || 'Chưa nộp'} • Thời gian: {attempt.durationMinutes} phút
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="text-xl font-black text-[#142B4A] dark:text-[#38BDF8]">
                            {attempt.score ?? 0}
                          </span>
                          <span className="text-xs text-slate-400"> / {attempt.maxScore} đ</span>
                          <span className="block text-xs font-semibold text-slate-500">
                            ({attempt.percentage ?? 0}%)
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                        <span className="text-slate-400">
                          Trạng thái: <strong>{attempt.status}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedExamId(attempt.examId)
                            setActiveTab('QUESTIONS')
                          }}
                          className="text-[#142B4A] dark:text-[#38BDF8] font-bold hover:underline inline-flex items-center gap-1"
                        >
                          Xem chi tiết đáp án &rarr;
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab 2: Attendance Records */}
            {activeTab === 'ATTENDANCE' && (
              <div className="flex-1 overflow-y-auto p-5 space-y-2">
                {data.sessionAttendances.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs italic">
                    Chưa có dữ liệu điểm danh thực tế cho học viên này.
                  </div>
                ) : (
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-600 dark:text-slate-300">
                        <tr>
                          <th className="p-3 w-16 text-center">Buổi</th>
                          <th className="p-3">Ngày & Giờ</th>
                          <th className="p-3">Chủ đề</th>
                          <th className="p-3 text-center w-28">Trạng thái</th>
                          <th className="p-3">Ghi chú</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {data.sessionAttendances.map((ar: StudentSessionAttendance, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="p-3 text-center font-bold text-[#142B4A] dark:text-[#38BDF8]">
                              #{idx + 1}
                            </td>
                            <td className="p-3">
                              <span className="font-semibold">{ar.sessionDate}</span>
                              <span className="text-slate-400 block text-[10px]">
                                {ar.timeRange}
                              </span>
                            </td>
                            <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                              {ar.topic || 'Buổi học định kỳ'}
                            </td>
                            <td className="p-3 text-center">
                              {ar.status === 'PRESENT' && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                  Có mặt
                                </span>
                              )}
                              {ar.status === 'LATE' && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                  Đi muộn
                                </span>
                              )}
                              {ar.status === 'ABSENT' && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                                  Vắng mặt
                                </span>
                              )}
                              {ar.status === 'UNRECORDED' && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                  Chưa điểm danh
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-slate-500 italic text-[11px]">
                              {ar.remarks || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Detailed Question Review */}
            {activeTab === 'QUESTIONS' && (
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {/* Attempt banner */}
                {selectedExamRecord && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <strong>{selectedExamRecord.examTitle}</strong>
                      <span className="text-slate-400 block text-[11px]">
                        Điểm số: {selectedExamRecord.score ?? 0} / {selectedExamRecord.maxScore} đ ({selectedExamRecord.percentage ?? 0}%)
                      </span>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                      selectedExamRecord.isPassed
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}>
                      {selectedExamRecord.isPassed ? 'ĐẠT YÊU CẦU' : 'CHƯA ĐẠT YÊU CẦU'}
                    </span>
                  </div>
                )}

                {data.reviewQuestions.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs italic">
                    Chưa có bài thi nào có câu hỏi chi tiết để hiển thị.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.reviewQuestions.map((qr: StudentReviewQuestion, qIdx: number) => (
                      <div
                        key={qr.questionId}
                        className={`p-4 rounded-xl border text-xs transition ${
                          qr.isCorrect
                            ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/20 dark:bg-emerald-950/20'
                            : 'border-rose-200 dark:border-rose-900/50 bg-rose-50/20 dark:bg-rose-950/20'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-500">Câu {qIdx + 1}</span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {qr.topic || 'Chung'}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              qr.isCorrect
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}>
                              {qr.isCorrect ? 'Đúng' : 'Sai / Chưa trả lời'}
                            </span>
                          </div>
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {qr.pointsEarned ?? 0} / {qr.maxPoints ?? 1} đ
                          </span>
                        </div>

                        <p className="font-semibold text-slate-900 dark:text-white mb-2">
                          {qr.questionContent}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2 rounded-lg bg-white/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-[11px]">
                          <div>
                            <span className="text-slate-400 block font-semibold">Học viên trả lời:</span>
                            <span className={qr.isCorrect ? 'font-bold text-emerald-600' : 'font-bold text-rose-600'}>
                              {qr.studentAnswer || '(Không trả lời)'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-semibold">Đáp án đúng:</span>
                            <span className="font-bold text-emerald-700 dark:text-emerald-400">
                              {qr.correctAnswer || '(Chưa cập nhật)'}
                            </span>
                          </div>
                        </div>

                        {qr.explanation && (
                          <div className="mt-2 text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg">
                            <strong className="text-slate-700 dark:text-slate-300">Giải thích: </strong>
                            {qr.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#1E293B] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}
