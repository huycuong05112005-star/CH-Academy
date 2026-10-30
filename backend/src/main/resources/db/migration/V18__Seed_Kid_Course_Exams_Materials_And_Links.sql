-- ==============================================================================
-- Flyway Migration V14: Seed Kid Course (Course 1) Questions, Exams, Materials & Linkages
-- ==============================================================================

-- 1. Seed 6 Questions for Bank 2 (QB-ENG-KID01 - Course 1 Starter Kids)
INSERT INTO questions (id, bank_id, course_id, code, type, difficulty, topic, learning_outcome, content, default_points, explanation, answer_key, status, created_by)
VALUES
(101, 2, 1, 'Q-KID-001', 'SINGLE_CHOICE', 'EASY', 'Greetings & Basics', 'REMEMBER', 
 'Khi gặp thầy cô giáo vào buổi sáng ở trường, câu chào tiếng Anh chuẩn xác và lễ phép nhất là gì?', 
 2.00, 'Good morning là lời chào buổi sáng lịch sự và chuẩn mực nhất dành cho thầy cô.', 'A', 'ACTIVE', 1),

(102, 2, 1, 'Q-KID-002', 'SINGLE_CHOICE', 'EASY', 'Animals & Nature', 'UNDERSTAND', 
 'Con vật nào sau đây có cánh và có thể bay lượn tự do trên bầu trời?', 
 2.00, 'Bird (chú chim) có cánh và biết bay. Dog (chó), Cat (mèo), Fish (cá) không biết bay trên trời.', 'A', 'ACTIVE', 1),

(103, 2, 1, 'Q-KID-003', 'MULTIPLE_CHOICE', 'MEDIUM', 'Colors & Shapes', 'APPLY', 
 'Những từ nào sau đây là từ chỉ MÀU SẮC trong tiếng Anh? (Chọn tất cả các đáp án đúng)', 
 2.00, 'Blue (màu xanh dương) và Red (màu đỏ) là các từ chỉ màu sắc.', 'A,B', 'ACTIVE', 1),

(104, 2, 1, 'Q-KID-004', 'FILL_IN_BLANK', 'MEDIUM', 'Numbers & Counting', 'APPLY', 
 'There are _____ days in a week. (Điền số từ tiếng Anh viết bằng chữ: ví dụ one, two, ...)', 
 1.50, 'Một tuần có 7 ngày, từ tiếng Anh là "seven".', 'seven', 'ACTIVE', 1),

(105, 2, 1, 'Q-KID-005', 'TRUE_FALSE', 'EASY', 'Daily Life & Fruits', 'UNDERSTAND', 
 '"An apple is a fruit." (Quả táo là một loại trái cây) - Khẳng định này Đúng hay Sai?', 
 1.00, 'Đúng. Quả táo (apple) là một loại hoa quả/trái cây thơm ngon giàu vitamin.', 'TRUE', 'ACTIVE', 1),

(106, 2, 1, 'Q-KID-006', 'SHORT_ANSWER', 'MEDIUM', 'Self-Introduction', 'CREATE', 
 'What is your favorite animal? (Em hãy viết câu trả lời ngắn bằng tiếng Anh, ví dụ: "I like dogs" hoặc "My favorite animal is a cat")', 
 1.50, 'Học sinh viết đúng cấu trúc câu chỉ con vật yêu thích sẽ đạt điểm tối đa.', 'I like dogs', 'ACTIVE', 1)
ON CONFLICT (id) DO UPDATE SET
    content = EXCLUDED.content,
    explanation = EXCLUDED.explanation,
    answer_key = EXCLUDED.answer_key;

-- Question Options for Q-KID-001
INSERT INTO question_options (id, question_id, option_code, content, is_correct, sort_order) VALUES
(101, 101, 'A', 'Good morning, teacher!', TRUE, 1),
(102, 101, 'B', 'Good night, teacher!', FALSE, 2),
(103, 101, 'C', 'Goodbye, teacher!', FALSE, 3),
(104, 101, 'D', 'See you yesterday!', FALSE, 4)
ON CONFLICT (id) DO NOTHING;

