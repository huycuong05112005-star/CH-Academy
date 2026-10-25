-- ==============================================================================
-- Flyway Migration V9: Add raw_password, Session Materials, Notifications & Teacher Accounts
-- ==============================================================================

-- 1. Add raw_password to users for admin visibility
ALTER TABLE users ADD COLUMN IF NOT EXISTS raw_password VARCHAR(255);

-- Update existing accounts
UPDATE users SET raw_password = 'Admin@123456' WHERE username = 'admin';
UPDATE users SET raw_password = 'Student@123456' WHERE username = 'thuylinh.nguyen@gmail.com';

-- 2. Create Teacher Users if not exists
-- PasswordHash for 'Teacher@123456' using BCrypt
INSERT INTO users (username, password_hash, raw_password, full_name, email, phone, status)
VALUES 
    ('gv.minhhanh', '$2a$10$w19rUqY9n1p55b2nU5f3/u3B65jP7kH59c2z7u59y/q5q.L8jV62K', 'Teacher@123456', 'Nguyễn Thị Minh Hạnh', 'hanh.nguyen@chacademy.vn', '0918889901', 'ACTIVE'),
    ('gv.hoangnam', '$2a$10$w19rUqY9n1p55b2nU5f3/u3B65jP7kH59c2z7u59y/q5q.L8jV62K', 'Teacher@123456', 'Lê Hoàng Nam', 'nam.le@chacademy.vn', '0918889902', 'ACTIVE')
ON CONFLICT (username) DO UPDATE 
SET raw_password = EXCLUDED.raw_password, status = 'ACTIVE';

-- Assign TEACHER role to these users
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, 'TEACHER'
FROM users u
WHERE u.username IN ('gv.minhhanh', 'gv.hoangnam')
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Link users with teachers table
UPDATE teachers t
SET user_id = u.id
FROM users u
WHERE t.teacher_code = 'GV2024001' AND u.username = 'gv.minhhanh';

UPDATE teachers t
SET user_id = u.id
FROM users u
WHERE t.teacher_code = 'GV2024002' AND u.username = 'gv.hoangnam';

-- 3. Create Session Materials Table (Tài liệu học tập theo từng buổi học)
CREATE TABLE IF NOT EXISTS session_materials (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT NOT NULL REFERENCES class_sessions(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    material_type VARCHAR(50) NOT NULL DEFAULT 'DOCUMENT',
    file_url VARCHAR(1000) NOT NULL,
    uploaded_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_material_type CHECK (material_type IN ('SLIDE', 'DOCUMENT', 'EXERCISE', 'VIDEO', 'LINK'))
);

CREATE INDEX IF NOT EXISTS idx_materials_session ON session_materials(session_id);

-- 4. Create Notifications Table (Thông báo cho giáo viên & học viên)
CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    target_audience VARCHAR(50) NOT NULL DEFAULT 'ALL',
    target_class_id BIGINT REFERENCES classes(id) ON DELETE CASCADE,
    priority VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_target_audience CHECK (target_audience IN ('ALL', 'TEACHERS', 'STUDENTS', 'CLASS')),
    CONSTRAINT chk_priority CHECK (priority IN ('NORMAL', 'HIGH', 'URGENT'))
);

CREATE INDEX IF NOT EXISTS idx_notifications_target ON notifications(target_audience);
CREATE INDEX IF NOT EXISTS idx_notifications_class ON notifications(target_class_id);

-- 5. Seed Sessions for Class 2 (CLS-ENG-PRO01) where student Thuỳ Linh is enrolled
INSERT INTO class_sessions (class_id, teacher_id, session_date, start_time, end_time, room, topic, status)
SELECT 
    c.id, 
    c.primary_teacher_id, 
    CURRENT_DATE - INTERVAL '3 days', 
    '19:30:00', 
    '21:00:00', 
    'Phòng Executive 302', 
    'Buổi 01: Giới thiệu khóa học & Kỹ thuật viết Business Email chuẩn quốc tế', 
    'COMPLETED'
FROM classes c WHERE c.code = 'CLS-ENG-PRO01'
ON CONFLICT DO NOTHING;

INSERT INTO class_sessions (class_id, teacher_id, session_date, start_time, end_time, room, topic, status)
SELECT 
    c.id, 
    c.primary_teacher_id, 
    CURRENT_DATE, 
    '19:30:00', 
    '21:00:00', 
    'Phòng Executive 302', 
    'Buổi 02: Kỹ năng thuyết trình dự án & báo cáo số liệu trước ban giám đốc', 
    'SCHEDULED'
FROM classes c WHERE c.code = 'CLS-ENG-PRO01'
ON CONFLICT DO NOTHING;

INSERT INTO class_sessions (class_id, teacher_id, session_date, start_time, end_time, room, topic, status)
SELECT 
    c.id, 
    c.primary_teacher_id, 
    CURRENT_DATE + INTERVAL '2 days', 
    '19:30:00', 
    '21:00:00', 
    'Phòng Executive 302', 
    'Buổi 03: Kỹ năng đàm phán hợp đồng & thương lượng với đối tác nước ngoài', 
    'SCHEDULED'
