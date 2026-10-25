import React, { useState } from 'react'
import { PublicNavbar } from '../../components/public/PublicNavbar'
import { PublicFooter } from '../../components/public/PublicFooter'
import { publicApi } from '../../api/public'
import { MapPin, Phone, Mail, Clock, Send, CheckCircle } from 'lucide-react'

export const ContactPage: React.FC = () => {
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!fullName.trim()) {
      setError('Vui lòng nhập họ và tên')
      return
    }
    const phoneRegex = /^(0[35789])[0-9]{8}$/
    if (!phoneRegex.test(phone.trim())) {
      setError('Số điện thoại không hợp lệ (yêu cầu 10 chữ số định dạng VN)')
      return
    }

    setSubmitting(true)
    try {
      await publicApi.submitLead({
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        notes: notes.trim() || undefined,
      })
      setSuccess(true)
      setFullName('')
      setPhone('')
      setEmail('')
      setNotes('')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra, vui lòng thử lại sau.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-[var(--bg-app)] min-h-screen flex flex-col text-[var(--text-main)] transition-colors duration-200">
      <PublicNavbar />

      {/* Header Banner */}
      <section className="bg-gradient-to-br from-[#0F243E] via-[#142B4A] to-[#1E3A63] text-white py-14 px-4 sm:px-6 text-center">
        <div className="max-w-3xl mx-auto space-y-3">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Liên hệ với CH Academy
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Bộ phận tuyển sinh và chăm sóc học viên luôn sẵn sàng giải đáp thắc mắc và hướng dẫn chi tiết thủ tục ghi danh.
          </p>
        </div>
      </section>

      <main className="max-w-6xl mx-auto my-12 px-4 sm:px-6 w-full box-border flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Contact Info */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white dark:bg-[#111C31] p-6 sm:p-8 rounded-2xl border border-slate-200/80 dark:border-[#1E3152] shadow-xs space-y-6 transition-colors">
              <h2 className="text-xl font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                Thông tin Trụ sở & Kênh liên lạc
              </h2>

              <div className="space-y-5 text-sm text-slate-700 dark:text-slate-300">
                <div className="flex gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#2563EB] dark:text-[#38BDF8] flex items-center justify-center shrink-0">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <strong className="block text-[#0F172A] dark:text-white">Địa chỉ trung tâm:</strong>
                    <div className="text-slate-500 dark:text-[#94A3B8] text-xs mt-0.5">
                      Khu vực điều hành CH Academy (Cập nhật bởi Ban Quản lý)
                    </div>
                  </div>
                </div>

                <div className="flex gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#2563EB] dark:text-[#38BDF8] flex items-center justify-center shrink-0">
                    <Phone size={20} />
                  </div>
                  <div>
                    <strong className="block text-[#0F172A] dark:text-white">Hotline Tuyển sinh & Hỗ trợ:</strong>
                    <div className="text-slate-500 dark:text-[#94A3B8] text-xs mt-0.5">0987 654 321 (08:00 - 21:00)</div>
                  </div>
                </div>

                <div className="flex gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#2563EB] dark:text-[#38BDF8] flex items-center justify-center shrink-0">
                    <Mail size={20} />
                  </div>
                  <div>
                    <strong className="block text-[#0F172A] dark:text-white">Hòm thư điện tử:</strong>
                    <div className="text-slate-500 dark:text-[#94A3B8] text-xs mt-0.5">contact@chacademy.edu.vn</div>
                  </div>
                </div>

                <div className="flex gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#2563EB] dark:text-[#38BDF8] flex items-center justify-center shrink-0">
                    <Clock size={20} />
                  </div>
                  <div>
                    <strong className="block text-[#0F172A] dark:text-white">Thời gian làm việc:</strong>
                    <div className="text-slate-500 dark:text-[#94A3B8] text-xs mt-0.5">
                      Thứ Hai — Chủ Nhật: 08:00 — 21:00
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50/70 dark:bg-blue-950/30 p-6 rounded-2xl border border-blue-200/80 dark:border-blue-900/50 text-[#1E40AF] dark:text-[#38BDF8]">
              <h3 className="text-base font-bold mb-2">Dành cho Phụ huynh & Học viên</h3>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                Quý khách có thể đến trực tiếp văn phòng trung tâm vào các khung giờ trên để tham quan phòng học, làm bài kiểm tra xếp lớp và nhận tài liệu lộ trình đào tạo.
              </p>
            </div>
          </div>

          {/* Right: Interactive Contact Form */}
          <div className="lg:col-span-7 bg-white dark:bg-[#111C31] p-6 sm:p-8 rounded-2xl border border-slate-200/80 dark:border-[#1E3152] shadow-xs transition-colors">
            <h2 className="text-xl font-bold text-[#0F172A] dark:text-[#F8FAFC] mb-1">
              Gửi tin nhắn hoặc Yêu cầu tư vấn
            </h2>
            <p className="text-slate-500 dark:text-[#94A3B8] text-sm mb-6">
              Điền biểu mẫu bên dưới, chúng tôi sẽ phản hồi trong thời gian sớm nhất.
            </p>

            {success ? (
              <div className="p-8 text-center bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl">
                <CheckCircle size={44} className="text-emerald-600 dark:text-emerald-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-emerald-800 dark:text-emerald-300 mb-2">
                  Gửi thông tin thành công!
                </h3>
                <p className="text-sm text-emerald-700 dark:text-emerald-400 mb-5">
                  Cảm ơn bạn đã liên hệ. Đội ngũ CH Academy sẽ phản hồi qua số điện thoại của bạn trong vòng 24 giờ.
                </p>
                <button
                  type="button"
                  onClick={() => setSuccess(false)}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors"
                >
                  Gửi thêm tin nhắn khác
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs sm:text-sm font-medium">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] mb-1.5">
                    Họ và tên của bạn <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn An"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-slate-50/50 dark:bg-[#1C293D] text-sm text-[#0F172A] dark:text-[#F8FAFC] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:focus:ring-[#38BDF8] transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] mb-1.5">
                    Số điện thoại liên hệ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="0987654321"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-slate-50/50 dark:bg-[#1C293D] text-sm text-[#0F172A] dark:text-[#F8FAFC] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:focus:ring-[#38BDF8] transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] mb-1.5">
                    Hòm thư Email
                  </label>
                  <input
                    type="email"
                    placeholder="example@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-slate-50/50 dark:bg-[#1C293D] text-sm text-[#0F172A] dark:text-[#F8FAFC] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:focus:ring-[#38BDF8] transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] mb-1.5">
                    Nội dung thắc mắc / Yêu cầu
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Nội dung bạn muốn trao đổi cùng trung tâm..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-slate-50/50 dark:bg-[#1C293D] text-sm text-[#0F172A] dark:text-[#F8FAFC] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:focus:ring-[#38BDF8] transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 px-6 rounded-xl bg-[#0F243E] dark:bg-[#38BDF8] hover:bg-[#173557] dark:hover:bg-[#0284C7] text-white dark:text-[#0B1220] font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Send size={16} />
                  <span>{submitting ? 'Đang gửi...' : 'Gửi thông tin liên hệ'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  )
}
export default ContactPage

