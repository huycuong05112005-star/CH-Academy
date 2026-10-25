import React, { useEffect, useState, useCallback } from 'react'
import { attendanceApi } from '../../../api/attendance'
import { classesApi } from '../../../api/classes'
import type { ClassItem, Enrollment } from '../../../types/class'
import type { AttendanceRecord, ClassSessionItem } from '../../../types/attendance'
import { StatCard } from '../../../components/ui/StatCard'
import { Badge } from '../../../components/ui/Badge'
import {
  UserCheck,
  AlertCircle,
  CheckCircle2,
  X,
  RefreshCw,
  Save,
  Users,
  Clock,
  Calendar,
  AlertTriangle,
  Download
} from 'lucide-react'
import { exportToCsv } from '../../../utils/exportCsv'

export const AttendancePage: React.FC = () => {
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [selectedClassId, setSelectedClassId] = useState<number>(0)
  const [sessions, setSessions] = useState<ClassSessionItem[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<number>(0)

  const [enrolledStudents, setEnrolledStudents] = useState<Enrollment[]>([])
  const [attendanceMap, setAttendanceMap] = useState<Record<number, { status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'; note: string }>>({})

  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Load Classes
  useEffect(() => {
    const loadClasses = async () => {
      try {
        const res = await classesApi.searchClasses({ page: 0, size: 100 })
        if (res.success && res.data) {
          const list = res.data.content || []
          setClasses(list)
          if (list.length > 0) {
            setSelectedClassId(list[0].id)
          }
        }
      } catch {
        // Silently ignore
      } finally {
        setLoading(false)
      }
    }
    loadClasses()
  }, [])

  // Load Sessions and Students when Class changes
  useEffect(() => {
    if (!selectedClassId) return

    const loadClassData = async () => {
      setLoading(true)
      setError(null)
      try {
        const [sessRes, enrollRes] = await Promise.all([
          attendanceApi.getSessions({ classId: selectedClassId }),
          classesApi.getEnrollments(selectedClassId)
        ])

        if (sessRes.success && sessRes.data) {
          setSessions(sessRes.data)
          if (sessRes.data.length > 0) {
            setSelectedSessionId(sessRes.data[0].id)
          } else {
            setSelectedSessionId(0)
          }
        }

        if (enrollRes.success && enrollRes.data) {
          setEnrolledStudents(enrollRes.data)
        }
      } catch (err: unknown) {
        const e = err as { message?: string }
        setError(e.message || 'Lỗi khi tải thông tin lớp học')
      } finally {
        setLoading(false)
      }
    }
    loadClassData()
  }, [selectedClassId])

  // Load Session Attendance when Session changes
  const loadSessionAttendance = useCallback(async () => {
    if (!selectedSessionId) return
    setLoading(true)
    setError(null)
    try {
      const res = await attendanceApi.getSessionAttendance(selectedSessionId)
      const initialMap: Record<number, { status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'; note: string }> = {}

      // Pre-fill existing records
      if (res.success && res.data) {
        res.data.forEach((r: AttendanceRecord) => {
          initialMap[r.studentId] = {
            status: r.status,
            note: r.note || ''
          }
        })
      }

      // Default to PRESENT for students without existing record
      enrolledStudents.forEach((enr) => {
        if (!initialMap[enr.studentId]) {
          initialMap[enr.studentId] = {
            status: 'PRESENT',
            note: ''
          }
        }
      })

      setAttendanceMap(initialMap)
    } catch (err: unknown) {
      const e = err as { message?: string }
      setError(e.message || 'Lỗi khi tải dữ liệu điểm danh')
    } finally {
      setLoading(false)
    }
  }, [selectedSessionId, enrolledStudents])

  useEffect(() => {
    loadSessionAttendance()
  }, [loadSessionAttendance])

  // Set all students to a single status
  const handleMarkAll = (status: 'PRESENT' | 'ABSENT') => {
    const updated = { ...attendanceMap }
    enrolledStudents.forEach((enr) => {
      updated[enr.studentId] = {
        status,
        note: updated[enr.studentId]?.note || ''
      }
    })
    setAttendanceMap(updated)
  }

  // Save Attendance
  const handleSaveAttendance = async () => {
    if (!selectedSessionId) return
    setSaving(true)
    setError(null)
    try {
      const records = enrolledStudents.map((enr) => ({
        studentId: enr.studentId,
        status: attendanceMap[enr.studentId]?.status || 'PRESENT',
        note: attendanceMap[enr.studentId]?.note || undefined
      }))

      const res = await attendanceApi.markAttendance(selectedSessionId, { records })
      if (res.success) {
        setSuccessMsg('Đã lưu kết quả điểm danh thành công!')
      } else {
        setError(res.message || 'Lưu điểm danh thất bại')
      }
    } catch (err: unknown) {
      const e = err as { message?: string }
      setError(e.message || 'Lỗi khi lưu điểm danh')
    } finally {
      setSaving(false)
    }
  }

  // Calculate live stats
  const total = enrolledStudents.length
  let present = 0
  let late = 0
  let absent = 0
  let excused = 0

  enrolledStudents.forEach((enr) => {
    const st = attendanceMap[enr.studentId]?.status || 'PRESENT'
    if (st === 'PRESENT') present++
    else if (st === 'LATE') late++
    else if (st === 'ABSENT') absent++
    else if (st === 'EXCUSED') excused++
  })

    const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0

  const handleExportAttendance = () => {
    const curClass = classes.find(c => c.id === selectedClassId)
    const curSession = sessions.find(s => s.id === selectedSessionId)

    const headers = [
      'Lớp học',
      'Mã lớp',
      'Ngày học',
      'Chủ đề',
      'Thời gian',
      'Phòng',
      'Mã học viên',
      'Họ và tên',
      'Trạng thái điểm danh',
      'Ghi chú'
    ]

    const statusTextMap: Record<string, string> = {
      PRESENT: 'Có mặt',
      LATE: 'Đi muộn',
      EXCUSED: 'Nghỉ có phép',
      ABSENT: 'Vắng không phép'
    }

    const rows = enrolledStudents.map(enr => {
      const rec = attendanceMap[enr.studentId]
      const st = rec?.status || 'PRESENT'
      return [
        curClass?.name || '',
        curClass?.code || '',
        curSession?.sessionDate || '',
        curSession?.topic || '',
        curSession ? `${curSession.startTime} - ${curSession.endTime}` : '',
        curSession?.room || '',
        enr.studentCode,
        enr.studentFullName,
        statusTextMap[st] || st,
        rec?.note || ''
      ]
    })

    const classCode = curClass?.code ? `_${curClass.code}` : ''
    const dateStr = curSession?.sessionDate ? `_${curSession.sessionDate}` : ''
    exportToCsv(`Diem_danh${classCode}${dateStr}`, headers, rows)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#2A3A50]">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-[#A6B4C8] uppercase tracking-wider mb-1">
            <span>Đào tạo & Học vụ</span>
            <span>/</span>
            <span className="text-[#142B4A] dark:text-[#38BDF8]">Chuyên cần</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#142B4A] dark:text-[#E8EEF7] flex items-center gap-2.5">
            <UserCheck className="w-7 h-7 text-[#142B4A] dark:text-[#38BDF8]" />
            Điểm danh & Chuyên cần
          </h1>
          <p className="text-sm text-slate-600 dark:text-[#A6B4C8] mt-1">
            Ghi nhận hiện diện từng buổi học, theo dõi tỷ lệ chuyên cần và lý do vắng/nghỉ có phép.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedSessionId > 0 && enrolledStudents.length > 0 && (
            <button
              onClick={handleExportAttendance}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-300 dark:border-emerald-700/60 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 text-sm font-semibold shadow-xs transition-all"
            >
              <Download size={16} />
              <span>Xuất điểm danh (CSV)</span>
            </button>
          )}

          {selectedSessionId > 0 && enrolledStudents.length > 0 && (
            <button
              onClick={handleSaveAttendance}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#142B4A] dark:bg-[#38BDF8] hover:bg-[#1D4168] dark:hover:bg-[#0284C7] text-white dark:text-[#0B1220] rounded-xl text-sm font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#3977B8] disabled:opacity-50"
            >
              <Save size={16} />
              <span>{saving ? 'Đang lưu...' : 'Lưu kết quả điểm danh'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-center justify-between text-sm shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-800 dark:hover:text-emerald-200">
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 flex items-center justify-between text-sm shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertCircle size={18} className="text-rose-600 dark:text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-600 hover:text-rose-800 dark:hover:text-rose-200">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Selectors Card */}
      <div className="bg-white dark:bg-[#151F31] p-5 rounded-2xl border border-slate-200/80 dark:border-[#2A3A50] shadow-xs grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] mb-1.5">
            1. Chọn Lớp học giảng dạy
          </label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(Number(e.target.value))}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-sm text-[#142B4A] dark:text-[#E8EEF7] focus:outline-none focus:ring-2 focus:ring-[#142B4A] dark:focus:ring-[#38BDF8]"
          >
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name} ({cls.code}) - {cls.enrolledCount} học viên
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] mb-1.5">
            2. Chọn Buổi học (Class Session)
          </label>
          {sessions.length === 0 ? (
            <div className="text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800">
              Lớp này chưa có buổi học cụ thể nào được tạo trong lịch.
            </div>
          ) : (
            <select
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-sm text-[#142B4A] dark:text-[#E8EEF7] focus:outline-none focus:ring-2 focus:ring-[#142B4A] dark:focus:ring-[#38BDF8]"
            >
              {sessions.map((sess) => (
                <option key={sess.id} value={sess.id}>
                  {sess.sessionDate} ({sess.startTime} - {sess.endTime}) {sess.topic ? `- ${sess.topic}` : ''}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Live Stats Overview Bar */}
      {selectedSessionId > 0 && enrolledStudents.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard title="Sĩ số lớp" value={total} icon={Users} />
          <StatCard title="Có mặt" value={present} icon={UserCheck} badge={<Badge variant="success">Đủ</Badge>} />
          <StatCard title="Đi muộn" value={late} icon={Clock} badge={<Badge variant="warning">Muộn</Badge>} />
          <StatCard title="Có phép" value={excused} icon={Calendar} badge={<Badge variant="info">Phép</Badge>} />
          <StatCard title="Vắng mặt" value={absent} icon={AlertTriangle} badge={<Badge variant="danger">Vắng</Badge>} />
          <StatCard title="Chuyên cần" value={`${rate}%`} icon={UserCheck} />
        </div>
      )}

      {/* Attendance Matrix Table */}
      <div className="bg-white dark:bg-[#151F31] rounded-2xl border border-slate-200/80 dark:border-[#2A3A50] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 dark:text-[#A6B4C8]">
            <RefreshCw className="w-7 h-7 animate-spin mx-auto mb-3 text-[#142B4A] dark:text-[#38BDF8]" />
            Đang tải dữ liệu điểm danh...
          </div>
        ) : enrolledStudents.length === 0 ? (
          <div className="p-12 text-center">
            <UserCheck className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#142B4A] dark:text-[#E8EEF7] mb-1">Chưa có học viên nào trong lớp</h3>
            <p className="text-sm text-slate-500 dark:text-[#A6B4C8]">
              Vui lòng ghi danh học viên vào lớp học tại mục <strong>Lớp học & Lịch</strong> trước khi thực hiện điểm danh.
            </p>
          </div>
        ) : (
          <div>
            <div className="p-4 bg-slate-50/60 dark:bg-[#1C293D]/60 border-b border-slate-200 dark:border-[#2A3A50] flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="font-semibold text-slate-700 dark:text-[#E8EEF7]">Danh sách học viên trong buổi</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleMarkAll('PRESENT')}
                  className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 rounded-lg text-xs font-semibold transition-colors border border-emerald-200 dark:border-emerald-800"
                >
                  Đánh dấu tất cả có mặt
                </button>
                <button
                  type="button"
                  onClick={() => handleMarkAll('ABSENT')}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 rounded-lg text-xs font-semibold transition-colors border border-slate-200 dark:border-slate-700"
                >
                  Đặt lại
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl">
              <table className="w-full text-left border-collapse text-table min-w-[820px]">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-[#1C293D] border-b border-slate-200 dark:border-[#2A3A50] text-xs font-semibold text-slate-500 dark:text-[#A6B4C8] uppercase tracking-wider">
                    <th className="py-3.5 px-4 w-14 text-center whitespace-nowrap">STT</th>
                    <th className="py-3.5 px-4 w-[110px] whitespace-nowrap">Mã HV</th>
                    <th className="py-3.5 px-4 min-w-[200px]">Họ và tên học viên</th>
                    <th className="py-3.5 px-4 w-[300px] text-center whitespace-nowrap">Trạng thái điểm danh</th>
                    <th className="py-3.5 px-4 min-w-[200px]">Ghi chú buổi học</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#2A3A50]/60">
                  {enrolledStudents.map((enr, idx) => {
                    const currentStatus = attendanceMap[enr.studentId]?.status || 'PRESENT'
                    const currentNote = attendanceMap[enr.studentId]?.note || ''

                    return (
                      <tr key={enr.studentId} className="hover:bg-slate-50/60 dark:hover:bg-[#1C293D]/40 transition-colors">
                        <td className="py-3.5 px-4 text-center text-slate-400 text-xs font-mono">
                          {idx + 1}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-xs text-[#142B4A] dark:text-[#38BDF8]">
                          {enr.studentCode}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-[#142B4A] dark:text-[#E8EEF7]">
                          {enr.studentFullName}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="inline-flex rounded-xl border border-slate-200 dark:border-[#2A3A50] p-1 bg-slate-50 dark:bg-[#1C293D] gap-1 text-xs">
                            <button
                              type="button"
                              onClick={() =>
                                setAttendanceMap({
                                  ...attendanceMap,
                                  [enr.studentId]: { status: 'PRESENT', note: currentNote }
                                })
                              }
                              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                                currentStatus === 'PRESENT'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
                              }`}
                            >
                              Có mặt
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setAttendanceMap({
                                  ...attendanceMap,
                                  [enr.studentId]: { status: 'LATE', note: currentNote }
                                })
                              }
                              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                                currentStatus === 'LATE'
                                  ? 'bg-amber-500 text-white shadow-xs'
                                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
                              }`}
                            >
                              Đi muộn
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setAttendanceMap({
                                  ...attendanceMap,
                                  [enr.studentId]: { status: 'EXCUSED', note: currentNote }
                                })
                              }
                              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                                currentStatus === 'EXCUSED'
                                  ? 'bg-purple-600 text-white shadow-xs'
                                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
                              }`}
                            >
                              Có phép
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setAttendanceMap({
                                  ...attendanceMap,
                                  [enr.studentId]: { status: 'ABSENT', note: currentNote }
                                })
                              }
                              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                                currentStatus === 'ABSENT'
                                  ? 'bg-rose-600 text-white shadow-xs'
                                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
                              }`}
                            >
                              Vắng mặt
                            </button>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <input
                            type="text"
                            placeholder="Ghi chú (đến muộn 15p, có phụ huynh xin phép)..."
                            value={currentNote}
                            onChange={(e) =>
                              setAttendanceMap({
                                ...attendanceMap,
                                [enr.studentId]: { status: currentStatus, note: e.target.value }
                              })
                            }
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-[#142B4A] dark:text-[#E8EEF7] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#142B4A] dark:focus:ring-[#38BDF8]"
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
