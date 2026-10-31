import React, { useState, useEffect, useCallback } from 'react'
import {
  Calendar,
  RefreshCw,
  CheckCircle2,
  Users,
  BookOpen,
  Award,
  Layers,
  GraduationCap
} from 'lucide-react'
import { apiClient } from '../../api/client'

export const TeacherTeachingHistorySection: React.FC = () => {
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadHistory = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiClient.get<any[]>('/teacher/portal/teaching-history')
      if (res?.success && res.data) {
        setHistory(res.data)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  // Group by academic year
  const grouped = history.reduce<Record<string, any[]>>((acc, item) => {
    const yr = item.academicYear || 'Khác'
    if (!acc[yr]) acc[yr] = []
    acc[yr].push(item)
    return acc
  }, {})

  const sortedYears = Object.keys(grouped).sort().reverse()

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="p-5 rounded-2xl bg-white dark:bg-[#151F31] border border-slate-200/80 dark:border-[#2A3A50] shadow-sm flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-500" />
            <span>Hồ sơ & Lịch sử Giảng dạy Đa Năm Học</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Tổng hợp toàn bộ các lớp học và khóa học thầy cô đã phụ trách giảng dạy qua các năm tại CH Academy.
          </p>
        </div>
        <button
          type="button"
          onClick={loadHistory}
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer"
          title="Làm mới lịch sử"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400 animate-pulse">
          Đang tải lịch sử giảng dạy...
        </div>
      ) : sortedYears.length === 0 ? (
        <div className="p-10 text-center rounded-2xl bg-white dark:bg-[#151F31] border border-slate-200/80 dark:border-[#2A3A50] text-xs text-slate-400">
          Chưa có dữ liệu lịch sử giảng dạy.
        </div>
      ) : (
        <div className="space-y-6">
          {sortedYears.map((yr) => {
            const list = grouped[yr]
            return (
              <div key={yr} className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1 rounded-full text-xs font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    Năm học: {yr}
                  </div>
                  <span className="text-xs text-slate-400">({list.length} lớp phụ trách)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {list.map((cls) => (
                    <div
                      key={cls.classId}
                      className="p-4 rounded-2xl bg-white dark:bg-[#151F31] border border-slate-200/80 dark:border-[#2A3A50] shadow-sm flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div>
                            <span className="font-mono text-[11px] font-bold text-amber-600 dark:text-amber-400">
                              {cls.classCode}
                            </span>
                            <h4 className="text-sm font-black text-slate-900 dark:text-white">{cls.className}</h4>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                            {cls.status}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          Khóa: <strong>{cls.courseName}</strong>
                        </p>

                        <div className="mt-2 grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 block">Sĩ số học viên</span>
                            <span className="font-bold text-slate-800 dark:text-white">{cls.studentCount} học viên</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">Tiến độ buổi học</span>
                            <span className="font-bold text-amber-600 dark:text-amber-400">
                              {cls.completedSessions} / {cls.totalSessions} buổi
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                        <span>Thời gian: {cls.startDate} → {cls.endDate || 'Hiện tại'}</span>
                        <span className="font-semibold text-emerald-600">Đã hoàn tất</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
