import { useState, useEffect, useCallback } from 'react'
import { healthApi, type HealthResponse } from '../../api/client'
import '../../App.css'

// ----- Types -----
type HealthStatus = 'idle' | 'loading' | 'success' | 'error'

// ----- Navbar Component -----
function Navbar() {
  return (
    <nav className="navbar" role="navigation" aria-label="Điều hướng chính">
      <div className="navbar__inner">
        <a href="/" className="navbar__logo" aria-label="CH Academy - Trang chủ">
          <div className="navbar__logo-icon" aria-hidden="true">CH</div>
          <div className="navbar__logo-text">
            <span>CH Academy</span>
            <span>Trung tâm Giáo dục</span>
          </div>
        </a>

        <div className="navbar__nav">
          <a href="#features" className="navbar__nav-link">Chương trình học</a>
          <a href="#about" className="navbar__nav-link">Về chúng tôi</a>
          <a href="#health" className="navbar__nav-link">Hệ thống</a>
          <a href="/login" className="navbar__nav-link" style={{ fontWeight: 600, color: '#142B4A' }}>Đăng nhập</a>
          <a href="#contact" className="navbar__cta">Đăng ký học thử</a>
        </div>
      </div>
    </nav>
  )
}

// ----- Hero Section Component -----
function HeroSection() {
  return (
    <section className="hero" aria-labelledby="hero-heading">
      <div className="hero__content">
        <div className="hero__text">
          <div className="hero__badge" aria-label="Trạng thái: Đang tuyển sinh">
            Đang tuyển sinh 2024
          </div>

          <h1 id="hero-heading" className="hero__title">
            Nền tảng giáo dục<br />
            <span className="hero__title-highlight">CH Academy</span>
          </h1>

          <p className="hero__description">
            Hệ thống quản lý trung tâm giáo dục toàn diện — theo dõi học sinh,
            quản lý lớp học, và tối ưu hóa chất lượng giảng dạy cho mọi lứa tuổi.
          </p>

          <div className="hero__actions">
            <a href="#features" className="btn btn--primary">
              ✦ Khám phá tính năng
            </a>
            <a href="#health" className="btn btn--outline">
              Kiểm tra hệ thống
            </a>
            <a href="/login" className="btn btn--outline" style={{ borderColor: '#142B4A', color: '#142B4A' }}>
              Khu vực Quản trị
            </a>
          </div>

          <div className="hero__stats">
            <div className="hero__stat-item">
              <span className="hero__stat-number">100%</span>
              <span className="hero__stat-label">Sẵn sàng mở rộng</span>
            </div>
            <div className="hero__stat-divider" aria-hidden="true" />
            <div className="hero__stat-item">
              <span className="hero__stat-number">24/7</span>
              <span className="hero__stat-label">Hệ thống ổn định</span>
            </div>
            <div className="hero__stat-divider" aria-hidden="true" />
            <div className="hero__stat-item">
              <span className="hero__stat-number">REST</span>
              <span className="hero__stat-label">API v1 chuẩn hóa</span>
            </div>
          </div>
        </div>

        <div className="hero__visual" aria-hidden="true">
          <div className="hero__card hero__card--main">
            <div className="hero__card-header">
              <span className="hero__card-dot hero__card-dot--red" />
              <span className="hero__card-dot hero__card-dot--yellow" />
              <span className="hero__card-dot hero__card-dot--green" />
              <span className="hero__card-title">ch-academy-system</span>
            </div>
            <div className="hero__card-body">
              <div className="hero__card-row">
                <span className="hero__card-key">frontend:</span>
                <span className="hero__card-val">React 19 + TypeScript + Vite</span>
              </div>
              <div className="hero__card-row">
                <span className="hero__card-key">backend:</span>
                <span className="hero__card-val">Java Spring Boot 3</span>
              </div>
              <div className="hero__card-row">
                <span className="hero__card-key">database:</span>
                <span className="hero__card-val">PostgreSQL 16 (Docker)</span>
              </div>
              <div className="hero__card-row">
                <span className="hero__card-key">security:</span>
                <span className="hero__card-val">Spring Security 6 + JWT</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ----- Features Section Component -----
const FEATURES = [
  {
    icon: '📚',
    title: 'Quản lý Khóa học',
    desc: 'Tổ chức chương trình học đa dạng cho cả trẻ em và người lớn với lộ trình rõ ràng.',
  },
  {
    icon: '👥',
    title: 'Hồ sơ Học sinh',
    desc: 'Theo dõi tiến độ, điểm danh, kết quả học tập và thông tin liên lạc tập trung.',
  },
  {
    icon: '🗓️',
    title: 'Lịch học Thông minh',
    desc: 'Xếp lịch giảng dạy tự động, tránh xung đột phòng học và thời gian giáo viên.',
  },
  {
    icon: '💳',
    title: 'Quản lý Học phí',
    desc: 'Theo dõi thu học phí, xuất hóa đơn và cảnh báo các khoản cần thanh toán.',
  },
  {
    icon: '📊',
    title: 'Báo cáo & Thống kê',
    desc: 'Biểu đồ trực quan về doanh thu, số lượng học sinh và hiệu suất các lớp học.',
  },
  {
    icon: '🔒',
    title: 'Bảo mật Phân quyền',
    desc: 'Phân quyền chặt chẽ cho Quản trị viên, Giáo viên, Nhân viên và Học sinh.',
  },
]

function FeaturesSection() {
  return (
    <section id="features" className="features" aria-labelledby="features-heading">
      <div className="features__inner">
        <div className="features__header">
          <span className="features__tag">Tính năng cốt lõi</span>
          <h2 id="features-heading" className="features__title">
            Mọi thứ bạn cần để vận hành trung tâm
          </h2>
          <p className="features__subtitle">
            Được thiết kế từ đầu để phục vụ cả chương trình cho trẻ em và người lớn
          </p>
        </div>

        <div className="features__grid">
          {FEATURES.map((feature, idx) => (
            <article key={idx} className="feature-card">
              <div className="feature-card__icon" aria-hidden="true">{feature.icon}</div>
              <h3 className="feature-card__title">{feature.title}</h3>
              <p className="feature-card__desc">{feature.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

// ----- Health Check Component -----
function HealthSection() {
  const [status, setStatus] = useState<HealthStatus>('idle')
  const [data, setData] = useState<HealthResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const checkHealth = useCallback(async () => {
    setStatus('loading')
    setError(null)
    try {
      const result = await healthApi.check()
      setData(result)
      setStatus('success')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể kết nối đến backend')
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    checkHealth()
  }, [checkHealth])

  const statusLabel = {
    idle: 'Đang kiểm tra...',
    loading: 'Đang kết nối đến backend...',
    success: 'Hoạt động bình thường',
    error: 'Không thể kết nối đến backend',
  }[status]

  return (
    <section id="health" className="health-section" aria-labelledby="health-heading">
      <div className="health-section__inner">
        <h2 id="health-heading" className="health-section__title">
          Trạng thái Hệ thống
        </h2>
        <p className="health-section__desc">
          Kết nối đến backend Spring Boot tại{' '}
          <code>{import.meta.env.VITE_API_BASE_URL || 'http://localhost:8088/api/v1'}</code>
        </p>

        <div className="health-card">
          <div
            className={`health-card__status health-card__status--${
              status === 'idle' ? 'loading' :
              status === 'loading' ? 'loading' :
              status === 'success' && data?.status === 'UP' ? 'up' : 'down'
            }`}
            role="status"
            aria-live="polite"
          >
            <span className="health-card__status-dot" aria-hidden="true" />
            {statusLabel}
          </div>

          {status === 'success' && data && (
            <div className="health-card__data">
              <div className="health-card__field">
                <div className="health-card__field-label">Service</div>
                <div className="health-card__field-value">{data.service}</div>
              </div>
              <div className="health-card__field">
                <div className="health-card__field-label">Version</div>
                <div className="health-card__field-value">{data.version}</div>
              </div>
              <div className="health-card__field">
                <div className="health-card__field-label">Thời gian server</div>
                <div className="health-card__field-value">
                  {new Date(data.timestamp).toLocaleString('vi-VN')}
                </div>
              </div>
              <div className="health-card__field">
                <div className="health-card__field-label">Thông báo</div>
                <div className="health-card__field-value">{data.message}</div>
              </div>
            </div>
          )}

          {status === 'error' && error && (
            <div className="health-card__error" role="alert">
              ⚠️ {error}
              <br />
              <small>Hãy đảm bảo backend đang chạy tại port 8088</small>
            </div>
          )}

          <button
            id="health-check-btn"
            className="health-card__btn"
            onClick={checkHealth}
            disabled={status === 'loading'}
            aria-label="Kiểm tra lại trạng thái backend"
          >
            {status === 'loading' ? 'Đang kiểm tra...' : '↻ Kiểm tra lại'}
          </button>
        </div>
      </div>
    </section>
  )
}

// ----- Footer Component -----
function Footer() {
  return (
    <footer className="footer" role="contentinfo">
      <div className="footer__inner">
        <div className="footer__brand">
          <div className="footer__logo">
            <span className="footer__logo-icon">CH</span>
            <span className="footer__logo-name">CH Academy</span>
          </div>
          <p className="footer__tagline">
            Hệ thống quản lý trung tâm giáo dục hiện đại và chuyên nghiệp.
          </p>
        </div>

        <div className="footer__bottom">
          <p>&copy; {new Date().getFullYear()} CH Academy. Tất cả quyền được bảo lưu.</p>
          <div className="footer__tech">
            <span>React 19</span> • <span>TypeScript</span> • <span>Spring Boot 3</span> • <span>PostgreSQL</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

// ----- LandingPage Component -----
export function LandingPage() {
  return (
    <div className="app">
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HealthSection />
      </main>
      <Footer />
    </div>
  )
}
