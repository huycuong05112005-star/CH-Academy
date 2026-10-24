import React, { useEffect, useState, useCallback } from 'react'
import { attendanceApi } from '../../../api/attendance'
import { classesApi } from '../../../api/classes'
import type { ClassItem, Enrollment } from '../../../types/class'
import type { AttendanceRecord, ClassSessionItem } from '../../../types/attendance'
import {
  UserCheck,
  AlertCircle,
  CheckCircle2,
  X,
  RefreshCw,
  Save
} from 'lucide-react'

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

      // Default remaining enrolled students to PRESENT
      enrolledStudents.forEach((enr) => {
        if (!initialMap[enr.studentId]) {
          initialMap[enr.studentId] = { status: 'PRESENT', note: '' }
        }
      })

      setAttendanceMap(initialMap)
    } catch (err: unknown) {
      const e = err as { message?: string }
      setError(e.message || 'Lỗi khi tải bảng điểm danh')
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#142B4A]">Điểm danh & Chuyên cần</h1>
          <p className="text-sm text-gray-500 mt-1">
            Ghi nhận hiện diện từng buổi học, theo dõi tỷ lệ chuyên cần và lý do vắng/nghỉ có phép
          </p>
        </div>

        {selectedSessionId > 0 && enrolledStudents.length > 0 && (
          <button
            onClick={handleSaveAttendance}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#142B4A] text-white text-sm font-semibold rounded-lg hover:bg-[#1a3860] transition-colors shadow-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Đang lưu...' : 'Lưu kết quả điểm danh'}
          </button>
        )}
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between text-green-800 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-green-600 hover:text-green-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between text-red-800 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Selectors Card */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            1. Chọn Lớp học giảng dạy
          </label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#142B4A]"
          >
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name} ({cls.code}) - {cls.enrolledCount} học viên
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            2. Chọn Buổi học (Class Session)
          </label>
          {sessions.length === 0 ? (
            <div className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded border border-amber-200">
              Lớp này chưa có buổi học cụ thể nào được tạo trong lịch.
            </div>
          ) : (
            <select
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#142B4A]"
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
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-gray-500 block">Sĩ số lớp</span>
              <span className="text-lg font-bold text-gray-900">{total}</span>
            </div>
            <div>
              <span className="text-green-600 block font-semibold">Có mặt</span>
              <span className="text-lg font-bold text-green-700">{present}</span>
            </div>
            <div>
              <span className="text-amber-600 block font-semibold">Đi muộn</span>
              <span className="text-lg font-bold text-amber-700">{late}</span>
            </div>
            <div>
              <span className="text-purple-600 block font-semibold">Có phép</span>
              <span className="text-lg font-bold text-purple-700">{excused}</span>
            </div>
            <div>
              <span className="text-red-600 block font-semibold">Vắng mặt</span>
              <span className="text-lg font-bold text-red-700">{absent}</span>
            </div>
            <div>
              <span className="text-[#142B4A] block font-semibold">Tỷ lệ chuyên cần</span>
              <span className="text-lg font-bold text-[#142B4A]">{rate}%</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleMarkAll('PRESENT')}
              className="px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded text-xs font-semibold transition-colors border border-green-200"
            >
              Đánh dấu tất cả có mặt
            </button>
            <button
              onClick={() => handleMarkAll('ABSENT')}
              className="px-3 py-1.5 bg-gray-50 text-gray-700 hover:bg-gray-100 rounded text-xs font-semibold transition-colors border border-gray-200"
            >
              Đặt lại
            </button>
          </div>
        </div>
      )}

      {/* Attendance Matrix Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#142B4A]" />
            Đang tải dữ liệu điểm danh...
          </div>
        ) : enrolledStudents.length === 0 ? (
          <div className="p-12 text-center">
            <UserCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-700 mb-1">Chưa có học viên nào trong lớp</h3>
            <p className="text-sm text-gray-500">
              Vui lòng ghi danh học viên vào lớp học tại mục <strong>Lớp học & Lịch</strong> trước khi thực hiện điểm danh.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">STT</th>
                  <th className="py-3 px-4">Mã HV</th>
                  <th className="py-3 px-4">Họ và tên học viên</th>
                  <th className="py-3 px-4 text-center">Trạng thái điểm danh</th>
                  <th className="py-3 px-4">Ghi chú buổi học</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {enrolledStudents.map((enr, idx) => {
                  const currentStatus = attendanceMap[enr.studentId]?.status || 'PRESENT'
                  const currentNote = attendanceMap[enr.studentId]?.note || ''

                  return (
                    <tr key={enr.studentId} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4 text-center text-gray-400 text-xs">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-xs text-[#142B4A]">
                        {enr.studentCode}
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-900">
                        {enr.studentFullName}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50 gap-1 text-xs">
                          <button
                            type="button"
                            onClick={() =>
                              setAttendanceMap({
                                ...attendanceMap,
                                [enr.studentId]: { status: 'PRESENT', note: currentNote }
                              })
                            }
                            className={`px-3 py-1 rounded font-medium transition-colors ${
                              currentStatus === 'PRESENT'
                                ? 'bg-green-600 text-white shadow-sm'
                                : 'text-gray-600 hover:bg-gray-200/60'
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
                            className={`px-3 py-1 rounded font-medium transition-colors ${
                              currentStatus === 'LATE'
                                ? 'bg-amber-500 text-white shadow-sm'
                                : 'text-gray-600 hover:bg-gray-200/60'
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
                            className={`px-3 py-1 rounded font-medium transition-colors ${
                              currentStatus === 'EXCUSED'
                                ? 'bg-purple-600 text-white shadow-sm'
                                : 'text-gray-600 hover:bg-gray-200/60'
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
                            className={`px-3 py-1 rounded font-medium transition-colors ${
                              currentStatus === 'ABSENT'
                                ? 'bg-red-600 text-white shadow-sm'
                                : 'text-gray-600 hover:bg-gray-200/60'
                            }`}
                          >
                            Vắng mặt
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4">
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
                          className="w-full px-2.5 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-[#142B4A] bg-white"
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
