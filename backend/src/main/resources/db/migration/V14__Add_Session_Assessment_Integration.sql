-- V14__Add_Session_Assessment_Integration.sql
-- Tích hợp đánh giá học tập trực tiếp vào từng buổi học (Class Session)

ALTER TABLE exam_assignments
    ADD COLUMN IF NOT EXISTS session_id BIGINT REFERENCES class_sessions(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS assessment_type VARCHAR(30) DEFAULT 'STANDARD',
    ADD COLUMN IF NOT EXISTS title VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_ea_session ON exam_assignments(session_id);

-- Thêm trường topic cho ngân hàng câu hỏi
ALTER TABLE questions
    ADD COLUMN IF NOT EXISTS topic VARCHAR(150);

-- Seed liên kết giữa bài kiểm tra mẫu (exam_id = 1, class_id = 2) với buổi học đầu tiên của lớp 2
DO $$
DECLARE
    v_session_id BIGINT;
BEGIN
    SELECT id INTO v_session_id FROM class_sessions WHERE class_id = 2 ORDER BY session_date ASC, start_time ASC LIMIT 1;
    IF v_session_id IS NOT NULL THEN
        UPDATE exam_assignments
        SET session_id = v_session_id,
            assessment_type = 'MIDTERM',
            title = 'Kiểm tra giữa kỳ - Kỹ năng Giao tiếp & Soạn thảo'
        WHERE exam_id = 1 AND class_id = 2;
    END IF;
END $$;
