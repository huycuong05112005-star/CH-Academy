-- ==============================================================================
-- Flyway Migration V16: Add Exam Approval Workflow & Review Audit Trail
-- Quy trình Admin duyệt đề thi bắt buộc & Ghi nhận lịch sử kiểm duyệt
-- ==============================================================================

-- 1. Cập nhật ràng buộc trạng thái cho bảng exams
ALTER TABLE exams DROP CONSTRAINT IF EXISTS chk_exam_status;
ALTER TABLE exams ADD CONSTRAINT chk_exam_status 
    CHECK (status IN ('DRAFT', 'PENDING_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED', 'PUBLISHED', 'ARCHIVED', 'CLOSED'));

-- 2. Bổ sung các cột thông tin phê duyệt vào bảng exams
ALTER TABLE exams
    ADD COLUMN IF NOT EXISTS reviewed_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS review_feedback TEXT,
    ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
    ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_exams_reviewed_by ON exams(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_exams_status_submitted ON exams(status, submitted_at);

-- 3. Bổ sung target_user_id vào bảng notifications để gửi thông báo trực tiếp cho cá nhân
ALTER TABLE notifications
    ADD COLUMN IF NOT EXISTS target_user_id BIGINT REFERENCES users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_notifications_target_user ON notifications(target_user_id);

-- 4. Bảng lưu trữ nhật ký kiểm duyệt đề thi (Exam Review Logs)
CREATE TABLE IF NOT EXISTS exam_review_logs (
    id BIGSERIAL PRIMARY KEY,
    exam_id BIGINT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    version INT NOT NULL DEFAULT 1,
    action VARCHAR(30) NOT NULL, -- SUBMIT_FOR_REVIEW, REQUEST_CHANGES, REJECT, APPROVE, PUBLISH, CLOSE
    actor_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    actor_name VARCHAR(100),
    actor_role VARCHAR(50),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_review_logs_exam ON exam_review_logs(exam_id);
CREATE INDEX IF NOT EXISTS idx_review_logs_created_at ON exam_review_logs(created_at);

-- 5. Cập nhật dữ liệu mẫu: ghi nhận exam hiện có đã được APPROVED / PUBLISHED
DO $$
BEGIN
    UPDATE exams
    SET status = 'PUBLISHED',
        published_at = CURRENT_TIMESTAMP
    WHERE id = 1 AND status = 'PUBLISHED';

    IF EXISTS (SELECT 1 FROM exams WHERE id = 1) THEN
        INSERT INTO exam_review_logs (exam_id, version, action, actor_name, actor_role, comment, created_at)
        VALUES (1, 1, 'APPROVE', 'Hệ thống Quản trị CH Academy', 'SUPER_ADMIN', 'Đề thi mẫu đánh giá năng lực đã được kiểm duyệt hợp lệ', CURRENT_TIMESTAMP)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