-- Question Options for Q-KID-002
INSERT INTO question_options (id, question_id, option_code, content, is_correct, sort_order) VALUES
(105, 102, 'A', 'Bird', TRUE, 1),
(106, 102, 'B', 'Dog', FALSE, 2),
(107, 102, 'C', 'Cat', FALSE, 3),
(108, 102, 'D', 'Fish', FALSE, 4)
ON CONFLICT (id) DO NOTHING;

-- Question Options for Q-KID-003
INSERT INTO question_options (id, question_id, option_code, content, is_correct, sort_order) VALUES
(109, 103, 'A', 'Blue', TRUE, 1),
(110, 103, 'B', 'Red', TRUE, 2),
(111, 103, 'C', 'Apple', FALSE, 3),
(112, 103, 'D', 'Book', FALSE, 4)
ON CONFLICT (id) DO NOTHING;

-- Question Options for Q-KID-005
INSERT INTO question_options (id, question_id, option_code, content, is_correct, sort_order) VALUES
(113, 105, 'TRUE', 'Đúng (True)', TRUE, 1),
(114, 105, 'FALSE', 'Sai (False)', FALSE, 2)
ON CONFLICT (id) DO NOTHING;

SELECT setval('questions_id_seq', (SELECT COALESCE(MAX(id), 1) FROM questions));
SELECT setval('question_options_id_seq', (SELECT COALESCE(MAX(id), 1) FROM question_options));

-- 2. Seed Kid Exam (Course 1 Starter Kids)
INSERT INTO exams (id, title, code, description, course_id, teacher_id, duration_minutes, pass_percentage, max_attempts, shuffle_questions, shuffle_options, show_result_mode, start_time, end_time, status, version, created_by)
VALUES
(3, 'Bài Kiểm Tra Giữa Kỳ: Tiếng Anh Khởi Động Cho Trẻ Em (Starter Kids)', 'EXAM-ENG-KID01',
 'Bài kiểm tra đánh giá khả năng nhận biết từ vựng, số đếm, màu sắc và phản xạ giao tiếp tiếng Anh cơ bản.',
 1, 1, 30, 50.00, 2, FALSE, FALSE, 'IMMEDIATELY',
 CURRENT_TIMESTAMP - INTERVAL '2 days',
 CURRENT_TIMESTAMP + INTERVAL '30 days',
 'PUBLISHED', 1, 1)
ON CONFLICT (id) DO UPDATE SET
    status = 'PUBLISHED',
    end_time = CURRENT_TIMESTAMP + INTERVAL '30 days';

-- Phân bổ câu hỏi vào đề thi 3
INSERT INTO exam_questions (exam_id, question_id, points, sort_order) VALUES
(3, 101, 2.00, 1),
(3, 102, 2.00, 2),
(3, 103, 2.00, 3),
(3, 104, 1.50, 4),
(3, 105, 1.00, 5),
(3, 106, 1.50, 6)
ON CONFLICT (exam_id, question_id) DO NOTHING;

-- Giao đề 3 cho Lớp 1 (CLS-ENG-KID01)
INSERT INTO exam_assignments (exam_id, class_id, student_id, assigned_by, due_date)
SELECT 3, 1, NULL, 1, CURRENT_TIMESTAMP + INTERVAL '30 days'
WHERE NOT EXISTS (SELECT 1 FROM exam_assignments WHERE exam_id = 3 AND class_id = 1);

