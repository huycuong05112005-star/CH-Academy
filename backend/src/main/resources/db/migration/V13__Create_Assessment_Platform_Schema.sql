-- ==============================================================================
-- Flyway Migration V13: Create CH Academy Assessment Platform Schema
-- Hệ thống Kiểm tra Đánh giá Trực tuyến Toàn diện CH Academy
-- ==============================================================================

-- 1. Ngân hàng câu hỏi (Question Banks)
CREATE TABLE IF NOT EXISTS question_banks (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    course_id BIGINT REFERENCES courses(id) ON DELETE SET NULL,
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_qbank_status CHECK (status IN ('ACTIVE', 'ARCHIVED'))
);

CREATE INDEX IF NOT EXISTS idx_qbank_course ON question_banks(course_id);
CREATE INDEX IF NOT EXISTS idx_qbank_status ON question_banks(status);

-- 2. Câu hỏi (Questions)
CREATE TABLE IF NOT EXISTS questions (
    id BIGSERIAL PRIMARY KEY,
    bank_id BIGINT REFERENCES question_banks(id) ON DELETE SET NULL,
    course_id BIGINT REFERENCES courses(id) ON DELETE SET NULL,
    code VARCHAR(50),
    type VARCHAR(30) NOT NULL,
    difficulty VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    topic VARCHAR(100) NOT NULL DEFAULT 'Chung',
    learning_outcome VARCHAR(100) DEFAULT 'APPLY',
    content TEXT NOT NULL,
    default_points NUMERIC(5, 2) NOT NULL DEFAULT 1.00,
    explanation TEXT,
    rubric_json TEXT,
    answer_key TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_q_type CHECK (type IN ('SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_IN_BLANK', 'SHORT_ANSWER', 'ESSAY')),
    CONSTRAINT chk_q_difficulty CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD', 'EXPERT')),
    CONSTRAINT chk_q_status CHECK (status IN ('ACTIVE', 'DRAFT', 'ARCHIVED'))
);

CREATE INDEX IF NOT EXISTS idx_questions_bank ON questions(bank_id);
CREATE INDEX IF NOT EXISTS idx_questions_course ON questions(course_id);
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(type);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions(topic);
CREATE INDEX IF NOT EXISTS idx_questions_status ON questions(status);

-- 3. Phương án trả lời cho trắc nghiệm (Question Options)
CREATE TABLE IF NOT EXISTS question_options (
    id BIGSERIAL PRIMARY KEY,
    question_id BIGINT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    option_code VARCHAR(10) NOT NULL,
    content TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INT NOT NULL DEFAULT 0,
    explanation TEXT
);

CREATE INDEX IF NOT EXISTS idx_qoptions_question ON question_options(question_id);

-- 4. Đề thi (Exams)
CREATE TABLE IF NOT EXISTS exams (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    course_id BIGINT REFERENCES courses(id) ON DELETE SET NULL,
    teacher_id BIGINT REFERENCES teachers(id) ON DELETE SET NULL,
    duration_minutes INT NOT NULL DEFAULT 45,
    pass_percentage NUMERIC(5, 2) NOT NULL DEFAULT 50.00,
    max_attempts INT NOT NULL DEFAULT 1,
    shuffle_questions BOOLEAN NOT NULL DEFAULT TRUE,
    shuffle_options BOOLEAN NOT NULL DEFAULT TRUE,
    show_result_mode VARCHAR(30) NOT NULL DEFAULT 'IMMEDIATELY',
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    version INT NOT NULL DEFAULT 1,
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_exam_status CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED', 'CLOSED')),
    CONSTRAINT chk_exam_duration CHECK (duration_minutes > 0),
    CONSTRAINT chk_exam_pass CHECK (pass_percentage >= 0 AND pass_percentage <= 100)
);

CREATE INDEX IF NOT EXISTS idx_exams_course ON exams(course_id);
CREATE INDEX IF NOT EXISTS idx_exams_teacher ON exams(teacher_id);
CREATE INDEX IF NOT EXISTS idx_exams_status ON exams(status);
CREATE INDEX IF NOT EXISTS idx_exams_start_end ON exams(start_time, end_time);

