import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { assessmentApi } from '../../../api/assessment'
import type { ExamAnalyticsData } from '../../../types/assessment'
import {
  BarChart3,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react'

export const ExamAnalyticsPage: React.FC = () => {
  const { examId } = useParams<{ examId: string }>()
  const navigate = useNavigate()

  const [data, setData] = useState<ExamAnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    const loadAnalytics = async () => {
      if (!examId) return
      try {
        setLoading(true)
        setError(null)
        const res = await assessmentApi.getExamAnalytics(Number(examId))
        if (isMounted && res.success && res.data) {
          setData(res.data)
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Không thể tải báo cáo phân tích')
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    loadAnalytics()
    return () => { isMounted = false }
  }, [examId])

  // Xuất báo cáo CSV
  const handleExportCsv = () => {
    if (!data) return
    let csvContent = 'data:text/csv;charset=utf-8,\uFEFF'
    csvContent += 'BÁO CÁO PHÂN TÍCH ĐỀ THI - CH ACADEMY\n'
    csvContent += `Tên đề thi:,${data.examTitle}\n`
    csvContent += `Mã đề:,${data.examCode}\n`
    csvContent += `Tổng lượt thi:,${data.totalAttempts}\n`
    csvContent += `Điểm trung bình:,${data.averageScore}\n`
    csvContent += `Điểm trung vị:,${data.medianScore}\n`
    csvContent += `Điểm cao nhất:,${data.highestScore}\n`
    csvContent += `Điểm thấp nhất:,${data.lowestScore}\n`
    csvContent += `Tỷ lệ đạt:,${data.passRate}%\n\n`

    csvContent += 'PHÂN TÍCH CHI TIẾT TỪNG CÂU HỎI (ITEM ANALYSIS)\n'
    csvContent += 'Mã câu,Chủ đề,Loại,Điểm tối đa,Điểm TB,Tỷ lệ đúng (%),Độ khó bất thường\n'
    data.questionStats.forEach((qs) => {
      csvContent += `"${qs.code}","${qs.topic}","${qs.type}",${qs.maxPoints},${qs.averageScore},${qs.correctRate}%,${qs.isAnomalous ? 'CẢNH BÁO' : 'Bình thường'}\n`
    })

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `analytics_${data.examCode}_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-10 h-10 border-4 border-[#142B4A] dark:border-[#38BDF8] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-500">Đang tổng hợp dữ liệu phân tích thống kê...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center bg-white dark:bg-[#151F31] rounded-3xl border border-slate-200 dark:border-slate-800">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Không thể tải dữ liệu báo cáo</h3>
        <p className="text-sm text-slate-500 mt-1">{error}</p>
        <button
          onClick={() => navigate('/admin/assessment/exams')}
          className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold"
        >
          Quay lại danh sách đề thi
        </button>
      </div>
    )
  }

  const maxFreq = Math.max(...Object.values(data.scoreDistribution), 1)

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#151F31] p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/assessment/exams')}
            className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          </button>
          <div>
            <span className="text-xs font-black px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[#142B4A] dark:text-[#38BDF8] mr-2">
              {data.examCode}
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white inline">
              {data.examTitle}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Báo cáo phân tích chuyên sâu hiệu quả đề thi, phổ điểm & độ phân hóa câu hỏi
            </p>
          </div>
        </div>

        <button
          onClick={handleExportCsv}
          className="px-5 py-2.5 rounded-xl bg-[#142B4A] dark:bg-[#38BDF8] text-white dark:text-[#0B1220] font-bold text-sm shadow hover:opacity-90 transition flex items-center gap-2"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Xuất Báo Cáo Excel/CSV
        </button>
      </div>

      {/* 4 Thẻ Chỉ Số Đo Lường Chính */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#151F31] p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Điểm Trung Bình</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-[#142B4A] dark:text-[#38BDF8]">
              {data.averageScore}
            </span>
            <span className="text-xs text-slate-400 font-semibold">/ 10 đ</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-2 block">
            Trung vị (Median): <b className="text-slate-700 dark:text-slate-300">{data.medianScore} đ</b>
          </span>
        </div>

        <div className="bg-white dark:bg-[#151F31] p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Tỷ Lệ Đạt (Pass Rate)</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {data.passRate}%
            </span>
          </div>
          <span className="text-[11px] text-slate-500 mt-2 block">
            Dựa trên điểm chuẩn của đề thi
          </span>
        </div>

        <div className="bg-white dark:bg-[#151F31] p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Điểm Cao Nhất / Thấp Nhất</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-slate-800 dark:text-slate-100">
              {data.highestScore}
            </span>
            <span className="text-xs text-slate-400">/</span>
            <span className="text-2xl font-black text-rose-600">
              {data.lowestScore}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 mt-2 block">
            Độ chênh lệch: {(data.highestScore - data.lowestScore).toFixed(2)} đ
          </span>
        </div>

        <div className="bg-white dark:bg-[#151F31] p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Tổng Số Lượt Thi</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-purple-600 dark:text-purple-400">
              {data.completedAttempts}
            </span>
            <span className="text-xs text-slate-400 font-semibold">bài nộp</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-2 block">
            Đã chấm điểm hoàn tất 100%
          </span>
        </div>
      </div>

      {/* Biểu Đồ Phổ Điểm (Score Distribution Histogram) */}
      <div className="bg-white dark:bg-[#151F31] p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-[#142B4A] dark:text-[#38BDF8]" />
          Phổ Điểm Thí Sinh (Score Distribution)
        </h3>

        <div className="grid grid-cols-4 gap-4 items-end h-56 pt-6 pb-2 border-b border-slate-100 dark:border-slate-800">
          {Object.entries(data.scoreDistribution).map(([range, count]) => {
            const heightPercent = maxFreq > 0 ? (count / maxFreq) * 100 : 0
            return (
              <div key={range} className="flex flex-col items-center gap-2 h-full justify-end">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {count} học viên
                </span>
                <div
                  className="w-full max-w-[80px] bg-gradient-to-t from-[#142B4A] to-[#1E3A8A] dark:from-[#0284C7] dark:to-[#38BDF8] rounded-t-2xl transition-all duration-500"
                  style={{ height: `${Math.max(heightPercent, 8)}%` }}
                />
                <span className="text-xs font-bold text-slate-500 mt-1">
                  Dải {range} điểm
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Bảng Phân Tích Từng Câu Hỏi (Item Analysis) */}
      <div className="bg-white dark:bg-[#151F31] p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#142B4A] dark:text-[#38BDF8]" />
            Phân Tích Chi Tiết Từng Câu Hỏi (Item Analysis)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Theo dõi tỷ lệ trả lời đúng và phát hiện câu hỏi có độ khó bất thường hoặc phương án gây bẫy
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-bold">Mã & Nội dung</th>
                <th className="py-3.5 px-4 font-bold">Chủ đề (Topic)</th>
                <th className="py-3.5 px-4 font-bold">Loại câu</th>
                <th className="py-3.5 px-4 font-bold">Điểm tối đa</th>
                <th className="py-3.5 px-4 font-bold">Điểm TB</th>
                <th className="py-3.5 px-4 font-bold">Tỷ lệ đúng</th>
                <th className="py-3.5 px-4 font-bold">Đánh giá chất lượng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.questionStats.map((qs) => (
                <tr key={qs.questionId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                  <td className="py-3.5 px-4 max-w-xs">
                    <span className="font-bold text-xs text-[#142B4A] dark:text-[#38BDF8] block">
                      #{qs.code}
                    </span>
                    <span className="text-xs text-slate-700 dark:text-slate-300 line-clamp-1">
                      {qs.content}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
                    {qs.topic}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-500">
                    {qs.type}
                  </td>
                  <td className="py-3.5 px-4 text-xs font-bold text-slate-700 dark:text-slate-200">
                    {qs.maxPoints} đ
                  </td>
                  <td className="py-3.5 px-4 text-xs font-bold text-slate-700 dark:text-slate-200">
                    {qs.averageScore} đ
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            qs.correctRate >= 70
                              ? 'bg-emerald-500'
                              : qs.correctRate >= 40
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${qs.correctRate}%` }}
                        />
                      </div>
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-200">{qs.correctRate}%</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    {qs.isAnomalous ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                        <AlertTriangle className="w-3 h-3" /> Quá khó / Cần xem xét
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                        <CheckCircle2 className="w-3 h-3" /> Phân hóa tốt
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
