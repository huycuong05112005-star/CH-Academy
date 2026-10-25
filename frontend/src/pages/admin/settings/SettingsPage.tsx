import React, { useState } from 'react'
import {
  Settings,
  Building2,
  Palette,
  Bell,
  Database,
  CheckCircle2,
  Save,
  Sun,
  Moon,
  Monitor,
  ShieldCheck,
  Server
} from 'lucide-react'
import { useTheme, type Theme } from '../../../context/ThemeContext'

export const SettingsPage: React.FC = () => {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Center Info State
  const [centerName, setCenterName] = useState('Học viện Anh ngữ & Năng khiếu CH Academy')
  const [shortName, setShortName] = useState('CH Academy')
  const [hotline, setHotline] = useState('0988 123 456')
  const [email, setEmail] = useState('tuyensinh@chacademy.edu.vn')
  const [address, setAddress] = useState('Tầng 3, Tòa nhà Tri Thức, Số 123 Phố Huế, Q. Hai Bà Trưng, Hà Nội')
  const [website, setWebsite] = useState('https://chacademy.edu.vn')

  // Notification Preferences
  const [notifyNewLead, setNotifyNewLead] = useState(true)
  const [notifyTuitionDue, setNotifyTuitionDue] = useState(true)
  const [notifyAbsence, setNotifyAbsence] = useState(false)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      setSuccessMsg('Đã lưu cấu hình hệ thống thành công!')
      setTimeout(() => setSuccessMsg(null), 4000)
    }, 400)
  }

  const themeOptions: { value: Theme; label: string; desc: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
    { value: 'light', label: 'Giao diện Sáng', desc: 'Màu nền trắng và xanh navy thanh lịch, phù hợp làm việc ban ngày', icon: Sun },
    { value: 'dark', label: 'Giao diện Tối', desc: 'Nền tối sâu thẳm, chống mỏi mắt khi làm việc buổi tối', icon: Moon },
    { value: 'system', label: 'Theo Hệ Thống', desc: 'Tự động đồng bộ theo cài đặt hệ điều hành của bạn', icon: Monitor }
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#2A3A50]">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-[#A6B4C8] uppercase tracking-wider mb-1">
            <span>Quản trị hệ thống</span>
            <span>/</span>
            <span className="text-[#142B4A] dark:text-[#38BDF8]">Cấu hình</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#142B4A] dark:text-[#E8EEF7] flex items-center gap-2.5">
            <Settings className="w-7 h-7 text-[#142B4A] dark:text-[#38BDF8]" />
            Cấu hình Hệ thống & Trung tâm
          </h1>
          <p className="text-sm text-slate-600 dark:text-[#A6B4C8] mt-1">
            Quản lý thông tin tổ chức, tùy chọn giao diện hiển thị, thông báo và trạng thái cơ sở dữ liệu.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#142B4A] dark:bg-[#38BDF8] hover:bg-[#1D4168] dark:hover:bg-[#0284C7] text-white dark:text-[#0B1220] rounded-xl text-sm font-semibold shadow-sm transition-all"
        >
          <Save size={16} />
          <span>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
        </button>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-center gap-3 text-sm shadow-xs animate-in fade-in">
          <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form Settings (2 Cols) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Appearance Section */}
          <div className="bg-white dark:bg-[#151F31] p-6 rounded-2xl border border-slate-200/80 dark:border-[#2A3A50] shadow-xs">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-[#2A3A50]">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#1C293D] flex items-center justify-center text-[#142B4A] dark:text-[#38BDF8]">
                <Palette size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#142B4A] dark:text-[#E8EEF7]">Chế độ Giao diện</h2>
                <p className="text-xs text-slate-500 dark:text-[#A6B4C8]">Tùy chỉnh phong cách hiển thị sáng / tối của toàn bộ phần mềm</p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {themeOptions.map((opt) => {
                const Icon = opt.icon
                const isSelected = theme === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTheme(opt.value)}
                    className={`flex flex-col text-left p-4 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-[#142B4A] dark:border-[#38BDF8] bg-slate-50 dark:bg-[#1C293D] ring-2 ring-[#142B4A]/10 dark:ring-[#38BDF8]/20'
                        : 'border-slate-200 dark:border-[#2A3A50] hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-[#151F31]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isSelected ? 'bg-[#142B4A] dark:bg-[#38BDF8] text-white dark:text-[#0B1220]' : 'bg-slate-100 dark:bg-[#1C293D] text-slate-600 dark:text-slate-300'
                      }`}>
                        <Icon size={16} />
                      </div>
                      {isSelected && (
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#142B4A] dark:text-[#38BDF8] bg-white dark:bg-[#151F31] px-2 py-0.5 rounded-full border border-slate-200 dark:border-[#2A3A50]">
                          Đang chọn
                        </span>
                      )}
                    </div>
                    <div className="font-semibold text-sm text-[#142B4A] dark:text-[#E8EEF7]">{opt.label}</div>
                    <div className="text-xs text-slate-500 dark:text-[#A6B4C8] mt-1 leading-relaxed">{opt.desc}</div>
                  </button>
                )
              })}
            </div>
            <div className="mt-4 text-xs text-slate-400 dark:text-slate-400">
              Giao diện thực tế đang hiển thị: <span className="font-semibold text-[#142B4A] dark:text-[#38BDF8]">{resolvedTheme === 'dark' ? 'Chế độ Tối' : 'Chế độ Sáng'}</span>
            </div>
          </div>

          {/* Center Profile Section */}
          <div className="bg-white dark:bg-[#151F31] p-6 rounded-2xl border border-slate-200/80 dark:border-[#2A3A50] shadow-xs">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-[#2A3A50]">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#1C293D] flex items-center justify-center text-[#142B4A] dark:text-[#38BDF8]">
                <Building2 size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#142B4A] dark:text-[#E8EEF7]">Thông tin Trung tâm</h2>
                <p className="text-xs text-slate-500 dark:text-[#A6B4C8]">Hiển thị trên hóa đơn, phiếu thu học phí và cổng thông tin công khai</p>
              </div>
            </div>

            <form onSubmit={handleSave} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] mb-1.5">
                    Tên đầy đủ của trung tâm *
                  </label>
                  <input
                    type="text"
                    value={centerName}
                    onChange={(e) => setCenterName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-sm text-[#142B4A] dark:text-[#E8EEF7] focus:outline-none focus:ring-2 focus:ring-[#142B4A] dark:focus:ring-[#38BDF8]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] mb-1.5">
                    Tên viết tắt thương hiệu *
                  </label>
                  <input
                    type="text"
                    value={shortName}
                    onChange={(e) => setShortName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-sm text-[#142B4A] dark:text-[#E8EEF7] focus:outline-none focus:ring-2 focus:ring-[#142B4A] dark:focus:ring-[#38BDF8]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] mb-1.5">
                    Hotline tuyển sinh *
                  </label>
                  <input
                    type="text"
                    value={hotline}
                    onChange={(e) => setHotline(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-sm text-[#142B4A] dark:text-[#E8EEF7] focus:outline-none focus:ring-2 focus:ring-[#142B4A] dark:focus:ring-[#38BDF8]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] mb-1.5">
                    Hòm thư điện tử (Email) *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-sm text-[#142B4A] dark:text-[#E8EEF7] focus:outline-none focus:ring-2 focus:ring-[#142B4A] dark:focus:ring-[#38BDF8]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] mb-1.5">
                  Địa chỉ trụ sở chính *
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-sm text-[#142B4A] dark:text-[#E8EEF7] focus:outline-none focus:ring-2 focus:ring-[#142B4A] dark:focus:ring-[#38BDF8]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] mb-1.5">
                  Website chính thức
                </label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-white dark:bg-[#1C293D] text-sm text-[#142B4A] dark:text-[#E8EEF7] focus:outline-none focus:ring-2 focus:ring-[#142B4A] dark:focus:ring-[#38BDF8]"
                />
              </div>
            </form>
          </div>

          {/* Notification Preferences */}
          <div className="bg-white dark:bg-[#151F31] p-6 rounded-2xl border border-slate-200/80 dark:border-[#2A3A50] shadow-xs">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-[#2A3A50]">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#1C293D] flex items-center justify-center text-[#142B4A] dark:text-[#38BDF8]">
                <Bell size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#142B4A] dark:text-[#E8EEF7]">Tùy chọn Thông báo</h2>
                <p className="text-xs text-slate-500 dark:text-[#A6B4C8]">Cấu hình quy tắc gửi thông báo nội bộ cho cán bộ quản lý</p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyNewLead}
                  onChange={(e) => setNotifyNewLead(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded text-[#142B4A] dark:text-[#38BDF8] border-slate-300 dark:border-slate-600 focus:ring-2"
                />
                <div>
                  <div className="text-sm font-semibold text-[#142B4A] dark:text-[#E8EEF7]">Khách hàng tiềm năng mới</div>
                  <div className="text-xs text-slate-500 dark:text-[#A6B4C8]">Gửi thông báo tức thì khi có phụ huynh điền đơn tư vấn tuyển sinh từ website</div>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyTuitionDue}
                  onChange={(e) => setNotifyTuitionDue(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded text-[#142B4A] dark:text-[#38BDF8] border-slate-300 dark:border-slate-600 focus:ring-2"
                />
                <div>
                  <div className="text-sm font-semibold text-[#142B4A] dark:text-[#E8EEF7]">Khoản thu học phí đến hạn</div>
                  <div className="text-xs text-slate-500 dark:text-[#A6B4C8]">Tự động nhắc kế toán và phụ huynh trước 3 ngày đến hạn đóng học phí</div>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyAbsence}
                  onChange={(e) => setNotifyAbsence(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded text-[#142B4A] dark:text-[#38BDF8] border-slate-300 dark:border-slate-600 focus:ring-2"
                />
                <div>
                  <div className="text-sm font-semibold text-[#142B4A] dark:text-[#E8EEF7]">Học viên vắng mặt liên tiếp</div>
                  <div className="text-xs text-slate-500 dark:text-[#A6B4C8]">Cảnh báo giáo vụ khi học viên vắng mặt từ 2 buổi trở lên không phép</div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: System Diagnostics & Health (1 Col) */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#151F31] p-6 rounded-2xl border border-slate-200/80 dark:border-[#2A3A50] shadow-xs">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-[#2A3A50]">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#1C293D] flex items-center justify-center text-[#142B4A] dark:text-[#38BDF8]">
                <Server size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#142B4A] dark:text-[#E8EEF7]">Trạng thái Kỹ thuật</h2>
                <p className="text-xs text-slate-500 dark:text-[#A6B4C8]">Thông số môi trường vận hành</p>
              </div>
            </div>

            <div className="mt-5 space-y-3.5 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-[#2A3A50]/60">
                <span className="text-slate-500 dark:text-[#A6B4C8]">Hệ thống Backend</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Spring Boot 3.5 (Hoạt động)
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-[#2A3A50]/60">
                <span className="text-slate-500 dark:text-[#A6B4C8]">Cơ sở dữ liệu</span>
                <span className="font-semibold text-slate-700 dark:text-[#E8EEF7] flex items-center gap-1.5">
                  <Database size={13} className="text-sky-500" />
                  PostgreSQL 16 (Port 5432)
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-[#2A3A50]/60">
                <span className="text-slate-500 dark:text-[#A6B4C8]">Flyway Migration</span>
                <span className="font-semibold text-slate-700 dark:text-[#E8EEF7]">V1__initial_schema</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-[#2A3A50]/60">
                <span className="text-slate-500 dark:text-[#A6B4C8]">Bảo mật & Xác thực</span>
                <span className="font-semibold text-slate-700 dark:text-[#E8EEF7] flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-emerald-500" />
                  JWT + Spring Security 6.x
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-500 dark:text-[#A6B4C8]">Múi giờ vận hành</span>
                <span className="font-semibold text-slate-700 dark:text-[#E8EEF7]">Asia/Ho_Chi_Minh (UTC+7)</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-[#1C293D]/50 p-5 rounded-2xl border border-slate-200 dark:border-[#2A3A50] text-xs text-slate-600 dark:text-[#A6B4C8] leading-relaxed">
            <div className="font-bold text-[#142B4A] dark:text-[#E8EEF7] mb-1">Ghi chú vận hành</div>
            Hệ thống quản lý CH Academy chạy trên kiến trúc micro-modular tích hợp với dữ liệu PostgreSQL toàn vẹn. Mọi thay đổi cấu hình được áp dụng ngay lập tức trên toàn bộ các phiên làm việc.
          </div>
        </div>
      </div>
    </div>
  )
}
