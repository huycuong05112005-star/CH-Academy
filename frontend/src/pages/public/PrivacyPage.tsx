import React from 'react'
import { PublicNavbar } from '../../components/public/PublicNavbar'
import { PublicFooter } from '../../components/public/PublicFooter'

export const PrivacyPage: React.FC = () => {
  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <PublicNavbar />

      <section style={{ backgroundColor: '#142B4A', color: '#ffffff', padding: '3.5rem 1.5rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>
            Chính Sách Bảo Vệ Quyền Riêng Tư
          </h1>
          <p style={{ color: '#cbd5e1', fontSize: '0.95rem', margin: 0 }}>
            Cam kết bảo mật dữ liệu học viên, phụ huynh và an toàn thông tin của trẻ vị thành niên tại CH Academy
          </p>
        </div>
      </section>

      <main style={{ maxWidth: '900px', margin: '3rem auto', padding: '0 1.5rem', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '2.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#334155', lineHeight: 1.7, fontSize: '0.95rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#142B4A', marginTop: 0 }}>1. Nguyên tắc thu thập dữ liệu tối thiểu</h2>
          <p>
            CH Academy chỉ thu thập các thông tin thực sự cần thiết phục vụ công tác tổ chức đào tạo, chăm sóc học viên và quản lý nghiệp vụ tài chính, bao gồm: Họ và tên, số điện thoại liên lạc, thông tin người giám hộ (đối với học viên là trẻ em), lịch sử điểm danh và học phí. Chúng tôi tuyệt đối không thu thập các thông tin nhạy cảm ngoài phạm vi giáo dục.
          </p>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#142B4A' }}>2. Bảo vệ dữ liệu trẻ em và người giám hộ</h2>
          <p>
            Đối với học sinh dưới 16 tuổi, mọi thông tin chỉ được thu thập và xác nhận thông qua sự đồng ý của cha mẹ hoặc người giám hộ hợp pháp. Hồ sơ học tập và điểm danh của trẻ em chỉ được cấp quyền xem cho chính phụ huynh đã được liên kết và nhân sự đào tạo có thẩm quyền.
          </p>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#142B4A' }}>3. Bảo mật hệ thống & Lưu trữ</h2>
          <p>
            Toàn bộ cơ sở dữ liệu được mã hóa và lưu trữ an toàn trong hệ thống máy chủ cơ sở dữ liệu PostgreSQL chuẩn hóa. Mật khẩu người dùng được băm an toàn thông qua thuật toán BCrypt. Hệ thống chỉ cho phép các nhân sự có quyền tương ứng (Role-based Access Control) truy cập vào dữ liệu được phân công.
          </p>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#142B4A' }}>4. Không chia sẻ cho bên thứ ba</h2>
          <p>
            CH Academy cam kết không chia sẻ, bán hoặc chuyển giao dữ liệu cá nhân của học viên và phụ huynh cho bất kỳ tổ chức hay bên thứ ba nào vì mục đích thương mại hoặc quảng cáo.
          </p>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#142B4A' }}>5. Quyền chỉnh sửa và xóa dữ liệu</h2>
          <p>
            Học viên và phụ huynh có quyền yêu cầu tra cứu, cập nhật hoặc điều chỉnh thông tin cá nhân của mình bất kỳ lúc nào bằng cách liên hệ với bộ phận giáo vụ của trung tâm.
          </p>
        </div>
      </main>

      <PublicFooter />
    </div>
  )
}
export default PrivacyPage
