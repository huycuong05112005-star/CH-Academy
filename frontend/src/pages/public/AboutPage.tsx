import React from 'react'
import { Link } from 'react-router-dom'
import { PublicNavbar } from '../../components/public/PublicNavbar'
import { PublicFooter } from '../../components/public/PublicFooter'
import { Target, Eye, Award, CheckCircle, ArrowRight } from 'lucide-react'

export const AboutPage: React.FC = () => {
  return (
    <div className="bg-[var(--bg-app)] min-h-screen flex flex-col text-[var(--text-main)] transition-colors duration-200">
      <PublicNavbar />

      {/* Header Banner */}
      <section className="bg-gradient-to-br from-[#0F243E] via-[#142B4A] to-[#1E3A63] text-white py-16 px-4 sm:px-6 text-center">
        <div className="max-w-3xl mx-auto space-y-4">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Về CH Academy
          </h1>
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
            Hệ sinh thái giáo dục hiện đại, chuẩn mực và lấy người học làm trung tâm. Chúng tôi đồng hành cùng sự phát triển của học viên ở mọi giai đoạn.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <main className="max-w-6xl mx-auto my-12 px-4 sm:px-6 w-full box-border space-y-12 flex-1">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-[#111C31] p-6 sm:p-8 rounded-2xl border border-slate-200/80 dark:border-[#1E3152] shadow-xs hover-lift transition-all">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#2563EB] dark:text-[#38BDF8] flex items-center justify-center mb-5 shadow-xs">
              <Target size={26} />
            </div>
            <h2 className="text-xl font-bold text-[#0F172A] dark:text-[#F8FAFC] mb-3">
              Sứ mệnh của Chúng tôi
            </h2>
            <p className="text-sm text-slate-600 dark:text-[#94A3B8] leading-relaxed">
              Đem đến môi trường học tập có tính tương tác cao, giúp học viên trang bị kiến thức vững vàng, kỹ năng tư duy phản biện và khả năng ứng dụng thực tiễn ngay trong cuộc sống và công việc.
            </p>
          </div>

          <div className="bg-white dark:bg-[#111C31] p-6 sm:p-8 rounded-2xl border border-slate-200/80 dark:border-[#1E3152] shadow-xs hover-lift transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-5 shadow-xs">
              <Eye size={26} />
            </div>
            <h2 className="text-xl font-bold text-[#0F172A] dark:text-[#F8FAFC] mb-3">
              Tầm nhìn Chiến lược
            </h2>
            <p className="text-sm text-slate-600 dark:text-[#94A3B8] leading-relaxed">
              Trở thành trung tâm đào tạo uy tín hàng đầu trong việc áp dụng công nghệ chuyển đổi số vào quản lý đào tạo, điểm danh và gắn kết giữa trung tâm, giáo viên, học viên và phụ huynh.
            </p>
          </div>

          <div className="bg-white dark:bg-[#111C31] p-6 sm:p-8 rounded-2xl border border-slate-200/80 dark:border-[#1E3152] shadow-xs hover-lift transition-all">
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-5 shadow-xs">
              <Award size={26} />
            </div>
            <h2 className="text-xl font-bold text-[#0F172A] dark:text-[#F8FAFC] mb-3">
              Giá trị Cốt lõi
            </h2>
            <p className="text-sm text-slate-600 dark:text-[#94A3B8] leading-relaxed">
              Chính trực — Tận tâm — Chất lượng — Minh bạch. Mỗi học viên tại CH Academy đều được theo dõi và hỗ trợ theo năng lực cá nhân để phát huy tối đa tiềm năng.
            </p>
          </div>
        </div>

        {/* Commitment */}
        <div className="bg-white dark:bg-[#111C31] p-8 sm:p-10 rounded-2xl border border-slate-200/80 dark:border-[#1E3152] shadow-xs transition-colors">
          <h2 className="text-2xl font-bold text-[#0F172A] dark:text-[#F8FAFC] mb-6">
            Cam kết Chất lượng Đào tạo
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm text-slate-700 dark:text-slate-300">
            <div className="flex gap-3">
              <CheckCircle size={20} className="text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#0F172A] dark:text-white">Lộ trình học tập rõ ràng:</strong> Giáo trình được chuẩn hóa theo tiêu chuẩn quốc tế và tinh chỉnh phù hợp với thực tế tại Việt Nam.
              </div>
            </div>
            <div className="flex gap-3">
              <CheckCircle size={20} className="text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#0F172A] dark:text-white">Báo cáo tiến độ minh bạch:</strong> Phụ huynh và học viên nắm bắt đầy đủ lịch học, kết quả điểm danh và đánh giá từ giáo viên.
              </div>
            </div>
            <div className="flex gap-3">
              <CheckCircle size={20} className="text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#0F172A] dark:text-white">Hỗ trợ liên tục:</strong> Đội ngũ chăm sóc và trợ giảng sẵn sàng giải đáp thắc mắc và hỗ trợ kèm bù khi học viên cần.
              </div>
            </div>
            <div className="flex gap-3">
              <CheckCircle size={20} className="text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#0F172A] dark:text-white">Cơ sở vật chất tiện nghi:</strong> Phòng học máy chiếu, điều hòa, trang thiết bị thực hành hiện đại phục vụ việc tiếp thu kiến thức.
              </div>
            </div>
          </div>
        </div>

        {/* CTA banner */}
        <div className="text-center bg-gradient-to-r from-[#0F243E] to-[#173557] text-white p-8 sm:p-12 rounded-3xl shadow-lg space-y-4">
          <h3 className="text-2xl font-bold">
            Sẵn sàng trải nghiệm môi trường học tập tại CH Academy?
          </h3>
          <p className="text-slate-300 max-w-xl mx-auto text-sm sm:text-base">
            Liên hệ ngay hôm nay để nhận thông tin ưu đãi và xếp lớp học thử miễn phí.
          </p>
          <div className="pt-2">
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#38BDF8] hover:bg-[#0284C7] text-[#0A0F1D] font-bold text-sm shadow-md hover-lift transition-all"
            >
              <span>Khám phá các khóa học</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  )
}
export default AboutPage

