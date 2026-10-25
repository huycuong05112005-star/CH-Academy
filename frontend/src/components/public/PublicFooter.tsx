import React from 'react'
import { Link } from 'react-router-dom'
import { GraduationCap, Mail, Phone, MapPin, Clock } from 'lucide-react'
import { useSettings } from '../../context/SettingsContext'

export const PublicFooter: React.FC = () => {
  const { settings } = useSettings()

  return (
    <footer className="bg-[#0B1526] text-slate-300 pt-14 pb-8 border-t border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand Col */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-white text-[#0F243E] flex items-center justify-center shadow-sm">
                <GraduationCap size={22} />
              </div>
              <div className="text-xl font-extrabold text-white tracking-tight uppercase">
                {settings.shortName}
              </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Hệ thống trung tâm giáo dục đào tạo đa lĩnh vực dành cho trẻ em và người lớn. Cam kết chất lượng đào tạo thực tiễn và chuẩn hóa chuẩn đầu ra.
            </p>
            <div className="text-xs text-slate-500 font-medium">
              Phiên bản hệ thống: 0.0.1-SNAPSHOT
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Khám phá
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/courses" className="text-slate-400 hover:text-white transition-colors">Chương trình khóa học</Link></li>
              <li><Link to="/about" className="text-slate-400 hover:text-white transition-colors">Về chúng tôi & Tầm nhìn</Link></li>
              <li><Link to="/contact" className="text-slate-400 hover:text-white transition-colors">Liên hệ & Địa điểm</Link></li>
              <li><Link to="/login" className="text-slate-400 hover:text-white transition-colors">Cổng thông tin Quản trị</Link></li>
            </ul>
          </div>

          {/* Legal / Policy */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Quy định & Chính sách
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/terms" className="text-slate-400 hover:text-white transition-colors">Điều khoản sử dụng dịch vụ</Link></li>
              <li><Link to="/privacy" className="text-slate-400 hover:text-white transition-colors">Chính sách bảo vệ quyền riêng tư</Link></li>
              <li><span className="text-slate-500">Chính sách hoàn phí & bảo lưu</span></li>
              <li><span className="text-slate-500">Quy chuẩn lớp học & điểm danh</span></li>
            </ul>
          </div>

          {/* Contact info */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Thông tin liên hệ
            </h4>
            <div className="space-y-3 text-sm text-slate-400">
              <div className="flex items-start gap-2.5">
                <MapPin size={18} className="text-[#38BDF8] shrink-0 mt-0.5" />
                <span>Trụ sở chính: {settings.address}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone size={18} className="text-[#38BDF8] shrink-0" />
                <span>Hotline: {settings.hotline}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail size={18} className="text-[#38BDF8] shrink-0" />
                <span>Email: {settings.email}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock size={18} className="text-[#38BDF8] shrink-0" />
                <span>Giờ làm việc: 08:00 - 21:00 (Hàng ngày)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800/80 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} {settings.shortName}. Tất cả quyền được bảo lưu. Múi giờ hệ thống: {settings.timezone || 'Asia/Ho_Chi_Minh'}.
          </div>
          <div>
            Nền tảng vận hành giáo dục chuyên nghiệp
          </div>
        </div>
      </div>
    </footer>
  )
}
export default PublicFooter

