-- ==============================================================================
-- V30__Permanent_Student_Identity_And_Unified_Security.sql
-- CH ACADEMY — PERMANENT STUDENT IDENTITY, ENROLLMENT AUTOMATION & UNIFIED SECURITY
-- ==============================================================================

-- 1. Cho phép một học viên gắn với nhiều Leads xuyên các năm (bỏ unique trên converted_student_id)
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_converted_student_id_key;

-- Bổ sung cờ nhận diện học viên cũ đăng ký lại trên Lead
ALTER TABLE leads 
    ADD COLUMN IF NOT EXISTS is_existing_student BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS existing_student_id BIGINT REFERENCES students(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_leads_existing_student ON leads(existing_student_id);

-- 2. Cập nhật ràng buộc trạng thái Enrollment phong phú
ALTER TABLE enrollments DROP CONSTRAINT IF EXISTS chk_enrollment_status;
ALTER TABLE enrollments 
    ADD CONSTRAINT chk_enrollment_status 
    CHECK (status IN ('ENROLLED', 'ACTIVE', 'COMPLETED', 'DROPPED', 'CANCELLED', 'WITHDRAWN', 'SUSPENDED'));

-- Đảm bảo duy nhất một enrollment cho một học viên trong cùng một lớp
-- (Constraint uq_class_student đã có, đảm bảo không bị trùng)

-- 3. Nâng cấp bảng cảnh báo an ninh (Security Alerts) với quy trình điều tra chuẩn Enterprise
ALTER TABLE security_alerts DROP CONSTRAINT IF EXISTS security_alerts_status_check;
ALTER TABLE security_alerts 
    ADD CONSTRAINT security_alerts_status_check 
    CHECK (status IN ('NEW', 'INVESTIGATING', 'RESOLVED', 'DISMISSED', 'FALSE_POSITIVE', 'ACCEPTED_RISK'));

ALTER TABLE security_alerts
    ADD COLUMN IF NOT EXISTS alert_code VARCHAR(50),
    ADD COLUMN IF NOT EXISTS investigated_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS investigated_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS investigation_notes TEXT,
    ADD COLUMN IF NOT EXISTS endpoint VARCHAR(255),
    ADD COLUMN IF NOT EXISTS target_resource VARCHAR(100),
    ADD COLUMN IF NOT EXISTS action_taken VARCHAR(100),
    ADD COLUMN IF NOT EXISTS correlation_id VARCHAR(100);

-- Backfill mã cảnh báo chuẩn cho các bản ghi hiện tại
UPDATE security_alerts 
SET alert_code = 'SEC-' || TO_CHAR(created_at, 'YYYY') || '-' || LPAD(id::TEXT, 4, '0')
WHERE alert_code IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_security_alerts_code ON security_alerts(alert_code);

-- 4. Bổ sung trường kích hoạt tài khoản an toàn cho Users (Không gửi mật khẩu cleartext)
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS activation_token VARCHAR(255),
    ADD COLUMN IF NOT EXISTS activation_token_expires_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_users_activation_token ON users(activation_token);

-- 5. Bổ sung phân quyền chuyên trách Security Center & Audit Log vào RBAC
INSERT INTO permissions (id, module, description, created_at)
VALUES 
    ('SECURITY_ALERT_VIEW', 'security', 'Xem danh sách và chi tiết cảnh báo an ninh', CURRENT_TIMESTAMP),
    ('SECURITY_ALERT_INVESTIGATE', 'security', 'Tiếp nhận và ghi chú điều tra sự cố an ninh', CURRENT_TIMESTAMP),
    ('SECURITY_ALERT_RESOLVE', 'security', 'Xử lý, khắc phục hoặc gắn nhãn cảnh báo an ninh', CURRENT_TIMESTAMP),
    ('SECURITY_SESSION_VIEW', 'security', 'Xem danh sách phiên đăng nhập và thiết bị', CURRENT_TIMESTAMP),
    ('SECURITY_SESSION_REVOKE', 'security', 'Thu hồi phiên đăng nhập và buộc đăng xuất', CURRENT_TIMESTAMP),
    ('AUDIT_LOG_VIEW', 'audit', 'Tra cứu và xem chi tiết nhật ký hoạt động', CURRENT_TIMESTAMP),
    ('AUDIT_LOG_EXPORT', 'audit', 'Xuất báo cáo nhật ký kiểm toán hệ thống', CURRENT_TIMESTAMP),
    ('SECURITY_POLICY_VIEW', 'security', 'Xem các chính sách an toàn bảo mật', CURRENT_TIMESTAMP),
    ('SECURITY_POLICY_MANAGE', 'security', 'Cấu hình chính sách bảo mật hệ thống', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- Phân quyền cho vai trò SUPER_ADMIN, CENTER_ADMIN, ADMIN
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.id IN ('SUPER_ADMIN', 'CENTER_ADMIN', 'ADMIN')
  AND p.id IN (
    'SECURITY_ALERT_VIEW',
    'SECURITY_ALERT_INVESTIGATE',
    'SECURITY_ALERT_RESOLVE',
    'SECURITY_SESSION_VIEW',
    'SECURITY_SESSION_REVOKE',
    'AUDIT_LOG_VIEW',
    'AUDIT_LOG_EXPORT',
    'SECURITY_POLICY_VIEW',
    'SECURITY_POLICY_MANAGE'
  )
ON CONFLICT DO NOTHING;

-- Cung cấp quyền xem nhật ký và cảnh báo cho ACADEMIC_STAFF (read-only audit)
INSERT INTO role_permissions (role_id, permission_id)
VALUES 
    ('ACADEMIC_STAFF', 'AUDIT_LOG_VIEW')
ON CONFLICT DO NOTHING;

-- 6. Tạo thêm dữ liệu mẫu sự cố an ninh đa dạng để hiển thị thực tế
INSERT INTO security_alerts (alert_code, event_type, severity, title, description, username, ip_address, status, endpoint, target_resource, correlation_id, created_at)
VALUES 
    ('SEC-2026-0004', 'BRUTE_FORCE_LOGIN', 'HIGH', 'Phát hiện đăng nhập thất bại liên tiếp 5 lần', 'Tài khoản admin bị thử đăng nhập mật khẩu sai 5 lần từ cùng một IP.', 'admin', '192.168.1.105', 'INVESTIGATING', '/api/v1/auth/login', 'USER', 'CORR-AUTH-9921', CURRENT_TIMESTAMP - INTERVAL '3 hours'),
    ('SEC-2026-0005', 'UNAUTHORIZED_ADMIN_ACCESS', 'CRITICAL', 'Thử truy cập trái phép phân hệ Quản trị', 'Tài khoản học viên HV20240001 thử gọi API quản trị bảo mật.', 'hocvien01@chacademy.vn', '14.232.18.99', 'NEW', '/api/v1/admin/security/overview', 'SECURITY_CENTER', 'CORR-RBAC-1044', CURRENT_TIMESTAMP - INTERVAL '45 minutes'),
    ('SEC-2026-0006', 'ACADEMIC_YEAR_TAMPER', 'MEDIUM', 'Nghi vấn thay đổi tham số Academic Year không hợp lệ', 'Phát hiện request đăng ký lớp học chứa academicYear 2035-2036 chưa mở.', 'hocvien02@chacademy.vn', '118.70.12.5', 'NEW', '/api/v1/student/enrollment-requests', 'ENROLLMENT', 'CORR-ENR-3310', CURRENT_TIMESTAMP - INTERVAL '15 minutes')
ON CONFLICT DO NOTHING;

