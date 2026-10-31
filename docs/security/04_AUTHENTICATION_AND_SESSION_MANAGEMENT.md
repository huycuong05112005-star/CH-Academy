# CH ACADEMY — HỆ THỐNG AN NINH THÔNG TIN TOÀN DIỆN
## Tài liệu 04: Xác thực và Quản lý Phiên Người dùng (Authentication & Session Security)

---

## 1. CƠ CHẾ XÁC THỰC KÉP JWT & DATABASE SESSION TRACKING

CH Academy kết hợp ưu điểm của kiến trúc Stateless JWT với khả năng kiểm soát tức thì của Stateful Session Tracking:

1. **JSON Web Token (JWT)**:
   - Sử dụng thuật toán ký `HMAC-SHA256` với secret key bảo mật cao từ biến môi trường.
   - Thời gian sống của Access Token: 60 phút. Chứa các claims: `sub` (username), `userId`, `roles`, `jti` (unique token id).
   - Tự động mã hóa và truyền tải qua HTTP Header `Authorization: Bearer <token>`.

2. **Bảng Theo dõi Phiên Hoạt động (`user_sessions`)**:
   - Mỗi lần người dùng đăng nhập thành công, hệ thống sinh một phiên mới lưu trong bảng `user_sessions`:
     - `session_token`: Mã định danh phiên độc nhất.
     - `ip_address`: Địa chỉ IP của máy khách.
     - `user_agent`: Thông tin hệ điều hành và trình duyệt.
     - `device_type`: Desktop / Mobile / Tablet.
     - `is_active`: Trạng thái hoạt động (true/false).
     - `last_activity_at`: Dấu thời gian hoạt động gần nhất.

---

## 2. TÍNH NĂNG THU HỒI PHIÊN TỪ XA (REMOTE SESSION REVOCATION)

Tại Trung tâm An ninh Quản trị (`/admin/security` -> Tab "Phiên hoạt động"):
- Quản trị viên có thể xem danh sách tất cả các phiên đang đăng nhập trên toàn hệ thống kèm IP, thiết bị và thời điểm online.
- **Nút "Cưỡng chế Đăng xuất" (Revoke Session)**:
  - Khi Admin phát hiện phiên đăng nhập đáng ngờ (VD: IP lạ từ nước ngoài hoặc thiết bị không xác định), Admin nhấn "Đăng xuất".
  - Backend thực thi `POST /api/v1/admin/security/sessions/{id}/revoke`: Cập nhật `is_active = false` và `revoked_at = NOW()`.
  - Bộ lọc `JwtAuthenticationFilter` trên mỗi request kiểm tra tính hợp lệ của phiên: Nếu `is_active == false`, token lập tức bị vô hiệu hóa và phản hồi `401 Unauthorized`, người dùng bị đẩy ra khỏi màn hình ngay lập tức mà không cần chờ JWT hết hạn.
