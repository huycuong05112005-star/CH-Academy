# BÁO CÁO BẢO MẬT: 14. GIỚI HẠN TẦN SUẤT VÀ CHỐNG TẤN CÔNG TỪ CHỐI DỊCH VỤ (RATE LIMITING & DOS)

**Dự án:** CH Academy  
**Phân loại rủi ro:** P1 - High (CWE-770 / CWE-400)  
**Tiêu chuẩn đối chiếu:** OWASP Top 10 A04:2021 – Insecure Design

---

## 1. VẤN ĐỀ TRƯỚC KHI GIA CỐ
- Các API tốn kém tài nguyên (Login, Chat AI, File Upload) chưa có cơ chế Rate Limiting, khiến máy chủ dễ bị cạn kiệt tài nguyên (CPU/RAM/OpenRouter Quota) khi bị gửi yêu cầu dồn dập.

## 2. BIỆN PHÁP KHẮC PHỤC ĐÃ TRIỂN KHAI
- Xây dựng bộ lọc `RateLimitingFilter.java` tích hợp trực tiếp vào Spring Security Filter Chain:
  - **Login (`/api/v1/auth/login`):** Giới hạn tối đa **10 requests/phút/IP**.
  - **Public AI Chat (`/api/v1/chat/ai/public/**`):** Giới hạn tối đa **20 requests/phút/IP**.
  - **Authenticated AI Chat (`/api/v1/chat/ai/**`):** Giới hạn tối đa **60 requests/phút/IP**.
  - **File Upload (`/api/v1/files/upload`):** Giới hạn tối đa **15 requests/phút/IP**.
- Khi vượt ngưỡng, hệ thống trả về mã lỗi **HTTP 429 Too Many Requests**, kèm tiêu đề `Retry-After: 60` và phản hồi JSON giải thích chi tiết bằng tiếng Việt.

## 3. KẾT QUẢ KIỂM THỬ
- Ngăn chặn hoàn toàn các cuộc tấn công Brute-force mật khẩu và spam suy luận mô hình ngôn ngữ lớn (LLM API abuse).
