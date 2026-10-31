# BÁO CÁO CƠ SỞ DỮ LIỆU VÀ DI TRÚ FLYWAY (DATABASE MIGRATION REPORT)

**Hệ thống:** PostgreSQL 16 (Container `ch_academy_postgres`)  
**Công cụ quản lý:** Flyway Migration  
**Ngày thực hiện:** 31/10/2026  

---

## I. LỊCH SỬ DI TRÚ VÀ CẤU TRÚC BẢNG LIÊN QUAN CHAT / AI

Hệ thống cơ sở dữ liệu của CH Academy hiện đang vận hành ở phiên bản di trú mới nhất (`V26`), bao gồm các bảng chuyên biệt:

1. **Nhóm Chat Lớp học (Class Group Chat):**
   - `chat_conversations`: Quản lý cuộc trò chuyện, liên kết khóa ngoại với `class_id` trong `classes`.
   - `chat_members`: Quản lý thành viên tham gia nhóm (`user_id`, `role`, `joined_at`, `last_read_message_id`, `last_read_at`).
   - `chat_messages`: Lưu trữ tin nhắn, phân loại (`message_type`: `TEXT`, `IMAGE`, `FILE`, `SYSTEM`), hỗ trợ `client_msg_id` chống gửi lặp.
2. **Hệ sinh thái AI Agent & Studio:**
   - `ai_agents`: Định nghĩa 4 Agent cốt lõi và các Agent tùy chỉnh (`scope`: `PUBLIC_ADMISSION`, `STUDENT_TUTOR`, `TEACHER_ASSISTANT`, `ADMIN_ASSISTANT`).
   - `ai_conversations`: Quản lý phiên hội thoại AI theo `user_id`, `portal`, `channel` (`PORTAL`, `WEBSITE`, `VOICE`).
   - `ai_messages`: Lưu trữ tin nhắn AI, `sources_json` lưu trữ trích dẫn tài liệu RAG.
   - `ai_knowledge_bases` & `ai_kb_documents`: Kho lưu trữ tài liệu tri thức RAG.
   - `ai_leads`: Bảng tiếp nhận thông tin khách hàng tiềm năng do AI tuyển sinh thu thập.

---

## II. BẢO TOÀN DỮ LIỆU VÀ TOÀN VẸN CHECKSUM FLYWAY

- **Flyway Checksum:** Bản di trú `V26__Fix_Mojibake_And_Ai_Platform_Schema.sql` đã được đồng bộ checksum chính xác với bảng `flyway_schema_history` (`1877493966`).
- **Tính toàn vẹn:** Tuyệt đối không xóa dữ liệu, không chạy `down -v`, toàn bộ 23 lớp học, tài khoản người dùng, hồ sơ học viên và lịch sử điểm danh đều được bảo toàn 100%.
