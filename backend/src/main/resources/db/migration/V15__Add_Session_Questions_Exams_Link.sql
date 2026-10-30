-- V15__Add_Session_Questions_Exams_Link.sql
-- Liên kết trực tiếp câu hỏi và đề thi vào từng buổi học (Class Session)

-- 1. Thêm session_id vào bảng questions
ALTER TABLE questions
    ADD COLUMN IF NOT EXISTS session_id BIGINT REFERENCES class_sessions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_questions_session ON questions(session_id);

-- 2. Thêm session_id vào bảng exams
ALTER TABLE exams
    ADD COLUMN IF NOT EXISTS session_id BIGINT REFERENCES class_sessions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_exams_session ON exams(session_id);

-- 3. Cập nhật dữ liệu mẫu: gán câu hỏi mẫu và đề thi mẫu cho buổi học của lớp 2
DO $$
DECLARE
    v_session_id BIGINT;
BEGIN
    SELECT id INTO v_session_id FROM class_sessions WHERE class_id = 2 ORDER BY session_date ASC, start_time ASC LIMIT 1;
    IF v_session_id IS NOT NULL THEN
        -- Gán đề thi 1 cho buổi học đầu tiên của lớp 2
        UPDATE exams
        SET session_id = v_session_id
        WHERE id = 1 AND session_id IS NULL;

        -- Gán một số câu hỏi thuộc đề thi 1 cho buổi học này
        UPDATE questions
        SET session_id = v_session_id
        WHERE id IN (
            SELECT question_id FROM exam_questions WHERE exam_id = 1
        ) AND session_id IS NULL;
    END IF;
END $$;
