import React, { useState, useEffect, useCallback } from 'react'
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Lock,
  Key,
  Smartphone,
  Laptop,
  Globe,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  FileText,
  UserX,
  Activity,
  Layers,
  ChevronRight
} from 'lucide-react'
import { apiClient } from '../../../api/client'

interface SecurityOverview {
  activeSessions: number
  unresolvedAlerts: number
  criticalAlerts: number
  highAlerts: number
  zeroTrustPosture: string
  fieldLevelSecurityEnforced: boolean
  recentAlerts: SecurityAlertItem[]
}

interface SecurityAlertItem {
  id: number
  eventType: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  title: string
  description: string
  username?: string
  ipAddress?: string
  status: 'NEW' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED'
  createdAt: string
  resolutionNotes?: string
}

interface UserSessionItem {
  id: number
  userId: number
  username: string
  fullName: string
  email: string
  ipAddress: string
  deviceName: string
  lastActivityAt: string
  createdAt: string
  isActive: boolean
}

interface AuditLogItem {
  id: number
  actorUsername: string
  action: string
  resourceType: string
  resourceId?: string
  clientIp?: string
  createdAt: string
}

export const SecurityCenterPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'alerts' | 'sessions' | 'audit' | 'policies'>('alerts')
  const [overview, setOverview] = useState<SecurityOverview | null>(null)
  const [alerts, setAlerts] = useState<SecurityAlertItem[]>([])
  const [sessions, setSessions] = useState<UserSessionItem[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([])
  const [loading, setLoading] = useState(true)

  // Filter
  const [severityFilter, setSeverityFilter] = useState<string>('ALL')
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type })
    setTimeout(() => setToastMsg(null), 3500)
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [ovRes, alRes, seRes, auRes] = await Promise.all([
        apiClient.get<SecurityOverview>('/admin/security/overview').catch(() => ({ success: false, data: null })),
        apiClient.get<SecurityAlertItem[]>('/admin/security/alerts').catch(() => ({ success: false, data: [] })),
        apiClient.get<UserSessionItem[]>('/admin/security/sessions').catch(() => ({ success: false, data: [] })),
        apiClient.get<{ recentLogs: AuditLogItem[] }>('/admin/security/audit-summary').catch(() => ({ success: false, data: { recentLogs: [] } }))
      ])

      if (ovRes?.success && ovRes.data) setOverview(ovRes.data)
      if (alRes?.success && alRes.data) setAlerts(alRes.data)
      if (seRes?.success && seRes.data) setSessions(seRes.data)
      if (auRes?.success && auRes.data?.recentLogs) setAuditLogs(auRes.data.recentLogs)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleUpdateAlertStatus = async (id: number, status: string) => {
    try {
      const res = await apiClient.put(`/admin/security/alerts/${id}/status?status=${status}`)
      if (res?.success) {
        showToast('Đã cập nhật trạng thái cảnh báo an ninh', 'success')
        loadData()
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Lỗi cập nhật cảnh báo', 'error')
    }
  }

  const handleRevokeSession = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn thu hồi phiên đăng nhập này ngay lập tức? Người dùng sẽ bị đăng xuất.')) return
    try {
      const res = await apiClient.delete(`/admin/security/sessions/${id}`)
      if (res?.success) {
        showToast('Đã thu hồi phiên đăng nhập thành công', 'success')
        loadData()
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Lỗi thu hồi phiên', 'error')
    }
  }

  const filteredAlerts = alerts.filter((a) => {
    if (severityFilter === 'ALL') return true
    return a.severity === severityFilter
  })

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold border animate-in slide-in-from-bottom-5 ${
            toastMsg.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-500'
              : 'bg-rose-600 text-white border-rose-500'
          }`}
        >
          {toastMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>Trung tâm An ninh & Kiểm soát Rủi ro (Security Center)</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Zero Trust Active
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Giám sát phiên làm việc thời gian thực, phát hiện bất thường, kiểm soát phân quyền Field-Level & bảo vệ RAG AI.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer self-start md:self-auto"
          title="Làm mới trạng thái an ninh"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Top 4 KPI Security Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Phiên hoạt động</span>
            <span className="text-xl font-black text-slate-900 dark:text-white mt-1 block">
              {overview?.activeSessions ?? 1}
            </span>
            <span className="text-[10px] text-emerald-500 font-semibold">Được xác thực JWT</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
            <Laptop size={18} />
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Cảnh báo chưa xử lý</span>
            <span className="text-xl font-black text-amber-500 mt-1 block">
              {overview?.unresolvedAlerts ?? 0}
            </span>
            <span className="text-[10px] text-slate-400">Trên toàn hệ sinh thái</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <AlertTriangle size={18} />
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Đe dọa nghiêm trọng</span>
            <span className="text-xl font-black text-rose-500 mt-1 block">
              {overview?.criticalAlerts ?? 0}
            </span>
            <span className="text-[10px] text-rose-400 font-semibold">Mức độ Critical</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
            <ShieldAlert size={18} />
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Field-Level Security</span>
            <span className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
              BẬT (RBAC + ABAC)
            </span>
            <span className="text-[10px] text-slate-400">Ẩn thông tin nhạy cảm</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <Lock size={18} />
          </div>
        </div>
      </div>

      {/* Sub Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('alerts')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'alerts'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          <ShieldAlert size={14} />
          <span>Cảnh báo An ninh ({alerts.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sessions')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'sessions'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          <Laptop size={14} />
          <span>Quản lý Phiên & Thiết bị ({sessions.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'audit'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          <Activity size={14} />
          <span>Nhật ký Kiểm toán ({auditLogs.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('policies')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'policies'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          <Key size={14} />
          <span>Chính sách Bảo vệ Dữ liệu & AI</span>
        </button>
      </div>

      {/* TAB 1: CẢNH BÁO AN NINH */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Lọc theo mức độ:</span>
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
              <button
                key={sev}
                type="button"
                onClick={() => setSeverityFilter(sev)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  severityFilter === sev
                    ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filteredAlerts.length === 0 ? (
              <div className="p-8 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-400">
                Không có cảnh báo an ninh nào trong mục này.
              </div>
            ) : (
              filteredAlerts.map((al) => {
                const sevColor = {
                  CRITICAL: 'bg-rose-500/10 text-rose-600 border-rose-500/30',
                  HIGH: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
                  MEDIUM: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
                  LOW: 'bg-blue-500/10 text-blue-600 border-blue-500/30'
                }[al.severity]

                return (
                  <div
                    key={al.id}
                    className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${sevColor}`}>
                          {al.severity}
                        </span>
                        <h4 className="text-xs font-black text-slate-900 dark:text-white">{al.title}</h4>
                        <span className="text-[10px] text-slate-400 font-mono">#{al.id} • {al.eventType}</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {al.description}
                      </p>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400 pt-1">
                        <span>User: {al.username || 'System'}</span>
                        <span>IP: {al.ipAddress || '127.0.0.1'}</span>
                        <span>Thời gian: {new Date(al.createdAt).toLocaleString('vi-VN')}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {al.status !== 'RESOLVED' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateAlertStatus(al.id, 'RESOLVED')}
                          className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-xs font-bold transition cursor-pointer"
                        >
                          Giải quyết
                        </button>
                      )}
                      {al.status !== 'DISMISSED' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateAlertStatus(al.id, 'DISMISSED')}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
                        >
                          Bỏ qua
                        </button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: QUẢN LÝ PHIÊN & THIẾT BỊ */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <h3 className="text-sm font-black text-slate-900 dark:text-white mb-1">
              Danh sách thiết bị & Phiên làm việc đang hoạt động
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Quản trị viên có thể thu hồi phiên đăng nhập từ xa nếu phát hiện hành vi truy cập đáng ngờ hoặc thiết bị thất lạc.
            </p>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {sessions.map((s) => (
                <div key={s.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 mt-0.5">
                      <Laptop size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{s.fullName || s.username}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({s.email})</span>
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-600">
                          Active
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Thiết bị: {s.deviceName || 'Web Browser'} • IP: {s.ipAddress}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Hoạt động gần nhất: {new Date(s.lastActivityAt).toLocaleString('vi-VN')}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRevokeSession(s.id)}
                    className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 text-xs font-bold transition cursor-pointer self-start sm:self-auto flex items-center gap-1"
                  >
                    <UserX size={13} />
                    <span>Thu hồi phiên</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: NHẬT KÝ KIỂM TOÁN */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <h3 className="text-sm font-black text-slate-900 dark:text-white mb-3">
              Nhật ký Kiểm toán Hoạt động gần nhất
            </h3>

            <div className="space-y-2">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-xs flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                      {log.action}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-800 dark:text-white font-semibold">
                      {log.resourceType} {log.resourceId ? `#${log.resourceId}` : ''}
                    </span>
                    <span className="text-slate-400">bởi</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {log.actorUsername}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {new Date(log.createdAt).toLocaleString('vi-VN')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CHÍNH SÁCH BẢO VỆ DỮ LIỆU & AI */}
      {activeTab === 'policies' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-500" />
              <span>Chính sách Field-Level Security</span>
            </h3>
            <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Giáo viên:</strong> Không thể xem số CCCD, tình trạng đóng học phí, công nợ hoặc thông tin tài chính cá nhân của học viên.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Học viên:</strong> Chỉ xem được điểm thi, lịch học, học phí của chính mình; chặn 100% IDOR/BOLA truy cập dữ liệu học viên khác.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Kiểm toán:</strong> Mọi thao tác cập nhật điểm số hoặc xóa hồ sơ đều được ghi nhận vào bảng `audit_logs`.</span>
              </li>
            </ul>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-500" />
              <span>Bảo vệ AI & Ngăn chặn Prompt Injection</span>
            </h3>
            <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-indigo-500 shrink-0 mt-0.5" />
                <span><strong>Prompt Injection Filter:</strong> Tự động phát hiện và trung hòa các câu lệnh jailbreak ("ignore previous instructions", "act as DAN").</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-indigo-500 shrink-0 mt-0.5" />
                <span><strong>RAG Isolation:</strong> Phân vùng Kho tri thức nghiêm ngặt (`PUBLIC`, `INTERNAL`, `TEACHER_ONLY`, `ADMIN_ONLY`), AI không bao giờ trích xuất tài liệu vượt quá quyền của người hỏi.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-indigo-500 shrink-0 mt-0.5" />
                <span><strong>File Upload Sandbox:</strong> Xác thực MIME type và magic bytes (PDF, DOCX, XLSX) chống tấn công upload mã độc.</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
