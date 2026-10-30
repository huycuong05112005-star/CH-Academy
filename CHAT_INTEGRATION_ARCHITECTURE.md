# KIẾN TRÚC TÍCH HỢP CHAT NHÓM LỚP HỌC & GEN AI CHAT BOX — CH ACADEMY
**Cập nhật:** 31/10/2026  
**Mục tiêu:** Tích hợp Chat nhóm thời gian thực gắn theo lớp học và Trợ lý AI cá nhân hóa theo 3 vai trò (Admin, Giảng viên, Học viên).

---

## 1. THIẾT KẾ CƠ SỞ DỮ LIỆU (FLYWAY MIGRATION `V22`)

```sql
-- 1. Bảng hội thoại Chat nhóm theo lớp
CREATE TABLE chat_conversations (
    id BIGSERIAL PRIMARY KEY,
    class_id BIGINT UNIQUE REFERENCES classes(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'CLASS_GROUP',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Thành viên nhóm chat
CREATE TABLE chat_members (
    id BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL, -- 'TEACHER', 'STUDENT', 'ADMIN'
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_read_message_id BIGINT,
    UNIQUE (conversation_id, user_id)
);

-- 3. Tin nhắn trong nhóm chat
CREATE TABLE chat_messages (
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

-- 4. Phiên hội thoại Gen AI
CREATE TABLE ai_conversations (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tin nhắn hội thoại Gen AI
CREATE TABLE ai_messages (
    id BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
    role VARCHAR(30) NOT NULL, -- 'user', 'assistant', 'system'
    content TEXT NOT NULL,
    sources_json TEXT,
    tokens_used INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Indexes tối ưu hiệu năng
CREATE INDEX idx_chat_messages_conv ON chat_messages(conversation_id, created_at ASC);
CREATE INDEX idx_chat_members_user ON chat_members(user_id);
CREATE INDEX idx_ai_messages_conv ON ai_messages(conversation_id, created_at ASC);
```

---

## 2. QUY TRÌNH TỰ ĐỘNG ĐỒNG BỘ THÀNH VIÊN NHÓM CHAT (IDEMPOTENT)

```
[Admin ghi danh học viên] / [Phân công giảng viên]
                    │
                    ▼
       Spring Boot Service Transaction
                    │
   ┌────────────────┴────────────────┐
   │                                 │
   ▼                                 ▼
Lưu bản ghi Enrollment      Lưu bản ghi TeacherAssignment
   │                                 │
   └────────────────┬────────────────┘
                    │
                    ▼
     ChatSyncService.syncClassGroup(classId)
                    │
     Kiểm tra xem nhóm chat lớp đã tạo chưa?
     ├── Chưa: Tạo chat_conversations(class_id)
     └── Đã có: Lấy conversation_id
                    │
     Lấy danh sách Học viên ENROLLED + Giảng viên ACTIVE
                    │
     Thêm vào chat_members (ON CONFLICT DO NOTHING)
                    │
     Commit Transaction
```

---

## 3. CƠ CHẾ GEN AI CHAT THEO VAI TRÒ (ROLE-AWARE CONTEXT INJECTION)

1. **Nhận diện danh tính bảo mật:**
   - Backend lấy `User` từ JWT đã giải mã (`SecurityContextHolder`), **không tin tưởng** role gửi từ Frontend.
2. **Tiêm ngữ cảnh động (Dynamic Context Injection):**
   - **Học viên:** Tự động truy vấn các lớp đang theo học, lịch học sắp tới, số tiền học phí còn nợ từ `studentRepository`, `enrollmentRepository`, `receivableRepository`.
   - **Giảng viên:** Tự động truy vấn danh sách lớp phụ trách, số học viên mỗi lớp từ `teacherRepository` và `classRepository`.
   - **Quản trị viên:** Cung cấp thông số tổng quan hệ thống (số học viên, số lớp, số giảng viên, tỷ lệ hoàn tất học phí).
3. **Tiêm tri thức tĩnh (Static Knowledge Base):**
   - Nội quy trung tâm CH Academy, quy định hoàn tiền, chính sách kiểm tra định kỳ và đánh giá chuẩn đầu ra.
4. **Cơ chế chống Prompt Injection & Bịa đặt (Hallucination Guard):**
   - Chỉ dẫn LLM không được trả lời các câu hỏi ngoài phạm vi giáo dục đào tạo.
   - Khi không có dữ liệu, trả lời trung thực: *"Hiện tại hệ thống chưa ghi nhận thông tin này. Vui lòng liên hệ bộ phận Đào tạo để được hỗ trợ."*.

