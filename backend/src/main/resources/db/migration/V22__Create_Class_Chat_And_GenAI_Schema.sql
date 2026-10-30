-- ==============================================================================
-- V22: SCHEMA HỆ THỐNG CHAT NHÓM THEO LỚP & HỘI THOẠI GEN AI TRỢ LÝ HỌC TẬP
-- ==============================================================================

-- 1. Bảng nhóm trò chuyện theo lớp học
CREATE TABLE IF NOT EXISTS chat_conversations (
    id BIGSERIAL PRIMARY KEY,
    class_id BIGINT UNIQUE REFERENCES classes(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'CLASS_GROUP',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Bảng thành viên nhóm trò chuyện
CREATE TABLE IF NOT EXISTS chat_members (
    id BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL, -- 'TEACHER', 'STUDENT', 'ADMIN'
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_read_message_id BIGINT,
    UNIQUE (conversation_id, user_id)
);

-- 3. Bảng tin nhắn trò chuyện lớp học
CREATE TABLE IF NOT EXISTS chat_messages (
    id BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    sender_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message_type VARCHAR(30) NOT NULL DEFAULT 'TEXT', -- 'TEXT', 'IMAGE', 'FILE', 'SYSTEM'
    content TEXT NOT NULL,
    attachment_url VARCHAR(500),
    attachment_name VARCHAR(255),
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Bảng phiên hội thoại Gen AI cá nhân hóa
CREATE TABLE IF NOT EXISTS ai_conversations (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, -- 'STUDENT', 'TEACHER', 'ADMIN'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Bảng tin nhắn hội thoại Gen AI
CREATE TABLE IF NOT EXISTS ai_messages (
    id BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
    role VARCHAR(30) NOT NULL, -- 'user', 'assistant', 'system'
    content TEXT NOT NULL,
    sources_json TEXT,
    tokens_used INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tạo chỉ mục tối ưu truy vấn
CREATE INDEX IF NOT EXISTS idx_chat_messages_conv ON chat_messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_chat_members_user ON chat_members(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON ai_conversations(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conv ON ai_messages(conversation_id, created_at ASC);

-- 7. Khởi tạo nhóm chat cho các lớp học hiện có
INSERT INTO chat_conversations (class_id, title, type)
SELECT c.id, 'Nhóm học tập: ' || c.name, 'CLASS_GROUP'
FROM classes c
ON CONFLICT (class_id) DO NOTHING;

-- 8. Đồng bộ giáo viên phụ trách vào nhóm chat
INSERT INTO chat_members (conversation_id, user_id, role)
SELECT cc.id, t.user_id, 'TEACHER'
FROM chat_conversations cc
JOIN classes c ON cc.class_id = c.id
JOIN teachers t ON c.primary_teacher_id = t.id
WHERE t.user_id IS NOT NULL
ON CONFLICT (conversation_id, user_id) DO NOTHING;

-- Đồng bộ giáo viên từ bảng teacher_assignments
INSERT INTO chat_members (conversation_id, user_id, role)
SELECT cc.id, t.user_id, 'TEACHER'
FROM chat_conversations cc
JOIN teacher_assignments ta ON cc.class_id = ta.class_id
JOIN teachers t ON ta.teacher_id = t.id
WHERE ta.status = 'ACTIVE' AND t.user_id IS NOT NULL
ON CONFLICT (conversation_id, user_id) DO NOTHING;

-- 9. Đồng bộ học viên đã ghi danh vào nhóm chat
INSERT INTO chat_members (conversation_id, user_id, role)
SELECT cc.id, s.user_id, 'STUDENT'
FROM chat_conversations cc
JOIN enrollments e ON cc.class_id = e.class_id
JOIN students s ON e.student_id = s.id
WHERE e.status = 'ENROLLED' AND s.user_id IS NOT NULL
ON CONFLICT (conversation_id, user_id) DO NOTHING;

-- 10. Tạo tin nhắn chào mừng mặc định từ giáo viên
INSERT INTO chat_messages (conversation_id, sender_id, message_type, content, is_pinned)
SELECT 
    cc.id,
    cm.user_id,
    'SYSTEM',
    'Chào mừng các bạn học viên đến với nhóm học tập trực tuyến của ' || c.name || '! Nơi trao đổi bài vở, nhận tài liệu và giải đáp thắc mắc cùng giảng viên.',
    TRUE
FROM chat_conversations cc
JOIN classes c ON cc.class_id = c.id
JOIN chat_members cm ON cm.conversation_id = cc.id AND cm.role = 'TEACHER'
WHERE NOT EXISTS (
    SELECT 1 FROM chat_messages m WHERE m.conversation_id = cc.id
);

