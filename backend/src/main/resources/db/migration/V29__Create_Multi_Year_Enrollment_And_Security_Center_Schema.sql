-- ==============================================================================
-- V29__Create_Multi_Year_Enrollment_And_Security_Center_Schema.sql
-- CH ACADEMY — MULTI-ACADEMIC-YEAR ECOSYSTEM & ENTERPRISE SECURITY SCHEMA
-- ==============================================================================

-- 1. Bổ sung trường cho bảng academic_years
ALTER TABLE academic_years 
    ADD COLUMN IF NOT EXISTS registration_start_date DATE,
    ADD COLUMN IF NOT EXISTS registration_end_date DATE,
    ADD COLUMN IF NOT EXISTS description TEXT;

-- Cập nhật thời gian đăng ký mẫu cho các năm học hiện có
UPDATE academic_years 
SET registration_start_date = (start_date - INTERVAL '30 days')::DATE,
    registration_end_date = (start_date + INTERVAL '15 days')::DATE,
    description = 'Năm học chính quy trung tâm CH Academy'
WHERE registration_start_date IS NULL;

-- 2. Bảng yêu cầu đăng ký khóa học của học viên (Enrollment Requests Workflow)
CREATE TABLE IF NOT EXISTS enrollment_requests (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    class_id BIGINT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    academic_year VARCHAR(20) NOT NULL,
    request_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING' NOT NULL CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
    applied_tuition_fee NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    final_fee NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    reviewed_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_notes TEXT,
    student_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_enrollment_requests_student ON enrollment_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_requests_class ON enrollment_requests(class_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_requests_year ON enrollment_requests(academic_year);
CREATE INDEX IF NOT EXISTS idx_enrollment_requests_status ON enrollment_requests(status);

-- 3. Bảng sự kiện và cảnh báo an ninh trung tâm (Security Alerts)
CREATE TABLE IF NOT EXISTS security_alerts (
    id BIGSERIAL PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    username VARCHAR(100),
    ip_address VARCHAR(50),
    user_agent TEXT,
    status VARCHAR(20) DEFAULT 'NEW' NOT NULL CHECK (status IN ('NEW', 'INVESTIGATING', 'RESOLVED', 'DISMISSED')),
    resolved_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    metadata_json TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_security_alerts_severity ON security_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_security_alerts_status ON security_alerts(status);
CREATE INDEX IF NOT EXISTS idx_security_alerts_created_at ON security_alerts(created_at DESC);

-- 4. Bảng quản lý phiên đăng nhập và thiết bị người dùng (User Sessions)
CREATE TABLE IF NOT EXISTS user_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) NOT NULL,
    ip_address VARCHAR(50),
    user_agent TEXT,
    device_name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoked_reason VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active);

-- Seed cảnh báo an ninh mẫu để Security Center có dữ liệu khởi tạo chuyên nghiệp
INSERT INTO security_alerts (event_type, severity, title, description, username, ip_address, status, created_at)
VALUES 
    ('SYSTEM_AUDIT', 'LOW', 'Khởi tạo hệ thống kiểm toán an ninh Enterprise', 'Hệ thống Zero Trust Security Center được kích hoạt thành công trên CH Academy.', 'admin', '127.0.0.1', 'RESOLVED', CURRENT_TIMESTAMP - INTERVAL '2 days'),
    ('RATE_LIMIT_CHECK', 'LOW', 'Kiểm tra lưu lượng bảo vệ API rate limit', 'Hệ thống rate limiting tự động ghi nhận 0 lượt vi phạm trong 24 giờ qua.', 'system', '127.0.0.1', 'RESOLVED', CURRENT_TIMESTAMP - INTERVAL '1 day'),
    ('RBAC_ENFORCEMENT', 'MEDIUM', 'Kiểm soát truy cập phân hệ Quản trị', 'Spring Security kích hoạt chặn truy cập trái phép phân hệ Admin từ tài khoản thường.', 'nhc051105@gmail.com', '127.0.0.1', 'RESOLVED', CURRENT_TIMESTAMP - INTERVAL '1 hour')
ON CONFLICT DO NOTHING;
