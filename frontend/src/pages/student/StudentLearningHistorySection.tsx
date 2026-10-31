import React, { useState, useEffect, useCallback } from 'react'
import {
  Calendar,
  RefreshCw,
  CheckCircle2,
  Clock,
  BookOpen,
  Award,
  Layers,
  GraduationCap
} from 'lucide-react'
import { apiClient } from '../../api/client'

export const StudentLearningHistorySection: React.FC = () => {
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadHistory = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiClient.get<any[]>('/student/learning-history')
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

  // Nhóm lịch sử theo từng năm học
  const groupedHistory = history.reduce<Record<string, any[]>>((acc, item) => {
    const yr = item.academicYear || 'Khác'
    if (!acc[yr]) acc[yr] = []
    acc[yr].push(item)
    return acc
  }, {})

  const sortedYears = Object.keys(groupedHistory).sort().reverse()

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="p-5 rounded-2xl bg-white/80 dark:bg-[#151F31]/80 border border-slate-200/80 dark:border-[#2A3A50] shadow-sm flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-500" />
            <span>Hồ sơ & Lịch sử Học tập Xuyên Năm</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Toàn bộ các khóa học và lớp học bạn đã ghi danh qua từng năm học tại CH Academy.
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
          Đang tải lịch sử đào tạo...
        </div>
      ) : sortedYears.length === 0 ? (
        <div className="p-10 text-center rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-400">
          Chưa có dữ liệu lịch sử học tập.
        </div>
      ) : (
        <div className="space-y-6">
          {sortedYears.map((yr) => {
            const list = groupedHistory[yr]
            return (
              <div key={yr} className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1 rounded-full text-xs font-black bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                    Năm học: {yr}
                  </div>
                  <span className="text-xs text-slate-400">({list.length} lớp học)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {list.map((item) => (
                    <div
                      key={item.enrollmentId}
                      className="p-4 rounded-2xl bg-white/80 dark:bg-[#151F31]/80 border border-slate-200/80 dark:border-[#2A3A50] shadow-sm flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div>
                            <span className="font-mono text-[11px] font-bold text-sky-600 dark:text-sky-400">
                              {item.classCode}
                            </span>
                            <h4 className="text-sm font-black text-slate-900 dark:text-white">
                              {item.className}
                            </h4>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                            {item.status}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          Khóa: <strong>{item.courseName}</strong>
                        </p>

                        <div className="mt-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-[11px] text-slate-500 space-y-1">
                          <div>Giảng viên phụ trách: <strong className="text-slate-700 dark:text-slate-300">{item.primaryTeacherName}</strong></div>
                          <div>Ngày ghi danh: <strong className="text-slate-700 dark:text-slate-300">{item.enrollmentDate ? new Date(item.enrollmentDate).toLocaleDateString('vi-VN') : '—'}</strong></div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                        <span>Hồ sơ lưu trữ chính thức</span>
                        <span className="font-semibold text-emerald-600">Đã kích hoạt</span>
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
