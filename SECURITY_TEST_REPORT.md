# BÁO CÁO KIỂM THỬ BẢO MẬT & KIỂM SOÁT TRUY CẬP (SECURITY TEST REPORT)

## 1. MỤC TIÊU & PHƯƠNG PHÁP

Đánh giá tính an toàn bảo mật, phân quyền RBAC và kiểm soát truy cập theo các tiêu chuẩn OWASP Top 10 đối với API và giao diện của CH Academy.

---

## 2. KẾT QUẢ KIỂM THỬ CÁC TIÊU CHÍ BẢO MẬT

### 2.1. Xác thực & Quản lý Phiên (Authentication & Session Management)
- **Cơ chế:** JSON Web Token (JWT) với thuật toán HMAC-SHA256, thời hạn sống hợp lý.
- **Xử lý phiên hết hạn:** `GlobalExceptionHandler.java` bắt lỗi `AccessDeniedException` và kiểm tra nếu `auth == null || isAnonymous` thì lập tức trả về mã HTTP `401 UNAUTHORIZED`.
- **Frontend handling:** `client.ts` tự động xóa token khỏi `localStorage` và chuyển hướng về `/login` khi nhận mã `401`.

### 2.2. Kiểm soát Truy cập Ngang & Dọc (Broken Access Control)
- **Kiểm thử Cổng Quản trị từ tài khoản Học viên:**
  - Endpoint `GET /api/v1/dashboard/stats` với token học viên: Trả về HTTP `403 FORBIDDEN` (PASS).
  - Endpoint `POST /api/v1/admin/ai/agents` với token học viên: Trả về HTTP `403 FORBIDDEN` (PASS).
- **Kiểm thử Cổng Học viên từ tài khoản Quản trị viên:**
  - Không còn hiện tượng fallback tự gán hồ sơ `HV20240002`. Nếu admin truy cập `/student/portal/me`, backend trả về `404 NOT_FOUND` với thông điệp: "Tài khoản 'admin' chưa được liên kết với hồ sơ học viên" (PASS).

### 2.3. Chống Trùng lặp & Tấn công DoS Tin nhắn (Message Ingestion Idempotency)
- Header / Body request hỗ trợ `clientMsgId`. Gửi trùng lặp cùng một ID không tạo ra hai bản ghi trong cơ sở dữ liệu.
- Mọi câu hỏi gửi đến Gemini LLM đều được kiểm soát tốc độ (rate limit / debounce) và giới hạn độ dài ký tự đầu vào.
