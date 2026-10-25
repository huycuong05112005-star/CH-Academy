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
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <PublicNavbar />

      <section style={{ backgroundColor: '#142B4A', color: '#ffffff', padding: '3.5rem 1.5rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, margin: '0 0 0.75rem 0' }}>
            Liên hệ với CH Academy
          </h1>
          <p style={{ color: '#cbd5e1', fontSize: '1rem', margin: 0, lineHeight: 1.6 }}>
            Bộ phận tuyển sinh và chăm sóc học viên luôn sẵn sàng giải đáp thắc mắc và hướng dẫn chi tiết thủ tục ghi danh.
          </p>
        </div>
      </section>

      <main style={{ maxWidth: '1100px', margin: '3.5rem auto', padding: '0 1.5rem', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem' }}>
          {/* Left: Contact Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ backgroundColor: '#ffffff', padding: '2rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#142B4A', margin: '0 0 1.25rem 0' }}>
                Thông tin Trụ sở & Kênh liên lạc
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontSize: '0.95rem', color: '#334155' }}>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <MapPin size={22} color="#2563eb" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>Địa chỉ trung tâm:</strong>
                    <div style={{ color: '#64748b', marginTop: '0.2rem' }}>
                      Khu vực điều hành CH Academy (Cập nhật bởi Ban Quản lý)
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <Phone size={22} color="#2563eb" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>Hotline Tuyển sinh & Hỗ trợ:</strong>
                    <div style={{ color: '#64748b', marginTop: '0.2rem' }}>0987 654 321 (08:00 - 21:00)</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <Mail size={22} color="#2563eb" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>Hòm thư điện tử:</strong>
                    <div style={{ color: '#64748b', marginTop: '0.2rem' }}>contact@chacademy.edu.vn</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <Clock size={22} color="#2563eb" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>Thời gian làm việc:</strong>
                    <div style={{ color: '#64748b', marginTop: '0.2rem' }}>
                      Thứ Hai — Chủ Nhật: 08:00 — 21:00
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: '#eff6ff', padding: '1.75rem', borderRadius: '12px', border: '1px solid #bfdbfe', color: '#1e40af' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Dành cho Phụ huynh & Học viên</h3>
              <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.5 }}>
                Quý khách có thể đến trực tiếp văn phòng trung tâm vào các khung giờ trên để tham quan phòng học, làm bài kiểm tra xếp lớp và nhận tài liệu lộ trình đào tạo.
              </p>
            </div>
          </div>

          {/* Right: Interactive Contact Form */}
          <div style={{ backgroundColor: '#ffffff', padding: '2rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#142B4A', margin: '0 0 0.5rem 0' }}>
              Gửi tin nhắn hoặc Yêu cầu tư vấn
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0 0 1.5rem 0' }}>
              Điền biểu mẫu bên dưới, chúng tôi sẽ phản hồi trong thời gian sớm nhất.
            </p>

            {success ? (
              <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px' }}>
                <CheckCircle size={44} color="#16a34a" style={{ margin: '0 auto 0.75rem auto' }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#166534', margin: '0 0 0.5rem 0' }}>
                  Gửi thông tin thành công!
                </h3>
                <p style={{ color: '#15803d', fontSize: '0.9rem', margin: '0 0 1.25rem 0' }}>
                  Cảm ơn bạn đã liên hệ. Đội ngũ CH Academy sẽ phản hồi qua số điện thoại của bạn trong vòng 24 giờ.
                </p>
                <button
                  type="button"
                  onClick={() => setSuccess(false)}
                  style={{ padding: '0.5rem 1.25rem', borderRadius: '6px', backgroundColor: '#166534', color: '#ffffff', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                >
                  Gửi thêm tin nhắn khác
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                {error && (
                  <div style={{ padding: '0.65rem 0.85rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: '8px', fontSize: '0.85rem' }}>
                    {error}
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Họ và tên của bạn <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn An"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Số điện thoại liên hệ <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="0987654321"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Hòm thư Email
                  </label>
                  <input
                    type="email"
                    placeholder="example@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Nội dung thắc mắc / Yêu cầu
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Nội dung bạn muốn trao đổi cùng trung tâm..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', fontFamily: 'inherit', boxSizing: 'border-box' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '0.8rem 1.5rem',
                    borderRadius: '8px',
                    backgroundColor: '#142B4A',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    border: 'none',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    marginTop: '0.5rem'
                  }}
                >
                  <Send size={16} />
                  {submitting ? 'Đang gửi...' : 'Gửi thông tin liên hệ'}
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
