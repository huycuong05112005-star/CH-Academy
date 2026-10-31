# BÁO CÁO BẢO MẬT HỆ THỐNG GIAO TIẾP VÀ VOICE AI (SECURITY AUDIT REPORT)

**Dự án:** CH Academy Platform  
**Phạm vi:** Phân quyền API, Xác thực phiên, Cô lập dữ liệu và Bảo vệ tài nguyên âm thanh  
**Ngày thực hiện:** 31/10/2026  
**Đánh giá an ninh:** ĐẠT CHUẨN AN TOÀN CAO

---

## I. CÁC HÀNG RÀO BẢO MẬT ĐÃ THIẾT LẬP

### 1. Cô lập dữ liệu hội thoại (Conversation & Identity Isolation)
- **Tuyệt đối không tin tưởng client:** Mọi API gọi AI (`/api/v1/chat/ai/ask`) hay lấy danh sách tin nhắn (`/api/v1/chat/classes/conversations/{id}/messages`) đều trích xuất `User` trực tiếp từ JWT Token của Spring Security (`SecurityContextHolder`).
- **Chặn truy cập chéo (Cross-tenant / IDOR):**
  - Học viên A không thể xem tin nhắn hay lịch sử AI của Học viên B.
  - Tài khoản Admin không bị fallback demo vào hồ sơ học viên; khi gọi API Cổng học viên sẽ nhận mã lỗi `403 FORBIDDEN` hoặc `404 NOT_FOUND`.

### 2. Phân quyền truy cập nhóm lớp học (Class Group Membership)
- Trong `ClassChatService`:
  - Học viên chỉ được xem và gửi tin vào lớp mà mình có bản ghi `enrollments` hợp lệ (`status = 'ENROLLED'` hoặc `'ACTIVE'`).
  - Giảng viên chỉ được truy cập vào lớp mà mình có bản ghi `teacher_assignments`.
  - Quản trị viên (`SUPER_ADMIN`, `ADMIN`) có đặc quyền giám sát và điều hành toàn bộ nhóm lớp.

### 3. Bảo vệ Microphone & Quyền riêng tư (Microphone Privacy)
- Trình duyệt chỉ xin quyền micro khi người dùng chủ động nhấn nút bắt đầu cuộc gọi (`startCall`).
- Khi đóng modal cuộc gọi hoặc chuyển trang, toàn bộ `MediaStreamTrack` đều được gọi `.stop()` và `AudioContext` được đóng (`.close()`) ngay lập tức, đảm bảo **không có tiến trình nghe lén hoặc chiếm dụng micro chạy ngầm**.
- Không tự ý lưu trữ tệp ghi âm thô vào máy chủ mà chưa có chính sách đồng ý từ người học.

### 4. Phòng chống gửi lặp (Idempotent Deduplication & Rate Limiting)
- Mọi tin nhắn văn bản đều gửi kèm `clientMsgId`. Backend kiểm tra bảng `chat_messages` theo cặp `(conversation_id, client_msg_id)`, nếu phát hiện trùng lặp sẽ trả về bản ghi cũ mà không ghi đè hay tạo tin nhắn rác.

