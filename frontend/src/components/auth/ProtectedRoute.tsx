import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ShieldAlert } from 'lucide-react'

interface ProtectedRouteProps {
  children?: React.ReactNode
  requiredRoles?: string[]
  requiredPermission?: string
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles,
  requiredPermission,
}) => {
  const { isAuthenticated, isLoading, hasAnyRole, hasPermission } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', flexDirection: 'column', gap: '1rem' }}>
        <div className="loading-spinner" style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTop: '4px solid #142B4A', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Đang xác thực thông tin...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requiredRoles && requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', maxWidth: '500px', margin: '4rem auto' }}>
        <ShieldAlert size={56} color="#ef4444" style={{ margin: '0 auto 1.5rem' }} />
        <h2 style={{ color: '#0f172a', marginBottom: '0.5rem' }}>403 - Không có quyền truy cập</h2>
        <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
          Tài khoản của bạn không có vai trò phù hợp để truy cập trang này. Vui lòng liên hệ ban quản trị.
        </p>
        <a href="/admin" style={{ display: 'inline-block', padding: '0.6rem 1.2rem', backgroundColor: '#142B4A', color: '#fff', borderRadius: '6px', textDecoration: 'none' }}>
          Về trang tổng quan
        </a>
      </div>
    )
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', maxWidth: '500px', margin: '4rem auto' }}>
        <ShieldAlert size={56} color="#ef4444" style={{ margin: '0 auto 1.5rem' }} />
        <h2 style={{ color: '#0f172a', marginBottom: '0.5rem' }}>403 - Giới hạn quyền hạn</h2>
        <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
          Bạn không có quyền thực hiện hoặc xem tính năng này ({requiredPermission}).
        </p>
      </div>
    )
  }

  return <>{children}</>
}
