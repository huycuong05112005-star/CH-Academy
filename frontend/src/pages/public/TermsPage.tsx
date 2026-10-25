import React from 'react'
import { PublicNavbar } from '../../components/public/PublicNavbar'
import { PublicFooter } from '../../components/public/PublicFooter'
import { FileText } from 'lucide-react'

export const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      <PublicNavbar />

      <section className="relative overflow-hidden bg-gradient-to-r from-[#0d1e33] via-[#142B4A] to-[#1e3a66] text-white py-16 px-4 sm:px-6 lg:px-8 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(14,165,233,0.15),transparent_60%)]" />
        <div className="relative max-w-3xl mx-auto animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold mb-4 backdrop-blur-sm">
            <FileText className="w-3.5 h-3.5 text-cyan-300" />
            <span>Quy Định & Pháp Lý</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Điều Khoản Sử Dụng Dịch Vụ
          </h1>
          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Quy định chung về hoạt động đào tạo, đăng ký và trách nhiệm của học viên tại CH Academy
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
              <h2>Quy định chung</h2>
            </div>
            <p className="pl-10">
              Chào mừng bạn đến với hệ thống giáo dục CH Academy. Khi đăng ký tham gia các khóa học hoặc sử dụng các tiện ích trên hệ thống website của chúng tôi, bạn đồng ý tuân thủ toàn bộ các điều khoản và quy định được nêu tại đây.
            </p>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-bold text-lg sm:text-xl">
              <span className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                2
              </span>
              <h2>Đăng ký & Xếp lớp học</h2>
            </div>
            <p className="pl-10">
              Học viên hoàn tất đăng ký sau khi cung cấp đầy đủ thông tin cá nhân và được xếp vào lớp học phù hợp với độ tuổi, trình độ. Trung tâm có quyền điều chỉnh lịch học hoặc chuyển đổi lớp trong các trường hợp cần thiết và sẽ thông báo trước ít nhất 48 giờ.
            </p>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-bold text-lg sm:text-xl">
              <span className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                3
              </span>
              <h2>Học phí & Chính sách Thanh toán</h2>
            </div>
            <p className="pl-10">
              Học phí được áp dụng theo biểu phí niêm yết tại thời điểm đăng ký hoặc theo thông báo chính thức của Ban Quản lý. Các khoản thanh toán phải được thực hiện đúng thời hạn quy định. Mọi giao dịch tài chính tại trung tâm đều được xuất phiếu thu / biên nhận điện tử theo đúng quy trình chuẩn.
            </p>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-bold text-lg sm:text-xl">
              <span className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                4
              </span>
              <h2>Quy định Điểm danh & Chuyên cần</h2>
            </div>
            <p className="pl-10">
              Học viên cần tham dự tối thiểu 80% số buổi học trong khóa để đảm bảo chuẩn đầu ra. Trường hợp vắng mặt có phép cần báo trước cho giáo viên phụ trách hoặc bộ phận giáo vụ để được sắp xếp bài tập hoặc buổi học bù phù hợp.
            </p>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-bold text-lg sm:text-xl">
              <span className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                5
              </span>
              <h2>Sở hữu Trí tuệ Giáo trình</h2>
            </div>
            <p className="pl-10">
              Toàn bộ tài liệu, bài giảng, giáo án và video đào tạo do CH Academy cung cấp thuộc quyền sở hữu trí tuệ của trung tâm. Học viên không được sao chép, phân phối hoặc sử dụng cho mục đích thương mại ngoài phạm vi học tập cá nhân.
            </p>
          </section>
        </div>
      </main>

      <PublicFooter />
    </div>
  )
}
export default TermsPage
