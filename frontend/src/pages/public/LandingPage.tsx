import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PublicNavbar } from '../../components/public/PublicNavbar'
import { PublicFooter } from '../../components/public/PublicFooter'
import { publicApi } from '../../api/public'
import type { Course } from '../../types/course'
import { useSettings } from '../../context/SettingsContext'
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
  Clock
} from 'lucide-react'
import { Tilt3DCard } from '../../components/3d/Tilt3DCard'
import { KnowledgeMatrix3D } from '../../components/3d/KnowledgeMatrix3D'

export const LandingPage: React.FC = () => {
  const { settings } = useSettings()
  const [featuredCourses, setFeaturedCourses] = useState<Course[]>([])
  const [loadingCourses, setLoadingCourses] = useState<boolean>(true)

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
      a: `${settings.shortName} có quy định rõ ràng về quyền lợi bảo lưu và điều chỉnh lịch học. Mọi yêu cầu được ghi nhận vào hệ thống quản lý và xử lý minh bạch theo đúng quy chuẩn trung tâm.`
    }
  ]

  return (
    <div className="bg-[var(--bg-app)] min-h-screen flex flex-col text-[var(--text-main)] transition-colors duration-200">
      <PublicNavbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#0F243E] via-[#142B4A] to-[#1E3A63] text-white py-16 lg:py-24 px-4 sm:px-6 relative overflow-hidden">
        {/* Subtle background decorative shapes */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-sky-400/10 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center relative z-10">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-[#38BDF8] animate-fade-in">
              <Sparkles size={15} />
              <span>Tuyển sinh các khóa học chất lượng cao</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-white animate-slide-up">
              Kiến tạo Tri thức — Vững bước Tương lai cùng <span className="text-[#38BDF8]">{settings.shortName}</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl animate-slide-up stagger-1">
              Môi trường học tập chuyên nghiệp với phương pháp giảng dạy hiện đại, đội ngũ giáo viên tận tâm và hệ thống quản trị đào tạo minh bạch, chuẩn hóa.
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-2 animate-slide-up stagger-2">
              <a
                href="#tu-van"
                className="px-6 py-3.5 rounded-xl bg-[#38BDF8] hover:bg-[#0284C7] text-[#0A0F1D] font-bold text-sm shadow-md hover-lift transition-all"
              >
                Đăng ký tư vấn miễn phí
              </a>
              <Link
                to="/courses"
                className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/25 text-white font-semibold text-sm backdrop-blur-sm transition-all"
              >
                Khám phá khóa học
              </Link>
            </div>

            {/* Quick trust metrics */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/15 animate-slide-up stagger-3">
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-[#38BDF8] tabular-nums">100%</div>
                <div className="text-xs text-slate-300 mt-0.5">Giáo trình chuẩn hóa</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-[#38BDF8]">Đa dạng</div>
                <div className="text-xs text-slate-300 mt-0.5">Trẻ em & Người lớn</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-[#38BDF8]">Minh bạch</div>
                <div className="text-xs text-slate-300 mt-0.5">Theo dõi học tập 24/7</div>
              </div>
            </div>
          </div>

          {/* Hero right 3D visual card */}
          <div className="lg:col-span-5 relative animate-slide-up stagger-2">
            <Tilt3DCard maxTilt={5} className="w-full">
              <div className="bg-white/10 dark:bg-[#111C31]/70 backdrop-blur-xl border border-white/25 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4">
                {/* 3D WebGL Matrix Viewport */}
                <div className="relative w-full h-44 rounded-2xl overflow-hidden bg-slate-950/40 border border-white/15">
                  <KnowledgeMatrix3D className="w-full h-full" />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-900/70 backdrop-blur-md border border-cyan-500/30 text-[10px] font-bold text-cyan-300 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                    <span>3D EDTECH CORE</span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-white flex items-center gap-2 pt-1 border-t border-white/10">
                  <ShieldCheck size={20} className="text-[#38BDF8]" />
                  <span>Vì sao chọn {settings.shortName}?</span>
                </h3>
                <ul className="space-y-3 text-xs sm:text-sm text-slate-200">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong className="text-white">Đội ngũ chuyên môn cao:</strong> Giáo viên giàu kinh nghiệm, phương pháp sư phạm tương tác cao.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong className="text-white">Quy mô lớp học tinh gọn:</strong> Giới hạn sĩ số giúp giáo viên sâu sát đến từng học viên.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong className="text-white">Sổ liên lạc điện tử:</strong> Điểm danh, chuyên cần và tiến độ cập nhật tức thời cho phụ huynh.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong className="text-white">Chính sách linh hoạt:</strong> Biểu phí rõ ràng, hỗ trợ xếp lịch học và học bù chu đáo.</span>
                  </li>
                </ul>
              </div>
            </Tilt3DCard>
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section className="bg-white dark:bg-[#111C31] py-16 px-4 sm:px-6 border-b border-slate-200/80 dark:border-[#1E3152] transition-colors">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold text-[#2563EB] dark:text-[#38BDF8] uppercase tracking-wider">
              Năng lực vận hành
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] dark:text-[#F8FAFC] mt-2 mb-3">
              Mọi thứ bạn cần để vận hành trung tâm
            </h2>
            <p className="text-slate-600 dark:text-[#94A3B8] text-sm sm:text-base">
              Được thiết kế từ đầu để phục vụ cả chương trình cho trẻ em và người lớn
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Tilt3DCard maxTilt={6}>
              <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-[#1E3152] bg-slate-50/60 dark:bg-[#152238] shadow-sm hover:shadow-md transition-all h-full">
                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#2563EB] dark:text-[#38BDF8] flex items-center justify-center mb-4 shadow-xs">
                  <BookOpen size={24} />
                </div>
                <h3 className="text-lg font-bold text-[#0F172A] dark:text-[#F8FAFC] mb-2">
                  Quản lý Khóa học
                </h3>
                <p className="text-sm text-slate-600 dark:text-[#94A3B8] leading-relaxed">
                  Tổ chức chương trình học đa dạng cho cả trẻ em và người lớn với lộ trình rõ ràng, chuẩn hóa chuẩn đầu ra.
                </p>
              </div>
            </Tilt3DCard>

            <Tilt3DCard maxTilt={6}>
              <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-[#1E3152] bg-slate-50/60 dark:bg-[#152238] shadow-sm hover:shadow-md transition-all h-full">
                <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4 shadow-xs">
                  <Users size={24} />
                </div>
                <h3 className="text-lg font-bold text-[#0F172A] dark:text-[#F8FAFC] mb-2">
                  Hồ sơ Học sinh
                </h3>
                <p className="text-sm text-slate-600 dark:text-[#94A3B8] leading-relaxed">
                  Theo dõi tiến độ, điểm danh, kết quả học tập và thông tin người giám hộ tập trung, bảo mật cao.
                </p>
              </div>
            </Tilt3DCard>

            <Tilt3DCard maxTilt={6}>
              <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-[#1E3152] bg-slate-50/60 dark:bg-[#152238] shadow-sm hover:shadow-md transition-all h-full">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 shadow-xs">
                  <CreditCard size={24} />
                </div>
                <h3 className="text-lg font-bold text-[#0F172A] dark:text-[#F8FAFC] mb-2">
                  Quản lý Học phí
                </h3>
                <p className="text-sm text-slate-600 dark:text-[#94A3B8] leading-relaxed">
                  Theo dõi thu học phí, ghi nhận thanh toán nhiều đợt, công nợ tự động và hoàn phí theo đúng quy định.
                </p>
              </div>
            </Tilt3DCard>
          </div>
        </div>
      </section>

      {/* Featured Courses Section */}
      <section className="py-16 px-4 sm:px-6 max-w-7xl mx-auto w-full box-border">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-[#2563EB] dark:text-[#38BDF8] uppercase tracking-wider">
            Chương trình tiêu biểu
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] dark:text-[#F8FAFC] mt-2 mb-3">
            Khóa học Nổi bật tại {settings.shortName}
          </h2>
          <p className="text-slate-600 dark:text-[#94A3B8] text-sm sm:text-base">
            Các chương trình đào tạo được thiết kế bài bản, chú trọng tính thực tiễn và phát triển kỹ năng toàn diện cho học viên.
          </p>
        </div>

        {loadingCourses ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400 animate-pulse">
            Đang tải danh sách khóa học...
          </div>
        ) : featuredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredCourses.map((c) => (
              <Tilt3DCard key={c.id} maxTilt={5}>
                <div className="bg-white dark:bg-[#111C31] rounded-2xl border border-slate-200/80 dark:border-[#1E3152] shadow-xs p-6 flex flex-col justify-between hover-lift transition-all h-full">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                        c.targetAudience === 'KIDS'
                          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                          : c.targetAudience === 'ADULTS'
                          ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}>
                        {c.targetAudience === 'KIDS' ? 'Trẻ em' : c.targetAudience === 'ADULTS' ? 'Người lớn' : 'Mọi lứa tuổi'}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-[#94A3B8] flex items-center gap-1">
                        <Clock size={13} /> {c.durationHours} giờ
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-[#0F172A] dark:text-[#F8FAFC] mb-2 line-clamp-1">
                      {c.name}
                    </h3>

                    <p className="text-sm text-slate-600 dark:text-[#94A3B8] leading-relaxed line-clamp-2 mb-4">
                      {c.description || 'Chương trình đào tạo chuyên sâu với lộ trình chuẩn mực.'}
                    </p>
                  </div>

                  <div className="border-t border-slate-100 dark:border-[#1E3152] pt-4 flex justify-between items-center">
                    <div>
                      <div className="text-xs text-slate-400 dark:text-slate-500">Học phí niêm yết</div>
                      <div className="text-lg font-extrabold text-[#0F243E] dark:text-[#38BDF8] tabular-nums">
                        {formatVND(c.defaultTuitionFee)}
                      </div>
                    </div>
                    <a
                      href="#tu-van"
                      onClick={() => setTargetCourseId(c.id)}
                      className="px-4 py-2 rounded-xl bg-[#0F243E] dark:bg-[#38BDF8] text-white dark:text-[#0B1220] hover:bg-[#173557] dark:hover:bg-[#0284C7] text-xs font-semibold shadow-xs transition-colors"
                    >
                      Đăng ký tư vấn
                    </a>
                  </div>
                </div>
              </Tilt3DCard>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 px-4 bg-white dark:bg-[#111C31] rounded-2xl border border-slate-200/80 dark:border-[#1E3152] text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
            <BookOpen size={36} className="mx-auto mb-3 opacity-40" />
            <p className="font-semibold text-sm">Hiện trung tâm đang cập nhật danh mục khóa học mới</p>
            <p className="text-xs text-slate-400 mt-1">Vui lòng đăng ký form tư vấn để nhận thông tin chi tiết</p>
          </div>
        )}

        <div className="text-center mt-10">
          <Link
            to="/courses"
            className="inline-flex items-center gap-2 text-[#0F243E] dark:text-[#38BDF8] font-bold text-sm hover:underline"
          >
            <span>Xem toàn bộ danh mục khóa học</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* 4-Step Registration Process */}
      <section className="bg-white dark:bg-[#111C31] py-16 px-4 sm:px-6 border-t border-b border-slate-200/80 dark:border-[#1E3152] transition-colors">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold text-[#2563EB] dark:text-[#38BDF8] uppercase tracking-wider">
              Quy trình nhập học
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] dark:text-[#F8FAFC] mt-2 mb-3">
              4 Bước Đơn giản để Bắt đầu Khóa học
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-slate-50/60 dark:bg-[#152238] border border-slate-200/80 dark:border-[#1E3152] hover-lift transition-all">
              <div className="w-10 h-10 rounded-full bg-[#0F243E] dark:bg-[#38BDF8] text-white dark:text-[#0B1220] flex items-center justify-center font-extrabold text-sm mb-4 shadow-xs">
                1
              </div>
              <h3 className="text-base font-bold text-[#0F172A] dark:text-[#F8FAFC] mb-2">Đăng ký tư vấn</h3>
              <p className="text-sm text-slate-600 dark:text-[#94A3B8] leading-relaxed">
                Điền thông tin và khóa học bạn quan tâm qua form đăng ký trên website.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50/60 dark:bg-[#152238] border border-slate-200/80 dark:border-[#1E3152] hover-lift transition-all">
              <div className="w-10 h-10 rounded-full bg-[#0F243E] dark:bg-[#38BDF8] text-white dark:text-[#0B1220] flex items-center justify-center font-extrabold text-sm mb-4 shadow-xs">
                2
              </div>
              <h3 className="text-base font-bold text-[#0F172A] dark:text-[#F8FAFC] mb-2">Tư vấn & Kiểm tra</h3>
              <p className="text-sm text-slate-600 dark:text-[#94A3B8] leading-relaxed">
                Chuyên viên đào tạo liên hệ tư vấn chi tiết và sắp xếp lịch kiểm tra trình độ.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50/60 dark:bg-[#152238] border border-slate-200/80 dark:border-[#1E3152] hover-lift transition-all">
              <div className="w-10 h-10 rounded-full bg-[#0F243E] dark:bg-[#38BDF8] text-white dark:text-[#0B1220] flex items-center justify-center font-extrabold text-sm mb-4 shadow-xs">
                3
              </div>
              <h3 className="text-base font-bold text-[#0F172A] dark:text-[#F8FAFC] mb-2">Xếp lớp & Hoàn tất</h3>
              <p className="text-sm text-slate-600 dark:text-[#94A3B8] leading-relaxed">
                Chọn lịch học phù hợp, ghi nhận hồ sơ học viên và hoàn tất thủ tục học phí.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50/60 dark:bg-[#152238] border border-slate-200/80 dark:border-[#1E3152] hover-lift transition-all">
              <div className="w-10 h-10 rounded-full bg-[#0F243E] dark:bg-[#38BDF8] text-white dark:text-[#0B1220] flex items-center justify-center font-extrabold text-sm mb-4 shadow-xs">
                4
              </div>
              <h3 className="text-base font-bold text-[#0F172A] dark:text-[#F8FAFC] mb-2">Bắt đầu Khóa học</h3>
              <p className="text-sm text-slate-600 dark:text-[#94A3B8] leading-relaxed">
                Tham gia lớp học cùng giảng viên, theo dõi tiến độ và nhận phản hồi định kỳ.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Consultation Form Section */}
      <section id="tu-van" className="py-16 px-4 sm:px-6 max-w-4xl mx-auto w-full box-border">
        <div className="bg-white dark:bg-[#111C31] rounded-3xl border border-slate-200/80 dark:border-[#1E3152] shadow-xl p-6 sm:p-10 transition-colors">
          <div className="text-center mb-8">
            <span className="text-xs font-bold text-[#2563EB] dark:text-[#38BDF8] uppercase tracking-wider">
              Liên hệ trực tiếp
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] dark:text-[#F8FAFC] mt-2 mb-2">
              Đăng ký Nhận Tư vấn & Lộ trình Học
            </h2>
            <p className="text-slate-600 dark:text-[#94A3B8] text-sm">
              Để lại thông tin, đội ngũ tuyển sinh {settings.shortName} sẽ liên hệ hỗ trợ bạn trong vòng 24 giờ.
            </p>
          </div>

          {submitSuccess ? (
            <div className="p-8 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-center">
              <CheckCircle size={44} className="text-emerald-600 dark:text-emerald-400 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-emerald-800 dark:text-emerald-300 mb-2">
                Đăng ký tư vấn thành công!
              </h3>
              <p className="text-sm text-emerald-700 dark:text-emerald-400 mb-5 max-w-md mx-auto">
                Cảm ơn bạn đã quan tâm đến chương trình đào tạo tại {settings.shortName}. Chúng tôi sẽ sớm liên hệ theo số điện thoại bạn đã cung cấp.
              </p>
              <button
                type="button"
                onClick={() => setSubmitSuccess(false)}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm transition-colors"
              >
                Gửi thêm yêu cầu
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {formError && (
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-sm font-medium">
                  {formError}
                </div>
              )}

              {/* Honeypot field (hidden from real users) */}
              <input
                type="text"
                name="websiteUrl"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                className="hidden"
                tabIndex={-1}
                autoComplete="off"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] mb-1.5">
                    Họ và tên học viên / phụ huynh <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Nguyễn Văn An"
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
                    placeholder="Ví dụ: 0987654321"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-slate-50/50 dark:bg-[#1C293D] text-sm text-[#0F172A] dark:text-[#F8FAFC] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:focus:ring-[#38BDF8] transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] mb-1.5">
                    Địa chỉ Email (tùy chọn)
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
                    Khóa học quan tâm
                  </label>
                  <select
                    value={targetCourseId || ''}
                    onChange={(e) => setTargetCourseId(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2A3A50] bg-slate-50/50 dark:bg-[#1C293D] text-sm text-[#0F172A] dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:focus:ring-[#38BDF8] transition"
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
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#E8EEF7] mb-1.5">
                  Nhu cầu tư vấn cụ thể / Ghi chú thêm
                </label>
                <textarea
                  rows={3}
                  placeholder="Ghi rõ thời gian có thể học hoặc độ tuổi của học viên..."
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
                <Send size={18} />
                <span>{submitting ? 'Đang gửi thông tin...' : 'Gửi đăng ký tư vấn ngay'}</span>
              </button>
            </form>
          )}
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section className="bg-slate-50 dark:bg-[#0B1220] py-16 px-4 sm:px-6 transition-colors">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs font-bold text-[#2563EB] dark:text-[#38BDF8] uppercase tracking-wider">
              Hỏi đáp thường gặp
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] dark:text-[#F8FAFC] mt-2 mb-2">
              Giải đáp Thắc mắc của Quý Phụ huynh & Học viên
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx
              return (
                <div
                  key={idx}
                  className="border border-slate-200/80 dark:border-[#1E3152] rounded-2xl overflow-hidden bg-white dark:bg-[#111C31] shadow-2xs transition-colors"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full px-5 py-4 flex justify-between items-center text-left text-sm sm:text-base font-semibold text-[#0F172A] dark:text-[#F8FAFC] hover:bg-slate-50/50 dark:hover:bg-[#152238] transition-colors"
                  >
                    <span className="flex items-center gap-3 pr-2">
                      <HelpCircle size={18} className="text-[#2563EB] dark:text-[#38BDF8] shrink-0" />
                      <span>{faq.q}</span>
                    </span>
                    <span className="text-xl text-slate-400 shrink-0">{isOpen ? '−' : '+'}</span>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pl-12 text-sm text-slate-600 dark:text-[#94A3B8] leading-relaxed border-t border-slate-100 dark:border-[#1E3152] pt-3">
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

