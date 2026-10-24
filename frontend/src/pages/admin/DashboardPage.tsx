import React, { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { healthApi, type HealthResponse } from '../../api/client'
import { BookOpen, Users, Calendar, UserPlus, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react'

export const DashboardPage: React.FC = () => {
  const { user } = useAuth()
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [healthStatus, setHealthStatus] = useState<'loading' | 'success' | 'error'>('loading')

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

  useEffect(() => {
    fetchHealth()
  }, [])

  const statCards = [
    { title: 'Khóa học', value: '0', sub: 'Chương trình đào tạo', icon: BookOpen, color: '#2563eb' },
    { title: 'Lớp học', value: '0', sub: 'Lớp đang vận hành', icon: Calendar, color: '#059669' },
    { title: 'Học viên', value: '0', sub: 'Đang theo học', icon: Users, color: '#d97706' },
    { title: 'Tuyển sinh', value: '0', sub: 'Khách hàng tiềm năng', icon: UserPlus, color: '#7c3aed' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Welcome Banner */}
      <div style={{
        backgroundColor: '#ffffff',
        padding: '1.75rem',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#142B4A', margin: '0 0 0.5rem 0' }}>
            Xin chào, {user?.fullName || 'Quản trị viên'}! 👋
          </h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>
            Chào mừng bạn đến với trung tâm điều hành giáo dục CH Academy.
          </p>
        </div>
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
      </div>

      {/* Stat Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.25rem'
      }}>
        {statCards.map((card, idx) => {
          const Icon = card.icon
          return (
            <div key={idx} style={{
              backgroundColor: '#ffffff',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              display: 'flex',
              alignItems: 'center',
              gap: '1.25rem'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '10px',
                backgroundColor: `${card.color}15`,
                color: card.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Icon size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>{card.title}</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1e293b', lineHeight: 1.2 }}>{card.value}</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{card.sub}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* System Status Detail Card */}
      <div style={{
        backgroundColor: '#ffffff',
        padding: '1.75rem',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#142B4A', marginTop: 0, marginBottom: '1rem' }}>
          Trạng thái Dịch vụ Hệ thống
        </h2>
        {healthStatus === 'success' && health ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Dịch vụ</div>
              <div style={{ fontWeight: 600, color: '#0f172a' }}>{health.service}</div>
            </div>
            <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Phiên bản</div>
              <div style={{ fontWeight: 600, color: '#0f172a' }}>{health.version}</div>
            </div>
            <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Database</div>
              <div style={{ fontWeight: 600, color: '#166534' }}>PostgreSQL 16 (UP)</div>
            </div>
            <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Múi giờ</div>
              <div style={{ fontWeight: 600, color: '#0f172a' }}>Asia/Ho_Chi_Minh</div>
            </div>
          </div>
        ) : (
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Đang nạp dữ liệu trạng thái...</p>
        )}
      </div>
    </div>
  )
}
