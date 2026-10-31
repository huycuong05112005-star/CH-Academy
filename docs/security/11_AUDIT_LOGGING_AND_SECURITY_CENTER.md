# CH ACADEMY — HỆ THỐNG AN NINH THÔNG TIN TOÀN DIỆN
## Tài liệu 11: Nhật ký Kiểm toán và Trung tâm An ninh Quản trị (Audit Logging & Security Center)

---

## 1. HỆ THỐNG GHI NHẬT KÝ KIỂM TOÁN BẤT BIẾN (IMMUTABLE AUDIT LOGS)

Mọi thao tác thay đổi trạng thái quan trọng trong hệ thống đều được tự động ghi nhận vào bảng `audit_logs`:
- **Thông tin lưu trữ**:
  - `user_id` / `username`: Người thực hiện hành vi.
  - `action`: Thao tác (VD: `ENROLLMENT_APPROVED`, `SECURITY_SESSION_REVOKED`, `EXAM_SUBMITTED`, `ACADEMIC_YEAR_CLOSED`).
  - `entity_type` & `entity_id`: Đối tượng chịu tác động.
  - `details`: Chi tiết thay đổi trước và sau khi thao tác (JSON diff).
  - `ip_address` & `user_agent`: Vết mạng của người thực hiện.
  - `created_at`: Dấu thời gian chuẩn UTC.
- **Tính bất biến**: Bảng `audit_logs` chỉ hỗ trợ thao tác ghi (`INSERT`) và đọc (`SELECT`). Tuyệt đối không cung cấp API cập nhật (`UPDATE`) hoặc xóa (`DELETE`), bảo toàn bằng chứng phục vụ công tác thanh tra và kiểm định an ninh.

---

## 2. GIAO DIỆN TRUNG TÂM AN NINH QUẢN TRỊ (`/admin/security`)

Được thiết kế hiện đại, cung cấp khả năng điều hành phòng thủ cho Quản trị viên:

1. **Dashboard Tổng quan (Security Posture Overview)**:
   - Thẻ đánh giá Tư thế Zero Trust: `COMPLIANT` kèm số lượng phiên hoạt động.
   - Thống kê tỷ lệ cảnh báo theo mức độ: Thấp (`LOW`), Trung bình (`MEDIUM`), Cao (`HIGH`), Nghiêm trọng (`CRITICAL`).

2. **Quản lý Cảnh báo An ninh (Threat & Alert Monitoring)**:
   - Bảng cảnh báo động hỗ trợ lọc theo mức độ rủi ro và trạng thái xử lý (`OPEN`, `RESOLVED`, `IGNORED`).
   - Nút "Đánh dấu đã giải quyết" giúp cán bộ an ninh đóng các cảnh báo sau khi xác minh.

3. **Giám sát & Cưỡng chế Phiên Hoạt động (Session Watchdog)**:
   - Danh sách chi tiết từng thiết bị, địa chỉ IP và trình duyệt đang kết nối.
   - Nút hành động "Đăng xuất" kích hoạt lệnh thu hồi phiên từ xa ngay lập tức.

4. **Trích xuất Tóm tắt Nhật ký Kiểm toán (Recent Audit Activity)**:
   - Dòng thời gian 20 sự kiện hệ thống mới nhất giúp phát hiện nhanh các dấu hiệu bất thường.
