-- ==============================================================================
-- Flyway Migration V3: Create Courses and Course Categories
-- ==============================================================================

-- 1. Course Categories Table
CREATE TABLE IF NOT EXISTS course_categories (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_course_categories_active ON course_categories(is_active);

-- 2. Courses Table
CREATE TABLE IF NOT EXISTS courses (
    id BIGSERIAL PRIMARY KEY,
    category_id BIGINT NOT NULL REFERENCES course_categories(id) ON DELETE RESTRICT,
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    target_audience VARCHAR(50) NOT NULL DEFAULT 'ALL',
    level VARCHAR(50) NOT NULL DEFAULT 'BEGINNER',
    duration_hours INT NOT NULL DEFAULT 36,
    default_tuition_fee NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    learning_outcomes TEXT,
    max_students INT NOT NULL DEFAULT 20,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_course_duration CHECK (duration_hours > 0),
    CONSTRAINT chk_course_tuition CHECK (default_tuition_fee >= 0),
    CONSTRAINT chk_course_max_students CHECK (max_students > 0),
    CONSTRAINT chk_course_status CHECK (status IN ('DRAFT', 'ACTIVE', 'SUSPENDED', 'ARCHIVED'))
);

CREATE INDEX IF NOT EXISTS idx_courses_category_id ON courses(category_id);
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_target_audience ON courses(target_audience);
CREATE INDEX IF NOT EXISTS idx_courses_is_public ON courses(is_public);

-- 3. Seed Initial Categories
INSERT INTO course_categories (code, name, description, display_order, is_active)
VALUES
    ('ENG-KIDS', 'Tiếng Anh Thiếu Nhi', 'Chương trình phát triển phản xạ tự nhiên và chuẩn âm cho trẻ 4-12 tuổi', 1, TRUE),
    ('ENG-COMM', 'Tiếng Anh Giao Tiếp Người Lớn', 'Rèn luyện phản xạ giao tiếp công sở, du lịch và đời sống thực tế', 2, TRUE),
    ('IELTS-PREP', 'Luyện Thi Chứng Chỉ IELTS', 'Lộ trình chuẩn hóa 4 kỹ năng nghe, nói, đọc, viết cam kết đầu ra', 3, TRUE),
    ('DIGITAL-SKILLS', 'Tin Học & Kỹ Năng Số', 'Lập trình Python, thiết kế đồ họa và kỹ năng ứng dụng công nghệ', 4, TRUE)
ON CONFLICT (code) DO NOTHING;

-- 4. Seed Initial Courses
INSERT INTO courses (category_id, code, name, description, target_audience, level, duration_hours, default_tuition_fee, learning_outcomes, max_students, status, is_public)
SELECT
    cat.id,
    'ENG-KID-01',
    'Tiếng Anh Khởi Động Cho Trẻ Em (Starter Kids)',
    'Khóa học tương tác sinh động với giáo viên bản ngữ và trợ giảng, tạo nền tảng phát âm chuẩn quốc tế ngay từ nhỏ.',
    'KIDS',
    'BEGINNER',
    36,
    3500000.00,
    '- Nhận diện và phát âm chuẩn 100+ từ vựng cơ bản
- Tự tin chào hỏi và trả lời các câu hỏi đơn giản
- Rèn luyện phản xạ nghe qua bài hát và trò chơi tương tác',
    15,
    'ACTIVE',
    TRUE
FROM course_categories cat WHERE cat.code = 'ENG-KIDS'
ON CONFLICT (code) DO NOTHING;

INSERT INTO courses (category_id, code, name, description, target_audience, level, duration_hours, default_tuition_fee, learning_outcomes, max_students, status, is_public)
SELECT
    cat.id,
    'ENG-COMM-PRO',
    'Tiếng Anh Giao Tiếp Công Sở & Doanh Nghiệp',
    'Giải pháp giao tiếp chuyên nghiệp dành cho người đi làm: viết email, đàm phán, thuyết trình và họp trực tuyến.',
    'ADULTS',
    'INTERMEDIATE',
    45,
    4200000.00,
    '- Giao tiếp lưu loát trong môi trường văn phòng quốc tế
- Kỹ năng viết email và lập báo cáo chuẩn mực
- Thuyết trình và dẫn dắt cuộc họp tự tin bằng tiếng Anh',
    18,
    'ACTIVE',
    TRUE
FROM course_categories cat WHERE cat.code = 'ENG-COMM'
ON CONFLICT (code) DO NOTHING;

INSERT INTO courses (category_id, code, name, description, target_audience, level, duration_hours, default_tuition_fee, learning_outcomes, max_students, status, is_public)
SELECT
    cat.id,
    'IELTS-INTENSIVE',
    'Luyện Thi IELTS Học Thuật Cấp Tốc (Mục tiêu 6.5+)',
    'Khóa học tập trung chiến thuật làm bài, sửa bài viết 1:1 và luyện phỏng vấn Speaking trực tiếp chuyên sâu.',
    'ALL',
    'INTERMEDIATE',
    60,
    7800000.00,
    '- Nắm vững toàn bộ phương pháp xử lý các dạng bài Listening & Reading
- Cải thiện từ vựng học thuật Band 7.0+ cho Writing Task 1 & 2
- Tăng độ trôi chảy và mạch lạc trong Speaking',
    12,
    'ACTIVE',
    TRUE
FROM course_categories cat WHERE cat.code = 'IELTS-PREP'
ON CONFLICT (code) DO NOTHING;

INSERT INTO courses (category_id, code, name, description, target_audience, level, duration_hours, default_tuition_fee, learning_outcomes, max_students, status, is_public)
SELECT
    cat.id,
    'PY-DATA-BASICS',
    'Lập Trình Python Căn Bản & Ứng Dụng Xử Lý Dữ Liệu',
    'Khóa học trang bị tư duy giải thuật, cú pháp Python hiện đại và kỹ năng tự động hóa công việc hàng ngày.',
    'ALL',
    'BEGINNER',
    40,
    4500000.00,
    '- Thành thạo tư duy lập trình và cú pháp Python
- Xử lý và làm sạch dữ liệu với Pandas & Excel
- Tự động hóa các tác vụ văn phòng tiết kiệm thời gian',
    20,
    'ACTIVE',
    TRUE
FROM course_categories cat WHERE cat.code = 'DIGITAL-SKILLS'
ON CONFLICT (code) DO NOTHING;
