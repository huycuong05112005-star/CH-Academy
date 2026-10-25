import React, { useState, useEffect } from 'react'
import { PublicNavbar } from '../../components/public/PublicNavbar'
import { PublicFooter } from '../../components/public/PublicFooter'
import { publicApi } from '../../api/public'
import type { Course, CourseCategory } from '../../types/course'
import { Search, Filter, Clock, BookOpen, Send, CheckCircle, X, Sparkles } from 'lucide-react'

export const CoursesPublicPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([])
  const [categories, setCategories] = useState<CourseCategory[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [keyword, setKeyword] = useState('')
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined)
  const [targetAudience, setTargetAudience] = useState('ALL')

  // Consultation Modal
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [modalSubmitting, setModalSubmitting] = useState(false)
  const [modalSuccess, setModalSuccess] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)

  const fetchCourses = async () => {
    setLoading(true)
    try {
      const res = await publicApi.getCourses({
        keyword: keyword || undefined,
        categoryId,
        targetAudience: targetAudience !== 'ALL' ? targetAudience : undefined,
        size: 50,
      })
      setCourses(res.content || [])
    } catch {
      // Handle error
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const cats = await publicApi.getCategories()
        setCategories(cats || [])
      } catch {
        // Fallback
      }
    }
    fetchCats()
  }, [])

  useEffect(() => {
    fetchCourses()
  }, [categoryId, targetAudience])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchCourses()
  }

  const handleConsultSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setModalError(null)

    if (!fullName.trim()) {
      setModalError('Vui lòng nhập họ và tên')
      return
    }
    const phoneRegex = /^(0[35789])[0-9]{8}$/
    if (!phoneRegex.test(phone.trim())) {
      setModalError('Số điện thoại không hợp lệ (định dạng VN: 10 chữ số)')
      return
    }

    setModalSubmitting(true)
    try {
      await publicApi.submitLead({
        fullName: fullName.trim(),
        phone: phone.trim(),
        targetCourseId: selectedCourse?.id,
        notes: notes.trim() || undefined,
      })
      setModalSuccess(true)
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : 'Có lỗi xảy ra, vui lòng thử lại sau.')
    } finally {
      setModalSubmitting(false)
    }
  }

  const formatVND = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0)
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      <PublicNavbar />

      {/* Header Banner */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#0d1e33] via-[#142B4A] to-[#1e3a66] text-white py-16 px-4 sm:px-6 lg:px-8 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(14,165,233,0.15),transparent_60%)]" />
        <div className="relative max-w-4xl mx-auto animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold mb-4 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            <span>Chương Trình Đào Tạo Chuẩn Mực</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Danh mục Khóa học & Chương trình Đào tạo
          </h1>
          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Khám phá các lộ trình đào tạo chuẩn mực tại CH Academy, phục vụ đa dạng nhóm tuổi và mục tiêu phát triển kỹ năng thực tiễn.
          </p>
        </div>
      </section>

      {/* Filter Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-7 mb-10 w-full relative z-10">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-black/30 p-4 sm:p-5 flex flex-wrap gap-3 sm:gap-4 items-center">
          {/* Keyword search form */}
          <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[260px] flex gap-2">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Tìm theo tên khóa học hoặc mã..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors shadow-sm whitespace-nowrap active:scale-95"
            >
              Tìm kiếm
            </button>
          </form>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              aria-label="Lọc theo danh mục"
              value={categoryId || ''}
              onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : undefined)}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Target Audience Filter */}
          <div>
            <select
              aria-label="Lọc theo đối tượng"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
            >
              <option value="ALL">Mọi lứa tuổi</option>
              <option value="KIDS">Khóa học Trẻ em</option>
              <option value="ADULTS">Khóa học Người lớn</option>
            </select>
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 flex-1 w-full">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 animate-pulse">
                <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-1/3 mb-4"></div>
                <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full mb-2"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-2/3 mb-6"></div>
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
                  <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : courses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((c) => (
              <div
                key={c.id}
                className="hover-lift bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 flex flex-col justify-between shadow-sm hover:shadow-lg transition-all duration-200 group"
              >
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide ${
                        c.targetAudience === 'KIDS'
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                          : c.targetAudience === 'ADULTS'
                          ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {c.targetAudience === 'KIDS' ? 'Trẻ em' : c.targetAudience === 'ADULTS' ? 'Người lớn' : 'Mọi lứa tuổi'}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-blue-500" /> {c.durationHours} giờ
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {c.name}
                  </h3>

                  <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed mb-4">
                    {c.description || 'Chương trình đào tạo chuyên sâu kết hợp lý thuyết và thực hành.'}
                  </p>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 mt-2 flex justify-between items-center gap-2">
                  <div>
                    <div className="text-xs text-slate-400 dark:text-slate-500">Học phí niêm yết</div>
                    <div className="text-lg font-extrabold text-blue-600 dark:text-blue-400 tabular-nums">
                      {formatVND(c.defaultTuitionFee)}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedCourse(c)
                      setModalSuccess(false)
                      setModalError(null)
                    }}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold transition-colors shadow-sm active:scale-95"
                  >
                    Đăng ký tư vấn
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-md mx-auto">
            <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-60" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">
              Không tìm thấy khóa học phù hợp
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Hãy thử thay đổi từ khóa hoặc bộ lọc danh mục phía trên.
            </p>
          </div>
        )}
      </main>

      {/* Consultation Modal */}
      {selectedCourse && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 sm:p-8 relative shadow-2xl border border-slate-100 dark:border-slate-800 animate-scale-in">
            <button
              onClick={() => setSelectedCourse(null)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {modalSuccess ? (
              <div className="text-center py-4">
                <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mb-2">
                  Gửi yêu cầu tư vấn thành công!
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                  Bộ phận tuyển sinh sẽ liên hệ bạn sớm để tư vấn chi tiết về khóa học <strong>{selectedCourse.name}</strong>.
                </p>
                <button
                  onClick={() => setSelectedCourse(null)}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors shadow-sm"
                >
                  Đóng
                </button>
              </div>
            ) : (
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-1">
                  Đăng ký nhận tư vấn
                </h3>
                <div className="text-sm text-blue-600 dark:text-blue-400 font-semibold mb-6">
                  {selectedCourse.name} — <span className="tabular-nums">{formatVND(selectedCourse.defaultTuitionFee)}</span>
                </div>

                {modalError && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 rounded-xl text-xs sm:text-sm mb-4">
                    {modalError}
                  </div>
                )}

                <form onSubmit={handleConsultSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Họ và tên của bạn <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Nguyễn Văn An"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Số điện thoại liên hệ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="0987654321"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Ghi chú thêm (khung giờ học mong muốn, trình độ...)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Ghi chú thêm..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400 font-sans"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={modalSubmitting}
                    className="w-full mt-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    {modalSubmitting ? 'Đang gửi...' : 'Gửi đăng ký tư vấn'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      <PublicFooter />
    </div>
  )
}
export default CoursesPublicPage
