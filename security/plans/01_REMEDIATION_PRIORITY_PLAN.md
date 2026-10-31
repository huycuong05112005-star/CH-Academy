# KẾ HOẠCH KHẮC PHỤC THEO THỨ TỰ ƯU TIÊN (REMEDIATION PRIORITY PLAN)

**Dự án:** CH Academy  
**Mục tiêu:** Xử lý triệt để 100% các lỗ hổng từ mức P0 (Critical) đến P1 (High) và đưa hệ thống vào trạng thái vận hành an toàn.

---

## I. MA TRẬN PHÂN LOẠI VÀ TIẾN ĐỘ THỰC HIỆN

| Mức độ | Hạng mục lỗ hổng | Tác động | Trạng thái | Giải pháp đã thực thi |
|:---:|:---|:---|:---:|:---|
| **P0** | Lộ mật khẩu bản rõ `raw_password` | Chiếm đoạt tài khoản toàn bộ học viên & GV | **ĐÃ XỬ LÝ 100%** | Xóa cột DB (V27), xóa thuộc tính Entity/DTO/Service, xóa hiển thị & CSV trên Frontend. |
| **P0** | Mở cổng Database PostgreSQL ra Internet | Tấn công vét cạn và truy cập CSDL từ xa | **ĐÃ XỬ LÝ 100%** | Ràng buộc `127.0.0.1:5432` trong `docker-compose.yml`. |
| **P1** | Dò quét tài khoản (User Enumeration) | Xác định danh sách tài khoản hợp lệ | **ĐÃ XỬ LÝ 100%** | Thống nhất phản hồi `BAD_CREDENTIALS` (HTTP 401). |
| **P1** | Thiếu khóa tài khoản (Brute-force) | Tấn công đoán mật khẩu liên tục | **ĐÃ XỬ LÝ 100%** | Tự động khóa tài khoản sau 5 lần đăng nhập thất bại. |
| **P1** | Thiếu Rate Limiting | Nguy cơ DoS và cạn kiệt ngân sách AI | **ĐÃ XỬ LÝ 100%** | Tích hợp `RateLimitingFilter.java` giới hạn Login, AI Chat, File Upload. |
| **P1** | Thiếu Security Headers & CSP | Clickjacking, MIME-sniffing, chèn script | **ĐÃ XỬ LÝ 100%** | Cấu hình `SecurityConfig.java` với CSP, frame-ancestors 'none', nosniff, DENY. |
| **P1** | File Upload không kiểm tra Magic Bytes | Upload tệp mã độc mạo danh định dạng ảnh/tài liệu | **ĐÃ XỬ LÝ 100%** | Bổ sung kiểm tra chữ ký nhị phân thực tế và chặn Path Traversal trong `FileStorageService.java`. |
| **P1** | Webhook không xác thực chữ ký | Giả mạo sự kiện từ bên ngoài | **ĐÃ XỬ LÝ 100%** | Bổ sung xác thực `X-Zalo-Signature` trong `ZaloWebhookController.java`. |
| **P1** | Phân luồng Chat và WebSocket | Học viên truy cập nhầm nhóm chat lớp khác | **ĐÃ XỬ LÝ 100%** | Tách biệt 4 Widget và kiểm soát quyền Subscribe kênh phòng chat. |
