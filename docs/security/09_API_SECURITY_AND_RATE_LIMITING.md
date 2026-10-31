# CH ACADEMY — HỆ THỐNG AN NINH THÔNG TIN TOÀN DIỆN
## Tài liệu 09: Bảo mật API, Giới hạn Tần suất và Tiêu đề An toàn (API Security & Rate Limiting)

---

## 1. GIỚI HẠN TẦN SUẤT TRUY CẬP (RATE LIMITING)

Để bảo vệ hệ thống trước các cuộc tấn công Brute-force mật khẩu, Scraping dữ liệu hoặc DoS tầng ứng dụng, CH Academy triển khai bộ lọc `RateLimitingFilter`:

- **Thuật toán Token Bucket**:
  - Mỗi địa chỉ IP được cấp phát một thùng token với tốc độ hồi phục định kỳ.
  - Ngưỡng công khai: Tối đa 60 requests/phút cho các API duyệt thông tin thông thường.
  - Ngưỡng xác thực (`/api/v1/auth/**`): Tối đa 10 requests/phút. Nếu vượt quá, hệ thống trả về mã lỗi `429 Too Many Requests` và tạm khóa IP đó trong 5 phút.
  - Ngưỡng Voice AI & Webhook: Tối đa 30 requests/phút nhằm chống lạm dụng tài nguyên tính toán sinh giọng nói.

---

## 2. BẢO MẬT TIÊU ĐỀ HTTP (HTTP SECURITY HEADERS)

Trong lớp cấu hình `SecurityConfig.java`, hệ thống áp dụng các tiêu đề bảo mật chuẩn công nghiệp:

1. **Content-Security-Policy (CSP)**:
   - Ngăn chặn triệt để tấn công XSS (Cross-Site Scripting) và Data Injection.
   - Chỉ cho phép nạp script, style và tài nguyên từ các nguồn tin cậy (`'self'`).
2. **X-Frame-Options: DENY**:
   - Ngăn chặn toàn bộ việc nhúng giao diện CH Academy vào thẻ `<iframe>`, loại trừ nguy cơ tấn công Clickjacking.
3. **X-Content-Type-Options: nosniff**:
   - Ngăn chặn trình duyệt tự ý đoán định dạng MIME type của file tải về.
4. **Strict-Transport-Security (HSTS)**:
   - Bắt buộc toàn bộ kết nối phải sử dụng giao thức HTTPS an toàn (`max-age=31536000; includeSubDomains`).
5. **CORS Policy (Cross-Origin Resource Sharing)**:
   - Cấu hình tường minh danh sách `allowedOrigins` (chỉ cho phép các domain chính thức của CH Academy), từ chối ký tự đại diện `*` khi có kèm thông tin xác thực (`allowCredentials = true`).
