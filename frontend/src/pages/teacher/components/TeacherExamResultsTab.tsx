import React, { useState, useEffect } from 'react'
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  BarChart3,
  Search,
  CheckSquare,
  RefreshCw
} from 'lucide-react'
import { teacherApi } from '../../../api/teacher'
import type { ClassExamResultItem, TeacherClassItem } from '../../../types/teacher'

interface Props {
  teacherClasses: TeacherClassItem[]
}

export const TeacherExamResultsTab: React.FC<Props> = ({ teacherClasses }) => {
  const [selectedClassId, setSelectedClassId] = useState<number | ''>(teacherClasses[0]?.id || '')
  const [examResults, setExamResults] = useState<ClassExamResultItem[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Selected Exam for detailed student breakdown
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null)
  const [studentStatusFilter, setStudentStatusFilter] = useState<'ALL' | 'UNATTEMPTED' | 'FAILED' | 'COMPLETED'>('ALL')
  const [searchStudent, setSearchStudent] = useState<string>('')

  const loadResults = async (classId: number) => {
    setLoading(true)
    setError(null)
    try {
      const res = await teacherApi.getClassExamResults(classId)
      if (res.data) {
        setExamResults(res.data)
        if (res.data.length > 0 && !selectedExamId) {
          setSelectedExamId(res.data[0].examId)
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Không thể tải kết quả kiểm tra của lớp.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedClassId) {
      loadResults(Number(selectedClassId))
    }
  }, [selectedClassId])

  const selectedExamData = examResults.find((e) => e.examId === selectedExamId)

  // Filter students
  const filteredStudents = (selectedExamData?.studentResults || []).filter((s) => {
    if (searchStudent.trim()) {
      const q = searchStudent.toLowerCase()
      const matchName = s.fullName?.toLowerCase().includes(q)
      const matchCode = s.studentCode?.toLowerCase().includes(q)
      if (!matchName && !matchCode) return false
    }

    if (studentStatusFilter === 'UNATTEMPTED') {
      return s.status === 'NOT_STARTED'
    }
    if (studentStatusFilter === 'FAILED') {
      return s.status === 'GRADED' && s.isPassed === false
    }
    if (studentStatusFilter === 'COMPLETED') {
      return s.status === 'GRADED' || s.status === 'SUBMITTED'
    }
    return true
  })

  return (
    <div className="space-y-6">
      {/* Top Header & Class Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Kết Quả Bài Kiểm Tra Theo Lớp Học
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi phổ điểm, tỷ lệ hoàn thành và học viên chưa làm bài để hỗ trợ kịp thời
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-500">Lớp học:</span>
          <select
            value={selectedClassId}
            onChange={(e) => {
              const val = e.target.value ? Number(e.target.value) : ''
              setSelectedClassId(val)
              setSelectedExamId(null)
            }}
            className="px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20"
          >
            {teacherClasses.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name} ({cls.code}) - {cls.enrolledStudents} học viên
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500">Đang tổng hợp kết quả bài thi của lớp...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center text-rose-500 bg-rose-50 dark:bg-rose-950/30 rounded-2xl border border-rose-200">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
          <p className="font-semibold text-xs">{error}</p>
        </div>
      ) : examResults.length === 0 ? (
        <div className="p-16 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <CheckSquare className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Chưa có bài kiểm tra nào được phát hành cho lớp này
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Vào tab "Soạn đề & Quản lý thi", chọn đề đã được duyệt và bấm "Giao đề cho lớp" để bắt đầu đánh giá học viên.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Exam Cards Carousel / Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {examResults.map((exam) => {
              const isSelected = exam.examId === selectedExamId
              return (
                <div
                  key={exam.examId}
                  onClick={() => setSelectedExamId(exam.examId)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? 'bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-transparent border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                      : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-indigo-400'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-400 font-bold">
                      {exam.examCode}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500">
                      {exam.durationMinutes} phút
                    </span>
                  </div>

                  <h3 className="text-sm font-black text-slate-900 dark:text-white mt-1 line-clamp-1">
                    {exam.examTitle}
                  </h3>

                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
                    <div>
                      <div className="text-xs font-black text-slate-900 dark:text-white">
                        {exam.completedCount}/{exam.totalStudents}
                      </div>
                      <div className="text-[10px] text-slate-400">Đã nộp</div>
                    </div>
                    <div>
                      <div className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                        {exam.averageScore !== null && exam.averageScore !== undefined ? `${exam.averageScore}` : '—'}
                      </div>
                      <div className="text-[10px] text-slate-400">Điểm TB</div>
                    </div>
                    <div>
                      <div className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                        {exam.passRate}%
                      </div>
                      <div className="text-[10px] text-slate-400">Qua môn</div>
                    </div>
                  </div>

                  {/* Unattempted alert */}
                  {exam.unattemptedCount > 0 && (
                    <div className="mt-3 text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Có {exam.unattemptedCount} bạn chưa làm bài
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Detailed Student Breakdown for Selected Exam */}
          {selectedExamData && (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    Danh Sách Kết Quả: {selectedExamData.examTitle}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Tổng số {selectedExamData.totalStudents} học viên trong lớp
                  </p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchStudent}
                      onChange={(e) => setSearchStudent(e.target.value)}
                      placeholder="Tìm tên, mã học viên..."
                      className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="flex gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
                    {[
                      { id: 'ALL', label: 'Tất cả' },
                      { id: 'UNATTEMPTED', label: 'Chưa làm' },
                      { id: 'FAILED', label: 'Chưa đạt' },
                      { id: 'COMPLETED', label: 'Đã hoàn thành' }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setStudentStatusFilter(tab.id as any)}
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                          studentStatusFilter === tab.id
                            ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Student Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Mã HV</th>
                      <th className="py-3 px-4">Họ và tên</th>
                      <th className="py-3 px-4 text-center">Trạng thái thi</th>
                      <th className="py-3 px-4 text-center">Số lượt làm</th>
                      <th className="py-3 px-4 text-center">Điểm số</th>
                      <th className="py-3 px-4 text-center">Kết quả</th>
                      <th className="py-3 px-4 text-right">Thời gian nộp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          Không có học viên nào khớp với bộ lọc.
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((s) => (
                        <tr key={s.studentId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                          <td className="py-3 px-4 font-mono font-bold text-slate-600 dark:text-slate-400">
                            {s.studentCode}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                            {s.fullName}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {s.status === 'NOT_STARTED' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-300">
                                Chưa làm bài
                              </span>
                            )}
                            {s.status === 'IN_PROGRESS' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-300 animate-pulse">
                                Đang làm bài
                              </span>
                            )}
                            {s.status === 'SUBMITTED' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-300">
                                Chờ chấm tự luận
                              </span>
                            )}
                            {s.status === 'GRADED' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-300">
                                Đã có điểm
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-slate-700 dark:text-slate-300">
                            {s.attemptCount || 0}
                          </td>
                          <td className="py-3 px-4 text-center font-extrabold text-sm">
                            {s.score !== null && s.score !== undefined ? (
                              <span className="text-indigo-600 dark:text-indigo-400">
                                {s.score} <span className="text-[10px] text-slate-400 font-normal">/ {s.maxScore || 10}</span>
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {s.isPassed === true && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Đạt
                              </span>
                            )}
                            {s.isPassed === false && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                                <XCircle className="w-3.5 h-3.5" /> Chưa đạt
                              </span>
                            )}
                            {s.isPassed === null && <span className="text-slate-400">—</span>}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-400 font-mono">
                            {s.submittedAt
                              ? new Date(s.submittedAt).toLocaleString('vi-VN')
                              : '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
export default TeacherExamResultsTab
