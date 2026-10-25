import React from 'react'
import { PublicNavbar } from '../../components/public/PublicNavbar'
import { PublicFooter } from '../../components/public/PublicFooter'

export const TermsPage: React.FC = () => {
  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <PublicNavbar />

      <section style={{ backgroundColor: '#142B4A', color: '#ffffff', padding: '3.5rem 1.5rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>
            Điều Khoản Sử Dụng Dịch Vụ
          </h1>
          <p style={{ color: '#cbd5e1', fontSize: '0.95rem', margin: 0 }}>
            Quy định chung về hoạt động đào tạo, đăng ký và trách nhiệm của học viên tại CH Academy
          </p>
        </div>
      </section>

      <main style={{ maxWidth: '900px', margin: '3rem auto', padding: '0 1.5rem', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '2.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#334155', lineHeight: 1.7, fontSize: '0.95rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#142B4A', marginTop: 0 }}>1. Quy định chung</h2>
          <p>
            Chào mừng bạn đến với hệ thống giáo dục CH Academy. Khi đăng ký tham gia các khóa học hoặc sử dụng các tiện ích trên hệ thống website của chúng tôi, bạn đồng ý tuân thủ toàn bộ các điều khoản và quy định được nêu tại đây.
          </p>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#142B4A' }}>2. Đăng ký & Xếp lớp học</h2>
          <p>
            Học viên hoàn tất đăng ký sau khi cung cấp đầy đủ thông tin cá nhân và được xếp vào lớp học phù hợp với độ tuổi, trình độ. Trung tâm có quyền điều chỉnh lịch học hoặc chuyển đổi lớp trong các trường hợp cần thiết và sẽ thông báo trước ít nhất 48 giờ.
          </p>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#142B4A' }}>3. Học phí & Chính sách Thanh toán</h2>
          <p>
            Học phí được áp dụng theo biểu phí niêm yết tại thời điểm đăng ký hoặc theo thông báo chính thức của Ban Quản lý. Các khoản thanh toán phải được thực hiện đúng thời hạn quy định. Mọi giao dịch tài chính tại trung tâm đều được xuất phiếu thu / biên nhận điện tử theo đúng quy trình chuẩn.
          </p>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#142B4A' }}>4. Quy định Điểm danh & Chuyên cần</h2>
          <p>
            Học viên cần tham dự tối thiểu 80% số buổi học trong khóa để đảm bảo chuẩn đầu ra. Trường hợp vắng mặt có phép cần báo trước cho giáo viên phụ trách hoặc bộ phận giáo vụ để được sắp xếp bài tập hoặc buổi học bù phù hợp.
          </p>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#142B4A' }}>5. Sở hữu Trí tuệ Giáo trình</h2>
          <p>
            Toàn bộ tài liệu, bài giảng, giáo án và video đào tạo do CH Academy cung cấp thuộc quyền sở hữu trí tuệ của trung tâm. Học viên không được sao chép, phân phối hoặc sử dụng cho mục đích thương mại ngoài phạm vi học tập cá nhân.
          </p>
        </div>
      </main>

      <PublicFooter />
    </div>
  )
}
export default TermsPage
