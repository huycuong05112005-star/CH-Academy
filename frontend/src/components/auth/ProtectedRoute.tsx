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
  const { isAuthenticated, isLoading, hasRole, hasAnyRole, hasPermission } = useAuth()
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
    const isTeacher = hasRole('TEACHER')
    const isStudent = hasRole('STUDENT')
    const portalUrl = isTeacher ? '/teacher' : isStudent ? '/student' : '/admin'

    return (
      <div className="p-8 text-center max-w-lg mx-auto my-16 bg-white dark:bg-[#151F31] rounded-2xl border border-slate-200 dark:border-[#2A3A50] shadow-xl">
        <ShieldAlert size={56} className="mx-auto mb-4 text-rose-500" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-[#E8EEF7] mb-2">403 - Giới hạn quyền truy cập</h2>
        <p className="text-sm text-slate-500 dark:text-[#A6B4C8] mb-6">
          Tài khoản của bạn không có vai trò phù hợp để truy cập phân hệ này. Vui lòng quay lại không gian làm việc của bạn.
        </p>
        <Navigate to={portalUrl} replace />
      </div>
    )
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="p-8 text-center max-w-lg mx-auto my-16 bg-white dark:bg-[#151F31] rounded-2xl border border-slate-200 dark:border-[#2A3A50] shadow-xl">
        <ShieldAlert size={56} className="mx-auto mb-4 text-amber-500" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-[#E8EEF7] mb-2">403 - Giới hạn quyền hạn</h2>
        <p className="text-sm text-slate-500 dark:text-[#A6B4C8] mb-4">
          Bạn không có quyền thực hiện hoặc xem tính năng này ({requiredPermission}).
        </p>
      </div>
    )
  }

  return <>{children}</>
}
