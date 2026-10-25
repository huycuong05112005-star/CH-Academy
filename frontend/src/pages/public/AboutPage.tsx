import React from 'react'
import { Link } from 'react-router-dom'
import { PublicNavbar } from '../../components/public/PublicNavbar'
import { PublicFooter } from '../../components/public/PublicFooter'
import { Target, Eye, Award, CheckCircle, ArrowRight } from 'lucide-react'

export const AboutPage: React.FC = () => {
  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <PublicNavbar />

      {/* Header Banner */}
      <section style={{ backgroundColor: '#142B4A', color: '#ffffff', padding: '4rem 1.5rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 1rem 0' }}>
            Về CH Academy
          </h1>
          <p style={{ color: '#cbd5e1', fontSize: '1.1rem', lineHeight: 1.6, margin: 0 }}>
            Hệ sinh thái giáo dục hiện đại, chuẩn mực và lấy người học làm trung tâm. Chúng tôi đồng hành cùng sự phát triển của học viên ở mọi giai đoạn.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <main style={{ maxWidth: '1100px', margin: '3.5rem auto', padding: '0 1.5rem', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '3.5rem' }}>
          <div style={{ backgroundColor: '#ffffff', padding: '2rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <Target size={26} />
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#142B4A', margin: '0 0 0.75rem 0' }}>Sứ mệnh của Chúng tôi</h2>
            <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
              Đem đến môi trường học tập có tính tương tác cao, giúp học viên trang bị kiến thức vững vàng, kỹ năng tư duy phản biện và khả năng ứng dụng thực tiễn ngay trong cuộc sống và công việc.
            </p>
          </div>

          <div style={{ backgroundColor: '#ffffff', padding: '2rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <Eye size={26} />
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#142B4A', margin: '0 0 0.75rem 0' }}>Tầm nhìn Chiến lược</h2>
            <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
              Trở thành trung tâm đào tạo uy tín hàng đầu trong việc áp dụng công nghệ chuyển đổi số vào quản lý đào tạo, điểm danh và gắn kết giữa trung tâm, giáo viên, học viên và phụ huynh.
            </p>
          </div>

          <div style={{ backgroundColor: '#ffffff', padding: '2rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <Award size={26} />
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#142B4A', margin: '0 0 0.75rem 0' }}>Giá trị Cốt lõi</h2>
            <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
              Chính trực — Tận tâm — Chất lượng — Minh bạch. Mỗi học viên tại CH Academy đều được theo dõi và hỗ trợ theo năng lực cá nhân để phát huy tối đa tiềm năng.
            </p>
          </div>
        </div>

        {/* Commitment */}
        <div style={{ backgroundColor: '#ffffff', padding: '2.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#142B4A', margin: '0 0 1.25rem 0' }}>
            Cam kết Chất lượng Đào tạo
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', fontSize: '0.95rem', color: '#334155' }}>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <CheckCircle size={20} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Lộ trình học tập rõ ràng:</strong> Giáo trình được chuẩn hóa theo tiêu chuẩn quốc tế và tinh chỉnh phù hợp với thực tế tại Việt Nam.
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <CheckCircle size={20} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Báo cáo tiến độ minh bạch:</strong> Phụ huynh và học viên nắm bắt đầy đủ lịch học, kết quả điểm danh và đánh giá từ giáo viên.
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <CheckCircle size={20} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Hỗ trợ liên tục:</strong> Đội ngũ chăm sóc và trợ giảng sẵn sàng giải đáp thắc mắc và hỗ trợ kèm bù khi học viên cần.
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <CheckCircle size={20} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Cơ sở vật chất tiện nghi:</strong> Phòng học máy chiếu, điều hòa, trang thiết bị thực hành hiện đại phục vụ việc tiếp thu kiến thức.
              </div>
            </div>
          </div>
        </div>

        {/* CTA banner */}
        <div style={{ textAlign: 'center', backgroundColor: '#142B4A', color: '#ffffff', padding: '2.5rem', borderRadius: '12px' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.75rem 0' }}>
            Sẵn sàng trải nghiệm môi trường học tập tại CH Academy?
          </h3>
          <p style={{ color: '#cbd5e1', margin: '0 0 1.5rem 0' }}>
            Liên hệ ngay hôm nay để nhận thông tin ưu đãi và xếp lớp học thử miễn phí.
          </p>
          <Link
            to="/courses"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              backgroundColor: '#38bdf8',
              color: '#0f172a',
              fontWeight: 700,
              borderRadius: '8px',
              textDecoration: 'none'
            }}
          >
            Khám phá các khóa học <ArrowRight size={18} />
          </Link>
        </div>
      </main>

      <PublicFooter />
    </div>
  )
}
export default AboutPage
