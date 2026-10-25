import React, { useEffect, useState } from 'react'
import { attendanceMonitoringApi, type MonitoringSessionItem } from '../../../api/attendanceMonitoring'
import { CheckCircle2, AlertTriangle, Calendar, RefreshCw, Clock, Users, MapPin, Eye, Download } from 'lucide-react'
import type { AttendanceRecord } from '../../../types/attendance'
import { exportToCsv } from '../../../utils/exportCsv'

export const AttendanceMonitoringPage: React.FC = () => {
  const [sessions, setSessions] = useState<MonitoringSessionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filterMarked, setFilterMarked] = useState('ALL') // ALL, UNMARKED, MARKED
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null)
  const [sessionDetail, setSessionDetail] = useState<AttendanceRecord[]>([])
  const [detailLoading, setDetailLoading] = useState(false)

  const fetchSessions = async () => {
    setLoading(true)
    try {
      const data = await attendanceMonitoringApi.getMonitoringSessions({
        markedFilter: filterMarked,
      })
      setSessions(data)
    } catch (err) {
      console.error('Failed to load attendance monitoring', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSessions()
  }, [filterMarked])

  const viewDetail = async (sessionId: number) => {
    setSelectedSessionId(sessionId)
    setDetailLoading(true)
    try {
      const list = await attendanceMonitoringApi.getSessionDetails(sessionId)
      setSessionDetail(list)
    } catch (err) {
      console.error('Failed to load session details', err)
    } finally {
      setDetailLoading(false)
    }
  }

  const unmarkedCount = sessions.filter((s) => !s.isMarked).length
  const markedCount = sessions.filter((s) => s.isMarked).length

  const handleExportMonitoring = () => {
    const headers = [
      'Lớp học',
      'Mã lớp',
      'Ngày học',
      'Thời gian',
      'Phòng',
      'Chủ đề',
      'Giảng viên',
      'Trạng thái điểm danh',
      'Sĩ số',
      'Có mặt',
      'Đi muộn',
      'Vắng không phép',
      'Nghỉ có phép',
      'Tỷ lệ chuyên cần'
    ]

    const rows = sessions.map(s => {
      const rate = s.totalEnrolled > 0 ? Math.round(((s.presentCount + s.lateCount) / s.totalEnrolled) * 100) : 0
      return [
        s.className,
        s.classCode,
        s.sessionDate,
        `${s.startTime} - ${s.endTime}`,
        s.room || 'Chưa xếp phòng',
        s.topic || '',
        s.teacherName || 'Chưa phân công',
        s.isMarked ? 'Đã điểm danh' : 'Chưa điểm danh',
        s.totalEnrolled,
        s.presentCount,
        s.lateCount,
        s.absentCount,
        s.excusedCount,
        `${rate}%`
      ]
    })

    exportToCsv('Bao_cao_giam_sat_diem_danh', headers, rows)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-7 h-7 text-[#142B4A] dark:text-[#EAA86A]" />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Giám Sát Điểm Danh Toàn Trung Tâm</h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Theo dõi tiến độ điểm danh từng buổi học của các giáo viên, cảnh báo buổi học chưa được điểm danh.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchSessions}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 shadow-sm transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
          <button
            onClick={handleExportMonitoring}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-lg border border-emerald-300 dark:border-emerald-700/60 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 shadow-xs transition"
          >
            <Download className="w-4 h-4" />
            Xuất báo cáo (CSV)
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-[#1E293B] rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Tổng số buổi học</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{sessions.length}</div>
        </div>

        <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800 shadow-sm">
          <div className="text-xs text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            Đã hoàn thành điểm danh
          </div>
          <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">{markedCount}</div>
        </div>

        <div className="p-4 bg-amber-50/60 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800 shadow-sm">
          <div className="text-xs text-amber-700 dark:text-amber-400 font-medium flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            Chưa điểm danh (Cần nhắc nhở GV)
          </div>
          <div className="text-2xl font-bold text-amber-700 dark:text-amber-300 mt-1">{unmarkedCount}</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setFilterMarked('ALL')}
          className={`pb-3 px-3 text-sm font-semibold border-b-2 transition ${
            filterMarked === 'ALL'
              ? 'border-[#142B4A] dark:border-[#EAA86A] text-[#142B4A] dark:text-[#EAA86A]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Tất cả buổi học ({sessions.length})
        </button>
        <button
          onClick={() => setFilterMarked('UNMARKED')}
          className={`pb-3 px-3 text-sm font-semibold border-b-2 transition ${
            filterMarked === 'UNMARKED'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Chưa điểm danh ({unmarkedCount})
        </button>
        <button
          onClick={() => setFilterMarked('MARKED')}
          className={`pb-3 px-3 text-sm font-semibold border-b-2 transition ${
            filterMarked === 'MARKED'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Đã điểm danh ({markedCount})
        </button>
      </div>

      {/* Sessions Table */}
      <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 font-semibold">
              <tr>
                <th className="py-3 px-4">Ngày học & Giờ</th>
                <th className="py-3 px-4">Lớp học</th>
                <th className="py-3 px-4">Giáo viên</th>
                <th className="py-3 px-4">Chủ đề buổi học</th>
                <th className="py-3 px-4">Trạng thái điểm danh</th>
                <th className="py-3 px-4">Thống kê chuyên cần</th>
                <th className="py-3 px-4 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#142B4A] dark:text-[#EAA86A] mb-2" />
                    Đang tải danh sách buổi học...
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Không có buổi học nào theo bộ lọc này.
                  </td>
                </tr>
              ) : (
                sessions.map((s) => (
                  <tr key={s.sessionId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {s.sessionDate}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5 font-mono">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {s.startTime.slice(0, 5)} - {s.endTime.slice(0, 5)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{s.className}</div>
                      <div className="text-xs font-mono text-slate-400">{s.classCode}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{s.teacherName}</div>
                      <div className="text-xs text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {s.room || 'Phòng học chính'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-700 dark:text-slate-300 max-w-xs">
                      {s.topic || 'Buổi học theo lịch trình'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {s.isMarked ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Đã điểm danh
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Chưa điểm danh
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-xs">
                      {s.isMarked ? (
                        <div className="space-y-0.5">
                          <div className="text-emerald-600 dark:text-emerald-400 font-medium">
                            Có mặt: {s.presentCount} / {s.totalEnrolled}
                          </div>
                          {(s.lateCount > 0 || s.absentCount > 0) && (
                            <div className="text-[11px] text-slate-400">
                              Muộn: {s.lateCount} | Vắng: {s.absentCount}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">Sĩ số lớp: {s.totalEnrolled}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {s.isMarked && (
                        <button
                          onClick={() => viewDetail(s.sessionId)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#142B4A] dark:text-[#EAA86A] hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Xem danh sách
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal View Session Attendance Detail */}
      {selectedSessionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 dark:border-slate-800 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-[#142B4A] dark:text-[#EAA86A]" />
                Chi tiết điểm danh buổi #{selectedSessionId}
              </h3>
              <button
                onClick={() => setSelectedSessionId(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-2">
              {detailLoading ? (
                <div className="py-8 text-center text-slate-500">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#142B4A] mb-2" />
                  Đang tải danh sách học sinh...
                </div>
              ) : sessionDetail.length === 0 ? (
                <div className="py-8 text-center text-slate-500">Chưa có bản ghi điểm danh nào.</div>
              ) : (
                sessionDetail.map((r) => (
                  <div
                    key={r.id}
                    className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white text-sm">
                        {r.studentFullName}
                      </div>
                      <div className="text-xs text-slate-400 font-mono">{r.studentCode}</div>
                      {r.note && (
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">
                          "{r.note}"
                        </div>
                      )}
                    </div>
                    <div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          r.status === 'PRESENT'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : r.status === 'LATE'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : r.status === 'EXCUSED'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {r.status === 'PRESENT'
                          ? 'Có mặt'
                          : r.status === 'LATE'
                          ? 'Đi muộn'
                          : r.status === 'EXCUSED'
                          ? 'Có phép'
                          : 'Vắng mặt'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-right">
              <button
                onClick={() => setSelectedSessionId(null)}
                className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium"
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
