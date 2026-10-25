import React from 'react'
import { PublicNavbar } from '../../components/public/PublicNavbar'
import { PublicFooter } from '../../components/public/PublicFooter'
import { ShieldCheck } from 'lucide-react'

export const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      <PublicNavbar />

      <section className="relative overflow-hidden bg-gradient-to-r from-[#0d1e33] via-[#142B4A] to-[#1e3a66] text-white py-16 px-4 sm:px-6 lg:px-8 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(14,165,233,0.15),transparent_60%)]" />
        <div className="relative max-w-3xl mx-auto animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold mb-4 backdrop-blur-sm">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-300" />
            <span>Bảo Mật Dữ Liệu Học Viên</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Chính Sách Bảo Vệ Quyền Riêng Tư
          </h1>
          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Cam kết bảo mật dữ liệu học viên, phụ huynh và an toàn thông tin của trẻ vị thành niên tại CH Academy
          </p>
        </div>
      </section>

      <main className="max-w-4xl mx-auto my-10 sm:my-12 px-4 sm:px-6 lg:px-8 w-full flex-1">
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-10 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-8 leading-relaxed text-sm sm:text-base text-slate-600 dark:text-slate-300">
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-bold text-lg sm:text-xl">
              <span className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                1
              </span>
              <h2>Nguyên tắc thu thập dữ liệu tối thiểu</h2>
            </div>
            <p className="pl-10">
              CH Academy chỉ thu thập các thông tin thực sự cần thiết phục vụ công tác tổ chức đào tạo, chăm sóc học viên và quản lý nghiệp vụ tài chính, bao gồm: Họ và tên, số điện thoại liên lạc, thông tin người giám hộ (đối với học viên là trẻ em), lịch sử điểm danh và học phí. Chúng tôi tuyệt đối không thu thập các thông tin nhạy cảm ngoài phạm vi giáo dục.
            </p>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-bold text-lg sm:text-xl">
              <span className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                2
              </span>
              <h2>Bảo vệ dữ liệu trẻ em và người giám hộ</h2>
            </div>
            <p className="pl-10">
              Đối với học sinh dưới 16 tuổi, mọi thông tin chỉ được thu thập và xác nhận thông qua sự đồng ý của cha mẹ hoặc người giám hộ hợp pháp. Hồ sơ học tập và điểm danh của trẻ em chỉ được cấp quyền xem cho chính phụ huynh đã được liên kết và nhân sự đào tạo có thẩm quyền.
            </p>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-bold text-lg sm:text-xl">
              <span className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                3
              </span>
              <h2>Bảo mật hệ thống & Lưu trữ</h2>
            </div>
            <p className="pl-10">
              Toàn bộ cơ sở dữ liệu được mã hóa và lưu trữ an toàn trong hệ thống máy chủ cơ sở dữ liệu PostgreSQL chuẩn hóa. Mật khẩu người dùng được băm an toàn thông qua thuật toán BCrypt. Hệ thống chỉ cho phép các nhân sự có quyền tương ứng (Role-based Access Control) truy cập vào dữ liệu được phân công.
            </p>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-bold text-lg sm:text-xl">
              <span className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                4
              </span>
              <h2>Không chia sẻ cho bên thứ ba</h2>
            </div>
            <p className="pl-10">
              CH Academy cam kết không chia sẻ, bán hoặc chuyển giao dữ liệu cá nhân của học viên và phụ huynh cho bất kỳ tổ chức hay bên thứ ba nào vì mục đích thương mại hoặc quảng cáo.
            </p>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-bold text-lg sm:text-xl">
              <span className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                5
              </span>
              <h2>Quyền chỉnh sửa và xóa dữ liệu</h2>
            </div>
            <p className="pl-10">
              Học viên và phụ huynh có quyền yêu cầu tra cứu, cập nhật hoặc điều chỉnh thông tin cá nhân của mình bất kỳ lúc nào bằng cách liên hệ với bộ phận giáo vụ của trung tâm.
            </p>
          </section>
        </div>
      </main>

      <PublicFooter />
    </div>
  )
}
export default PrivacyPage
