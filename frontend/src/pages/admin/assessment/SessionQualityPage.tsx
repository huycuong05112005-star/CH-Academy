import React, { useEffect, useState, useCallback } from 'react'
import { assessmentApi } from '../../../api/assessment'
import { classesApi } from '../../../api/classes'
import { attendanceApi } from '../../../api/attendance'
import type { SessionQualityData } from '../../../types/assessment'
import type { ClassItem } from '../../../types/class'
import type { ClassSessionItem } from '../../../types/attendance'
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Users,
  Award,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ShieldAlert,
  Info
} from 'lucide-react'

export const SessionQualityPage: React.FC = () => {
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null)
  const [sessions, setSessions] = useState<ClassSessionItem[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null)

  const [qualityData, setQualityData] = useState<SessionQualityData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  // 1. Fetch Class List
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await classesApi.searchClasses({ size: 100 })
        if (res.success && res.data) {
          const list = res.data.content || []
          setClasses(list)
          if (list.length > 0 && !selectedClassId) {
            setSelectedClassId(list[0].id)
          }
        }
      } catch (err) {
        console.error('Failed to load classes:', err)
      }
    }
    fetchClasses()
  }, [])

  // 2. Fetch Sessions of Selected Class
  useEffect(() => {
    if (!selectedClassId) return
    const fetchSessions = async () => {
      try {
        const res = await attendanceApi.getSessions({ classId: selectedClassId })
        if (res.success && res.data) {
          const list = res.data || []
          setSessions(list)
          if (list.length > 0) {
            setSelectedSessionId(list[0].id)
          } else {
            setSelectedSessionId(null)
            setQualityData(null)
          }
        }
      } catch (err) {
        console.error('Failed to load class sessions:', err)
      }
    }
    fetchSessions()
  }, [selectedClassId])

  // 3. Fetch Session Quality Data
  const fetchSessionQuality = useCallback(async () => {
    if (!selectedSessionId) return
    try {
      setLoading(true)
      const res = await assessmentApi.getSessionQuality(selectedSessionId)
      if (res.success && res.data) {
        setQualityData(res.data)
      }
    } catch (err) {
      console.error('Failed to load session quality:', err)
    } finally {
      setLoading(false)
    }
  }, [selectedSessionId])

  useEffect(() => {
    fetchSessionQuality()
  }, [fetchSessionQuality])

  const getRatingBadge = (rating: string) => {
    switch (rating) {
      case 'Xuất sắc':
        return 'bg-emerald-500 text-white'
      case 'Tốt':
        return 'bg-blue-600 text-white'
      case 'Khá':
        return 'bg-amber-500 text-white'
      default:
        return 'bg-rose-500 text-white'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header & Filter Bar */}
      <div className="bg-white dark:bg-[#151F31] p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
                <Activity className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Phân Tích Chất Lượng Từng Buổi Học
              </h1>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Đánh giá phiên học thực tế dựa trên điểm danh, tỷ lệ hoàn thành bài tập, điểm trắc nghiệm và phát hiện học viên cần kèm cặp
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 flex items-center gap-1.5 border border-slate-200 dark:border-slate-700">
              <Info className="w-3.5 h-3.5 text-blue-500" />
              Công thức đa chiều minh bạch
            </span>
          </div>
        </div>

        {/* Class and Session Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-5">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
              1. Chọn Lớp Học *
            </label>
            <select
              value={selectedClassId || ''}
              onChange={(e) => setSelectedClassId(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-200 outline-none focus:border-purple-600"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.code} - {cls.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
              2. Chọn Buổi Học Cụ Thể (Session) *
            </label>
            <select
              value={selectedSessionId || ''}
              onChange={(e) => setSelectedSessionId(Number(e.target.value))}
              disabled={sessions.length === 0}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-200 outline-none focus:border-purple-600 disabled:opacity-50"
            >
              {sessions.length === 0 ? (
                <option value="">Lớp này chưa có lịch buổi học</option>
              ) : (
                sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    Ngày {s.sessionDate} ({s.startTime?.substring(0, 5)} - {s.endTime?.substring(0, 5)}) — {s.topic || 'Chưa đặt chủ đề'}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white dark:bg-[#151F31] rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-sm font-bold text-slate-500">Đang tổng hợp dữ liệu chất lượng buổi học...</p>
        </div>
      ) : !qualityData ? (
        <div className="p-12 text-center bg-white dark:bg-[#151F31] rounded-2xl border border-slate-200 dark:border-slate-800">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 dark:text-white text-base">Chưa có dữ liệu buổi học</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Vui lòng chọn lớp học và buổi học đã được lên lịch để phân tích chất lượng buổi dạy và học.
          </p>
        </div>
      ) : (
        <>
          {/* Data Warnings Banner if any */}
          {qualityData.dataWarnings && qualityData.dataWarnings.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold text-sm text-amber-900 dark:text-amber-200">
                  Lưu ý tính toàn vẹn dữ liệu buổi học
                </div>
                <ul className="text-xs text-amber-800 dark:text-amber-300 list-disc list-inside space-y-0.5">
                  {qualityData.dataWarnings.map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Session Info Banner */}
          <div className="bg-white dark:bg-[#151F31] p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  {qualityData.classCode}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                  {qualityData.sessionStatus}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                {qualityData.topic || 'Buổi học'}
              </h2>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 font-medium">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  GV: <strong>{qualityData.teacherName}</strong>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Ngày: <strong>{qualityData.sessionDate}</strong>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {qualityData.startTime?.substring(0, 5)} - {qualityData.endTime?.substring(0, 5)}
                </span>
                {qualityData.room && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      Phòng: <strong>{qualityData.room}</strong>
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Synthesized Quality Index Score Badge */}
            <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shrink-0">
              <div className="text-right">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Chỉ Số Chất Lượng Buổi Học
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                  {qualityData.qualityScore} <span className="text-sm font-semibold text-slate-400">/ 100</span>
                </div>
                <div className="text-[11px] text-slate-400 italic mt-0.5 max-w-[240px]">
                  {qualityData.formulaDescription}
                </div>
              </div>
              <div className={`px-3 py-2 rounded-xl font-black text-sm uppercase tracking-wider shadow-sm ${getRatingBadge(qualityData.qualityRating)}`}>
                {qualityData.qualityRating}
              </div>
            </div>
          </div>

          {/* Breakdown Sections: Attendance vs Assessment */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* 1. Mức độ tham gia & Điểm danh */}
            <div className="bg-white dark:bg-[#151F31] p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-500" />
                  1. Điểm Danh & Tham Gia Lớp Học
                </h3>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2.5 py-1 rounded-lg">
                  Tỷ lệ: {qualityData.attendanceRate}%
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                  <div className="text-xs text-slate-500 font-semibold">Sĩ số lớp</div>
                  <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
                    {qualityData.expectedStudents}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60">
                  <div className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold">Có mặt</div>
                  <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                    {qualityData.presentCount}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60">
                  <div className="text-xs text-amber-700 dark:text-amber-300 font-semibold">Đi muộn</div>
                  <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">
                    {qualityData.lateCount}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-800/60">
                  <div className="text-xs text-rose-700 dark:text-rose-300 font-semibold">Vắng mặt</div>
                  <div className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">
                    {qualityData.absentCount}
                  </div>
                </div>
              </div>

              <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${(qualityData.presentCount / Math.max(qualityData.expectedStudents, 1)) * 100}%` }}
                  title="Có mặt"
                ></div>
                <div
                  className="h-full bg-amber-500 transition-all duration-500"
                  style={{ width: `${(qualityData.lateCount / Math.max(qualityData.expectedStudents, 1)) * 100}%` }}
                  title="Đi muộn"
                ></div>
                <div
                  className="h-full bg-rose-500 transition-all duration-500"
                  style={{ width: `${(qualityData.absentCount / Math.max(qualityData.expectedStudents, 1)) * 100}%` }}
                  title="Vắng mặt"
                ></div>
              </div>
            </div>

            {/* 2. Đánh giá kiểm tra gắn với buổi học */}
            <div className="bg-white dark:bg-[#151F31] p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <Award className="w-5 h-5 text-purple-500" />
                  2. Đánh Giá Trắc Nghiệm / Bài Tập Buổi Học
                </h3>
                <span className="text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950 px-2.5 py-1 rounded-lg">
                  {qualityData.quizzesAssignedCount} hoạt động kiểm tra
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                  <div className="text-xs text-slate-500 font-semibold">Tỷ lệ nộp bài</div>
                  <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
                    {qualityData.quizCompletionRate}%
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/60">
                  <div className="text-xs text-blue-700 dark:text-blue-300 font-semibold">Điểm TB Quiz</div>
                  <div className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1">
                    {qualityData.quizAverageScore} <span className="text-xs text-slate-400">/10</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60">
                  <div className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold">Tỷ lệ Đạt</div>
                  <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                    {qualityData.quizPassRate}%
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-800/60">
                  <div className="text-xs text-purple-700 dark:text-purple-300 font-semibold">Số bài đã nộp</div>
                  <div className="text-xl font-black text-purple-600 dark:text-purple-400 mt-1">
                    {qualityData.quizSubmissionsCount}
                  </div>
                </div>
              </div>

              {/* Pre vs Post class Quiz Improvement if available */}
              {qualityData.preClassQuizScore !== null && qualityData.postClassQuizScore !== null && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500 font-medium">Khảo sát đầu buổi: </span>
                    <strong className="text-slate-800 dark:text-white">{qualityData.preClassQuizScore}/10</strong>
                    <span className="mx-2">→</span>
                    <span className="text-slate-500 font-medium">Đánh giá cuối buổi: </span>
                    <strong className="text-emerald-600 dark:text-emerald-400">{qualityData.postClassQuizScore}/10</strong>
                  </div>
                  {qualityData.scoreImprovement !== null && (
                    <span className="font-bold text-emerald-600 flex items-center gap-1">
                      <ArrowUpRight className="w-4 h-4" />
                      +{qualityData.scoreImprovement} điểm
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Students Needing Support Section */}
          <div className="bg-white dark:bg-[#151F31] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Danh Sách Học Viên Cần Kèm Cặp / Hỗ Trợ Sau Buổi Học ({qualityData.studentsNeedingSupport.length})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Học viên vắng mặt, đi muộn, làm bài thi dưới điểm trung bình hoặc chưa nộp bài tập
                </p>
              </div>
            </div>

            {qualityData.studentsNeedingSupport.length === 0 ? (
              <div className="p-8 text-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                Tất cả học viên trong buổi học đều tham gia đầy đủ và đạt kết quả đánh giá tốt!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <th className="py-3 px-4">Học Viên</th>
                      <th className="py-3 px-4 text-center">Điểm Danh</th>
                      <th className="py-3 px-4 text-center">Điểm Kiểm Tra</th>
                      <th className="py-3 px-4">Lý Do Cần Hỗ Trợ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
                    {qualityData.studentsNeedingSupport.map((st) => (
                      <tr key={st.studentId} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {st.fullName}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {st.studentCode}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          {st.attendanceStatus === 'ABSENT' && (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                              Vắng mặt
                            </span>
                          )}
                          {st.attendanceStatus === 'LATE' && (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                              Đi muộn
                            </span>
                          )}
                          {st.attendanceStatus === 'PRESENT' && (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                              Có mặt
                            </span>
                          )}
                          {st.attendanceStatus === 'NOT_RECORDED' && (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 dark:bg-slate-800">
                              Chưa điểm danh
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-center font-bold">
                          {st.quizScore !== undefined && st.quizScore !== null ? (
                            <span className={Number(st.quizScore) < 5.0 ? 'text-rose-600 font-black' : 'text-slate-800'}>
                              {st.quizScore} / 10
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-xs">Chưa có điểm</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1.5">
                            {st.reasons.map((r, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded-lg text-xs font-medium bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60"
                              >
                                {r}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Sessions Overview Timeline */}
          <div className="bg-white dark:bg-[#151F31] p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                Tiến Trình Chất Lượng Các Buổi Học Trong Khóa ({qualityData.classSessionsOverview.length})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                So sánh tỷ lệ tham gia, điểm số và chỉ số chất lượng qua từng buổi học của lớp
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {qualityData.classSessionsOverview.map((item) => (
                <div
                  key={item.sessionId}
                  onClick={() => setSelectedSessionId(item.sessionId)}
                  className={`p-4 rounded-xl border transition cursor-pointer ${
                    item.sessionId === selectedSessionId
                      ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/30 ring-2 ring-purple-600/20'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span className="font-semibold">{item.sessionDate}</span>
                    <span className="font-bold text-purple-600 dark:text-purple-400">{item.qualityScore} đ</span>
                  </div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white truncate">
                    {item.topic}
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                    <span>CC: <strong>{item.attendanceRate}%</strong></span>
                    <span>Quiz: <strong>{item.quizAverageScore}/10</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
export default SessionQualityPage
