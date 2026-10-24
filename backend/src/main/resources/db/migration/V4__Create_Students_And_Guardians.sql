-- ==============================================================================
-- Flyway Migration V4: Create Students, Guardians, and StudentGuardians
-- ==============================================================================

-- 1. Guardians Table
CREATE TABLE IF NOT EXISTS guardians (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE REFERENCES users(id) ON DELETE SET NULL,
    guardian_code VARCHAR(30) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    address TEXT,
    occupation VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_guardians_phone ON guardians(phone);

-- 2. Students Table
CREATE TABLE IF NOT EXISTS students (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE REFERENCES users(id) ON DELETE SET NULL,
    student_code VARCHAR(30) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(10) NOT NULL DEFAULT 'OTHER',
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    target_type VARCHAR(20) NOT NULL DEFAULT 'ADULT',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    internal_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_student_gender CHECK (gender IN ('MALE', 'FEMALE', 'OTHER')),
    CONSTRAINT chk_student_target_type CHECK (target_type IN ('KID', 'ADULT')),
    CONSTRAINT chk_student_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'GRADUATED', 'DROPPED'))
);

CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_students_phone ON students(phone);
CREATE INDEX IF NOT EXISTS idx_students_target_type ON students(target_type);

-- 3. Student-Guardians Many-to-Many Relationship Table
CREATE TABLE IF NOT EXISTS student_guardians (
    student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    guardian_id BIGINT NOT NULL REFERENCES guardians(id) ON DELETE CASCADE,
    relationship_type VARCHAR(30) NOT NULL DEFAULT 'OTHER',
    is_primary_contact BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (student_id, guardian_id)
);

-- 4. Seed Initial Guardians
INSERT INTO guardians (guardian_code, full_name, phone, email, address, occupation)
VALUES
    ('PH2024001', 'Trần Văn Dũng', '0912345678', 'dung.tran@gmail.com', '12 Nguyễn Trãi, Thanh Xuân, Hà Nội', 'Kỹ sư phần mềm'),
    ('PH2024002', 'Lê Thị Mai', '0934567890', 'mai.le@gmail.com', '45 Hoàng Hoa Thám, Ba Đình, Hà Nội', 'Dược sĩ')
ON CONFLICT (guardian_code) DO NOTHING;

-- 5. Seed Initial Students
INSERT INTO students (student_code, full_name, date_of_birth, gender, phone, email, address, target_type, status, internal_notes)
VALUES
    ('HV20240001', 'Trần Minh Khôi', '2016-05-15', 'MALE', NULL, NULL, '12 Nguyễn Trãi, Thanh Xuân, Hà Nội', 'KID', 'ACTIVE', 'Học viên chăm chỉ, năng nổ trong các hoạt động phản xạ'),
    ('HV20240002', 'Nguyễn Thùy Linh', '1998-11-20', 'FEMALE', '0987654321', 'thuylinh.nguyen@gmail.com', '88 Cầu Giấy, Hà Nội', 'ADULT', 'ACTIVE', 'Nhân viên văn phòng, mục tiêu giao tiếp tự tin'),
    ('HV20240003', 'Lê Hoàng Long', '2002-03-10', 'MALE', '0978112233', 'long.le@gmail.com', '24 Điện Biên Phủ, Đà Nẵng', 'ADULT', 'ACTIVE', 'Sinh viên đại học, chuẩn bị thi IELTS du học')
ON CONFLICT (student_code) DO NOTHING;

-- 6. Link Student 1 with Guardian 1
INSERT INTO student_guardians (student_id, guardian_id, relationship_type, is_primary_contact)
SELECT s.id, g.id, 'FATHER', TRUE
FROM students s, guardians g
WHERE s.student_code = 'HV20240001' AND g.guardian_code = 'PH2024001'
ON CONFLICT (student_id, guardian_id) DO NOTHING;