-- Snapshot cho đề thi 3
INSERT INTO exam_snapshots (id, exam_id, version, snapshot_json, created_at)
VALUES
(3, 3, 1, '{"examId":3,"title":"Bài Kiểm Tra Giữa Kỳ: Tiếng Anh Khởi Động Cho Trẻ Em (Starter Kids)","durationMinutes":30,"questionsCount":6,"maxPoints":10.00}', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- 3. Giao thêm Exam 1 cho Lớp 1 làm bài luyện tập giao tiếp liên khóa
INSERT INTO exam_assignments (exam_id, class_id, student_id, assigned_by, due_date)
SELECT 1, 1, NULL, 1, CURRENT_TIMESTAMP + INTERVAL '30 days'
WHERE NOT EXISTS (SELECT 1 FROM exam_assignments WHERE exam_id = 1 AND class_id = 1);

SELECT setval('exams_id_seq', (SELECT COALESCE(MAX(id), 1) FROM exams));
SELECT setval('exam_snapshots_id_seq', (SELECT COALESCE(MAX(id), 1) FROM exam_snapshots));

-- 4. Seed Lượt thi đã chấm cho Học viên 1 (Trần Minh Khôi) trong Exam 3
INSERT INTO exam_attempts (id, exam_id, snapshot_id, student_id, attempt_number, status, started_at, submitted_at, due_at, total_score, max_score, percentage, is_passed, idempotency_key, graded_at, graded_by)
VALUES
(2, 3, 3, 1, 1, 'GRADED',
 CURRENT_TIMESTAMP - INTERVAL '1 day',
 CURRENT_TIMESTAMP - INTERVAL '1 day' + INTERVAL '22 minutes',
 CURRENT_TIMESTAMP - INTERVAL '1 day' + INTERVAL '30 minutes',
 9.00, 10.00, 90.00, TRUE, 'SEED_ATTEMPT_KID_001',
 CURRENT_TIMESTAMP - INTERVAL '23 hours', 1)
ON CONFLICT (id) DO NOTHING;

-- Chi tiết bài làm của học viên 1
INSERT INTO attempt_answers (attempt_id, question_id, selected_option_ids, text_answer, is_marked_for_review, score, max_score, is_correct, teacher_feedback, auto_graded)
VALUES
(2, 101, '101', NULL, FALSE, 2.00, 2.00, TRUE, 'Rất tốt! Em biết cách chào hỏi lễ phép.', TRUE),
(2, 102, '105', NULL, FALSE, 2.00, 2.00, TRUE, 'Chính xác! Bird là chú chim biết bay.', TRUE),
(2, 103, '109,110', NULL, FALSE, 2.00, 2.00, TRUE, 'Xuất sắc! Chọn đúng cả màu đỏ và xanh dương.', TRUE),
(2, 104, NULL, 'seven', FALSE, 1.50, 1.50, TRUE, 'Tuyệt vời, chính tả đúng.', TRUE),
(2, 105, '113', NULL, FALSE, 1.00, 1.00, TRUE, 'Chính xác!', TRUE),
(2, 106, NULL, 'I like dogs and cats very much.', FALSE, 1.00, 1.50, TRUE, 'Câu trả lời rất dễ thương, cố gắng chú ý viết hoa đầu câu nhé.', FALSE)
ON CONFLICT (attempt_id, question_id) DO NOTHING;

SELECT setval('exam_attempts_id_seq', (SELECT COALESCE(MAX(id), 1) FROM exam_attempts));
SELECT setval('attempt_answers_id_seq', (SELECT COALESCE(MAX(id), 1) FROM attempt_answers));

-- 5. Seed Tài liệu học tập (Session Materials) cho Lớp 1 (CLS-ENG-KID01)
INSERT INTO session_materials (session_id, title, description, material_type, file_url, uploaded_by)
SELECT 
    cs.id, 
    'Slide Bài Giảng: 50 Từ vựng về Gia đình và Bạn bè thân thiết (PDF)', 
    'Bộ slide tranh vẽ màu sắc sinh động giúp các bé ghi nhớ từ vựng qua hình ảnh trực quan.', 
    'SLIDE', 
    'https://drive.google.com/file/d/sample-kids-family-slides.pdf', 
    u.id
FROM class_sessions cs
JOIN classes c ON c.id = cs.class_id
LEFT JOIN users u ON u.username = 'gv.minhhanh'
WHERE c.code = 'CLS-ENG-KID01' AND cs.topic LIKE 'Buổi 01%'
LIMIT 1;

INSERT INTO session_materials (session_id, title, description, material_type, file_url, uploaded_by)
SELECT 
    cs.id, 
    'Phiếu Bài Tập Nối Từ & Tập Tô Chữ Cái Tiếng Anh Chuẩn Phonics', 
    'Phiếu bài tập in ra giấy để các bé rèn luyện kỹ năng viết chữ cái và nối hình tương ứng.', 
    'EXERCISE', 
    'https://drive.google.com/file/d/sample-kids-exercise-phonics.pdf', 
    u.id
FROM class_sessions cs
JOIN classes c ON c.id = cs.class_id
LEFT JOIN users u ON u.username = 'gv.minhhanh'
WHERE c.code = 'CLS-ENG-KID01' AND cs.topic LIKE 'Buổi 01%'
LIMIT 1;

INSERT INTO session_materials (session_id, title, description, material_type, file_url, uploaded_by)
SELECT 
    cs.id, 
    'Video Vui Học: ABC Song & Học Đếm Số Qua Trò Chơi Tương Tác', 
    'Video hoạt hình âm nhạc chuẩn giọng bản ngữ giúp bé luyện phản xạ nghe tự nhiên.', 
    'VIDEO', 
    'https://www.youtube.com/watch?v=sample-kids-abc-video', 
    u.id
FROM class_sessions cs
JOIN classes c ON c.id = cs.class_id
LEFT JOIN users u ON u.username = 'gv.minhhanh'
WHERE c.code = 'CLS-ENG-KID01' AND cs.topic LIKE 'Buổi 02%'
LIMIT 1;

INSERT INTO session_materials (session_id, title, description, material_type, file_url, uploaded_by)
SELECT 
    cs.id, 
    'Tài Liệu Hướng Dẫn: Phương pháp đồng hành cùng con tự học tiếng Anh tại nhà', 
    'Cẩm nang dành riêng cho phụ huynh để hỗ trợ và tạo động lực học tập mỗi ngày cho con.', 
    'DOCUMENT', 
    'https://drive.google.com/file/d/sample-parents-guide.pdf', 
    u.id
FROM class_sessions cs
JOIN classes c ON c.id = cs.class_id
LEFT JOIN users u ON u.username = 'gv.minhhanh'
WHERE c.code = 'CLS-ENG-KID01' AND cs.topic LIKE 'Buổi 03%'
LIMIT 1;

-- 6. Điểm danh bổ sung cho Buổi 17 (Buổi 02 Lớp 1)
INSERT INTO attendance_records (session_id, student_id, status, note, recorded_by)
SELECT 
    17, 
    s.id, 
    'PRESENT', 
    'Bé tham gia lớp đúng giờ, hào hứng phát biểu và thuộc bài hát rất nhanh.', 
    u.id
FROM students s
LEFT JOIN users u ON u.username = 'gv.minhhanh'
WHERE s.id IN (1, 4, 5, 6)
ON CONFLICT (session_id, student_id) DO NOTHING;

-- 7. Ghi danh Học viên 3 (Lê Hoàng Long) vào Lớp 2 (CLS-ENG-PRO01) để có đầy đủ dữ liệu học
INSERT INTO enrollments (class_id, student_id, status, enrollment_date, applied_tuition_fee, discount_amount, final_fee, notes)
SELECT 2, 3, 'ENROLLED', CURRENT_DATE - INTERVAL '10 days', 4500000.00, 0.00, 4500000.00, 'Ghi danh khóa học Giao tiếp công sở chuyên sâu'
WHERE NOT EXISTS (SELECT 1 FROM enrollments WHERE class_id = 2 AND student_id = 3);

