import React from 'react'
import { Link } from 'react-router-dom'
import { GraduationCap, Mail, Phone, MapPin, Clock } from 'lucide-react'

export const PublicFooter: React.FC = () => {
  return (
    <footer style={{
      backgroundColor: '#0F1E33',
      color: '#e2e8f0',
      paddingTop: '3.5rem',
      paddingBottom: '2rem',
      borderTop: '3px solid #142B4A'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '2.5rem',
          marginBottom: '3rem'
        }}>
          {/* Brand Col */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                backgroundColor: '#ffffff',
                color: '#142B4A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <GraduationCap size={22} />
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>
                CH ACADEMY
              </div>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#94a3b8', lineHeight: 1.6, margin: '0 0 1rem 0' }}>
              Hệ thống trung tâm giáo dục đào tạo đa lĩnh vực dành cho trẻ em và người lớn. Cam kết chất lượng đào tạo thực tiễn và chuẩn hóa chuẩn đầu ra.
            </p>
            <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
              Phiên bản hệ thống: 0.0.1-SNAPSHOT
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', marginBottom: '1rem' }}>
              Khám phá
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.875rem' }}>
              <li><Link to="/courses" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Chương trình khóa học</Link></li>
              <li><Link to="/about" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Về chúng tôi & Tầm nhìn</Link></li>
              <li><Link to="/contact" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Liên hệ & Địa điểm</Link></li>
              <li><Link to="/login" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Cổng thông tin Quản trị</Link></li>
            </ul>
          </div>

          {/* Legal / Policy */}
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', marginBottom: '1rem' }}>
              Quy định & Chính sách
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.875rem' }}>
              <li><Link to="/terms" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Điều khoản sử dụng dịch vụ</Link></li>
              <li><Link to="/privacy" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Chính sách bảo vệ quyền riêng tư</Link></li>
              <li><span style={{ color: '#94a3b8' }}>Chính sách hoàn phí & bảo lưu</span></li>
              <li><span style={{ color: '#94a3b8' }}>Quy chuẩn lớp học & điểm danh</span></li>
            </ul>
          </div>

          {/* Contact info */}
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', marginBottom: '1rem' }}>
              Thông tin liên hệ
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem', color: '#cbd5e1' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <MapPin size={18} color="#38bdf8" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>Trụ sở trung tâm: Khu vực điều hành CH Academy (Cập nhật bởi Ban Quản lý)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Phone size={18} color="#38bdf8" style={{ flexShrink: 0 }} />
                <span>Hotline: 0987 654 321</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Mail size={18} color="#38bdf8" style={{ flexShrink: 0 }} />
                <span>Email: contact@chacademy.edu.vn</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={18} color="#38bdf8" style={{ flexShrink: 0 }} />
                <span>Giờ làm việc: 08:00 - 21:00 (Thứ 2 - Chủ Nhật)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.1)',
          paddingTop: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          fontSize: '0.8rem',
          color: '#94a3b8'
        }}>
          <div>
            © {new Date().getFullYear()} CH Academy. Tất cả quyền được bảo lưu. Múi giờ hệ thống: Asia/Ho_Chi_Minh.
          </div>
          <div>
            Nền tảng vận hành giáo dục chuyên nghiệp
          </div>
        </div>
      </div>
    </footer>
  )
}
