import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { PublicNavbar } from '../../components/public/PublicNavbar'
import { PublicFooter } from '../../components/public/PublicFooter'
import { publicApi } from '../../api/public'
import { healthApi, type HealthResponse } from '../../api/client'
import type { Course } from '../../types/course'
import {
  BookOpen,
  Users,
  CreditCard,
  CheckCircle,
  HelpCircle,
  Send,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Clock,
  RefreshCw,
  AlertTriangle
} from 'lucide-react'

// ----- Health Status Type -----
type HealthStatus = 'idle' | 'loading' | 'success' | 'error'

export const LandingPage: React.FC = () => {
  const [featuredCourses, setFeaturedCourses] = useState<Course[]>([])
  const [loadingCourses, setLoadingCourses] = useState<boolean>(true)

  // Health check state
  const [healthStatus, setHealthStatus] = useState<HealthStatus>('idle')
  const [healthData, setHealthData] = useState<HealthResponse | null>(null)
  const [healthError, setHealthError] = useState<string | null>(null)

  // Form state
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [targetCourseId, setTargetCourseId] = useState<number | undefined>(undefined)
  const [notes, setNotes] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('') // Honeypot
  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // FAQ state
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0)

  const checkHealth = useCallback(async () => {
    setHealthStatus('loading')
    setHealthError(null)
    try {
      const result = await healthApi.check()
      setHealthData(result)
      setHealthStatus('success')
    } catch (err: unknown) {
      setHealthError(err instanceof Error ? err.message : 'Không thể kết nối đến backend')
      setHealthStatus('error')
    }
  }, [])

  useEffect(() => {
    checkHealth()
  }, [checkHealth])

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const courses = await publicApi.getFeaturedCourses()
        setFeaturedCourses(courses || [])
      } catch {
        // Fallback
      } finally {
        setLoadingCourses(false)
      }
    }
    fetchFeatured()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!fullName.trim()) {
      setFormError('Vui lòng nhập họ và tên của bạn')
      return
    }
    const phoneRegex = /^(0[35789])[0-9]{8}$/
    if (!phoneRegex.test(phone.trim())) {
      setFormError('Số điện thoại không hợp lệ (yêu cầu 10 chữ số định dạng Việt Nam)')
      return
    }

    setSubmitting(true)
    try {
      await publicApi.submitLead({
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        targetCourseId,
        notes: notes.trim() || undefined,
        websiteUrl: websiteUrl || undefined,
      })
      setSubmitSuccess(true)
      setFullName('')
      setPhone('')
      setEmail('')
      setNotes('')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Có lỗi xảy ra khi gửi thông tin, vui lòng thử lại sau.'
      setFormError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const formatVND = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0)
  }

  const statusLabel = {
    idle: 'Đang kiểm tra...',
    loading: 'Đang kết nối đến backend...',
    success: 'Hoạt động bình thường',
    error: 'Không thể kết nối đến backend',
  }[healthStatus]

  const faqs = [
    {
      q: 'CH Academy nhận đào tạo những đối tượng học viên nào?',
      a: 'CH Academy tổ chức đa dạng các chương trình đào tạo cho cả trẻ em (tiểu học, THCS) và người trưởng thành (sinh viên, người đi làm) với giáo trình được tối ưu hóa theo từng nhóm độ tuổi.'
    },
    {
      q: 'Làm thế nào để học viên đăng ký và xếp lớp học phù hợp?',
      a: 'Phụ huynh và học viên có thể gửi thông tin qua mẫu đăng ký tư vấn. Chuyên viên đào tạo của trung tâm sẽ liên hệ, đánh giá năng lực đầu vào và tư vấn lộ trình học phù hợp nhất.'
    },
    {
      q: 'Hình thức học tại trung tâm như thế nào?',
      a: 'Trung tâm triển khai các lớp học trực tiếp tại phòng học hiện đại của cơ sở đào tạo, đồng thời có hỗ trợ tài liệu và bài tập tương tác trên hệ thống quản lý học tập số.'
    },
    {
      q: 'Chính sách hoàn phí hoặc bảo lưu khóa học được quy định ra sao?',
      a: 'CH Academy có quy định rõ ràng về quyền lợi bảo lưu và điều chỉnh lịch học. Mọi yêu cầu được ghi nhận vào hệ thống quản lý và xử lý minh bạch theo đúng quy chuẩn trung tâm.'
    }
  ]

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <PublicNavbar />

      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #142B4A 0%, #1e3a63 100%)',
        color: '#ffffff',
        padding: '4.5rem 1.5rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3rem', alignItems: 'center' }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.35rem 0.85rem',
              borderRadius: '20px',
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: '#38bdf8',
              marginBottom: '1.25rem'
            }}>
              <Sparkles size={16} /> Tuyển sinh các khóa học chất lượng cao
            </div>

            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1.25, margin: '0 0 1.25rem 0' }}>
              Kiến tạo Tri thức — Vững bước Tương lai cùng <span style={{ color: '#38bdf8' }}>CH Academy</span>
            </h1>

            <p style={{ fontSize: '1.05rem', color: '#cbd5e1', lineHeight: 1.6, margin: '0 0 2rem 0' }}>
              Môi trường học tập chuyên nghiệp với phương pháp giảng dạy hiện đại, đội ngũ giáo viên tận tâm và hệ thống quản trị đào tạo minh bạch, chuẩn hóa.
            </p>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <a
                href="#tu-van"
                style={{
                  padding: '0.85rem 1.75rem',
                  borderRadius: '8px',
                  backgroundColor: '#38bdf8',
                  color: '#0f172a',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  textDecoration: 'none',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)'
                }}
              >
                Đăng ký tư vấn miễn phí
              </a>
              <Link
                to="/courses"
                style={{
                  padding: '0.85rem 1.75rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  textDecoration: 'none'
                }}
              >
                Khám phá khóa học
              </Link>
            </div>

            {/* Quick trust metrics */}
            <div style={{ display: 'flex', gap: '2rem', marginTop: '2.5rem', borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '1.5rem' }}>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#38bdf8' }}>100%</div>
                <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>Giáo trình chuẩn hóa</div>
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#38bdf8' }}>Đa dạng</div>
                <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>Trẻ em & Người lớn</div>
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#38bdf8' }}>Minh bạch</div>
                <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>Theo dõi học tập 24/7</div>
              </div>
            </div>
          </div>

          {/* Hero right visual */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '16px',
            padding: '2rem',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 1.25rem 0', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={20} color="#38bdf8" /> Vì sao chọn CH Academy?
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.95rem', color: '#e2e8f0' }}>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <CheckCircle size={18} color="#4ade80" style={{ flexShrink: 0, marginTop: '3px' }} />
                <span><strong>Đội ngũ chuyên môn cao:</strong> Giáo viên giàu kinh nghiệm, phương pháp sư phạm tương tác cao.</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <CheckCircle size={18} color="#4ade80" style={{ flexShrink: 0, marginTop: '3px' }} />
                <span><strong>Quy mô lớp học tinh gọn:</strong> Giới hạn sĩ số giúp giáo viên sâu sát đến từng học viên.</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <CheckCircle size={18} color="#4ade80" style={{ flexShrink: 0, marginTop: '3px' }} />
                <span><strong>Sổ liên lạc điện tử:</strong> Điểm danh, chuyên cần và tiến độ cập nhật tức thời cho phụ huynh.</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <CheckCircle size={18} color="#4ade80" style={{ flexShrink: 0, marginTop: '3px' }} />
                <span><strong>Chính sách linh hoạt:</strong> Biểu phí rõ ràng, hỗ trợ xếp lịch học và học bù chu đáo.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section style={{ backgroundColor: '#ffffff', padding: '4.5rem 1.5rem', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Năng lực vận hành
            </span>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#142B4A', margin: '0.5rem 0 0.75rem 0' }}>
              Mọi thứ bạn cần để vận hành trung tâm
            </h2>
            <p style={{ color: '#64748b', fontSize: '1rem', maxWidth: '650px', margin: '0 auto' }}>
              Được thiết kế từ đầu để phục vụ cả chương trình cho trẻ em và người lớn
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.75rem' }}>
            <div style={{ padding: '1.75rem', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <BookOpen size={22} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#142B4A', margin: '0 0 0.5rem 0' }}>Quản lý Khóa học</h3>
              <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                Tổ chức chương trình học đa dạng cho cả trẻ em và người lớn với lộ trình rõ ràng, chuẩn hóa chuẩn đầu ra.
              </p>
            </div>

            <div style={{ padding: '1.75rem', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <Users size={22} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#142B4A', margin: '0 0 0.5rem 0' }}>Hồ sơ Học sinh</h3>
              <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                Theo dõi tiến độ, điểm danh, kết quả học tập và thông tin người giám hộ tập trung, bảo mật cao.
              </p>
            </div>

            <div style={{ padding: '1.75rem', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <CreditCard size={22} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#142B4A', margin: '0 0 0.5rem 0' }}>Quản lý Học phí</h3>
              <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                Theo dõi thu học phí, ghi nhận thanh toán nhiều đợt, công nợ tự động và hoàn phí theo đúng quy định.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Courses Section */}
      <section style={{ padding: '4.5rem 1.5rem', maxWidth: '1200px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Chương trình tiêu biểu
          </span>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#142B4A', margin: '0.5rem 0 0.75rem 0' }}>
            Khóa học Nổi bật tại CH Academy
          </h2>
          <p style={{ color: '#64748b', fontSize: '1rem', maxWidth: '650px', margin: '0 auto' }}>
            Các chương trình đào tạo được thiết kế bài bản, chú trọng tính thực tiễn và phát triển kỹ năng toàn diện cho học viên.
          </p>
        </div>

        {loadingCourses ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            Đang tải danh sách khóa học...
          </div>
        ) : featuredCourses.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.75rem' }}>
            {featuredCourses.map((c) => (
              <div
                key={c.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{
                      padding: '0.25rem 0.65rem',
                      borderRadius: '6px',
                      backgroundColor: c.targetAudience === 'KIDS' ? '#fef3c7' : c.targetAudience === 'ADULTS' ? '#e0e7ff' : '#f1f5f9',
                      color: c.targetAudience === 'KIDS' ? '#92400e' : c.targetAudience === 'ADULTS' ? '#3730a3' : '#475569',
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}>
                      {c.targetAudience === 'KIDS' ? 'Trẻ em' : c.targetAudience === 'ADULTS' ? 'Người lớn' : 'Mọi lứa tuổi'}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock size={14} /> {c.durationHours} giờ
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#142B4A', margin: '0 0 0.5rem 0' }}>
                    {c.name}
                  </h3>

                  <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.5, margin: '0 0 1rem 0' }}>
                    {c.description || 'Chương trình đào tạo chuyên sâu với lộ trình chuẩn mực.'}
                  </p>
                </div>

                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Học phí niêm yết</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#142B4A' }}>
                      {formatVND(c.defaultTuitionFee)}
                    </div>
                  </div>
                  <a
                    href="#tu-van"
                    onClick={() => setTargetCourseId(c.id)}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      backgroundColor: '#142B4A',
                      color: '#ffffff',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      textDecoration: 'none'
                    }}
                  >
                    Đăng ký tư vấn
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '2.5rem',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            color: '#64748b'
          }}>
            <BookOpen size={36} style={{ margin: '0 auto 0.75rem auto', opacity: 0.5 }} />
            <p style={{ margin: 0, fontWeight: 600 }}>Hiện trung tâm đang cập nhật danh mục khóa học mới</p>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem' }}>Vui lòng đăng ký form tư vấn để nhận thông tin chi tiết</p>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
          <Link
            to="/courses"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: '#142B4A',
              fontWeight: 700,
              fontSize: '1rem',
              textDecoration: 'none'
            }}
          >
            Xem toàn bộ danh mục khóa học <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* 4-Step Registration Process */}
      <section style={{ backgroundColor: '#ffffff', padding: '4.5rem 1.5rem', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Quy trình nhập học
            </span>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#142B4A', margin: '0.5rem 0 0.75rem 0' }}>
              4 Bước Đơn giản để Bắt đầu Khóa học
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.75rem' }}>
            <div style={{ padding: '1.5rem', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#142B4A', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, marginBottom: '1rem' }}>
                1
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#142B4A', margin: '0 0 0.5rem 0' }}>Đăng ký tư vấn</h3>
              <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
                Điền thông tin và khóa học bạn quan tâm qua form đăng ký trên website.
              </p>
            </div>

            <div style={{ padding: '1.5rem', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#142B4A', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, marginBottom: '1rem' }}>
                2
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#142B4A', margin: '0 0 0.5rem 0' }}>Tư vấn & Kiểm tra</h3>
              <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
                Chuyên viên đào tạo liên hệ tư vấn chi tiết và sắp xếp lịch kiểm tra trình độ.
              </p>
            </div>

            <div style={{ padding: '1.5rem', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#142B4A', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, marginBottom: '1rem' }}>
                3
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#142B4A', margin: '0 0 0.5rem 0' }}>Xếp lớp & Hoàn tất</h3>
              <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
                Chọn lịch học phù hợp, ghi nhận hồ sơ học viên và hoàn tất thủ tục học phí.
              </p>
            </div>

            <div style={{ padding: '1.5rem', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#142B4A', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, marginBottom: '1rem' }}>
                4
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#142B4A', margin: '0 0 0.5rem 0' }}>Bắt đầu Khóa học</h3>
              <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
                Tham gia lớp học cùng giảng viên, theo dõi tiến độ và nhận phản hồi định kỳ.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Consultation Form Section */}
      <section id="tu-van" style={{ padding: '4.5rem 1.5rem', maxWidth: '900px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
          padding: '2.5rem',
        }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase' }}>
              Liên hệ trực tiếp
            </span>
            <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#142B4A', margin: '0.5rem 0 0.5rem 0' }}>
              Đăng ký Nhận Tư vấn & Lộ trình Học
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>
              Để lại thông tin, đội ngũ tuyển sinh CH Academy sẽ liên hệ hỗ trợ bạn trong vòng 24 giờ.
            </p>
          </div>

          {submitSuccess ? (
            <div style={{
              padding: '2rem',
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <CheckCircle size={48} color="#16a34a" style={{ margin: '0 auto 0.75rem auto' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#166534', margin: '0 0 0.5rem 0' }}>
                Đăng ký tư vấn thành công!
              </h3>
              <p style={{ color: '#15803d', margin: '0 0 1.25rem 0' }}>
                Cảm ơn bạn đã quan tâm đến chương trình đào tạo tại CH Academy. Chúng tôi sẽ sớm liên hệ theo số điện thoại bạn đã cung cấp.
              </p>
              <button
                type="button"
                onClick={() => setSubmitSuccess(false)}
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: '6px',
                  backgroundColor: '#166534',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Gửi thêm yêu cầu
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {formError && (
                <div style={{ padding: '0.75rem 1rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: '8px', fontSize: '0.875rem' }}>
                  {formError}
                </div>
              )}

              {/* Honeypot field (hidden from real users) */}
              <input
                type="text"
                name="websiteUrl"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                style={{ display: 'none' }}
                tabIndex={-1}
                autoComplete="off"
              />

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                    Họ và tên học viên / phụ huynh <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Nguyễn Văn An"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.95rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                    Số điện thoại liên hệ <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Ví dụ: 0987654321"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.95rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                    Địa chỉ Email (tùy chọn)
                  </label>
                  <input
                    type="email"
                    placeholder="example@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.95rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                    Khóa học quan tâm
                  </label>
                  <select
                    value={targetCourseId || ''}
                    onChange={(e) => setTargetCourseId(e.target.value ? Number(e.target.value) : undefined)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.95rem',
                      backgroundColor: '#ffffff',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="">-- Chọn khóa học muốn tìm hiểu --</option>
                    {featuredCourses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({formatVND(c.defaultTuitionFee)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                  Nhu cầu tư vấn cụ thể / Ghi chú thêm
                </label>
                <textarea
                  rows={3}
                  placeholder="Ghi rõ thời gian có thể học hoặc độ tuổi của học viên..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.95rem',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: '0.85rem 1.75rem',
                  borderRadius: '8px',
                  backgroundColor: '#142B4A',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '1rem',
                  border: 'none',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  opacity: submitting ? 0.7 : 1,
                  boxShadow: '0 4px 6px rgba(20, 43, 74, 0.2)'
                }}
              >
                <Send size={18} />
                {submitting ? 'Đang gửi thông tin...' : 'Gửi đăng ký tư vấn ngay'}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* System Health Section */}
      <section style={{ backgroundColor: '#ffffff', padding: '3.5rem 1.5rem', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: '850px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#142B4A', margin: '0 0 0.5rem 0' }}>
            Trạng thái Hệ thống
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Kết nối đến backend Spring Boot tại <code>{import.meta.env.VITE_API_BASE_URL || 'http://localhost:8088/api/v1'}</code>
          </p>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1.5rem',
            borderRadius: '10px',
            backgroundColor: healthStatus === 'success' ? '#f0fdf4' : healthStatus === 'loading' ? '#f8fafc' : '#fef2f2',
            border: `1px solid ${healthStatus === 'success' ? '#bbf7d0' : healthStatus === 'loading' ? '#e2e8f0' : '#fecaca'}`,
            color: healthStatus === 'success' ? '#166534' : healthStatus === 'loading' ? '#64748b' : '#991b1b',
            fontWeight: 600
          }}>
            <span role="status" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {healthStatus === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
              {statusLabel}
            </span>
            <button
              onClick={checkHealth}
              disabled={healthStatus === 'loading'}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.85rem'
              }}
              aria-label="Kiểm tra lại trạng thái backend"
            >
              <RefreshCw size={14} /> Kiểm tra lại
            </button>
          </div>

          {healthStatus === 'success' && healthData && (
            <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#64748b' }}>
              {healthData.service} v{healthData.version}
            </div>
          )}

          {healthStatus === 'error' && healthError && (
            <div role="alert" style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#fef2f2', color: '#991b1b', borderRadius: '8px', fontSize: '0.85rem' }}>
              ⚠️ {healthError}
            </div>
          )}
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section style={{ backgroundColor: '#f8fafc', padding: '4.5rem 1.5rem' }}>
        <div style={{ maxWidth: '850px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase' }}>
              Hỏi đáp thường gặp
            </span>
            <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#142B4A', margin: '0.5rem 0 0.5rem 0' }}>
              Giải đáp Thắc mắc của Quý Phụ huynh & Học viên
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx
              return (
                <div
                  key={idx}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    backgroundColor: isOpen ? '#ffffff' : '#ffffff'
                  }}
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    style={{
                      width: '100%',
                      padding: '1.15rem 1.25rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'none',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      fontWeight: 600,
                      color: '#142B4A'
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <HelpCircle size={18} color="#2563eb" />
                      {faq.q}
                    </span>
                    <span style={{ fontSize: '1.25rem', color: '#64748b' }}>{isOpen ? '−' : '+'}</span>
                  </button>
                  {isOpen && (
                    <div style={{ padding: '0 1.25rem 1.25rem 2.75rem', fontSize: '0.9rem', color: '#475569', lineHeight: 1.6 }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
export default LandingPage
