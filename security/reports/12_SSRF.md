# BÁO CÁO BẢO MẬT: 12. PHÒNG CHỐNG TẤN CÔNG SSRF (SERVER-SIDE REQUEST FORGERY)

**Dự án:** CH Academy  
**Phân loại rủi ro:** P1 - High (CWE-918)  
**Tiêu chuẩn đối chiếu:** OWASP Top 10 A10:2021 – Server-Side Request Forgery

---

## 1. PHẠM VI KIỂM SOÁT
- Các chức năng thực hiện HTTP Client ra bên ngoài:
  - Tích hợp Zalo Webhook / OA API.
  - Tích hợp OpenRouter / Gemini API.
- Đã audit toàn bộ các điểm gọi `RestTemplate`, `WebClient`, `HttpClient`.

## 2. KẾT QUẢ ĐÁNH GIÁ
- Các URL gọi ra bên ngoài đều được hard-code hoặc đọc từ cấu hình hệ thống (`application.yml`), không nhận URL do người dùng truyền vào từ request query/body.
- Không tồn tại API nhận `url` để backend tải dữ liệu từ xa (remote fetch) về máy chủ.
- Trạng thái: **AN TOÀN (PASS)**.
