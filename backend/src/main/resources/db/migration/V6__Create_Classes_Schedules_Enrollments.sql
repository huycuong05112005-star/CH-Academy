-- ==============================================================================
-- Flyway Migration V6: Create Teachers, Classes, Schedules, Sessions & Enrollments
-- ==============================================================================

-- 1. Teachers Table
CREATE TABLE IF NOT EXISTS teachers (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE REFERENCES users(id) ON DELETE SET NULL,
    teacher_code VARCHAR(30) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    specialization VARCHAR(255),
    bio TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_teacher_status CHECK (status IN ('ACTIVE', 'ON_LEAVE', 'RESIGNED'))
);

CREATE INDEX IF NOT EXISTS idx_teachers_code ON teachers(teacher_code);
CREATE INDEX IF NOT EXISTS idx_teachers_status ON teachers(status);

-- 2. Classes Table
CREATE TABLE IF NOT EXISTS classes (
    id BIGSERIAL PRIMARY KEY,
    course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
    primary_teacher_id BIGINT REFERENCES teachers(id) ON DELETE SET NULL,
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    max_capacity INT NOT NULL DEFAULT 15,
    room VARCHAR(50),
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'PLANNING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_class_status CHECK (status IN ('PLANNING', 'OPEN_FOR_ENROLLMENT', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    CONSTRAINT chk_class_capacity CHECK (max_capacity > 0)
);

CREATE INDEX IF NOT EXISTS idx_classes_course ON classes(course_id);
CREATE INDEX IF NOT EXISTS idx_classes_teacher ON classes(primary_teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_status ON classes(status);

-- 3. Class Recurring Schedules (Thứ trong tuần, khung giờ lặp lại)
CREATE TABLE IF NOT EXISTS class_schedules (
    id BIGSERIAL PRIMARY KEY,
    class_id BIGINT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL, -- 1: Thứ 2, 2: Thứ 3, ..., 7: Chủ Nhật
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_schedule_dow CHECK (day_of_week BETWEEN 1 AND 7),
    CONSTRAINT chk_schedule_time CHECK (start_time < end_time)
);

CREATE INDEX IF NOT EXISTS idx_class_schedules_class ON class_schedules(class_id);

-- 4. Class Specific Sessions (Buổi học cụ thể)
CREATE TABLE IF NOT EXISTS class_sessions (
    id BIGSERIAL PRIMARY KEY,
    class_id BIGINT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    teacher_id BIGINT REFERENCES teachers(id) ON DELETE SET NULL,
    session_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room VARCHAR(50),
    topic VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_session_status CHECK (status IN ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED')),
    CONSTRAINT chk_session_time CHECK (start_time < end_time)
);

CREATE INDEX IF NOT EXISTS idx_class_sessions_class ON class_sessions(class_id);
CREATE INDEX IF NOT EXISTS idx_class_sessions_teacher ON class_sessions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_class_sessions_date ON class_sessions(session_date);

-- 5. Enrollments Table (Ghi danh học viên vào lớp)
CREATE TABLE IF NOT EXISTS enrollments (
    id BIGSERIAL PRIMARY KEY,
    class_id BIGINT NOT NULL REFERENCES classes(id) ON DELETE RESTRICT,
    student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    applied_tuition_fee NUMERIC(15, 2) NOT NULL,
    discount_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    final_fee NUMERIC(15, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ENROLLED',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_enrollment_status CHECK (status IN ('ENROLLED', 'DROPPED', 'COMPLETED')),
    CONSTRAINT chk_enrollment_fees CHECK (applied_tuition_fee >= 0 AND discount_amount >= 0 AND final_fee >= 0),
    CONSTRAINT uq_class_student UNIQUE (class_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_class ON enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);

-- 6. Seed Sample Teachers
INSERT INTO teachers (teacher_code, full_name, email, phone, specialization, status)
VALUES
('GV2024001', 'Nguyễn Thị Minh Hạnh', 'hanh.nguyen@chacademy.vn', '0918889901', 'Tiếng Anh Thiếu Nhi & Cambridge Starters', 'ACTIVE'),
('GV2024002', 'Lê Hoàng Nam', 'nam.le@chacademy.vn', '0918889902', 'IELTS 8.0 & Tiếng Anh Giao Tiếp Doanh Nghiệp', 'ACTIVE')
ON CONFLICT (teacher_code) DO NOTHING;

-- 7. Seed Sample Classes
INSERT INTO classes (course_id, primary_teacher_id, code, name, max_capacity, room, start_date, end_date, status)
SELECT
    c.id,
    t.id,
    'CLS-ENG-KID01',
    'Lớp Tiếng Anh Trẻ Em K01 (Tối 2-4-6)',
    12,
    'Phòng 201',
    CURRENT_DATE + INTERVAL '7 days',
    CURRENT_DATE + INTERVAL '97 days',
    'OPEN_FOR_ENROLLMENT'
FROM courses c, teachers t
WHERE c.code = 'ENG-KID-01' AND t.teacher_code = 'GV2024001'
ON CONFLICT (code) DO NOTHING;

INSERT INTO classes (course_id, primary_teacher_id, code, name, max_capacity, room, start_date, end_date, status)
SELECT
    c.id,
    t.id,
    'CLS-ENG-PRO01',
    'Lớp Giao Tiếp Công Sở Chuyên Sâu C01',
    15,
    'Phòng 302',
    CURRENT_DATE + INTERVAL '10 days',
    CURRENT_DATE + INTERVAL '70 days',
    'OPEN_FOR_ENROLLMENT'
FROM courses c, teachers t
WHERE c.code = 'ENG-COMM-PRO' AND t.teacher_code = 'GV2024002'
ON CONFLICT (code) DO NOTHING;

-- 8. Seed Schedules for CLS-ENG-KID01 (Thứ 2, 4, 6 từ 18:00 - 19:30)
INSERT INTO class_schedules (class_id, day_of_week, start_time, end_time, room)
SELECT cls.id, 1, '18:00:00', '19:30:00', 'Phòng 201' FROM classes cls WHERE cls.code = 'CLS-ENG-KID01';

INSERT INTO class_schedules (class_id, day_of_week, start_time, end_time, room)
SELECT cls.id, 3, '18:00:00', '19:30:00', 'Phòng 201' FROM classes cls WHERE cls.code = 'CLS-ENG-KID01';

INSERT INTO class_schedules (class_id, day_of_week, start_time, end_time, room)
SELECT cls.id, 5, '18:00:00', '19:30:00', 'Phòng 201' FROM classes cls WHERE cls.code = 'CLS-ENG-KID01';

-- 9. Seed Sample Enrollments
INSERT INTO enrollments (class_id, student_id, enrollment_date, applied_tuition_fee, discount_amount, final_fee, status)
SELECT
    cls.id,
    s.id,
    CURRENT_DATE,
    3200000.00,
    200000.00,
    3000000.00,
    'ENROLLED'
FROM classes cls, students s
WHERE cls.code = 'CLS-ENG-KID01' AND s.student_code = 'HV20240001'
ON CONFLICT (class_id, student_id) DO NOTHING;
