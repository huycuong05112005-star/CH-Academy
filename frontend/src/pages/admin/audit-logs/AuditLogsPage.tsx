import React, { useEffect, useState } from 'react'
import { adminAuditApi, type AuditLogItem } from '../../../api/adminAudit'
import { ShieldCheck, Search, Filter, RefreshCw, Activity, Clock } from 'lucide-react'

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [actorFilter, setActorFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [resourceFilter, setResourceFilter] = useState('')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const data = await adminAuditApi.getAuditLogs({
        actor: actorFilter.trim() || undefined,
        action: actionFilter || undefined,
        resourceType: resourceFilter || undefined,
        page,
        size: 15,
      })
      setLogs(data.content || [])
      setTotalPages(data.totalPages || 1)
      setTotalElements(data.totalElements || 0)
    } catch (err) {
      console.error('Failed to load audit logs', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [page, actionFilter, resourceFilter])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(0)
    fetchLogs()
  }

  const getActionBadge = (action: string) => {
    if (action.includes('ASSIGN') || action.includes('CREATE') || action.includes('UPLOAD')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
    }
    if (action.includes('DELETE') || action.includes('UNASSIGN')) {
      return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800'
    }
    if (action.includes('RECORD') || action.includes('UPDATE')) {
      return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800'
    }
    return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-[#142B4A] dark:text-[#EAA86A]" />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Nhật Ký Hệ Thống (Audit Logs)</h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Ghi nhận toàn bộ thao tác bảo mật, phân công giảng dạy, điểm danh, phát hành thông báo và tài chính.
          </p>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 shadow-sm transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-[#1E293B] p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
        <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Tìm theo người thực hiện..."
              value={actorFilter}
              onChange={(e) => setActorFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#142B4A]/20"
            />
          </div>

          <div className="relative">
            <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value)
                setPage(0)
              }}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#142B4A]/20"
            >
              <option value="">Tất cả hành động</option>
              <option value="TEACHER_ASSIGN">Phân công GV (TEACHER_ASSIGN)</option>
              <option value="TEACHER_UNASSIGN">Kết thúc phân công (TEACHER_UNASSIGN)</option>
              <option value="ATTENDANCE_RECORD">Điểm danh (ATTENDANCE_RECORD)</option>
              <option value="MATERIAL_UPLOAD">Tải tài liệu (MATERIAL_UPLOAD)</option>
              <option value="MATERIAL_DELETE">Xóa tài liệu (MATERIAL_DELETE)</option>
              <option value="NOTIFICATION_SEND">Phát thông báo (NOTIFICATION_SEND)</option>
              <option value="NOTIFICATION_DELETE">Thu hồi thông báo (NOTIFICATION_DELETE)</option>
              <option value="SYSTEM_INITIALIZE">Khởi tạo hệ thống</option>
            </select>
          </div>

          <div className="relative">
            <Activity className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <select
              value={resourceFilter}
              onChange={(e) => {
                setResourceFilter(e.target.value)
                setPage(0)
              }}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#142B4A]/20"
            >
              <option value="">Tất cả tài nguyên</option>
              <option value="CLASS">Lớp học (CLASS)</option>
              <option value="SESSION">Buổi học (SESSION)</option>
              <option value="SESSION_MATERIAL">Tài liệu học tập (SESSION_MATERIAL)</option>
              <option value="NOTIFICATION">Thông báo (NOTIFICATION)</option>
              <option value="SYSTEM">Hệ thống (SYSTEM)</option>
            </select>
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-[#142B4A] hover:bg-[#1E3A8A] text-white text-sm font-medium rounded-lg shadow transition"
          >
            Lọc nhật ký
          </button>
        </form>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 font-semibold">
              <tr>
                <th className="py-3 px-4">Thời gian</th>
                <th className="py-3 px-4">Người thực hiện</th>
                <th className="py-3 px-4">Hành động</th>
                <th className="py-3 px-4">Tài nguyên</th>
                <th className="py-3 px-4">Nội dung chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-[#142B4A] dark:text-[#EAA86A]" />
                      Đang tải nhật ký hệ thống...
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    Không tìm thấy bản ghi nhật ký nào phù hợp.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-mono">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(log.createdAt).toLocaleString('vi-VN')}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-xs">
                          {log.actorUsername?.slice(0, 2).toUpperCase() || 'AD'}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                            {log.actorUsername}
                          </div>
                          <div className="text-[10px] text-slate-400">{log.actorRole || 'MEMBER'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`inline-block px-2.5 py-0.5 text-xs font-medium rounded-full border ${getActionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {log.resourceType} #{log.resourceId || '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 text-xs max-w-md">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div>Tổng cộng: <span className="font-semibold">{totalElements}</span> sự kiện</div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0 || loading}
              className="px-3 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40"
            >
              Trang trước
            </button>
            <span>Trang {page + 1} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1 || loading}
              className="px-3 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40"
            >
              Trang sau
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
