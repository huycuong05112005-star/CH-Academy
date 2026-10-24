import React, { useState } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  Users,
  UserCheck,
  CreditCard,
  UserPlus,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Bell
} from 'lucide-react'

export const AdminLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navItems = [
    { label: 'Tổng quan', path: '/admin', icon: LayoutDashboard, end: true },
    { label: 'Khóa học', path: '/admin/courses', icon: BookOpen },
    { label: 'Lớp học & Lịch', path: '/admin/classes', icon: Calendar },
    { label: 'Học viên', path: '/admin/students', icon: Users },
    { label: 'Tuyển sinh & Leads', path: '/admin/leads', icon: UserPlus },
    { label: 'Điểm danh', path: '/admin/attendance', icon: UserCheck },
    { label: 'Học phí & Công nợ', path: '/admin/finance', icon: CreditCard },
    { label: 'Cấu hình hệ thống', path: '/admin/settings', icon: Settings },
  ]

  // Get current section label for breadcrumb
  const currentItem = navItems.find((item) =>
    item.end ? location.pathname === item.path : location.pathname.startsWith(item.path)
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', color: '#0f172a', fontFamily: 'Inter, -apple-system, sans-serif' }}>
      {/* Sidebar */}
      <aside style={{
        width: collapsed ? '80px' : '260px',
        backgroundColor: '#142B4A',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.25s ease',
        boxShadow: '2px 0 10px rgba(0,0,0,0.05)',
        position: 'sticky',
        top: 0,
        height: '100vh',
        zIndex: 50,
        boxSizing: 'border-box'
      }}>
        {/* Brand */}
        <div style={{
          padding: '1.25rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          overflow: 'hidden'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            backgroundColor: '#ffffff',
            color: '#142B4A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <GraduationCap size={24} />
          </div>
          {!collapsed && (
            <div style={{ whiteSpace: 'nowrap' }}>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>CH Academy</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Quản trị đào tạo</div>
            </div>
          )}
        </div>

        {/* Nav Links */}
        <nav style={{ flex: 1, padding: '1rem 0.5rem', overflowY: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.875rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    color: isActive ? '#ffffff' : '#cbd5e1',
                    backgroundColor: isActive ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                    textDecoration: 'none',
                    fontWeight: isActive ? 600 : 400,
                    fontSize: '0.925rem',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap'
                  })}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon size={20} style={{ flexShrink: 0 }} />
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              )
            })}
          </div>
        </nav>

        {/* Sidebar Footer & Toggle */}
        <div style={{
          padding: '1rem',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between'
        }}>
          {!collapsed && (
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>v1.0.0</span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: 'none',
              borderRadius: '6px',
              color: '#cbd5e1',
              padding: '0.4rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            aria-label={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Header */}
        <header style={{
          height: '64px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1.5rem',
          position: 'sticky',
          top: 0,
          zIndex: 40
        }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
            <span style={{ color: '#64748b' }}>Quản trị</span>
            <span style={{ color: '#cbd5e1' }}>/</span>
            <span style={{ fontWeight: 600, color: '#142B4A' }}>{currentItem?.label || 'Trang'}</span>
          </div>

          {/* Right Header items */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <button style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', position: 'relative' }} aria-label="Thông báo">
              <Bell size={20} />
            </button>

            {/* User Profile */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: '#e2e8f0',
                color: '#142B4A',
                fontWeight: 600,
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {user?.fullName?.charAt(0) || 'U'}
              </div>
              <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>
                  {user?.fullName || 'Người dùng'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  {user?.roles?.[0] || 'VAI TRÒ'}
                </div>
              </div>

              <button
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  marginLeft: '0.5rem',
                  padding: '0.4rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#ffffff',
                  color: '#dc2626',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
                title="Đăng xuất khỏi hệ thống"
              >
                <LogOut size={14} />
                <span>Thoát</span>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main style={{ flex: 1, padding: '2rem', boxSizing: 'border-box' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