-- 5. Liên kết Đề thi - Câu hỏi & Phân bổ điểm (Exam Questions)
CREATE TABLE IF NOT EXISTS exam_questions (
    id BIGSERIAL PRIMARY KEY,
    exam_id BIGINT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    question_id BIGINT NOT NULL REFERENCES questions(id) ON DELETE RESTRICT,
    points NUMERIC(5, 2) NOT NULL DEFAULT 1.00,
    sort_order INT NOT NULL DEFAULT 0,
    CONSTRAINT uq_exam_question UNIQUE (exam_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_eq_exam ON exam_questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_eq_question ON exam_questions(question_id);

-- 6. Giao đề thi theo Lớp hoặc Học viên (Exam Assignments)
CREATE TABLE IF NOT EXISTS exam_assignments (
    id BIGSERIAL PRIMARY KEY,
    exam_id BIGINT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    class_id BIGINT REFERENCES classes(id) ON DELETE CASCADE,
    student_id BIGINT REFERENCES students(id) ON DELETE CASCADE,
    assigned_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMPTZ,
    CONSTRAINT chk_exam_assign_target CHECK (class_id IS NOT NULL OR student_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_ea_exam ON exam_assignments(exam_id);
CREATE INDEX IF NOT EXISTS idx_ea_class ON exam_assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_ea_student ON exam_assignments(student_id);

-- 7. Snapshot đề thi (Exam Snapshots - bảo đảm phiên bản lịch sử không bị thay đổi)
CREATE TABLE IF NOT EXISTS exam_snapshots (
    id BIGSERIAL PRIMARY KEY,
    exam_id BIGINT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    version INT NOT NULL DEFAULT 1,
    snapshot_json TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_es_exam_ver ON exam_snapshots(exam_id, version);

-- 8. Lượt làm bài kiểm tra (Exam Attempts)
CREATE TABLE IF NOT EXISTS exam_attempts (
    id BIGSERIAL PRIMARY KEY,
    exam_id BIGINT NOT NULL REFERENCES exams(id) ON DELETE RESTRICT,
    snapshot_id BIGINT REFERENCES exam_snapshots(id) ON DELETE SET NULL,
    student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    attempt_number INT NOT NULL DEFAULT 1,
    status VARCHAR(30) NOT NULL DEFAULT 'IN_PROGRESS',
    started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMPTZ,
    due_at TIMESTAMPTZ NOT NULL,
    total_score NUMERIC(5, 2) DEFAULT 0.00,
    max_score NUMERIC(5, 2) DEFAULT 0.00,
    percentage NUMERIC(5, 2) DEFAULT 0.00,
    is_passed BOOLEAN DEFAULT FALSE,
    ip_address VARCHAR(50),
    user_agent VARCHAR(255),
    idempotency_key VARCHAR(100) UNIQUE,
    graded_at TIMESTAMPTZ,
    graded_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_attempt_status CHECK (status IN ('IN_PROGRESS', 'SUBMITTED', 'GRADING', 'GRADED', 'EXPIRED', 'CANCELLED')),
    CONSTRAINT uq_exam_student_attempt UNIQUE (exam_id, student_id, attempt_number)
);

CREATE INDEX IF NOT EXISTS idx_ea_student_attempts ON exam_attempts(student_id, status);
CREATE INDEX IF NOT EXISTS idx_ea_exam_attempts ON exam_attempts(exam_id, status);
CREATE INDEX IF NOT EXISTS idx_ea_started_due ON exam_attempts(started_at, due_at);

-- 9. Câu trả lời chi tiết của học viên (Attempt Answers)
CREATE TABLE IF NOT EXISTS attempt_answers (
    id BIGSERIAL PRIMARY KEY,
    attempt_id BIGINT NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
    question_id BIGINT NOT NULL REFERENCES questions(id) ON DELETE RESTRICT,
    selected_option_ids VARCHAR(255),
    text_answer TEXT,
    is_marked_for_review BOOLEAN NOT NULL DEFAULT FALSE,
    score NUMERIC(5, 2) DEFAULT 0.00,
    max_score NUMERIC(5, 2) NOT NULL DEFAULT 1.00,
    is_correct BOOLEAN DEFAULT NULL,
    teacher_feedback TEXT,
    rubric_breakdown TEXT,
    auto_graded BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_attempt_question UNIQUE (attempt_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_aa_attempt ON attempt_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_aa_question ON attempt_answers(question_id);

-- 10. Bổ sung các Permissions cho Module Assessment
INSERT INTO permissions (id, module, description) VALUES
('assessment:read', 'assessment', 'Xem danh sách câu hỏi, đề thi và kết quả làm bài'),
('assessment:write', 'assessment', 'Tạo, sửa và phát hành câu hỏi, đề thi'),
('assessment:grade', 'assessment', 'Chấm điểm tự luận, cập nhật nhận xét và chấm lại'),
('assessment:take', 'assessment', 'Vào phòng thi và nộp bài làm')
ON CONFLICT (id) DO NOTHING;

-- Phân quyền cho SUPER_ADMIN và CENTER_ADMIN
INSERT INTO role_permissions (role_id, permission_id) VALUES
('SUPER_ADMIN', 'assessment:read'),
('SUPER_ADMIN', 'assessment:write'),
('SUPER_ADMIN', 'assessment:grade'),
('SUPER_ADMIN', 'assessment:take'),
('CENTER_ADMIN', 'assessment:read'),
('CENTER_ADMIN', 'assessment:write'),
('CENTER_ADMIN', 'assessment:grade'),
('CENTER_ADMIN', 'assessment:take'),
('ACADEMIC_STAFF', 'assessment:read'),
('ACADEMIC_STAFF', 'assessment:write'),
('ACADEMIC_STAFF', 'assessment:grade'),
('TEACHER', 'assessment:read'),
('TEACHER', 'assessment:write'),
('TEACHER', 'assessment:grade'),
('STUDENT', 'assessment:read'),
('STUDENT', 'assessment:take')
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- SEED DỮ LIỆU MẪU ĐÁNH GIÁ (EdTech Standard Seed Data)
-- ==============================================================================

-- 1. Ngân hàng câu hỏi mẫu
INSERT INTO question_banks (id, name, code, description, course_id, created_by, status)
VALUES
(1, 'Ngân hàng Kiểm tra Tiếng Anh Doanh nghiệp & Thương mại', 'QB-ENG-BUS01', 'Tổng hợp câu hỏi ngữ pháp, từ vựng và tình huống công sở chuẩn Business English', 2, 1, 'ACTIVE'),
(2, 'Ngân hàng Đánh giá Năng lực Phản xạ Giao tiếp Cơ bản', 'QB-ENG-KID01', 'Bộ câu hỏi hình ảnh, từ vựng đời sống và phát âm dành cho học viên tiểu học', 1, 1, 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- 2. Bộ câu hỏi đa dạng các dạng (SINGLE_CHOICE, MULTIPLE_CHOICE, TRUE_FALSE, FILL_IN_BLANK, SHORT_ANSWER, ESSAY)
-- Câu 1: Single choice
INSERT INTO questions (id, bank_id, course_id, code, type, difficulty, topic, learning_outcome, content, default_points, explanation, answer_key, status, created_by)
VALUES
(1, 1, 2, 'Q-BUS-001', 'SINGLE_CHOICE', 'EASY', 'Business Communication', 'APPLY', 
 'Trong thư điện tử thương mại gửi đối tác lần đầu, câu chào mở đầu nào sau đây thể hiện tính chuyên nghiệp và chuẩn mực nhất?', 
 2.00, 'Trong giao dịch quốc tế trang trọng khi đã biết họ của đối tác, Dear Mr./Ms. [Last Name] là chuẩn mực chuyên nghiệp cao nhất.', 'A', 'ACTIVE', 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO question_options (id, question_id, option_code, content, is_correct, sort_order) VALUES
(1, 1, 'A', 'Dear Mr. Miller, / Dear Ms. Davis,', TRUE, 1),
(2, 1, 'B', 'Hey Miller, what''s up?', FALSE, 2),
(3, 1, 'C', 'Yo buddy, hope you are doing good,', FALSE, 3),
(4, 1, 'D', 'Hi Mr. John Miller,', FALSE, 4)
ON CONFLICT (id) DO NOTHING;

-- Câu 2: Multiple choice
INSERT INTO questions (id, bank_id, course_id, code, type, difficulty, topic, learning_outcome, content, default_points, explanation, answer_key, status, created_by)
VALUES
(2, 1, 2, 'Q-BUS-002', 'MULTIPLE_CHOICE', 'MEDIUM', 'Vocabulary & Negotiation', 'ANALYZE', 
 'Những cụm từ nào sau đây có thể sử dụng khi muốn lịch sự bày tỏ sự bất đồng quan điểm trong phiên đàm phán hợp đồng? (Chọn tất cả đáp án đúng)', 
 2.00, 'Các phương án B và C là những cách phản đối lịch sự và mềm dẻo trong văn hóa thương lượng phương Tây.', 'B,C', 'ACTIVE', 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO question_options (id, question_id, option_code, content, is_correct, sort_order) VALUES
(5, 2, 'A', 'You are totally wrong about the delivery terms.', FALSE, 1),
(6, 2, 'B', 'I see your point, but from our perspective, we need to consider the lead time.', TRUE, 2),
(7, 2, 'C', 'I am afraid we cannot agree to this clause as currently worded.', TRUE, 3),
(8, 2, 'D', 'No way, that makes zero sense for our company.', FALSE, 4)
ON CONFLICT (id) DO NOTHING;

-- Câu 3: True / False
INSERT INTO questions (id, bank_id, course_id, code, type, difficulty, topic, learning_outcome, content, default_points, explanation, answer_key, status, created_by)
VALUES
(3, 1, 2, 'Q-BUS-003', 'TRUE_FALSE', 'EASY', 'Business Etiquette', 'UNDERSTAND', 
 'Trong email thông báo hoãn họp đột xuất, việc nêu lý do ngắn gọn và đề xuất thời gian họp thay thế là điều bắt buộc theo quy tắc ứng xử công sở hiện đại.', 
 1.50, 'Đúng. Việc đưa ra phương án thay thế ngay giúp tiết kiệm thời gian cho các bên liên quan.', 'TRUE', 'ACTIVE', 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO question_options (id, question_id, option_code, content, is_correct, sort_order) VALUES
(9, 3, 'T', 'Đúng (True)', TRUE, 1),
(10, 3, 'F', 'Sai (False)', FALSE, 2)
ON CONFLICT (id) DO NOTHING;

-- Câu 4: Fill in blank
INSERT INTO questions (id, bank_id, course_id, code, type, difficulty, topic, learning_outcome, content, default_points, explanation, answer_key, status, created_by)
VALUES
(4, 1, 2, 'Q-BUS-004', 'FILL_IN_BLANK', 'MEDIUM', 'Grammar & Prepositions', 'APPLY', 
 'Điền giới từ thích hợp vào chỗ trống: "We look forward ___ hearing from your team soon."', 
 1.50, 'Cấu trúc cố định: look forward to + V-ing.', 'to', 'ACTIVE', 1)
ON CONFLICT (id) DO NOTHING;

-- Câu 5: Short answer
INSERT INTO questions (id, bank_id, course_id, code, type, difficulty, topic, learning_outcome, content, default_points, explanation, answer_key, status, created_by)
VALUES
(5, 1, 2, 'Q-BUS-005', 'SHORT_ANSWER', 'MEDIUM', 'Vocabulary & Negotiation', 'REMEMBER', 
 'Thuật ngữ tiếng Anh viết tắt đại diện cho thỏa thuận bảo mật thông tin giữa hai doanh nghiệp là gì? (Viết dạng 3 chữ cái viết hoa)', 
 1.00, 'NDA là viết tắt của Non-Disclosure Agreement (Thỏa thuận không tiết lộ thông tin).', 'NDA', 'ACTIVE', 1)
ON CONFLICT (id) DO NOTHING;

-- Câu 6: Essay with Rubric
INSERT INTO questions (id, bank_id, course_id, code, type, difficulty, topic, learning_outcome, content, default_points, explanation, rubric_json, status, created_by)
VALUES
(6, 1, 2, 'Q-BUS-006', 'ESSAY', 'HARD', 'Business Writing', 'APPLY', 
 'Bạn là Quản lý dự án tại CH Academy. Hãy soạn một đoạn email ngắn (khoảng 80 - 120 từ) gửi cho đối tác Global Tech thông báo về việc tiến độ bàn giao phần mềm kiểm tra trực tuyến bị trễ 3 ngày do cần tối ưu hóa hiệu năng chịu tải, đồng thời đề xuất buổi demo bù vào sáng thứ Hai tuần tới.', 
 2.00, 
 'Tiêu chí đánh giá gồm: Văn phong trang trọng (0.5đ), Đầy đủ thông tin lý do và giải pháp bù (0.75đ), Ngữ pháp và từ vựng chuẩn xác (0.75đ).',
 '{"criteria":[{"name":"Tone & Style","maxScore":0.5,"description":"Văn phong trang trọng, lịch sự, xin lỗi chân thành"},{"name":"Completeness","maxScore":0.75,"description":"Nêu rõ lý do trễ và đề xuất thời gian họp demo thay thế"},{"name":"Grammar & Vocabulary","maxScore":0.75,"description":"Sử dụng chính xác thì quá khứ/hiện tại hoàn thành, không lỗi chính tả"}]}',
 'ACTIVE', 1)
ON CONFLICT (id) DO NOTHING;

-- Cập nhật chuỗi sequence của câu hỏi và options
SELECT setval('questions_id_seq', (SELECT COALESCE(MAX(id), 1) FROM questions));
SELECT setval('question_options_id_seq', (SELECT COALESCE(MAX(id), 1) FROM question_options));
SELECT setval('question_banks_id_seq', (SELECT COALESCE(MAX(id), 1) FROM question_banks));

-- 3. Đề thi mẫu: "Đánh Giá Năng Lực Tiếng Anh Thương Mại & Giao Tiếp Đột Phá"
INSERT INTO exams (id, title, code, description, course_id, teacher_id, duration_minutes, pass_percentage, max_attempts, shuffle_questions, shuffle_options, show_result_mode, start_time, end_time, status, version, created_by)
VALUES
(1, 'Bài Kiểm Tra Giữa Kỳ: Kỹ Năng Giao Tiếp & Soạn Thảo Văn Bản Thương Mại', 'EXAM-ENG-MID01', 
 'Bài kiểm tra đánh giá toàn diện năng lực phản xạ tiếng Anh công sở, từ vựng đàm phán và kỹ năng viết email xử lý tình huống thực tế.',
 2, 2, 30, 60.00, 2, FALSE, FALSE, 'IMMEDIATELY',
 CURRENT_TIMESTAMP - INTERVAL '2 days',
 CURRENT_TIMESTAMP + INTERVAL '30 days',
 'PUBLISHED', 1, 1)
ON CONFLICT (id) DO NOTHING;

-- Phân bổ câu hỏi vào đề 1 (Tổng điểm = 2 + 2 + 1.5 + 1.5 + 1 + 2 = 10.00 điểm)
INSERT INTO exam_questions (exam_id, question_id, points, sort_order) VALUES
(1, 1, 2.00, 1),
(1, 2, 2.00, 2),
(1, 3, 1.50, 3),
(1, 4, 1.50, 4),
(1, 5, 1.00, 5),
(1, 6, 2.00, 6)
ON CONFLICT (exam_id, question_id) DO NOTHING;

-- Giao đề 1 cho Lớp 2 (Giao Tiếp Công Sở Chuyên Sâu C01)
INSERT INTO exam_assignments (exam_id, class_id, student_id, assigned_by, due_date)
VALUES
(1, 2, NULL, 1, CURRENT_TIMESTAMP + INTERVAL '30 days')
ON CONFLICT DO NOTHING;

-- Snapshot cho đề 1
INSERT INTO exam_snapshots (id, exam_id, version, snapshot_json, created_at)
VALUES
(1, 1, 1, '{"examId":1,"title":"Bài Kiểm Tra Giữa Kỳ: Kỹ Năng Giao Tiếp & Soạn Thảo Văn Bản Thương Mại","durationMinutes":30,"questionsCount":6,"maxPoints":10.00}', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

SELECT setval('exams_id_seq', (SELECT COALESCE(MAX(id), 1) FROM exams));
SELECT setval('exam_snapshots_id_seq', (SELECT COALESCE(MAX(id), 1) FROM exam_snapshots));

-- 4. Seed Lượt thi đã nộp của học viên 1 (Nguyễn Thùy Linh - student_id 1) để có dữ liệu phân tích ngay
INSERT INTO exam_attempts (id, exam_id, snapshot_id, student_id, attempt_number, status, started_at, submitted_at, due_at, total_score, max_score, percentage, is_passed, idempotency_key, graded_at, graded_by)
VALUES
(1, 1, 1, 1, 1, 'GRADED', 
 CURRENT_TIMESTAMP - INTERVAL '1 day 2 hours', 
 CURRENT_TIMESTAMP - INTERVAL '1 day 1 hour 35 minutes', 
 CURRENT_TIMESTAMP - INTERVAL '1 day 1 hour 30 minutes',
 9.25, 10.00, 92.50, TRUE, 'SEED_ATTEMPT_001', 
 CURRENT_TIMESTAMP - INTERVAL '1 day 1 hour', 1)
ON CONFLICT (id) DO NOTHING;

-- Chi tiết đáp án của học viên 1
INSERT INTO attempt_answers (attempt_id, question_id, selected_option_ids, text_answer, is_marked_for_review, score, max_score, is_correct, teacher_feedback, auto_graded)
VALUES
(1, 1, '1', NULL, FALSE, 2.00, 2.00, TRUE, 'Chính xác. Cách xưng hô chuẩn xác.', TRUE),
(1, 2, '6,7', NULL, FALSE, 2.00, 2.00, TRUE, 'Tuyệt vời. Chọn đúng đầy đủ cả 2 phương án lịch sự.', TRUE),
(1, 3, '9', NULL, FALSE, 1.50, 1.50, TRUE, 'Chính xác.', TRUE),
(1, 4, NULL, 'to', FALSE, 1.50, 1.50, TRUE, 'Chính xác.', TRUE),
(1, 5, NULL, 'NDA', FALSE, 1.00, 1.00, TRUE, 'Chuẩn xác.', TRUE),
(1, 6, NULL, 'Dear Global Tech Team, I am writing to sincerely apologize that our delivery of the online assessment platform will be delayed by three business days. We are conducting deep load-testing to ensure high concurrency stability for 1,000 users. We would love to reschedule our project demo to next Monday at 9:00 AM. Thank you for your understanding. Best regards, Project Lead.', FALSE, 1.25, 2.00, TRUE, 'Bài viết rất trôi chảy, đúng cấu trúc kinh doanh, từ vựng phù hợp.', FALSE)
ON CONFLICT (attempt_id, question_id) DO NOTHING;

SELECT setval('exam_attempts_id_seq', (SELECT COALESCE(MAX(id), 1) FROM exam_attempts));
SELECT setval('attempt_answers_id_seq', (SELECT COALESCE(MAX(id), 1) FROM attempt_answers));
