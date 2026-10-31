# BÁO CÁO BẢO MẬT: 19. BẢO MẬT HỆ THỐNG TIN NHẮN REAL-TIME VÀ WEBSOCKET

**Dự án:** CH Academy  
**Phân loại rủi ro:** P1 - High (CWE-285)  
**Tiêu chuẩn đối chiếu:** OWASP Top 10 A01:2021 – Broken Access Control

---

## 1. ĐẶC TẢ BẢO MẬT WEBSOCKET / STOMP
- Endpoint STOMP: `/ws`
- Kênh phát tin nhắn nhóm lớp: `/topic/class.{classId}`
- Kênh thông báo cá nhân: `/user/queue/notifications`

## 2. CƠ CHẾ BẢO MẬT ĐÃ THIẾT LẬP
1. **Xác thực kết nối (Connect Interceptor):**
   - Khi client bắt đầu bắt tay STOMP CONNECT, hệ thống kiểm tra JWT Token trong Header `Authorization`.
   - Nếu token không hợp lệ hoặc đã hết hạn, kết nối WebSocket bị từ chối ngay lập tức.
2. **Ủy quyền đăng ký kênh (Subscription Authorization):**
   - Khi client gửi lệnh `SUBSCRIBE /topic/class.{classId}`, hệ thống kiểm tra quyền thành viên trong database. Người dùng không phải thành viên lớp (và không phải Admin) sẽ bị ngắt kết nối kênh.
3. **Làm sạch nội dung tin nhắn (XSS Sanitization):**
   - Mọi tin nhắn gửi vào phòng chat đều được xử lý làm sạch mã HTML trước khi broadcast tới các thành viên khác.
- Trạng thái: **AN TOÀN (PASS)**.
