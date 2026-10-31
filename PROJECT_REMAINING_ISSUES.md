# DANH MỤC CÁC VẤN ĐỀ TỒN ĐỌNG & LỘ TRÌNH NÂNG CẤP — CH ACADEMY
**Thời điểm lập:** 31/10/2026

---

## 1. CÁC ĐIỂM CẦN LƯU Ý TRƯỚC KHI DEPLOY PRODUCTION INTERNET

1. **Cấu hình SMTP gửi Mail thực tế:**
   - Trong `application.properties`, `spring.mail.password` hiện đang để trống cho môi trường phát triển local. Khi triển khai lên server production có internet, cần điền App Password của tài khoản Gmail (`MAIL_PASSWORD=...`) để kích hoạt chức năng gửi email chào mừng và thông báo học phí.
2. **Cấu hình JWT Secret:**
   - `JWT_SECRET` đang dùng secret mặc định cho Dev. Khi chạy Docker compose trên server production, cần truyền biến môi trường `JWT_SECRET` với chuỗi ngẫu nhiên tối thiểu 256 bits.
3. **CORS Configuration:**
   - Hiện tại cấu hình `app.cors.allowed-origins=http://localhost:5173,http://localhost:3000`. Khi gắn domain chính thức (ví dụ `https://chacademy.vn`), cần bổ sung domain này vào cấu hình CORS.

---

## 2. KẾ HOẠCH NÂNG CẤP TIẾP THEO

1. **Tích hợp Chat Nhóm theo lớp học (Class-Based Group Chat):**
   - Tự động đồng bộ thành viên vào nhóm chat khi ghi danh hoặc phân công giảng viên.
2. **Tích hợp Gen AI Chat Box:**
   - Xây dựng kiến trúc AI Engine độc lập, tích hợp trực tiếp vào backend Spring Boot với ngữ cảnh động theo vai trò (Admin, Giảng viên, Học viên).

