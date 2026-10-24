import React, { useState, useEffect } from 'react'
import { PublicNavbar } from '../../components/public/PublicNavbar'
import { PublicFooter } from '../../components/public/PublicFooter'
import { publicApi } from '../../api/public'
import type { Course, CourseCategory } from '../../types/course'
import { Search, Filter, Clock, BookOpen, Send, CheckCircle, X } from 'lucide-react'

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
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <PublicNavbar />

      {/* Header Banner */}
      <section style={{ backgroundColor: '#142B4A', color: '#ffffff', padding: '3.5rem 1.5rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, margin: '0 0 0.75rem 0' }}>
            Danh mục Khóa học & Chương trình Đào tạo
          </h1>
          <p style={{ color: '#cbd5e1', fontSize: '1rem', margin: 0, lineHeight: 1.6 }}>
            Khám phá các lộ trình đào tạo chuẩn mực tại CH Academy, phục vụ đa dạng nhóm tuổi và mục tiêu phát triển kỹ năng thực tiễn.
          </p>
        </div>
      </section>

      {/* Filter Bar */}
      <div style={{ maxWidth: '1200px', margin: '-1.5rem auto 2rem auto', padding: '0 1.5rem', width: '100%', boxSizing: 'border-box' }}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          padding: '1.25rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center'
        }}>
          {/* Keyword search form */}
          <form onSubmit={handleSearchSubmit} style={{ flex: '1 1 280px', display: 'flex', gap: '0.5rem' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                type="text"
                placeholder="Tìm theo tên khóa học hoặc mã..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.85rem 0.6rem 2.25rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box'
                }}
              />
              <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
            <button
              type="submit"
              style={{
                padding: '0.6rem 1.25rem',
                borderRadius: '8px',
                backgroundColor: '#142B4A',
                color: '#ffffff',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              Tìm kiếm
            </button>
          </form>

          {/* Category Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={16} color="#64748b" />
            <select
              value={categoryId || ''}
              onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : undefined)}
              style={{
                padding: '0.6rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.9rem',
                backgroundColor: '#ffffff'
              }}
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
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              style={{
                padding: '0.6rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.9rem',
                backgroundColor: '#ffffff'
              }}
            >
              <option value="ALL">Mọi lứa tuổi</option>
              <option value="KIDS">Khóa học Trẻ em</option>
              <option value="ADULTS">Khóa học Người lớn</option>
            </select>
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      <main style={{ maxWidth: '1200px', margin: '0 auto 4rem auto', padding: '0 1.5rem', width: '100%', boxSizing: 'border-box' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
            Đang tải dữ liệu khóa học...
          </div>
        ) : courses.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.75rem' }}>
            {courses.map((c) => (
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

                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#142B4A', margin: '0 0 0.5rem 0' }}>
                    {c.name}
                  </h3>

                  <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.5, margin: '0 0 1rem 0' }}>
                    {c.description || 'Chương trình đào tạo chuyên sâu kết hợp lý thuyết và thực hành.'}
                  </p>
                </div>

                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Học phí niêm yết</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#142B4A' }}>
                      {formatVND(c.defaultTuitionFee)}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedCourse(c)
                      setModalSuccess(false)
                      setModalError(null)
                    }}
                    style={{
                      padding: '0.55rem 1.15rem',
                      borderRadius: '6px',
                      backgroundColor: '#142B4A',
                      color: '#ffffff',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    Đăng ký tư vấn
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '4rem 1.5rem',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            color: '#64748b'
          }}>
            <BookOpen size={40} style={{ margin: '0 auto 0.75rem auto', opacity: 0.5 }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1e293b', margin: '0 0 0.5rem 0' }}>
              Không tìm thấy khóa học phù hợp
            </h3>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>
              Hãy thử thay đổi từ khóa hoặc bộ lọc danh mục phía trên.
            </p>
          </div>
        )}
      </main>

      {/* Consultation Modal */}
      {selectedCourse && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          zIndex: 100
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            maxWidth: '520px',
            width: '100%',
            padding: '2rem',
            position: 'relative',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <button
              onClick={() => setSelectedCourse(null)}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#64748b'
              }}
            >
              <X size={20} />
            </button>

            {modalSuccess ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <CheckCircle size={48} color="#16a34a" style={{ margin: '0 auto 0.75rem auto' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#166534', margin: '0 0 0.5rem 0' }}>
                  Gửi yêu cầu tư vấn thành công!
                </h3>
                <p style={{ color: '#475569', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  Bộ phận tuyển sinh sẽ liên hệ bạn sớm để tư vấn chi tiết về khóa học <strong>{selectedCourse.name}</strong>.
                </p>
                <button
                  onClick={() => setSelectedCourse(null)}
                  style={{
                    padding: '0.6rem 1.5rem',
                    borderRadius: '8px',
                    backgroundColor: '#142B4A',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Đóng
                </button>
              </div>
            ) : (
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#142B4A', margin: '0 0 0.35rem 0' }}>
                  Đăng ký nhận tư vấn
                </h3>
                <div style={{ fontSize: '0.875rem', color: '#2563eb', fontWeight: 600, marginBottom: '1.25rem' }}>
                  {selectedCourse.name} — {formatVND(selectedCourse.defaultTuitionFee)}
                </div>

                {modalError && (
                  <div style={{ padding: '0.65rem 0.85rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem' }}>
                    {modalError}
                  </div>
                )}

                <form onSubmit={handleConsultSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                      Ghi chú thêm (khung giờ học mong muốn, trình độ...)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Ghi chú thêm..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', fontFamily: 'inherit', boxSizing: 'border-box' }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={modalSubmitting}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '8px',
                      backgroundColor: '#142B4A',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      border: 'none',
                      cursor: modalSubmitting ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      marginTop: '0.5rem'
                    }}
                  >
                    <Send size={16} />
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
