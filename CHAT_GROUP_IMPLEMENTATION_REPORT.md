# BÁO CÁO TRIỂN KHAI CHAT NHÓM THEO LỚP HỌC (CLASS GROUP CHAT)
**Dự án:** CH Academy  
**Cập nhật:** 31/10/2026

---

## 1. NGUYÊN TẮC VÀ ĐẶC TẢ NGHIỆP VỤ

1. **Mối quan hệ 1-1 giữa Lớp học và Nhóm chat:**
   - Mỗi lớp học vận hành trong hệ thống đều sở hữu một nhóm chat duy nhất (`chat_conversations.class_id = classes.id`).
   - Không cho phép tạo nhóm chat tùy tiện ngoài danh mục lớp học.
2. **Cơ chế tự động đồng bộ thành viên (Automatic & Idempotent Sync):**
   - Khi Admin ghi danh học viên (`AcademicService.enrollStudent`): Tự động đồng bộ học viên vào `chat_members` với vai trò `STUDENT`.
   - Khi Admin phân công giảng viên (`TeacherAssignmentAdminController.assignTeacher`): Tự động đồng bộ giảng viên vào `chat_members` với vai trò `TEACHER`.
   - Idempotent: Sử dụng `ON CONFLICT (conversation_id, user_id) DO NOTHING`, tránh nhân đôi thành viên khi gửi request nhiều lần.
3. **Phân quyền truy cập theo vai trò:**
   - **Học viên:** Chỉ nhìn thấy và tương tác với các nhóm lớp mà mình đã ghi danh hợp lệ (`ENROLLED`). Không thể truy cập lớp khác bằng cách đổi ID.
   - **Giảng viên:** Chỉ tham gia các nhóm lớp mà mình được phân công giảng dạy (`ACTIVE`).
   - **Quản trị viên:** Toàn quyền giám sát, hỗ trợ và quản trị nội dung.

---

## 2. KIẾN TRÚC DATABASE & BACKEND

### 2.1. Cấu trúc bảng (Flyway `V22__Create_Class_Chat_And_GenAI_Schema.sql`)
- `chat_conversations`: Quản lý định danh nhóm lớp, liên kết `class_id`.
- `chat_members`: Quản lý danh sách thành viên, vai trò trong nhóm và `last_read_message_id`.
- `chat_messages`: Quản lý nội dung tin nhắn (`TEXT`, `IMAGE`, `FILE`, `SYSTEM`), tệp đính kèm và cờ ghim tin nhắn (`is_pinned`).

### 2.2. Danh mục API Backend (`ClassChatController.java`)
- `GET /api/v1/chat/classes/conversations`: Lấy danh sách nhóm chat của người dùng hiện tại (kèm số tin nhắn chưa đọc và tin nhắn mới nhất).
- `GET /api/v1/chat/classes/conversations/{id}/messages`: Lấy lịch sử tin nhắn trong nhóm.
- `POST /api/v1/chat/classes/conversations/{id}/messages`: Gửi tin nhắn mới vào nhóm lớp.
- `POST /api/v1/chat/classes/conversations/{id}/read`: Cập nhật trạng thái đã đọc cho người dùng.

---

## 3. TRẢI NGHIỆM GIAO DIỆN NGƯỜI DÙNG (FRONTEND UI/UX)

- Component: `FloatingChatWidget.tsx` tích hợp tại `App.tsx` (hiển thị đồng nhất trên cả 3 cổng Admin, Giảng viên, Học viên).
- Nút Chat nổi thông minh ở góc dưới bên phải (`bottom-6 right-6`), huy hiệu số tin chưa đọc (unread badge).
- Khi chọn **"Chat nhóm lớp"**:
  - Mở cửa sổ nhắn tin phong cách SaaS hiện đại.
  - Phân chia danh sách lớp học trực quan kèm sĩ số thành viên.
  - Luồng tin nhắn phân biệt rõ: Tin của tôi (màu xanh thương hiệu, bo góc bên phải), Tin của bạn cùng lớp / Thầy cô (bo góc bên trái), Tin thông báo hệ thống (System banner).
  - Khung soạn thảo tin nhắn mượt mà, hỗ trợ phím `Enter` để gửi tin.
  - Tự động cuộn xuống tin nhắn mới nhất (`scrollToBottom`).