FROM classes c WHERE c.code = 'CLS-ENG-PRO01'
ON CONFLICT DO NOTHING;

-- Seed attendance for student Thuỳ Linh (ID 2) for Buổi 01
INSERT INTO attendance_records (session_id, student_id, status, note, recorded_by)
SELECT 
    cs.id, 
    2, 
    'PRESENT', 
    'Học viên tham gia thảo luận sôi nổi, phát âm chuẩn và hoàn thành tốt bài viết thư tín mẫu.',
    u.id
FROM class_sessions cs
JOIN classes c ON c.id = cs.class_id
LEFT JOIN users u ON u.username = 'gv.hoangnam'
WHERE c.code = 'CLS-ENG-PRO01' AND cs.topic LIKE 'Buổi 01%'
LIMIT 1
ON CONFLICT (session_id, student_id) DO NOTHING;

-- 6. Seed Materials uploaded by Teacher for Sessions
INSERT INTO session_materials (session_id, title, description, material_type, file_url, uploaded_by)
SELECT 
    cs.id, 
    'Slide Bài Giảng: Kỹ thuật viết Business Email & 50 Cấu trúc kinh điển', 
    'Bộ slide định dạng PDF tổng hợp các mẫu thư gửi đối tác, xin ý kiến sếp và phản hồi khiếu nại.',
    'SLIDE', 
    'https://drive.google.com/file/d/sample-business-email-slides.pdf',
    u.id
FROM class_sessions cs
JOIN classes c ON c.id = cs.class_id
LEFT JOIN users u ON u.username = 'gv.hoangnam'
WHERE c.code = 'CLS-ENG-PRO01' AND cs.topic LIKE 'Buổi 01%'
LIMIT 1;

INSERT INTO session_materials (session_id, title, description, material_type, file_url, uploaded_by)
SELECT 
    cs.id, 
    'Bài tập về nhà Buổi 1: Soạn thảo Email mời thầu quốc tế', 
    'Học viên hoàn thành bài tập theo biểu mẫu đính kèm và nộp trước 20h buổi học tiếp theo.',
    'EXERCISE', 
    'https://drive.google.com/file/d/sample-email-exercise.docx',
    u.id
FROM class_sessions cs
JOIN classes c ON c.id = cs.class_id
LEFT JOIN users u ON u.username = 'gv.hoangnam'
WHERE c.code = 'CLS-ENG-PRO01' AND cs.topic LIKE 'Buổi 01%'
LIMIT 1;

INSERT INTO session_materials (session_id, title, description, material_type, file_url, uploaded_by)
SELECT 
    cs.id, 
    'Tài liệu chuẩn bị Buổi 2: Bộ từ vựng Pitching & Cấu trúc bài thuyết trình đỉnh cao', 
    'Tài liệu đọc trước (Pre-reading) chuẩn bị cho buổi thực hành thuyết trình trực tiếp tại lớp.',
    'DOCUMENT', 
    'https://drive.google.com/file/d/sample-pitching-vocabulary.pdf',
    u.id
FROM class_sessions cs
JOIN classes c ON c.id = cs.class_id
LEFT JOIN users u ON u.username = 'gv.hoangnam'
WHERE c.code = 'CLS-ENG-PRO01' AND cs.topic LIKE 'Buổi 02%'
LIMIT 1;

-- 7. Seed Sample Notifications
INSERT INTO notifications (title, content, target_audience, priority, created_by)
SELECT 
    'Thông báo khai giảng các lớp tiếng Anh và Workshop Giao tiếp tháng 11',
    'Chào mừng quý thầy cô và các bạn học viên! Trung tâm tổ chức chuỗi Workshop thực chiến miễn phí vào thứ Bảy tuần tới.',
    'ALL',
    'NORMAL',
    u.id
FROM users u WHERE u.username = 'admin' LIMIT 1;

INSERT INTO notifications (title, content, target_audience, priority, created_by)
SELECT 
    'Nhắc nhở cập nhật giáo án và hoàn tất điểm danh trước 22h hàng ngày',
    'Kính gửi quý thầy cô: Đề nghị các thầy cô chủ động tải tài liệu học tập trước buổi học 24h và hoàn thành điểm danh lớp ngay sau khi kết thúc ca dạy.',
    'TEACHERS',
    'HIGH',
    u.id
FROM users u WHERE u.username = 'admin' LIMIT 1;

INSERT INTO notifications (title, content, target_audience, target_class_id, priority, created_by)
SELECT 
    'Lớp CLS-ENG-PRO01: Tài liệu bài học số 2 đã được cập nhật',
    'Thầy Nam đã tải lên tài liệu chuẩn bị cho buổi thực hành thuyết trình. Các bạn học viên vào mục Tài liệu lớp học để tải về nhé!',
    'CLASS',
    c.id,
    'HIGH',
    u.id
FROM classes c
LEFT JOIN users u ON u.username = 'gv.hoangnam'
WHERE c.code = 'CLS-ENG-PRO01' LIMIT 1;
