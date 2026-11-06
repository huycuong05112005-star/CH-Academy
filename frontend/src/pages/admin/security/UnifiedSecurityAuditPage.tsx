import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Lock,
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
  ChevronRight,
  Search,
  Filter,
  Download,
  KeyRound,
  Shield,
  ArrowRight,
  X,
  AlertOctagon,
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react'
import {
  securityAuditApi,
  type SecurityOverviewData,
  type SecurityAlertDto,
  type UserSessionDto,
  type AuditLogDto
} from '../../../api/securityAudit'
import { exportToCsv } from '../../../utils/exportCsv'

export const UnifiedSecurityAuditPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = searchParams.get('tab') === 'audit-logs' ? 'audit-logs' : 'alerts'
  const [activeTab, setActiveTab] = useState<'alerts' | 'audit-logs'>(initialTab)

  // Overview & Alerts State
  const [overview, setOverview] = useState<SecurityOverviewData | null>(null)
  const [alerts, setAlerts] = useState<SecurityAlertDto[]>([])
  const [sessions, setSessions] = useState<UserSessionDto[]>([])
  const [loadingAlerts, setLoadingAlerts] = useState(true)

  // Alert Filters
  const [severityFilter, setSeverityFilter] = useState<string>('ALL')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [keywordFilter, setKeywordFilter] = useState<string>('')

  // Selected Alert for Investigation Modal
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlertDto | null>(null)
  const [investigationNote, setInvestigationNote] = useState('')
  const [actionInProgress, setActionInProgress] = useState(false)

  // Active Sessions Drawer
  const [showSessionsDrawer, setShowSessionsDrawer] = useState(false)

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLogDto[]>([])
  const [loadingAudit, setLoadingAudit] = useState(false)
  const [auditActor, setAuditActor] = useState('')
  const [auditAction, setAuditAction] = useState('')
  const [auditModule, setAuditModule] = useState('')
  const [auditPage, setAuditPage] = useState(0)
  const [auditTotalPages, setAuditTotalPages] = useState(1)
  const [auditTotalElements, setAuditTotalElements] = useState(0)
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLogDto | null>(null)

  // Toast
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type })
    setTimeout(() => setToastMsg(null), 3500)
  }

  // Sync tab change with searchParams
  const handleTabChange = (tab: 'alerts' | 'audit-logs') => {
    setActiveTab(tab)
    setSearchParams({ tab })
  }

  // Load Security Alerts & Overview
  const loadSecurityData = useCallback(async () => {
    setLoadingAlerts(true)
    try {
      const [ovData, alData, seData] = await Promise.all([
        securityAuditApi.getOverview().catch(() => null),
        securityAuditApi.getAlerts({
          severity: severityFilter,
          status: statusFilter,
          keyword: keywordFilter.trim() || undefined
        }).catch(() => []),
        securityAuditApi.getSessions().catch(() => [])
      ])

      if (ovData) setOverview(ovData)
      setAlerts(alData)
      setSessions(seData)
    } finally {
      setLoadingAlerts(false)
    }
  }, [severityFilter, statusFilter, keywordFilter])

  // Load Audit Logs
  const loadAuditData = useCallback(async () => {
    setLoadingAudit(true)
    try {
      const data = await securityAuditApi.getAuditLogs({
        actor: auditActor.trim() || undefined,
        action: auditAction || undefined,
        module: auditModule || undefined,
        page: auditPage,
        size: 15
      })
      if (data) {
        setAuditLogs(data.content || [])
        setAuditTotalPages(data.totalPages || 1)
        setAuditTotalElements(data.totalElements || 0)
      }
    } catch {
      showToast('Không thể tải nhật ký hoạt động', 'error')
    } finally {
      setLoadingAudit(false)
    }
  }, [auditActor, auditAction, auditModule, auditPage])

  useEffect(() => {
    if (activeTab === 'alerts') {
      loadSecurityData()
    } else {
      loadAuditData()
    }
  }, [activeTab, loadSecurityData, loadAuditData])

  // Investigation Actions
  const handleInvestigateAlert = async (id: number) => {
    setActionInProgress(true)
    try {
      const updated = await securityAuditApi.investigateAlert(id, investigationNote.trim() || undefined)
      if (updated) {
        showToast('Đã tiếp nhận điều tra sự cố an ninh', 'success')
        setSelectedAlert(updated)
        setInvestigationNote('')
        loadSecurityData()
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Lỗi tiếp nhận điều tra', 'error')
    } finally {
      setActionInProgress(false)
    }
  }

  const handleResolveAlert = async (id: number, status: string, actionTaken?: string) => {
    setActionInProgress(true)
    try {
      const updated = await securityAuditApi.resolveAlert(id, status, investigationNote.trim() || undefined, actionTaken)
      if (updated) {
        showToast('Đã cập nhật kết quả xử lý cảnh báo', 'success')
        setSelectedAlert(updated)
        setInvestigationNote('')
        loadSecurityData()
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Lỗi cập nhật cảnh báo', 'error')
    } finally {
      setActionInProgress(false)
    }
  }

  const handleRemediateAlert = async (id: number, actionType: 'LOCK_USER' | 'REQUIRE_PASSWORD_CHANGE' | 'REVOKE_SESSIONS') => {
    if (!confirm(`Bạn có chắc chắn muốn thực hiện biện pháp an ninh [${actionType}] đối với tài khoản liên quan?`)) return
    setActionInProgress(true)
    try {
      const res = await securityAuditApi.remediateAlert(id, actionType)
      if (res) {
        showToast(res.message || 'Thực hiện biện pháp khắc phục thành công', 'success')
        loadSecurityData()
        // Refresh alert detail
        const refreshed = await securityAuditApi.getAlerts({ keyword: selectedAlert?.alertCode })
        if (refreshed.length > 0) setSelectedAlert(refreshed[0])
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Lỗi thực thi biện pháp khắc phục', 'error')
    } finally {
      setActionInProgress(false)
    }
  }

  const handleRevokeSession = async (sessionId: number) => {
    if (!confirm('Bạn có chắc chắn muốn thu hồi phiên đăng nhập này ngay lập tức? Người dùng sẽ bị buộc đăng xuất.')) return
    try {
      const ok = await securityAuditApi.revokeSession(sessionId, 'Thu hồi cưỡng chế từ Trung tâm An ninh')
      if (ok) {
        showToast('Đã thu hồi phiên đăng nhập thành công', 'success')
        loadSecurityData()
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Lỗi thu hồi phiên', 'error')
    }
  }

  const handleExportAuditLogs = () => {
    if (auditLogs.length === 0) {
      showToast('Không có dữ liệu nhật ký để xuất', 'error')
      return
    }
    const headers = ['Mã ID', 'Thời gian', 'Tài khoản', 'Vai trò', 'Hành động', 'Phân hệ', 'Tài nguyên', 'Mã đối tượng', 'Địa chỉ IP', 'Trạng thái', 'Chi tiết lỗi']
    const rows = auditLogs.map(l => [
      l.id,
      new Date(l.createdAt).toLocaleString('vi-VN'),
      l.actorUsername,
      l.actorRole || 'N/A',
      l.action,
      l.module || 'SYSTEM',
      l.resourceType,
      l.resourceId || '',
      l.clientIp || '',
      l.status || 'SUCCESS',
      l.errorMessage || ''
    ])
    exportToCsv('CH_Academy_Audit_Logs', headers, rows)
    showToast('Đã xuất file CSV nhật ký hệ thống thành công', 'success')
  }

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/15 text-rose-500 border border-rose-500/30">Nghiêm trọng</span>
      case 'HIGH':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30">Mức cao</span>
      case 'MEDIUM':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/15 text-blue-500 border border-blue-500/30">Trung bình</span>
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-500/15 text-slate-400 border border-slate-500/30">Thấp</span>
    }
  }

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'NEW':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">Mới phát hiện</span>
      case 'INVESTIGATING':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">Đang điều tra</span>
      case 'RESOLVED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Đã khắc phục</span>
      case 'FALSE_POSITIVE':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">Báo sai</span>
      case 'ACCEPTED_RISK':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">Chấp nhận rủi ro</span>
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">{st}</span>
    }
  }

  const getActionBadge = (action: string) => {
    if (action.includes('ASSIGN') || action.includes('CREATE') || action.includes('LOGIN') || action.includes('PROVISION')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
    }
    if (action.includes('DELETE') || action.includes('REVOKE') || action.includes('LOGOUT') || action.includes('LOCK')) {
      return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800'
    }
    if (action.includes('RECORD') || action.includes('UPDATE') || action.includes('CHANGE') || action.includes('INVESTIGATE')) {
      return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800'
    }
    return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800'
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-bold border transition-all animate-in slide-in-from-bottom-5 ${
            toastMsg.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-500'
              : 'bg-rose-600 text-white border-rose-500'
          }`}
        >
          {toastMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-600/10 text-blue-600 dark:bg-[#38BDF8]/10 dark:text-[#38BDF8]">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Bảo mật & Nhật ký Hệ thống
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/30">
                  Zero Trust Enforced
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-[#A6B4C8] mt-0.5">
                Giám sát an ninh, phát hiện đe dọa, điều tra sự cố & kiểm toán toàn bộ hoạt động hệ thống CH Academy.
              </p>
            </div>
          </div>
        </div>

        {/* Global Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-[#151F31] border border-slate-200 dark:border-[#2A3A50] rounded-2xl">
          <button
            onClick={() => handleTabChange('alerts')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'alerts'
                ? 'bg-white dark:bg-[#202E44] text-blue-600 dark:text-[#38BDF8] shadow-sm'
                : 'text-slate-600 dark:text-[#A6B4C8] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldAlert size={15} />
            <span>Cảnh báo An ninh</span>
            {overview && overview.unresolvedAlerts > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-extrabold">
                {overview.unresolvedAlerts}
              </span>
            )}
          </button>

          <button
            onClick={() => handleTabChange('audit-logs')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'audit-logs'
                ? 'bg-white dark:bg-[#202E44] text-blue-600 dark:text-[#38BDF8] shadow-sm'
                : 'text-slate-600 dark:text-[#A6B4C8] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Activity size={15} />
            <span>Nhật ký Hoạt động (Audit)</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: CẢNH BÁO AN NINH & ĐIỀU TRA SỰ CỐ */}
      {/* ========================================================================= */}
      {activeTab === 'alerts' && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          {/* Top KPI Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#151F31] shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-[#A6B4C8]">Tổng sự cố ghi nhận</span>
              <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
                {overview?.totalAlerts ?? alerts.length}
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 shadow-xs">
              <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">Chưa xử lý (Mới)</span>
              <div className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">
                {overview?.newAlerts ?? alerts.filter(a => a.status === 'NEW').length}
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 shadow-xs">
              <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">Đang điều tra</span>
              <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">
                {overview?.investigatingAlerts ?? alerts.filter(a => a.status === 'INVESTIGATING').length}
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs">
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Đã khắc phục</span>
              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {overview?.resolvedAlerts ?? alerts.filter(a => a.status === 'RESOLVED').length}
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-rose-300 dark:border-rose-800/60 bg-white dark:bg-[#151F31] shadow-xs">
              <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                <AlertOctagon size={12} />
                Mối đe dọa Cao/Khẩn
              </span>
              <div className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">
                {(overview?.criticalAlerts ?? 0) + (overview?.highAlerts ?? 0)}
              </div>
            </div>

            <div
              onClick={() => setShowSessionsDrawer(true)}
              className="p-4 rounded-2xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-950/20 shadow-xs cursor-pointer hover:border-blue-400 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-blue-600 dark:text-[#38BDF8]">Phiên hoạt động</span>
                <ChevronRight size={14} className="text-blue-500 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <div className="text-xl font-black text-blue-600 dark:text-[#38BDF8] mt-1">
                {overview?.activeSessions ?? sessions.length}
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 rounded-2xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#151F31]">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-[#A6B4C8]">
                <Filter size={14} />
                <span>Mức độ:</span>
              </div>
              {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((s) => (
                <button
                  key={s}
                  onClick={() => setSeverityFilter(s)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    severityFilter === s
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-[#1C293D] text-slate-600 dark:text-[#A6B4C8] hover:bg-slate-200 dark:hover:bg-[#25364F]'
                  }`}
                >
                  {s === 'ALL' ? 'Tất cả' : s}
                </button>
              ))}

              <div className="h-4 w-px bg-slate-300 dark:bg-[#2A3A50] mx-1 hidden sm:block" />

              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-[#A6B4C8]">
                <span>Trạng thái:</span>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-[#1C293D] text-slate-800 dark:text-[#E8EEF7] border border-slate-200 dark:border-[#2A3A50] focus:outline-hidden"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="NEW">Mới phát hiện</option>
                <option value="INVESTIGATING">Đang điều tra</option>
                <option value="RESOLVED">Đã khắc phục</option>
                <option value="FALSE_POSITIVE">Báo cáo sai</option>
                <option value="ACCEPTED_RISK">Chấp nhận rủi ro</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm theo mã, IP, username..."
                  value={keywordFilter}
                  onChange={(e) => setKeywordFilter(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-[#1C293D] text-slate-800 dark:text-white border border-slate-200 dark:border-[#2A3A50] focus:outline-hidden"
                />
              </div>

              <button
                onClick={loadSecurityData}
                disabled={loadingAlerts}
                className="p-2 rounded-xl border border-slate-200 dark:border-[#2A3A50] hover:bg-slate-100 dark:hover:bg-[#1C293D] text-slate-600 dark:text-[#A6B4C8] transition-colors"
                title="Làm mới"
              >
                <RefreshCw size={14} className={loadingAlerts ? 'animate-spin' : ''} />
              </button>

              <button
                onClick={() => setShowSessionsDrawer(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-[#38BDF8] border border-blue-200 dark:border-blue-900/60 text-xs font-bold hover:bg-blue-100 transition-colors"
              >
                <Laptop size={14} />
                <span>Quản lý phiên</span>
              </button>
            </div>
          </div>

          {/* Alerts Table */}
          <div className="rounded-2xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#151F31] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-[#101B2D] border-b border-slate-200 dark:border-[#2A3A50] text-slate-500 dark:text-[#A6B4C8] uppercase tracking-wider font-bold">
                  <tr>
                    <th className="py-3.5 px-4">Mã sự cố</th>
                    <th className="py-3.5 px-4">Tiêu đề & Hành vi</th>
                    <th className="py-3.5 px-4">Mức độ</th>
                    <th className="py-3.5 px-4">Trạng thái</th>
                    <th className="py-3.5 px-4">Tài khoản & IP</th>
                    <th className="py-3.5 px-4">Thời gian</th>
                    <th className="py-3.5 px-4 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#1C293D]">
                  {loadingAlerts ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-blue-500" />
                        <span>Đang phân tích dữ liệu cảnh báo an ninh...</span>
                      </td>
                    </tr>
                  ) : alerts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <ShieldCheck size={32} className="mx-auto mb-2 text-emerald-500 opacity-60" />
                        <div className="font-semibold text-sm text-slate-700 dark:text-slate-300">Không có sự cố an ninh nào</div>
                        <div className="text-xs text-slate-400 mt-0.5">Hệ thống đang hoạt động trong ngưỡng an toàn bảo mật cao.</div>
                      </td>
                    </tr>
                  ) : (
                    alerts.map((alert) => (
                      <tr
                        key={alert.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-[#19253A] transition-colors cursor-pointer"
                        onClick={() => setSelectedAlert(alert)}
                      >
                        <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-[#38BDF8]">
                          {alert.alertCode || `SEC-${alert.id}`}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">{alert.title}</div>
                          <div className="text-[11px] text-slate-500 dark:text-[#A6B4C8] line-clamp-1">{alert.description}</div>
                        </td>
                        <td className="py-3 px-4">{getSeverityBadge(alert.severity)}</td>
                        <td className="py-3 px-4">{getStatusBadge(alert.status)}</td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {alert.username || 'Khách vãng lai'}
                          </div>
                          <div className="text-[11px] font-mono text-slate-400">{alert.ipAddress || 'Unknown IP'}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-500 dark:text-[#A6B4C8]">
                          {new Date(alert.createdAt).toLocaleString('vi-VN')}
                        </td>
                        <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setSelectedAlert(alert)}
                            className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-[#38BDF8] hover:bg-blue-100 dark:hover:bg-blue-900/60 font-bold transition-colors"
                          >
                            Điều tra
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: NHẬT KÝ HOẠT ĐỘNG TOÀN HỆ THỐNG */}
      {/* ========================================================================= */}
      {activeTab === 'audit-logs' && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          {/* Audit Search & Filter Bar */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#151F31] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 flex-1">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Lọc theo tài khoản (Actor)..."
                  value={auditActor}
                  onChange={(e) => { setAuditActor(e.target.value); setAuditPage(0) }}
                  className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#1C293D] text-slate-800 dark:text-white border border-slate-200 dark:border-[#2A3A50] focus:outline-hidden"
                />
              </div>

              <select
                value={auditAction}
                onChange={(e) => { setAuditAction(e.target.value); setAuditPage(0) }}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-[#1C293D] text-slate-800 dark:text-[#E8EEF7] border border-slate-200 dark:border-[#2A3A50] focus:outline-hidden"
              >
                <option value="">Tất cả hành vi</option>
                <option value="LOGIN">Đăng nhập (LOGIN)</option>
                <option value="LOGOUT">Đăng xuất (LOGOUT)</option>
                <option value="CREATE">Tạo mới (CREATE)</option>
                <option value="UPDATE">Cập nhật (UPDATE)</option>
                <option value="DELETE">Xóa (DELETE)</option>
                <option value="ASSIGN">Phân công giảng dạy (ASSIGN)</option>
                <option value="RECORD">Điểm danh / Đánh giá (RECORD)</option>
                <option value="PROVISION">Cấp tài khoản (PROVISION)</option>
              </select>

              <select
                value={auditModule}
                onChange={(e) => { setAuditModule(e.target.value); setAuditPage(0) }}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-[#1C293D] text-slate-800 dark:text-[#E8EEF7] border border-slate-200 dark:border-[#2A3A50] focus:outline-hidden"
              >
                <option value="">Tất cả phân hệ</option>
                <option value="IDENTITY">IDENTITY (Xác thực & Người dùng)</option>
                <option value="ACADEMIC">ACADEMIC (Đào tạo & Lớp học)</option>
                <option value="ASSESSMENT">ASSESSMENT (Đề thi & Đánh giá)</option>
                <option value="STUDENT">STUDENT (Học viên & Tuyển sinh)</option>
                <option value="FINANCE">FINANCE (Tài chính & Học phí)</option>
                <option value="SECURITY">SECURITY (An ninh & Cảnh báo)</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={loadAuditData}
                disabled={loadingAudit}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-[#2A3A50] hover:bg-slate-100 dark:hover:bg-[#1C293D] text-slate-600 dark:text-[#A6B4C8] transition-colors"
                title="Làm mới"
              >
                <RefreshCw size={15} className={loadingAudit ? 'animate-spin' : ''} />
              </button>

              <button
                onClick={handleExportAuditLogs}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0F243E] dark:bg-[#38BDF8] text-white dark:text-[#0B1220] hover:bg-[#173557] dark:hover:bg-[#0284C7] text-xs font-bold transition-colors shadow-xs"
              >
                <FileSpreadsheet size={15} />
                <span>Xuất CSV</span>
              </button>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="rounded-2xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#151F31] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-[#101B2D] border-b border-slate-200 dark:border-[#2A3A50] text-slate-500 dark:text-[#A6B4C8] uppercase tracking-wider font-bold">
                  <tr>
                    <th className="py-3.5 px-4">Thời gian</th>
                    <th className="py-3.5 px-4">Người thực hiện</th>
                    <th className="py-3.5 px-4">Hành động</th>
                    <th className="py-3.5 px-4">Phân hệ / Module</th>
                    <th className="py-3.5 px-4">Tài nguyên mục tiêu</th>
                    <th className="py-3.5 px-4">IP Client</th>
                    <th className="py-3.5 px-4 text-right">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#1C293D]">
                  {loadingAudit ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-blue-500" />
                        <span>Đang tải nhật ký kiểm toán hệ thống...</span>
                      </td>
                    </tr>
                  ) : auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <Clock size={32} className="mx-auto mb-2 opacity-50" />
                        <div className="font-semibold text-sm text-slate-700 dark:text-slate-300">Không tìm thấy bản ghi nhật ký phù hợp</div>
                        <div className="text-xs text-slate-400 mt-0.5">Thử nới lỏng bộ lọc người dùng hoặc hành động.</div>
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr
                        key={log.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-[#19253A] transition-colors cursor-pointer"
                        onClick={() => setSelectedAuditLog(log)}
                      >
                        <td className="py-3 px-4 text-slate-500 dark:text-[#A6B4C8] whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString('vi-VN')}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                          <div>{log.actorUsername}</div>
                          {log.actorRole && (
                            <span className="text-[10px] text-slate-400 font-normal">{log.actorRole}</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${getActionBadge(log.action)}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-medium text-slate-600 dark:text-slate-300">
                          {log.module || 'SYSTEM'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{log.resourceType}</div>
                          {log.resourceId && (
                            <div className="text-[10px] text-slate-400 font-mono">ID: #{log.resourceId}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500 dark:text-[#A6B4C8]">
                          {log.clientIp || '-'}
                        </td>
                        <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setSelectedAuditLog(log)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                            title="Xem chi tiết bản ghi"
                          >
                            <Eye size={15} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {auditTotalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-[#2A3A50] bg-slate-50 dark:bg-[#101B2D]">
                <div className="text-xs text-slate-500 dark:text-[#A6B4C8]">
                  Trang {auditPage + 1} / {auditTotalPages} ({auditTotalElements} bản ghi)
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={auditPage === 0}
                    onClick={() => setAuditPage(p => Math.max(0, p - 1))}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#2A3A50] text-xs font-bold text-slate-600 dark:text-[#A6B4C8] disabled:opacity-40"
                  >
                    Trước
                  </button>
                  <button
                    disabled={auditPage >= auditTotalPages - 1}
                    onClick={() => setAuditPage(p => p + 1)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#2A3A50] text-xs font-bold text-slate-600 dark:text-[#A6B4C8] disabled:opacity-40"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CHI TIẾT & ĐIỀU TRA SỰ CỐ AN NINH */}
      {/* ========================================================================= */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#151F31] shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-blue-600 dark:text-[#38BDF8]">
                    {selectedAlert.alertCode || `SEC-${selectedAlert.id}`}
                  </span>
                  {getSeverityBadge(selectedAlert.severity)}
                  {getStatusBadge(selectedAlert.status)}
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1.5">
                  {selectedAlert.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedAlert(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-[#1C293D] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Description & Technical Metadata */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#101B2D] border border-slate-200 dark:border-[#2A3A50] space-y-3">
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase">Mô tả chi tiết sự cố</div>
                <div className="text-sm text-slate-800 dark:text-slate-200 mt-0.5">{selectedAlert.description}</div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs pt-2 border-t border-slate-200 dark:border-[#2A3A50]">
                <div>
                  <span className="text-slate-400 block text-[11px]">Tài khoản:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedAlert.username || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Địa chỉ IP:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">{selectedAlert.ipAddress || 'Unknown'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Loại sự kiện:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedAlert.eventType}</span>
                </div>
                {selectedAlert.endpoint && (
                  <div className="col-span-2">
                    <span className="text-slate-400 block text-[11px]">Endpoint bị tác động:</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">{selectedAlert.endpoint}</span>
                  </div>
                )}
                {selectedAlert.correlationId && (
                  <div>
                    <span className="text-slate-400 block text-[11px]">Correlation ID:</span>
                    <span className="font-mono text-[10px] text-slate-400">{selectedAlert.correlationId}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Investigation History & Notes */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Nhật ký & Tiến trình điều tra
              </label>
              {selectedAlert.investigationNotes ? (
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-[#1C293D] text-xs font-mono text-slate-700 dark:text-slate-300 whitespace-pre-wrap max-h-36 overflow-y-auto">
                  {selectedAlert.investigationNotes}
                </div>
              ) : (
                <div className="text-xs text-slate-400 italic">Chưa có ghi chú điều tra nào.</div>
              )}

              {selectedAlert.actionTaken && (
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-400">
                  <span className="font-bold">Biện pháp đã thực hiện:</span> {selectedAlert.actionTaken}
                </div>
              )}

              <textarea
                rows={2}
                placeholder="Nhập ghi chú điều tra mới hoặc kết luận xử lý..."
                value={investigationNote}
                onChange={(e) => setInvestigationNote(e.target.value)}
                className="w-full p-3 rounded-xl text-xs bg-slate-50 dark:bg-[#101B2D] text-slate-800 dark:text-white border border-slate-200 dark:border-[#2A3A50] focus:outline-hidden"
              />
            </div>

            {/* Remediation Actions (Khắc phục tài khoản) */}
            {selectedAlert.username && (
              <div className="p-3.5 rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-950/20 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400">
                  <Lock size={14} />
                  <span>Biện pháp cách ly & bảo vệ tài khoản ({selectedAlert.username})</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    disabled={actionInProgress}
                    onClick={() => handleRemediateAlert(selectedAlert.id, 'LOCK_USER')}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors"
                  >
                    Khóa tài khoản
                  </button>
                  <button
                    disabled={actionInProgress}
                    onClick={() => handleRemediateAlert(selectedAlert.id, 'REQUIRE_PASSWORD_CHANGE')}
                    className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors"
                  >
                    Buộc đổi mật khẩu
                  </button>
                  <button
                    disabled={actionInProgress}
                    onClick={() => handleRemediateAlert(selectedAlert.id, 'REVOKE_SESSIONS')}
                    className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
                  >
                    Hủy mọi phiên đăng nhập
                  </button>
                </div>
              </div>
            )}

            {/* Modal Footer Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-slate-200 dark:border-[#2A3A50]">
              <div className="flex items-center gap-2">
                {selectedAlert.status !== 'INVESTIGATING' && (
                  <button
                    disabled={actionInProgress}
                    onClick={() => handleInvestigateAlert(selectedAlert.id)}
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors"
                  >
                    Tiếp nhận điều tra
                  </button>
                )}
                <button
                  disabled={actionInProgress}
                  onClick={() => handleResolveAlert(selectedAlert.id, 'FALSE_POSITIVE')}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-[#1C293D] hover:bg-slate-200 dark:hover:bg-[#25364F] text-slate-700 dark:text-[#A6B4C8] text-xs font-bold transition-colors"
                >
                  Báo cáo sai
                </button>
                <button
                  disabled={actionInProgress}
                  onClick={() => handleResolveAlert(selectedAlert.id, 'ACCEPTED_RISK')}
                  className="px-3.5 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 text-purple-700 dark:text-purple-400 text-xs font-bold transition-colors"
                >
                  Chấp nhận rủi ro
                </button>
              </div>

              <button
                disabled={actionInProgress}
                onClick={() => handleResolveAlert(selectedAlert.id, 'RESOLVED', 'Đã xử lý và khắc phục rủi ro thành công')}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-sm"
              >
                Xác nhận khắc phục
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: QUẢN LÝ PHIÊN HOẠT ĐỘNG (SESSIONS DRAWER) */}
      {/* ========================================================================= */}
      {showSessionsDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-3xl rounded-3xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#151F31] shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Laptop className="w-6 h-6 text-blue-600 dark:text-[#38BDF8]" />
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Quản lý Phiên đăng nhập đang hoạt động ({sessions.length})
                </h2>
              </div>
              <button
                onClick={() => setShowSessionsDrawer(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-[#1C293D] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-[#1C293D] border border-slate-200 dark:border-[#2A3A50] rounded-2xl overflow-hidden">
              {sessions.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">Không có phiên đăng nhập nào.</div>
              ) : (
                sessions.map((s) => (
                  <div key={s.id} className="p-4 flex items-center justify-between gap-4 bg-white dark:bg-[#151F31] hover:bg-slate-50 dark:hover:bg-[#19253A] transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-slate-100 dark:bg-[#1C293D] text-slate-600 dark:text-[#A6B4C8]">
                        <Smartphone size={20} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{s.deviceName || 'Trình duyệt Web'}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold">
                            Đang hoạt động
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-[#A6B4C8] mt-0.5">
                          Tài khoản: <strong className="text-slate-700 dark:text-slate-300">{s.username}</strong> ({s.fullName || s.email})
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          IP: {s.ipAddress} • Hoạt động gần nhất: {new Date(s.lastActivityAt).toLocaleString('vi-VN')}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRevokeSession(s.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 text-xs font-bold hover:bg-rose-100 transition-colors"
                    >
                      Thu hồi phiên
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: CHI TIẾT BẢN GHI NHẬT KÝ (AUDIT LOG DETAIL) */}
      {/* ========================================================================= */}
      {selectedAuditLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-xl rounded-3xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#151F31] shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600 dark:text-[#38BDF8]" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Chi tiết Bản ghi Kiểm toán #{selectedAuditLog.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedAuditLog(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-[#1C293D] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-[#101B2D] border border-slate-200 dark:border-[#2A3A50]">
                <div>
                  <span className="text-slate-400 block text-[11px]">Người thực hiện:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedAuditLog.actorUsername}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Vai trò:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedAuditLog.actorRole || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Hành vi (Action):</span>
                  <span className={`inline-block px-2 py-0.5 rounded-md font-bold ${getActionBadge(selectedAuditLog.action)}`}>
                    {selectedAuditLog.action}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Phân hệ (Module):</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{selectedAuditLog.module}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Tài nguyên:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedAuditLog.resourceType} (ID: {selectedAuditLog.resourceId || 'N/A'})</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Client IP:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">{selectedAuditLog.clientIp || 'Unknown'}</span>
                </div>
              </div>

              {selectedAuditLog.userAgent && (
                <div>
                  <span className="text-slate-400 block text-[11px] mb-1">User Agent thiết bị:</span>
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#101B2D] border border-slate-200 dark:border-[#2A3A50] font-mono text-[11px] text-slate-600 dark:text-[#A6B4C8] break-all">
                    {selectedAuditLog.userAgent}
                  </div>
                </div>
              )}

              {(selectedAuditLog.oldValue || selectedAuditLog.newValue) && (
                <div className="space-y-2">
                  <span className="text-slate-400 block text-[11px]">Dữ liệu thay đổi (Payload Diff):</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px]">
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-300">
                      <div className="font-bold text-[10px] text-rose-500 uppercase mb-1">Dữ liệu trước</div>
                      <div className="whitespace-pre-wrap break-all">{selectedAuditLog.oldValue || '(Trống)'}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300">
                      <div className="font-bold text-[10px] text-emerald-500 uppercase mb-1">Dữ liệu sau</div>
                      <div className="whitespace-pre-wrap break-all">{selectedAuditLog.newValue || '(Trống)'}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
