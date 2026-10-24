import React from 'react'
import { Link } from 'react-router-dom'
import { GraduationCap, LogIn } from 'lucide-react'

export const PublicNavbar: React.FC = () => {
  return (
    <header
      role="navigation"
      aria-label="Điều hướng chính"
      style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}
    >
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0.85rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Logo */}
        <Link
          to="/"
          aria-label="CH Academy - Trang chủ"
          style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', textDecoration: 'none' }}
        >
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: '#142B4A',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <GraduationCap size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#142B4A', lineHeight: 1.1 }}>
              CH ACADEMY
            </div>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, letterSpacing: '0.05em' }}>
              TRUNG TÂM GIÁO DỤC CHẤT LƯỢNG CAO
            </div>
          </div>
        </Link>

        {/* Navigation links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '1.75rem', fontSize: '0.95rem', fontWeight: 600 }}>
          <Link to="/" style={{ color: '#334155', textDecoration: 'none' }}>
            Trang chủ
          </Link>
          <Link to="/courses" style={{ color: '#334155', textDecoration: 'none' }}>
            Khóa học
          </Link>
          <Link to="/about" style={{ color: '#334155', textDecoration: 'none' }}>
            Về chúng tôi
          </Link>
          <Link to="/contact" style={{ color: '#334155', textDecoration: 'none' }}>
            Liên hệ
          </Link>
        </nav>

        {/* Action CTAs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link
            to="/login"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#142B4A',
              fontWeight: 600,
              fontSize: '0.9rem',
              textDecoration: 'none'
            }}
          >
            <LogIn size={16} />
            Đăng nhập
          </Link>
          <a
            href="#tu-van"
            style={{
              padding: '0.5rem 1.15rem',
              borderRadius: '8px',
              backgroundColor: '#142B4A',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '0.9rem',
              textDecoration: 'none',
              boxShadow: '0 2px 4px rgba(20, 43, 74, 0.2)'
            }}
          >
            Đăng ký tư vấn
          </a>
        </div>
      </div>
    </header>
  )
}
