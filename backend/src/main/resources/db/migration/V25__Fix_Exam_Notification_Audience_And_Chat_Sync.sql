-- ==============================================================================
-- V25: FIX EXAM NOTIFICATION AUDIENCE, CHAT UNREAD & VOICE SESSIONS SCHEMA
-- ==============================================================================

-- 1. Sửa phạm vi thông báo duyệt đề thi từ ALL sang TEACHERS để không làm rác thông báo học viên
UPDATE notifications
SET target_audience = 'TEACHERS'
WHERE title LIKE 'Đề thi mới chờ duyệt%' AND target_audience = 'ALL';

-- 2. Thêm client_msg_id vào bảng chat_messages để chống gửi tin nhắn trùng lặp (Idempotency)
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS client_msg_id VARCHAR(100);
CREATE INDEX IF NOT EXISTS idx_chat_messages_client_id ON chat_messages(conversation_id, client_msg_id);

-- 3. Bổ sung last_read_at vào chat_members để đồng bộ thời gian đọc tin nhắn chính xác
ALTER TABLE chat_members ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMP WITH TIME ZONE;

-- 4. Bảng lưu trữ phiên cuộc gọi AI Voice (Call Sessions & Duration)
CREATE TABLE IF NOT EXISTS call_sessions (
    id BIGSERIAL PRIMARY KEY,
    session_code VARCHAR(100) UNIQUE NOT NULL,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    agent_code VARCHAR(100) NOT NULL,
    portal VARCHAR(50) NOT NULL,
    duration_seconds INT NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'COMPLETED',
    transcript TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_call_sessions_user ON call_sessions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_call_sessions_portal ON call_sessions(portal, created_at DESC);

