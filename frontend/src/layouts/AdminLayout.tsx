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

interface NavItem {
  label: string
  path: string
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>
  end?: boolean
}

interface NavGroup {
  group: string
  items: NavItem[]
}

export const AdminLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navGroups: NavGroup[] = [
    {
      group: 'ĐIỀU HÀNH',
      items: [
        { label: 'Tổng quan', path: '/admin', icon: LayoutDashboard, end: true },
      ]
    },
    {
      group: 'ĐÀO TẠO & HỌC VỤ',
      items: [
        { label: 'Khóa học', path: '/admin/courses', icon: BookOpen },
        { label: 'Lớp học & Lịch', path: '/admin/classes', icon: Calendar },
        { label: 'Điểm danh', path: '/admin/attendance', icon: UserCheck },
      ]
    },
    {
      group: 'HỌC VIÊN & TUYỂN SINH',
      items: [
        { label: 'Tuyển sinh & Leads', path: '/admin/leads', icon: UserPlus },
        { label: 'Học viên & Giám hộ', path: '/admin/students', icon: Users },
      ]
    },
    {
      group: 'TÀI CHÍNH & HỆ THỐNG',
      items: [
        { label: 'Học phí & Công nợ', path: '/admin/finance', icon: CreditCard },
        { label: 'Cấu hình hệ thống', path: '/admin/settings', icon: Settings },
      ]
    }
  ]

  const allNavItems = navGroups.flatMap(g => g.items)

  // Get current section label for breadcrumb
  const currentItem = allNavItems.find((item) =>
    item.end ? location.pathname === item.path : location.pathname.startsWith(item.path)
  )

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'Quản trị cấp cao'
      case 'ADMIN': return 'Quản trị viên'
      case 'ACADEMIC_STAFF': return 'Cán bộ giáo vụ'
      case 'TEACHER': return 'Giảng viên'
      case 'ACCOUNTANT': return 'Kế toán viên'
      default: return 'Nhân sự'
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F5F7FB', color: '#18283F', fontFamily: 'Inter, -apple-system, sans-serif' }}>
      {/* Sidebar */}
      <aside style={{
        width: collapsed ? '76px' : '260px',
        backgroundColor: '#142B4A',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '4px 0 16px rgba(11, 24, 48, 0.08)',
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
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          overflow: 'hidden'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: '#ffffff',
            color: '#142B4A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
          }}>
            <GraduationCap size={24} />
          </div>
          {!collapsed && (
            <div style={{ whiteSpace: 'nowrap' }}>
              <div style={{ fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.02em', color: '#ffffff' }}>CH Academy</div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 500, letterSpacing: '0.05em' }}>TRUNG TÂM ĐÀO TẠO</div>
            </div>
          )}
        </div>

        {/* Nav Links */}
        <nav style={{ flex: 1, padding: '1rem 0.65rem', overflowY: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {navGroups.map((group, gIdx) => (
              <div key={gIdx}>
                {!collapsed && (
                  <div style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    color: '#64748B',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    padding: '0 0.75rem',
                    marginBottom: '0.4rem'
                  }}>
                    {group.group}
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  {group.items.map((item) => {
                    const Icon = item.icon
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.end}
                        style={({ isActive }) => ({
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.85rem',
                          padding: collapsed ? '0.75rem 0' : '0.65rem 0.85rem',
                          justifyContent: collapsed ? 'center' : 'flex-start',
                          borderRadius: '8px',
                          color: isActive ? '#ffffff' : '#94A3B8',
                          backgroundColor: isActive ? 'rgba(255, 255, 255, 0.14)' : 'transparent',
                          textDecoration: 'none',
                          fontWeight: isActive ? 600 : 500,
                          fontSize: '0.875rem',
                          transition: 'all 0.15s ease',
                          whiteSpace: 'nowrap',
                          borderLeft: isActive ? '3px solid #38BDF8' : '3px solid transparent'
                        })}
                        title={collapsed ? item.label : undefined}
                      >
                        <Icon size={19} style={{ flexShrink: 0 }} />
                        {!collapsed && <span>{item.label}</span>}
                      </NavLink>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>

        {/* Sidebar Footer & Toggle */}
        <div style={{
          padding: '0.85rem 1rem',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          backgroundColor: 'rgba(11, 24, 48, 0.5)'
        }}>
          {!collapsed && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 600 }}>CH-Academy v1.0</span>
              <span style={{ fontSize: '0.65rem', color: '#64748b' }}>Hệ thống Quản lý Chuẩn</span>
            </div>
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
              justifyContent: 'center',
              transition: 'background 0.2s'
            }}
            aria-label={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, backgroundColor: '#F5F7FB' }}>
        {/* Top Header */}
        <header style={{
          height: '64px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 2rem',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          {/* Breadcrumb & Context */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
            <span style={{ color: '#64748B', fontWeight: 500 }}>Quản trị trung tâm</span>
            <span style={{ color: '#CBD5E1' }}>/</span>
            <span style={{ fontWeight: 700, color: '#142B4A' }}>{currentItem?.label || 'Bảng điều khiển'}</span>
          </div>

          {/* Right Header items */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <button
              style={{
                background: 'none',
                border: 'none',
                color: '#64748B',
                cursor: 'pointer',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                padding: '0.4rem',
                borderRadius: '8px'
              }}
              aria-label="Thông báo"
            >
              <Bell size={19} />
              <span style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                width: '7px',
                height: '7px',
                backgroundColor: '#38BDF8',
                borderRadius: '50%'
              }} />
            </button>

            {/* User Profile */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingLeft: '0.75rem', borderLeft: '1px solid #E2E8F0' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                backgroundColor: '#142B4A',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(20, 43, 74, 0.15)'
              }}>
                {user?.fullName?.charAt(0) || 'U'}
              </div>
              <div style={{ textAlign: 'left', lineHeight: 1.25 }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#18283F' }}>
                  {user?.fullName || 'Người dùng'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500 }}>
                  {getRoleLabel(user?.roles?.[0])}
                </div>
              </div>

              <button
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  marginLeft: '0.75rem',
                  padding: '0.45rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #FEE2E2',
                  backgroundColor: '#FEF2F2',
                  color: '#DC2626',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                title="Đăng xuất khỏi hệ thống"
              >
                <LogOut size={14} />
                <span>Thoát</span>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content: Generous, centered, comfortable layout */}
        <main style={{
          flex: 1,
          padding: '2rem',
          maxWidth: '1600px',
          width: '100%',
          margin: '0 auto',
          boxSizing: 'border-box'
        }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
