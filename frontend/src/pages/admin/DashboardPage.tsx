import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { healthApi, type HealthResponse } from '../../api/client'
import { dashboardApi } from '../../api/dashboard'
import type { DashboardStats } from '../../types/dashboard'
import {
  BookOpen,
  Users,
  Calendar,
  UserPlus,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  DollarSign,
  TrendingUp,
  Clock,
  ArrowRight,
  ShieldCheck,
  CreditCard
} from 'lucide-react'

export const DashboardPage: React.FC = () => {
  const { user } = useAuth()
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [healthStatus, setHealthStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [statsLoading, setStatsLoading] = useState<boolean>(true)
  const [statsError, setStatsError] = useState<string | null>(null)

  const fetchHealth = async () => {
    setHealthStatus('loading')
    try {
      const data = await healthApi.check()
      setHealth(data)
      setHealthStatus('success')
    } catch {
      setHealthStatus('error')
    }
  }

  const fetchStats = async () => {
    setStatsLoading(true)
    setStatsError(null)
    try {
      const data = await dashboardApi.getStats()
      setStats(data)
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Không thể tải thống kê bảng điều khiển'
      setStatsError(errorMsg)
    } finally {
      setStatsLoading(false)
    }
  }

  useEffect(() => {
    fetchHealth()
    fetchStats()
  }, [])

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0)
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    const [y, m, d] = dateStr.split('-')
    return `${d}/${m}/${y}`
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Welcome Banner */}
      <div style={{
        backgroundColor: '#ffffff',
        padding: '1.75rem',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#142B4A', margin: '0 0 0.5rem 0' }}>
            Xin chào, {user?.fullName || 'Quản trị viên'}! 👋
          </h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>
            Chào mừng bạn đến với trung tâm điều hành giáo dục CH Academy.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            backgroundColor: healthStatus === 'success' ? '#f0fdf4' : healthStatus === 'loading' ? '#f8fafc' : '#fef2f2',
            border: `1px solid ${healthStatus === 'success' ? '#bbf7d0' : healthStatus === 'loading' ? '#e2e8f0' : '#fecaca'}`,
            borderRadius: '8px',
            fontSize: '0.85rem',
            color: healthStatus === 'success' ? '#166534' : healthStatus === 'loading' ? '#64748b' : '#991b1b'
          }}>
            {healthStatus === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span>Backend: {healthStatus === 'success' ? 'Hoạt động tốt' : healthStatus === 'loading' ? 'Đang kiểm tra...' : 'Mất kết nối'}</span>
            <button
              onClick={fetchHealth}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex', padding: 0 }}
              title="Kiểm tra lại"
            >
              <RefreshCw size={14} />
            </button>
          </div>
          <button
            onClick={fetchStats}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.5rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              fontSize: '0.85rem',
              color: '#334155',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Main Stat Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '1.25rem'
      }}>
        {/* Card 1: Học viên */}
        <div style={{
          backgroundColor: '#ffffff',
          padding: '1.25rem',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '10px',
            backgroundColor: '#d9770615',
            color: '#d97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>Học viên</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#1e293b', lineHeight: 1.2 }}>
              {statsLoading ? '...' : stats?.totalStudents ?? 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 500 }}>
              {stats?.activeStudents ?? 0} đang theo học
            </div>
          </div>
        </div>

        {/* Card 2: Khóa học */}
        <div style={{
          backgroundColor: '#ffffff',
          padding: '1.25rem',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '10px',
            backgroundColor: '#2563eb15',
            color: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <BookOpen size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>Khóa học</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#1e293b', lineHeight: 1.2 }}>
              {statsLoading ? '...' : stats?.totalCourses ?? 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Chương trình đào tạo</div>
          </div>
        </div>

        {/* Card 3: Lớp học */}
        <div style={{
          backgroundColor: '#ffffff',
          padding: '1.25rem',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '10px',
            backgroundColor: '#05966915',
            color: '#059669',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Calendar size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>Lớp học</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#1e293b', lineHeight: 1.2 }}>
              {statsLoading ? '...' : stats?.activeClasses ?? 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Lớp đang vận hành</div>
          </div>
        </div>

        {/* Card 4: Tuyển sinh */}
        <div style={{
          backgroundColor: '#ffffff',
          padding: '1.25rem',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '10px',
            backgroundColor: '#7c3aed15',
            color: '#7c3aed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <UserPlus size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>Tuyển sinh</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#1e293b', lineHeight: 1.2 }}>
              {statsLoading ? '...' : stats?.totalLeads ?? 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#7c3aed', fontWeight: 500 }}>
              {stats?.leadConversionRate ?? 0}% chuyển đổi
            </div>
          </div>
        </div>
      </div>

      {/* Finance Overview Strip */}
      <div style={{
        backgroundColor: '#142B4A',
        borderRadius: '12px',
        padding: '1.5rem',
        color: '#ffffff',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.5rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ borderRight: '1px solid rgba(255,255,255,0.15)', paddingRight: '1rem' }}>
          <div style={{ fontSize: '0.85rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <DollarSign size={16} color="#38bdf8" />
            Tổng học phí phải thu
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.4rem' }}>
            {statsLoading ? '...' : formatVND(stats?.totalReceivable ?? 0)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
            Theo hợp đồng & biểu phí niêm yết
          </div>
        </div>

        <div style={{ borderRight: '1px solid rgba(255,255,255,0.15)', paddingRight: '1rem' }}>
          <div style={{ fontSize: '0.85rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <TrendingUp size={16} color="#4ade80" />
            Thực thu (Đã thanh toán)
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#4ade80', marginTop: '0.4rem' }}>
            {statsLoading ? '...' : formatVND(stats?.totalPaid ?? 0)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
            Đã ghi nhận giao dịch vào hệ thống
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.85rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <CreditCard size={16} color="#f87171" />
            Công nợ còn lại
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f87171', marginTop: '0.4rem' }}>
            {statsLoading ? '...' : formatVND(stats?.totalDebt ?? 0)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
            Các khoản chưa hoàn tất thanh toán
          </div>
        </div>
      </div>

      {/* Main Content Layout: Upcoming Sessions & Quick Links */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '1.5rem'
      }}>
        {/* Left: Upcoming Sessions Table */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.25rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={20} color="#142B4A" />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#142B4A', margin: 0 }}>
                Lịch học sắp diễn ra
              </h2>
            </div>
            <Link
              to="/admin/attendance"
              style={{
                fontSize: '0.85rem',
                color: '#2563eb',
                textDecoration: 'none',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              Xem điểm danh <ArrowRight size={14} />
            </Link>
          </div>

          {statsLoading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
              Đang tải lịch học...
            </div>
          ) : statsError ? (
            <div style={{ padding: '1rem', backgroundColor: '#fef2f2', color: '#991b1b', borderRadius: '8px' }}>
              {statsError}
            </div>
          ) : stats?.upcomingSessions && stats.upcomingSessions.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                    <th style={{ padding: '0.65rem 0.5rem' }}>Ngày</th>
                    <th style={{ padding: '0.65rem 0.5rem' }}>Giờ</th>
                    <th style={{ padding: '0.65rem 0.5rem' }}>Lớp học</th>
                    <th style={{ padding: '0.65rem 0.5rem' }}>Giáo viên</th>
                    <th style={{ padding: '0.65rem 0.5rem' }}>Phòng</th>
                    <th style={{ padding: '0.65rem 0.5rem' }}>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.upcomingSessions.map((session) => (
                    <tr key={session.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600, color: '#1e293b' }}>
                        {formatDate(session.sessionDate)}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: '#475569' }}>
                        {session.startTime?.substring(0, 5)} - {session.endTime?.substring(0, 5)}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <div style={{ fontWeight: 600, color: '#142B4A' }}>{session.className}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{session.classCode}</div>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: '#334155' }}>
                        {session.teacherName}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: '#64748b' }}>
                        {session.room || 'Chưa xếp'}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <span style={{
                          padding: '0.2rem 0.5rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          backgroundColor: session.status === 'SCHEDULED' ? '#eff6ff' : '#f0fdf4',
                          color: session.status === 'SCHEDULED' ? '#1d4ed8' : '#15803d'
                        }}>
                          {session.status === 'SCHEDULED' ? 'Đã lên lịch' : session.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{
              padding: '2.5rem',
              textAlign: 'center',
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              color: '#64748b'
            }}>
              <Calendar size={32} style={{ margin: '0 auto 0.5rem auto', opacity: 0.5 }} />
              <p style={{ margin: 0, fontWeight: 500 }}>Chưa có buổi học nào sắp tới trong 7 ngày tới</p>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                Tạo thêm lớp hoặc lịch học trong phần Quản lý đào tạo
              </p>
            </div>
          )}
        </div>

        {/* Right: Quick Actions & System Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Quick Actions */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            padding: '1.25rem'
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#142B4A', marginTop: 0, marginBottom: '1rem' }}>
              Thao tác nhanh
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <Link
                to="/admin/students"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  backgroundColor: '#f8fafc',
                  color: '#1e293b',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  border: '1px solid #e2e8f0'
                }}
              >
                <Users size={18} color="#d97706" />
                <span>Quản lý học viên</span>
              </Link>

              <Link
                to="/admin/courses"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  backgroundColor: '#f8fafc',
                  color: '#1e293b',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  border: '1px solid #e2e8f0'
                }}
              >
                <BookOpen size={18} color="#2563eb" />
                <span>Thêm khóa học mới</span>
              </Link>

              <Link
                to="/admin/classes"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  backgroundColor: '#f8fafc',
                  color: '#1e293b',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  border: '1px solid #e2e8f0'
                }}
              >
                <Calendar size={18} color="#059669" />
                <span>Mở lớp học & xếp lịch</span>
              </Link>

              <Link
                to="/admin/finance"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  backgroundColor: '#f8fafc',
                  color: '#1e293b',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  border: '1px solid #e2e8f0'
                }}
              >
                <DollarSign size={18} color="#16a34a" />
                <span>Thu học phí & công nợ</span>
              </Link>

              <Link
                to="/admin/leads"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  backgroundColor: '#f8fafc',
                  color: '#1e293b',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  border: '1px solid #e2e8f0'
                }}
              >
                <UserPlus size={18} color="#7c3aed" />
                <span>Tư vấn tuyển sinh</span>
              </Link>
            </div>
          </div>

          {/* System Spec Card */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            padding: '1.25rem'
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#142B4A', marginTop: 0, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldCheck size={18} color="#16a34a" /> Thông số kỹ thuật
            </h3>
            <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div><strong>Hệ điều hành:</strong> Windows 11 Localhost</div>
              <div><strong>Backend:</strong> {health?.service || 'CH Academy Backend'} ({health?.version || '0.0.1'})</div>
              <div><strong>Database:</strong> PostgreSQL 16 ({healthStatus === 'success' ? 'UP' : 'Checking'})</div>
              <div><strong>Múi giờ:</strong> Asia/Ho_Chi_Minh (GMT+7)</div>
              <div><strong>Tiền tệ:</strong> Việt Nam Đồng (VND)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
export default DashboardPage
