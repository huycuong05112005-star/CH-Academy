# BÁO CÁO DI TRÚ VÀ TOÀN VẸN CƠ SỞ DỮ LIỆU (DATABASE MIGRATION REPORT)

**Tài liệu:** `DATABASE_MIGRATION_REPORT.md`  
**Ngày cập nhật:** 31 tháng 10 năm 2026  
**Dự án:** Hệ thống Quản trị & AI CH Academy  
**Công nghệ:** PostgreSQL 16 + Flyway Migration  

---

## 1. TỔNG QUAN HỆ THỐNG DI TRÚ CƠ SỞ DỮ LIỆU

Hệ thống CH Academy sử dụng PostgreSQL 16 và Flyway để quản lý phiên bản cơ sở dữ liệu. Tất cả các migration được bảo toàn tính toàn vẹn, tuân thủ nguyên tắc:
- Không xóa Docker volume dữ liệu.
- Tuyệt đối không chạy `docker compose down -v`.
- Không chỉnh sửa các tệp migration lịch sử đã áp dụng thành công.
- Mọi thay đổi cấu trúc bảng, ràng buộc khóa ngoại hoặc sửa dữ liệu lỗi đều được thực hiện thông qua tệp migration kế tiếp có đánh số phiên bản tuần tự.

---

## 2. DANH SÁCH CHI TIẾT CÁC BẢN FLYWAY MIGRATION

| Phiên bản | Tên tập tin migration | Nội dung chính | Trạng thái |
| :---: | :--- | :--- | :---: |
| **V1 -> V10** | Core Business Schemas | Khởi tạo bảng User, Role, Học viên, Lớp học, Điểm danh, Tài chính, Audit Logs | **SUCCESS** |
| **V11 -> V20** | Assessment Platform | Khảo thí trực tuyến, ngân hàng câu hỏi, quy trình Admin kiểm duyệt đề thi | **SUCCESS** |
| **V21 -> V22** | Group Chat & GenAI | Bảng `chat_conversations`, `chat_members`, `chat_messages`, `ai_conversations` | **SUCCESS** |
| **V23** | AI Ecosystem Schema | Khởi tạo bảng `ai_agents`, `knowledge_bases`, `knowledge_documents`, `ai_flows`, `ai_channels` | **SUCCESS** |
| **V24** | AI Studio Permissions | Cấp quyền `ai:manage`, `ai:read`, `ai:use` cho Admin, thêm `AI_CHAT_BOX` vào ENUM Lead Source | **SUCCESS** |
| **V25** | Exam Audience & Chat Sync | Cập nhật thông báo duyệt đề sang `TEACHERS`, thêm `client_msg_id`, `last_read_at`, bảng `call_sessions` | **SUCCESS** |
| **V26** | Fix Mojibake & AI Platform Schema | Sửa triệt để lỗi vỡ font tiếng Việt trong `ai_agents`, bổ sung cột `scope` và phân bổ cho 7 Agents, chuẩn hóa `ai_flows` | **SUCCESS** |

---

## 3. NỘI DUNG NÂNG CẤP TRỌNG ĐIỂM TRONG FLYWAY MIGRATION V26

### 3.1. Bổ sung cột `scope` và Phân quyền Hoạt động AI Agent
Migration V26 bổ sung cột `scope VARCHAR(50)` vào bảng `ai_agents` để phân định ranh giới hoạt động của từng Agent:
```sql
ALTER TABLE ai_agents ADD COLUMN IF NOT EXISTS scope VARCHAR(50) DEFAULT 'PUBLIC_ADMISSION';

UPDATE ai_agents SET scope = 'PUBLIC_ADMISSION' WHERE code IN ('AGENT_ADMISSIONS', 'AGENT_VOICE_OUTBOUND');
UPDATE ai_agents SET scope = 'STUDENT_TUTOR' WHERE code IN ('AGENT_STUDENT_TUTOR', 'AGENT_STUDENT_ENGLISH');
UPDATE ai_agents SET scope = 'TEACHER_ASSISTANT' WHERE code IN ('AGENT_TEACHER_ASSISTANT', 'AGENT_ACADEMIC_AUDITOR');
UPDATE ai_agents SET scope = 'ADMIN_ASSISTANT' WHERE code = 'AGENT_ADMIN_ASSISTANT';
```

### 3.2. Sửa sạch dứt điểm Lỗi Vỡ Font Tiếng Việt (Mojibake Fix)
Migration V26 thực hiện ghi đè toàn bộ các trường `name` và `description` bị lỗi mã hóa Latin-1 sang chuẩn UTF-8 thuần túy cho tất cả 7 AI Agents. Tiếp theo đó, các bản ghi khách hàng trong bảng `leads` và `ai_leads` cũng đã được chuẩn hóa lại sạch sẽ (`Vũ Hoàng Minh`, `Tiếng Anh Giao Tiếp Doanh Nghiệp`).

### 3.3. Chuẩn hóa Bảng Kịch bản Hội thoại (`ai_flows`)
Bảng `ai_flows` được liên kết với `ai_agents` thông qua khóa ngoại `agent_id BIGINT REFERENCES ai_agents(id) ON DELETE CASCADE`, lưu trữ đồ thị kịch bản dạng `graph_json TEXT` và quản lý trạng thái (`ACTIVE` / `INACTIVE`).

---

## 4. CẤU TRÚC BẢNG `call_sessions` PHỤC VỤ VOICE AI

```sql
CREATE TABLE IF NOT EXISTS call_sessions (
    id BIGSERIAL PRIMARY KEY,
    session_code VARCHAR(50) UNIQUE NOT NULL,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    agent_code VARCHAR(50) NOT NULL,
    portal VARCHAR(20) NOT NULL,
    duration_seconds INT NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',
    transcript TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_call_sessions_portal ON call_sessions(portal);
CREATE INDEX IF NOT EXISTS idx_call_sessions_agent ON call_sessions(agent_code);
```

---

## 5. TOÀN VẸN RÀNG BUỘC KHÓA NGOẠI (INTEGRITY VERIFICATION)

Hệ thống đã kiểm tra đối chiếu bảng `flyway_schema_history` và các ràng buộc khóa ngoại trong CSDL PostgreSQL:
- Bảng `ai_conversations` liên kết toàn vẹn với `users(id)` (`ON DELETE SET NULL`).
- Bảng `ai_messages` liên kết toàn vẹn với `ai_conversations(id)` (`ON DELETE CASCADE`).
- Bảng `ai_leads` liên kết với `leads(id)` (`ON DELETE SET NULL`) và `ai_conversations(id)`.
- Bảng `lead_activities` liên kết với `leads(id)` (`ON DELETE CASCADE`).
- 100% dữ liệu thử nghiệm và dữ liệu nghiệp vụ của hệ thống được bảo toàn nguyên vẹn.
