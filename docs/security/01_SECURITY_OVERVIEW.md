# CH ACADEMY — HỆ THỐNG AN NINH THÔNG TIN TOÀN DIỆN
## Tài liệu 01: Tổng quan An ninh và Tư thế Zero Trust (Security Overview & Zero Trust Posture)

---

## 1. TỔNG QUAN HỆ THỐNG VÀ CHIẾN LƯỢC BẢO MẬT

CH Academy là nền tảng quản lý đào tạo, khảo thí trực tuyến và trợ lý AI thông minh phục vụ đồng thời ba nhóm người dùng: Quản trị viên (Admin), Giảng viên (Teacher) và Học viên (Student). Do tính chất xử lý dữ liệu định danh cá nhân (PII), kết quả thi cử, dữ liệu tài chính học phí và tài liệu tri thức nội bộ, hệ thống áp dụng nguyên tắc **Zero Trust Architecture (ZTA)** xuyên suốt mọi tầng kiến trúc:

- **Never Trust, Always Verify**: Mọi yêu cầu truy cập từ bên ngoài lẫn bên trong mạng nội bộ đều phải được xác thực danh tính và kiểm tra quyền truy cập ở mức chi tiết nhất.
- **Least Privilege Access**: Người dùng và dịch vụ chỉ được cấp quyền tối thiểu cần thiết để hoàn thành tác vụ được giao.
- **Assume Breach**: Thiết kế hệ thống với giả định môi trường có thể bị xâm nhập, từ đó triển khai các lớp phòng thủ sâu (Defense-in-Depth), cô lập dữ liệu và giám sát thời gian thực.

---

## 2. NĂM TRỤ CỘT BẢO MẬT CỦA CH ACADEMY

```
+---------------------------------------------------------------------------------+
|                         CH ACADEMY ZERO TRUST DEFENSE                           |
+---------------------------------------------------------------------------------+
| 1. IDENTITY & ACCESS      | Đa cổng phân tách (Admin, Teacher, Student)         |
|                           | JWT Bearer Token, Session Tracking & Remote Revoke  |
+---------------------------+-----------------------------------------------------+
| 2. DATA PROTECTION        | Field-Level Security (Ẩn PII, bảo vệ tài chính)     |
|                           | Isolation theo Niên khóa & Nhóm lớp học             |
+---------------------------+-----------------------------------------------------+
| 3. REALTIME & MESSAGING   | WebSocket Authorization Interceptor                 |
|                           | Chống IDOR/BOLA nhóm chat, tin nhắn ký danh         |
+---------------------------+-----------------------------------------------------+
| 4. AI PLATFORM & RAG      | Visibility Guard: PUBLIC, INTERNAL, TEACHER, ADMIN  |
|                           | Prompt Injection Prevention & Webhook HMAC SHA256   |
+---------------------------+-----------------------------------------------------+
| 5. AUDIT & MONITORING     | Immutable Audit Logs, Anomaly Detection             |
|                           | Trung tâm An ninh Quản trị (/admin/security)        |
+---------------------------------------------------------------------------------+
```

---

## 3. TRUNG TÂM AN NINH QUẢN TRỊ (SECURITY CENTER)

Để đảm bảo khả năng giám sát chủ động, CH Academy trang bị **Trung tâm An ninh (`/admin/security`)**:
1. **Chỉ số Tư thế Zero Trust (Zero Trust Posture)**: Đo lường trạng thái tuân thủ toàn hệ thống (COMPLIANT / WARNING / CRITICAL).
2. **Cảnh báo Đe dọa Thời gian thực (Active Security Alerts)**: Tự động ghi nhận và phân loại các sự kiện an ninh:
   - Đăng nhập từ thiết bị lạ / IP bất thường.
   - Phát hiện nghi vấn Brute-force mật khẩu.
   - Nỗ lực truy cập tài nguyên trái phép (IDOR/BOLA attempt).
   - Truy vấn AI vượt ngưỡng an toàn.
3. **Giám sát và Thu hồi Phiên từ xa (Remote Session Revocation)**: Liệt kê toàn bộ phiên đăng nhập đang hoạt động của mọi tài khoản (IP, trình duyệt, thời gian hoạt động cuối), cho phép Admin cưỡng chế ngắt phiên ngay lập tức khi phát hiện nghi vấn lộ lọt.
