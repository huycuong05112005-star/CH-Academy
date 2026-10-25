-- ==============================================================================
-- Flyway Migration V10: Create Audit Logs and Teacher Assignments
-- ==============================================================================

-- 1. Create Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    actor_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    actor_username VARCHAR(100),
    actor_role VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(100),
    details TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_username);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- 2. Create Teacher Assignments Table (Lịch sử & Phân công giáo viên vào lớp)
CREATE TABLE IF NOT EXISTS teacher_assignments (
    id BIGSERIAL PRIMARY KEY,
    class_id BIGINT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    teacher_id BIGINT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    role VARCHAR(30) NOT NULL DEFAULT 'PRIMARY',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    assigned_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_assign_role CHECK (role IN ('PRIMARY', 'ASSISTANT', 'SUBSTITUTE')),
    CONSTRAINT chk_assign_status CHECK (status IN ('ACTIVE', 'ENDED'))
);

CREATE INDEX IF NOT EXISTS idx_teacher_assign_class ON teacher_assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assign_teacher ON teacher_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assign_status ON teacher_assignments(status);

-- 3. Seed Initial Assignments from existing classes
INSERT INTO teacher_assignments (class_id, teacher_id, role, status, start_date, assigned_by, notes)
SELECT c.id, c.primary_teacher_id, 'PRIMARY', 'ACTIVE', c.start_date, (SELECT id FROM users WHERE username = 'admin' LIMIT 1), 'Phân công tự động từ dữ liệu lớp học'
FROM classes c
WHERE c.primary_teacher_id IS NOT NULL;

-- 4. Seed Initial Audit Logs
INSERT INTO audit_logs (actor_username, actor_role, action, resource_type, resource_id, details)
VALUES
    ('admin', 'SUPER_ADMIN', 'SYSTEM_INITIALIZE', 'SYSTEM', '1', 'Khởi tạo nền tảng đa cổng Multi-Portal CH Academy'),
    ('admin', 'SUPER_ADMIN', 'TEACHER_ASSIGN', 'CLASS', '2', 'Phân công giáo viên Lê Hoàng Nam phụ trách lớp CLS-ENG-PRO01'),
    ('gv.hoangnam', 'TEACHER', 'MATERIAL_UPLOAD', 'SESSION_MATERIAL', '1', 'Tải lên giáo trình và slide buổi 1'),
    ('gv.hoangnam', 'TEACHER', 'ATTENDANCE_RECORD', 'SESSION', '1', 'Điểm danh buổi học 1 cho học viên');
