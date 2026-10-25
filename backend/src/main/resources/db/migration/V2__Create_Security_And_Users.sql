-- =============================================================================
-- Migration V2: Tạo bảng Xác thực, Người dùng và Phân quyền (Security & Users)
-- Hệ thống: CH Academy
-- =============================================================================

-- 1. Bảng Vai trò (Roles)
CREATE TABLE roles (
    id VARCHAR(30) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Bảng Quyền hạn (Permissions)
CREATE TABLE permissions (
    id VARCHAR(50) PRIMARY KEY,
    module VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Bảng liên kết Vai trò - Quyền hạn (Role Permissions)
CREATE TABLE role_permissions (
    role_id VARCHAR(30) NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id VARCHAR(50) NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- 4. Bảng Người dùng (Users)
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20) UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    avatar_url VARCHAR(255),
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_status ON users(status);

-- 5. Bảng liên kết Người dùng - Vai trò (User Roles)
CREATE TABLE user_roles (
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id VARCHAR(30) NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- =============================================================================
-- SEED DỮ LIỆU BAN ĐẦU
-- =============================================================================

-- Khởi tạo 8 vai trò mặc định
INSERT INTO roles (id, name, description, is_system) VALUES
('SUPER_ADMIN', 'Quản trị viên tối cao', 'Toàn quyền quản trị hệ thống và cấu hình', TRUE),
('CENTER_ADMIN', 'Quản lý trung tâm', 'Quản lý vận hành toàn trung tâm', TRUE),
('ADMISSIONS_STAFF', 'Nhân viên tư vấn tuyển sinh', 'Quản lý khách hàng tiềm năng và tư vấn ghi danh', TRUE),
('ACADEMIC_STAFF', 'Nhân viên đào tạo', 'Quản lý khóa học, lớp học, lịch học và học viên', TRUE),
('ACCOUNTANT', 'Kế toán', 'Quản lý thu chi học phí, công nợ và hóa đơn', TRUE),
('TEACHER', 'Giáo viên', 'Xem lịch dạy, lớp phụ trách và thực hiện điểm danh', TRUE),
('STUDENT', 'Học viên', 'Xem lịch học, kết quả điểm danh và học phí cá nhân', TRUE),
('PARENT', 'Phụ huynh', 'Xem thông tin và lịch học của con em được liên kết', TRUE);

-- Khởi tạo các quyền cơ bản
INSERT INTO permissions (id, module, description) VALUES
('course:read', 'course', 'Xem danh sách và chi tiết khóa học'),
('course:write', 'course', 'Tạo và chỉnh sửa khóa học'),
('student:read', 'student', 'Xem danh sách và hồ sơ học viên'),
('student:write', 'student', 'Tạo và cập nhật hồ sơ học viên'),
('class:read', 'class', 'Xem lớp học và lịch học'),
('class:write', 'class', 'Tạo và quản lý lớp học, xếp lịch'),
('enrollment:write', 'enrollment', 'Ghi danh học viên vào lớp'),
('attendance:read', 'attendance', 'Xem kết quả điểm danh'),
('attendance:write', 'attendance', 'Thực hiện điểm danh học viên'),
('lead:read', 'lead', 'Xem danh sách khách hàng tiềm năng'),
('lead:write', 'lead', 'Tạo và chăm sóc khách hàng tiềm năng'),
('finance:read', 'finance', 'Xem khoản phải thu, công nợ và doanh thu'),
('finance:write', 'finance', 'Ghi nhận thanh toán và hoàn tiền'),
('user:read', 'identity', 'Xem danh sách tài khoản người dùng'),
('user:write', 'identity', 'Tạo, phân quyền và khóa tài khoản'),
('report:read', 'report', 'Xem các báo cáo thống kê và dashboard');

-- Phân quyền cho SUPER_ADMIN (toàn quyền)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'SUPER_ADMIN', id FROM permissions;

-- Phân quyền cho CENTER_ADMIN
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'CENTER_ADMIN', id FROM permissions;

-- Phân quyền cho ACADEMIC_STAFF
INSERT INTO role_permissions (role_id, permission_id) VALUES
('ACADEMIC_STAFF', 'course:read'),
('ACADEMIC_STAFF', 'course:write'),
('ACADEMIC_STAFF', 'student:read'),
('ACADEMIC_STAFF', 'student:write'),
('ACADEMIC_STAFF', 'class:read'),
('ACADEMIC_STAFF', 'class:write'),
('ACADEMIC_STAFF', 'enrollment:write'),
('ACADEMIC_STAFF', 'attendance:read'),
('ACADEMIC_STAFF', 'attendance:write');

-- Phân quyền cho ADMISSIONS_STAFF
INSERT INTO role_permissions (role_id, permission_id) VALUES
('ADMISSIONS_STAFF', 'course:read'),
('ADMISSIONS_STAFF', 'student:read'),
('ADMISSIONS_STAFF', 'student:write'),
('ADMISSIONS_STAFF', 'lead:read'),
('ADMISSIONS_STAFF', 'lead:write'),
('ADMISSIONS_STAFF', 'class:read'),
('ADMISSIONS_STAFF', 'enrollment:write');

-- Phân quyền cho ACCOUNTANT
INSERT INTO role_permissions (role_id, permission_id) VALUES
('ACCOUNTANT', 'student:read'),
('ACCOUNTANT', 'class:read'),
('ACCOUNTANT', 'finance:read'),
('ACCOUNTANT', 'finance:write'),
('ACCOUNTANT', 'report:read');

-- Phân quyền cho TEACHER
INSERT INTO role_permissions (role_id, permission_id) VALUES
('TEACHER', 'class:read'),
('TEACHER', 'attendance:read'),
('TEACHER', 'attendance:write');

-- Tạo tài khoản Admin mặc định (mật khẩu: Admin@123456)
INSERT INTO users (username, password_hash, full_name, email, phone, status)
VALUES (
    'admin',
    '$2a$10$GCo1W3NJ.yBgswvWdJ0j5u9t.hIo4vN3cecmDpAR2rA5N.b00t.8K',
    'Quản trị viên Hệ thống',
    'admin@chacademy.vn',
    '0901234567',
    'ACTIVE'
);

-- Gán vai trò SUPER_ADMIN cho tài khoản admin
INSERT INTO user_roles (user_id, role_id)
SELECT id, 'SUPER_ADMIN' FROM users WHERE username = 'admin';
