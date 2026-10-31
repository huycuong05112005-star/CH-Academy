# BÁO CÁO DI TRÚ VÀ TOÀN VẸN CƠ SỞ DỮ LIỆU (DATABASE MIGRATION REPORT)

## 1. TỔNG QUAN FLYWAY MIGRATIONS

Hệ thống CH Academy sử dụng PostgreSQL 16 và Flyway để quản lý phiên bản cơ sở dữ liệu. Tất cả các migration được bảo toàn tính toàn vẹn, tuân thủ nguyên tắc không xóa schema, không chạy `docker compose down -v` và bảo đảm không mất dữ liệu.

---

## 2. DANH SÁCH CÁC BẢN MIGRATION ĐÃ ÁP DỤNG

| Phiên bản | Tên tập tin | Nội dung chính | Trạng thái |
|---|---|---|---|
| **V1 -> V10** | Core Schemas | Khởi tạo bảng User, Role, Học viên, Lớp học, Điểm danh, Tài chính, Audit Logs | **SUCCESS** |
| **V11 -> V20** | Assessment Platform | Khảo thí trực tuyến, ngân hàng câu hỏi, quy trình Admin kiểm duyệt đề thi | **SUCCESS** |
| **V21 -> V22** | Group Chat & GenAI | Bảng `chat_conversations`, `chat_members`, `chat_messages`, `ai_conversations` | **SUCCESS** |
| **V23** | AI Ecosystem Schema | Khởi tạo bảng `ai_agents`, `knowledge_bases`, `knowledge_documents`, `ai_channels` | **SUCCESS** |
| **V24** | AI Studio Permissions | Cấp quyền `ai:manage`, `ai:read`, `ai:use` cho Admin, thêm `AI_CHAT_BOX` vào ENUM Lead Source | **SUCCESS** |
| **V25** | Exam Audience & Chat Sync | Cập nhật thông báo duyệt đề sang `TEACHERS`, thêm `client_msg_id`, `last_read_at`, bảng `call_sessions` | **SUCCESS** |

---

## 3. TOÀN VẸN DỮ LIỆU & RÀNG BUỘC KHÓA NGOẠI (FOREIGN KEYS)
- Đảm bảo 100% ràng buộc toàn vẹn dữ liệu:
  - `chat_messages` trỏ đến `chat_conversations(id)` với `ON DELETE CASCADE`.
  - `chat_members` thiết lập chỉ mục duy nhất `UNIQUE(conversation_id, user_id)`.
  - `call_sessions` thiết lập khóa ngoại `user_id` sang `users(id)` với `ON DELETE SET NULL`.
  - Tất cả các trường `client_msg_id` được đánh index `idx_chat_messages_client_id` để tối ưu hóa tốc độ tìm kiếm chống trùng lặp tin nhắn.
