import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { assessmentApi } from '../../../api/assessment'
import { classesApi } from '../../../api/classes'
import type { ClassAssessmentAnalytics } from '../../../types/assessment'
import type { ClassItem, ClassSessionItem } from '../../../types/class'
import { StudentAssessmentDrawer } from '../../../components/assessment/StudentAssessmentDrawer'
import { exportToCsv } from '../../../utils/exportCsv'
import {
  Award,
  CheckCircle2,
  XCircle,
  TrendingUp,
  BarChart2,
  Search,
  GraduationCap,
  Calendar,
  AlertCircle,
  AlertTriangle,
  Download,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  BookOpen,
  UserCheck,
  FileQuestion,
  Check,
  RotateCcw
} from 'lucide-react'
import { Tilt3DCard } from '../../../components/3d/Tilt3DCard'

export const ClassAnalyticsPage: React.FC = () => {
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null)
  const [sessions, setSessions] = useState<ClassSessionItem[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<number | undefined>(undefined)
  const [selectedExamId, setSelectedExamId] = useState<number | undefined>(undefined)
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')

  const [analytics, setAnalytics] = useState<ClassAssessmentAnalytics | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  // Interactive Filter from Chart A (Score distribution click)
  const [selectedScoreBucket, setSelectedScoreBucket] = useState<string | null>(null)

  // Student Table Search & Filter
  const [studentSearch, setStudentSearch] = useState<string>('')
  const [supportFilter, setSupportFilter] = useState<'ALL' | 'NEEDS_SUPPORT' | 'PASSED' | 'FAILED'>('ALL')
  const [sortField, setSortField] = useState<'name' | 'avgScore' | 'attendance' | 'completed'>('avgScore')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const pageSize = 10

  // Chart C Pagination
  const [chartCPage, setChartCPage] = useState<number>(1)
  const chartCPageSize = 8

  // Student Drilldown Drawer State
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null)

  // Load Classes
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
        console.error('Failed to load classes for analytics:', err)
      }
    }
    fetchClasses()
  }, [])

  // Load Sessions for Selected Class
  useEffect(() => {
    if (!selectedClassId) return
    const fetchSessions = async () => {
      try {
        const res = await classesApi.getClassSessions(selectedClassId)
        if (res.success && res.data) {
          setSessions(res.data)
        } else {
          setSessions([])
        }
      } catch (err) {
        console.error('Failed to load class sessions:', err)
        setSessions([])
      }
    }
    fetchSessions()
    setSelectedSessionId(undefined)
  }, [selectedClassId])

  // Load Analytics Data
  const fetchAnalytics = useCallback(async () => {
    if (!selectedClassId) return
    try {
      setLoading(true)
      const res = await assessmentApi.getClassAssessmentAnalytics(selectedClassId, {
        sessionId: selectedSessionId,
        examId: selectedExamId,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      })
      if (res.success && res.data) {
        setAnalytics(res.data)
      }
    } catch (err) {
      console.error('Failed to load class analytics:', err)
    } finally {
      setLoading(false)
    }
  }, [selectedClassId, selectedSessionId, selectedExamId, startDate, endDate])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  // Filtered and Sorted Students
  const filteredStudents = useMemo(() => {
    if (!analytics?.studentScores) return []
    let list = [...analytics.studentScores]

    // 1. Keyword search (Name / Code)
    if (studentSearch.trim()) {
      const term = studentSearch.toLowerCase()
      list = list.filter(
        (s) =>
          s.fullName.toLowerCase().includes(term) ||
          s.studentCode.toLowerCase().includes(term)
      )
    }

    // 2. Score Bucket filter (from clicking Chart A)
    if (selectedScoreBucket) {
      list = list.filter((s) => {
        const score = Number(s.averageScore) || 0
        if (selectedScoreBucket === '0 - 3.9') return score >= 0 && score < 4.0
        if (selectedScoreBucket === '4.0 - 5.9') return score >= 4.0 && score < 6.0
        if (selectedScoreBucket === '6.0 - 7.9') return score >= 6.0 && score < 8.0
        if (selectedScoreBucket === '8.0 - 10.0') return score >= 8.0 && score <= 10.0
        return true
      })
    }

    // 3. Needs Support / Status filter
    if (supportFilter === 'NEEDS_SUPPORT') {
      list = list.filter((s) => s.needsSupport)
    } else if (supportFilter === 'PASSED') {
      list = list.filter((s) => s.status === 'PASSED')
    } else if (supportFilter === 'FAILED') {
      list = list.filter((s) => s.status === 'FAILED')
    }

    // 4. Sort
    list.sort((a, b) => {
      let cmp = 0
      if (sortField === 'name') {
        cmp = a.fullName.localeCompare(b.fullName, 'vi')
      } else if (sortField === 'avgScore') {
        cmp = (Number(a.averageScore) || 0) - (Number(b.averageScore) || 0)
      } else if (sortField === 'attendance') {
        cmp = (Number(a.attendanceRate) || 0) - (Number(b.attendanceRate) || 0)
      } else if (sortField === 'completed') {
        cmp = (a.totalCompleted || 0) - (b.totalCompleted || 0)
      }
      return sortOrder === 'asc' ? cmp : -cmp
    })

    return list
  }, [analytics?.studentScores, studentSearch, selectedScoreBucket, supportFilter, sortField, sortOrder])

  // Table pagination
  const totalStudents = filteredStudents.length
  const totalPages = Math.ceil(totalStudents / pageSize) || 1
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredStudents.slice(start, start + pageSize)
  }, [filteredStudents, currentPage])

  // Export to CSV
  const handleExportCsv = () => {
    if (!analytics) return
    const headers = [
      'Mã học viên',
      'Họ và tên',
      'Số bài đã làm',
      'Số bài chưa làm',
      'Điểm TB (/10)',
      'Điểm cao nhất',
      'Điểm thấp nhất',
      'Tỷ lệ đạt (%)',
      'Tỷ lệ chuyên cần (%)',
      'Số buổi tham gia',
      'Xu hướng tiến bộ',
      'Cần hỗ trợ'
    ]
    const rows = filteredStudents.map((s) => [
      s.studentCode,
      s.fullName,
      s.totalCompleted ?? s.attemptsCount,
      s.totalUnattempted ?? 0,
      s.averageScore,
      s.highestScore,
      s.lowestScore ?? s.highestScore,
      s.passRate,
      s.attendanceRate ?? '—',
      s.attendedSessions != null ? `${s.attendedSessions}/${s.totalClassSessions}` : '—',
      s.progressTrend ?? 'ỔN ĐỊNH',
      s.needsSupport ? 'CÓ (Cần kèm cặp)' : 'Bình thường'
    ])
    exportToCsv(`Bao_Cao_Phan_Tich_Lop_${analytics.classCode}`, headers, rows)
  }

  // Toggle column sorting
  const handleSort = (field: 'name' | 'avgScore' | 'attendance' | 'completed') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
    setCurrentPage(1)
  }

  // Chart C data (student score horizontal bar)
  const chartCStudents = useMemo(() => {
    if (!analytics?.studentScores) return []
    const sorted = [...analytics.studentScores].sort(
      (a, b) => (Number(b.averageScore) || 0) - (Number(a.averageScore) || 0)
    )
    const start = (chartCPage - 1) * chartCPageSize
    return sorted.slice(start, start + chartCPageSize)
  }, [analytics?.studentScores, chartCPage])

  const chartCTotalPages = Math.ceil((analytics?.studentScores?.length || 0) / chartCPageSize) || 1

  return (
    <div className="space-y-6">
      {/* Top Header & Filter Card */}
      <div className="bg-white dark:bg-[#151F31] p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#142B4A] dark:text-[#38BDF8]">
                <BarChart2 className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Phân Tích Kết Quả & Chất Lượng Theo Lớp Học
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Hệ thống theo dõi đa chiều: Điểm số, mức độ chuyên cần, đánh giá theo buổi học và phát hiện học viên cần hỗ trợ
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              disabled={!analytics || filteredStudents.length === 0}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              Xuất Excel (.csv)
            </button>
            <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1.5 border border-emerald-200 dark:border-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Dữ liệu thời gian thực
            </span>
          </div>
        </div>

        {/* Filters Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-5 text-xs">
          {/* Class Picker */}
          <div>
            <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5 text-[#142B4A] dark:text-[#38BDF8]" /> Lớp học *
            </label>
            <select
              value={selectedClassId || ''}
              onChange={(e) => {
                setSelectedClassId(Number(e.target.value))
                setSelectedSessionId(undefined)
                setSelectedExamId(undefined)
                setSelectedScoreBucket(null)
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-200 outline-none focus:border-[#142B4A]"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.code} — {cls.name}
                </option>
              ))}
            </select>
          </div>

          {/* Session Picker */}
          <div>
            <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-500" /> Lọc theo buổi học
            </label>
            <select
              value={selectedSessionId || ''}
              onChange={(e) => setSelectedSessionId(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-200 outline-none"
            >
              <option value="">Tất cả các buổi học (Toàn khóa)</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  Buổi {s.sessionNumber}: {s.topic || s.sessionDate}
                </option>
              ))}
            </select>
          </div>

          {/* Exam Picker */}
          <div>
            <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
              <FileQuestion className="w-3.5 h-3.5 text-purple-500" /> Bài kiểm tra
            </label>
            <select
              value={selectedExamId || ''}
              onChange={(e) => setSelectedExamId(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-200 outline-none"
            >
              <option value="">Tất cả bài kiểm tra</option>
              {analytics?.scoreTrend?.map((t, idx) => (
                <option key={idx} value={idx + 1}>
                  {t.examTitle}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Từ ngày
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 outline-none"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Đến ngày
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 outline-none"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white dark:bg-[#151F31] rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="w-10 h-10 border-4 border-[#142B4A] dark:border-[#38BDF8] border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-sm font-bold text-slate-500">Đang tổng hợp dữ liệu lớp học...</p>
        </div>
      ) : !analytics ? (
        <div className="p-8 text-center bg-white dark:bg-[#151F31] rounded-2xl border border-slate-200 dark:border-slate-800">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 dark:text-white">Không có dữ liệu</h3>
          <p className="text-sm text-slate-500 mt-1">Vui lòng chọn lớp học có học viên và bài kiểm tra để xem thống kê.</p>
        </div>
      ) : (
        <>
          {/* SECTION 2.4: EMBEDDED SESSION QUALITY ANALYSIS BANNER (if session filtered) */}
          {analytics.selectedSessionQuality && (
            <div className="bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 rounded-2xl p-5 shadow-xs space-y-4 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-100 dark:border-indigo-900/60 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
                    <BookOpen className="w-5 h-5" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black px-2 py-0.5 rounded bg-indigo-200 text-indigo-900 dark:bg-indigo-800 dark:text-indigo-100">
                        Buổi học
                      </span>
                      <h3 className="text-base font-bold text-indigo-950 dark:text-indigo-100">
                        Phân Tích Chất Lượng: {analytics.selectedSessionQuality.topic || 'Buổi học định kỳ'}
                      </h3>
                    </div>
                    <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-0.5">
                      Ngày: <strong>{analytics.selectedSessionQuality.sessionDate}</strong> ({analytics.selectedSessionQuality.startTime?.slice(0, 5)} - {analytics.selectedSessionQuality.endTime?.slice(0, 5)}) • Điểm danh thực tế: <strong>{analytics.selectedSessionQuality.presentCount}/{analytics.selectedSessionQuality.expectedStudents} học viên ({analytics.selectedSessionQuality.attendanceRate}%)</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="px-3 py-1.5 bg-white dark:bg-slate-900 rounded-xl border border-indigo-100 dark:border-indigo-900 text-center">
                    <span className="text-[10px] text-slate-400 block font-semibold">Điểm TB Buổi</span>
                    <span className="text-sm font-black text-indigo-900 dark:text-indigo-200">
                      {analytics.selectedSessionQuality.quizAverageScore} / 10
                    </span>
                  </div>
                  <div className="px-3 py-1.5 bg-white dark:bg-slate-900 rounded-xl border border-indigo-100 dark:border-indigo-900 text-center">
                    <span className="text-[10px] text-slate-400 block font-semibold">Tỷ lệ Đạt</span>
                    <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                      {analytics.selectedSessionQuality.quizPassRate}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Attention students in this session */}
              <div className="bg-white dark:bg-[#1E293B] p-3.5 rounded-xl border border-indigo-100 dark:border-indigo-900/60 text-xs">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-blue-500" />
                  Học viên vắng mặt hoặc kết quả kiểm tra cần chú ý trong buổi:
                </h4>
                {analytics.selectedSessionQuality.studentsNeedingSupport.length === 0 ? (
                  <p className="text-emerald-600 font-semibold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> 100% học viên tham gia đầy đủ và đạt yêu cầu trong buổi học này!
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {analytics.selectedSessionQuality.studentsNeedingSupport.map((st) => (
                      <div key={st.studentId} className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50">
                        <div className="font-bold text-rose-800 dark:text-rose-200">
                          {st.fullName} ({st.studentCode})
                        </div>
                        <div className="text-[10px] text-rose-600 dark:text-rose-400 mt-0.5">
                          {st.reasons?.join('; ') || 'Cần theo dõi'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION 2.1: TỔNG QUAN LỚP HỌC (8 KPI CARDS WITH 3D DEPTH) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {/* 1. Tổng số học viên */}
            <Tilt3DCard maxTilt={5}>
              <div className="bg-white dark:bg-[#151F31] p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm h-full">
                <span className="text-[11px] text-slate-500 block font-semibold truncate">Tổng học viên</span>
                <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
                  {analytics.totalEnrolled}
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">Sĩ số lớp</span>
              </div>
            </Tilt3DCard>

            {/* 2. Đã tham gia kiểm tra */}
            <Tilt3DCard maxTilt={5}>
              <div className="bg-white dark:bg-[#151F31] p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm h-full">
                <span className="text-[11px] text-slate-500 block font-semibold truncate">Đã làm bài</span>
                <div className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1">
                  {analytics.totalParticipated}
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">Học viên tham gia</span>
              </div>
            </Tilt3DCard>

            {/* 3. Chưa làm bài */}
            <Tilt3DCard maxTilt={5}>
              <div className="bg-white dark:bg-[#151F31] p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm h-full">
                <span className="text-[11px] text-slate-500 block font-semibold truncate">Chưa làm bài</span>
                <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">
                  {analytics.totalUnattempted}
                </div>
                <span className="text-[10px] text-amber-500 block mt-0.5">Cần nhắc nhở</span>
              </div>
            </Tilt3DCard>

            {/* 4. Điểm trung bình */}
            <Tilt3DCard maxTilt={5}>
              <div className="bg-white dark:bg-[#151F31] p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm h-full">
                <span className="text-[11px] text-slate-500 block font-semibold truncate">Điểm TB</span>
                <div className="text-xl font-black text-[#142B4A] dark:text-[#38BDF8] mt-1">
                  {analytics.averageScore}
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">Thang điểm 10</span>
              </div>
            </Tilt3DCard>

            {/* 5. Điểm trung vị */}
            <Tilt3DCard maxTilt={5}>
              <div className="bg-white dark:bg-[#151F31] p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm h-full">
                <span className="text-[11px] text-slate-500 block font-semibold truncate">Điểm trung vị</span>
                <div className="text-xl font-black text-purple-600 dark:text-purple-400 mt-1">
                  {analytics.medianScore}
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">Mức trung tâm</span>
              </div>
            </Tilt3DCard>

            {/* 6. Tỷ lệ đạt */}
            <Tilt3DCard maxTilt={5}>
              <div className="bg-white dark:bg-[#151F31] p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm h-full">
                <span className="text-[11px] text-slate-500 block font-semibold truncate">Tỷ lệ đạt</span>
                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                  {analytics.passRate}%
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">{analytics.passCount} đạt / {analytics.failCount} trượt</span>
              </div>
            </Tilt3DCard>

            {/* 7. Tỷ lệ chuyên cần (từ attendance_records) */}
            <Tilt3DCard maxTilt={5}>
              <div className="bg-white dark:bg-[#151F31] p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm h-full">
                <span className="text-[11px] text-slate-500 block font-semibold truncate">Chuyên cần</span>
                <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                  {analytics.attendanceRate ?? 100}%
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">Điểm danh thực tế</span>
              </div>
            </Tilt3DCard>

            {/* 8. Số bài kiểm tra */}
            <Tilt3DCard maxTilt={5}>
              <div className="bg-white dark:bg-[#151F31] p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm h-full">
                <span className="text-[11px] text-slate-500 block font-semibold truncate">Đề kiểm tra</span>
                <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
                  {analytics.totalExams ?? (analytics.scoreTrend?.length || 0)}
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">Đã tổ chức</span>
              </div>
            </Tilt3DCard>
          </div>

          {/* SECTION 2.2: 4 BIỂU ĐỒ LỚN, DỄ ĐỌC, TƯƠNG TÁC */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            
            {/* BIỂU ĐỒ A — Phân bố điểm số (Clickable Histogram) */}
            <div className="bg-white dark:bg-[#151F31] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-[#142B4A] dark:text-[#38BDF8]">
                      <BarChart2 className="w-4 h-4" />
                    </span>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                        Biểu Đồ A — Phân Bố Điểm Số (Score Distribution)
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Nhấn vào cột để lọc danh sách học viên theo khoảng điểm tương ứng
                      </p>
                    </div>
                  </div>
                  {selectedScoreBucket && (
                    <button
                      onClick={() => setSelectedScoreBucket(null)}
                      className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Xóa lọc
                    </button>
                  )}
                </div>

                {/* Histogram Visual Bars */}
                <div className="pt-4 pb-2 space-y-3">
                  {analytics.scoreDistribution.map((b) => {
                    const isSelected = selectedScoreBucket === b.range
                    return (
                      <div
                        key={b.range}
                        onClick={() => setSelectedScoreBucket(isSelected ? null : b.range)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#142B4A] dark:border-[#38BDF8] bg-blue-50/50 dark:bg-blue-950/40 shadow-xs'
                            : 'border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <span className={`w-2.5 h-2.5 rounded-full ${
                              b.range === '8.0 - 10.0' ? 'bg-emerald-500' :
                              b.range === '6.0 - 7.9' ? 'bg-blue-500' :
                              b.range === '4.0 - 5.9' ? 'bg-amber-500' : 'bg-rose-500'
                            }`} />
                            Khoảng {b.range} điểm
                          </span>
                          <span className="font-black text-slate-900 dark:text-white">
                            {b.count} học viên ({b.percentage}%)
                          </span>
                        </div>
                        <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              b.range === '8.0 - 10.0' ? 'bg-emerald-500' :
                              b.range === '6.0 - 7.9' ? 'bg-blue-500' :
                              b.range === '4.0 - 5.9' ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.max(Number(b.percentage), 4)}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span>Điểm chuẩn đạt: &ge; 5.0 / 10</span>
                <span>{selectedScoreBucket ? `Đang lọc: ${selectedScoreBucket}` : 'Hiển thị toàn bộ phổ điểm'}</span>
              </div>
            </div>

            {/* BIỂU ĐỒ B — So sánh kết quả giữa các buổi / đề thi */}
            <div className="bg-white dark:bg-[#151F31] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400">
                    <TrendingUp className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                      Biểu Đồ B — Xu Hướng & So Sánh Các Buổi / Đề Thi
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      So sánh điểm trung bình và tỷ lệ đạt chuẩn đầu ra theo tiến trình học
                    </p>
                  </div>
                </div>

                <div className="pt-3 space-y-3">
                  {!analytics.scoreTrend || analytics.scoreTrend.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-400 italic">
                      Chưa có đủ số lượng bài thi để lập biểu đồ xu hướng tiến độ.
                    </div>
                  ) : (
                    analytics.scoreTrend.map((item, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[220px]">
                            {item.examTitle}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="text-[#142B4A] dark:text-[#38BDF8] font-bold">
                              TB: {item.averageScore} đ
                            </span>
                            <span className="text-emerald-600 font-bold">
                              Đạt: {item.passRate}%
                            </span>
                          </div>
                        </div>

                        {/* Dual bar for score & passRate */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                            <div
                              className="h-full bg-[#142B4A] dark:bg-[#38BDF8] rounded-full transition-all"
                              style={{ width: `${Math.min(100, (Number(item.averageScore) / 10) * 100)}%` }}
                              title={`Điểm TB: ${item.averageScore}`}
                            />
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all"
                              style={{ width: `${item.passRate}%` }}
                              title={`Tỷ lệ đạt: ${item.passRate}%`}
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#142B4A] dark:bg-[#38BDF8]" /> Điểm TB
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Tỷ lệ đạt
                  </span>
                </div>
                <span>Thang điểm chuẩn hóa 10</span>
              </div>
            </div>

            {/* BIỂU ĐỒ C — Kết quả từng học viên (Horizontal Bars with Pagination) */}
            <div className="bg-white dark:bg-[#151F31] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400">
                      <Award className="w-4 h-4" />
                    </span>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                        Biểu Đồ C — Điểm Số Từng Học Viên
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Xếp hạng học viên theo điểm TB (Trang {chartCPage}/{chartCTotalPages})
                      </p>
                    </div>
                  </div>

                  {/* Chart C mini pager */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setChartCPage((p) => Math.max(1, p - 1))}
                      disabled={chartCPage === 1}
                      className="p-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setChartCPage((p) => Math.min(chartCTotalPages, p + 1))}
                      disabled={chartCPage >= chartCTotalPages}
                      className="p-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="pt-3 space-y-2.5">
                  {chartCStudents.map((st) => {
                    const score = Number(st.averageScore) || 0
                    const percent = Math.min(100, Math.max(5, (score / 10) * 100))
                    return (
                      <div
                        key={st.studentId}
                        onClick={() => setSelectedStudentId(st.studentId)}
                        className="space-y-1 cursor-pointer hover:opacity-85 transition"
                        title="Nhấp để xem hồ sơ chi tiết học viên"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                            {st.fullName}
                          </span>
                          <span className="font-black text-slate-900 dark:text-white">
                            {st.attemptsCount > 0 ? `${st.averageScore} đ` : 'Chưa thi'}
                          </span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              score >= 8.0 ? 'bg-emerald-500' : score >= 5.0 ? 'bg-blue-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Nhấp vào học viên để mở ngăn chi tiết bài làm</span>
                <span>Tổng {analytics.studentScores?.length || 0} học viên</span>
              </div>
            </div>

            {/* BIỂU ĐỒ D — Chuyên cần & Mức độ tham gia */}
            <div className="bg-white dark:bg-[#151F31] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400">
                    <UserCheck className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                      Biểu Đồ D — Chuyên Cần & Mức Độ Tham Gia
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Tỷ lệ chuyên cần thực tế từ hệ thống điểm danh và tỷ lệ hoàn thành bài thi
                    </p>
                  </div>
                </div>

                <div className="pt-3 grid grid-cols-2 gap-3">
                  {/* Attendance gauge card */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center">
                    <div className="relative w-24 h-24 flex items-center justify-center mb-2">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-slate-200 dark:text-slate-800"
                          strokeWidth="3.5"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-indigo-600 dark:text-indigo-400 transition-all duration-1000"
                          strokeDasharray={`${analytics.attendanceRate ?? 100}, 100`}
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <div className="absolute font-black text-lg text-slate-900 dark:text-white">
                        {analytics.attendanceRate ?? 100}%
                      </div>
                    </div>
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                      Chuyên cần lớp
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Tổng hợp từ các buổi học
                    </span>
                  </div>

                  {/* Test Participation gauge card */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center">
                    <div className="relative w-24 h-24 flex items-center justify-center mb-2">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-slate-200 dark:text-slate-800"
                          strokeWidth="3.5"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-blue-500 transition-all duration-1000"
                          strokeDasharray={`${Math.round((analytics.totalParticipated / Math.max(1, analytics.totalEnrolled)) * 100)}, 100`}
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <div className="absolute font-black text-lg text-slate-900 dark:text-white">
                        {Math.round((analytics.totalParticipated / Math.max(1, analytics.totalEnrolled)) * 100)}%
                      </div>
                    </div>
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                      Tham gia kiểm tra
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {analytics.totalParticipated}/{analytics.totalEnrolled} học viên
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Dữ liệu điểm danh chính thức từ các buổi học</span>
                <span>Không suy diễn chuyên cần từ điểm thi</span>
              </div>
            </div>

          </div>

          {/* SECTION 2.3: BẢNG KẾT QUẢ TỪNG HỌC VIÊN */}
          <div className="bg-white dark:bg-[#151F31] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            {/* Table Header Controls */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <span>Bảng Kết Quả Chi Tiết Từng Học Viên ({filteredStudents.length})</span>
                  {selectedScoreBucket && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                      Khoảng điểm: {selectedScoreBucket}
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Nhấp vào bất kỳ dòng nào để xem chi tiết lịch sử điểm danh, bài kiểm tra và đáp án của từng câu hỏi
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <div className="relative w-full sm:w-56">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => {
                      setStudentSearch(e.target.value)
                      setCurrentPage(1)
                    }}
                    placeholder="Tìm tên hoặc mã..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:border-[#142B4A]"
                  />
                </div>

                {/* Support filter */}
                <select
                  value={supportFilter}
                  onChange={(e) => {
                    setSupportFilter(e.target.value as 'ALL' | 'NEEDS_SUPPORT' | 'PASSED' | 'FAILED')
                    setCurrentPage(1)
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                >
                  <option value="ALL">Tất cả học viên</option>
                  <option value="NEEDS_SUPPORT">Cần theo dõi / hỗ trợ</option>
                  <option value="PASSED">Đạt yêu cầu</option>
                  <option value="FAILED">Chưa đạt</option>
                </select>
              </div>
            </div>

            {/* Students Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th
                      className="py-3.5 px-4 cursor-pointer hover:text-slate-800 dark:hover:text-white"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center gap-1">
                        <span>Học Viên</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th
                      className="py-3.5 px-3 text-center cursor-pointer hover:text-slate-800 dark:hover:text-white"
                      onClick={() => handleSort('completed')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Đã làm / Chưa làm</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th
                      className="py-3.5 px-3 text-center cursor-pointer hover:text-slate-800 dark:hover:text-white"
                      onClick={() => handleSort('avgScore')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Điểm TB</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-3.5 px-3 text-center">Cao / Thấp</th>
                    <th className="py-3.5 px-3 text-center">Tỷ Lệ Đạt</th>
                    <th
                      className="py-3.5 px-3 text-center cursor-pointer hover:text-slate-800 dark:hover:text-white"
                      onClick={() => handleSort('attendance')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Chuyên Cần</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-3.5 px-3 text-center">Tiến Bộ</th>
                    <th className="py-3.5 px-4 text-center">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {paginatedStudents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                        Không tìm thấy học viên nào phù hợp với bộ lọc.
                      </td>
                    </tr>
                  ) : (
                    paginatedStudents.map((st) => (
                      <tr
                        key={st.studentId}
                        onClick={() => setSelectedStudentId(st.studentId)}
                        className="hover:bg-blue-50/40 dark:hover:bg-slate-800/50 transition cursor-pointer"
                      >
                        {/* Student Name & Code */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-[#142B4A] dark:text-[#38BDF8] flex items-center justify-center font-bold text-xs shrink-0">
                              {st.fullName.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white leading-tight">
                                {st.fullName}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                {st.studentCode}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Completed / Unattempted */}
                        <td className="py-3 px-3 text-center font-semibold">
                          <span className="text-emerald-600 font-bold">{st.totalCompleted ?? st.attemptsCount}</span>
                          <span className="text-slate-400"> / </span>
                          <span className={st.totalUnattempted && st.totalUnattempted > 0 ? 'text-amber-600 font-bold' : 'text-slate-400'}>
                            {st.totalUnattempted ?? 0}
                          </span>
                        </td>

                        {/* Average Score */}
                        <td className="py-3 px-3 text-center">
                          <span className="font-black text-sm text-[#142B4A] dark:text-[#38BDF8]">
                            {st.attemptsCount > 0 ? st.averageScore : '—'}
                          </span>
                        </td>

                        {/* High / Low score */}
                        <td className="py-3 px-3 text-center text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                          {st.attemptsCount > 0 ? (
                            <>
                              <span className="text-emerald-600 font-bold">{st.highestScore}</span>
                              <span> / </span>
                              <span className="text-slate-500">{st.lowestScore ?? st.highestScore}</span>
                            </>
                          ) : (
                            '—'
                          )}
                        </td>

                        {/* Pass Rate */}
                        <td className="py-3 px-3 text-center font-bold">
                          {st.attemptsCount > 0 ? (
                            <span className={Number(st.passRate) >= 70 ? 'text-emerald-600' : 'text-rose-600'}>
                              {st.passRate}%
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>

                        {/* Attendance Rate */}
                        <td className="py-3 px-3 text-center">
                          {st.attendanceRate != null ? (
                            <div className="font-bold">
                              <span className={st.attendanceRate >= 80 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600'}>
                                {st.attendanceRate}%
                              </span>
                              {st.attendedSessions != null && (
                                <span className="block text-[10px] text-slate-400 font-normal">
                                  ({st.attendedSessions}/{st.totalClassSessions} buổi)
                                </span>
                              )}
                            </div>
                          ) : (
                            '—'
                          )}
                        </td>

                        {/* Progress Trend */}
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            st.progressTrend === 'TIẾN BỘ'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : st.progressTrend === 'CẦN CỐ GẮNG'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}>
                            {st.progressTrend || 'ỔN ĐỊNH'}
                          </span>
                        </td>

                        {/* Status / Needs Support */}
                        <td className="py-3 px-4 text-center">
                          {st.needsSupport ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                              <AlertTriangle className="w-3 h-3" /> Cần hỗ trợ
                            </span>
                          ) : st.status === 'PASSED' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                              <CheckCircle2 className="w-3 h-3" /> Đạt
                            </span>
                          ) : st.status === 'FAILED' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                              <XCircle className="w-3 h-3" /> Chưa đạt
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">Chưa làm bài</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <div>
                Hiển thị <strong>{paginatedStudents.length}</strong> / <strong>{totalStudents}</strong> học viên
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-40"
                >
                  Trước
                </button>
                <span className="px-2">
                  Trang {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="px-2.5 py-1 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-40"
                >
                  Sau
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* STUDENT ASSESSMENT DRILLDOWN DRAWER */}
      {selectedStudentId && selectedClassId && (
        <StudentAssessmentDrawer
          studentId={selectedStudentId}
          classId={selectedClassId}
          onClose={() => setSelectedStudentId(null)}
        />
      )}
    </div>
  )
}

export default ClassAnalyticsPage
