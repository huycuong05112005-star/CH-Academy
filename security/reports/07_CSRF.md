# BÁO CÁO BẢO MẬT: 07. BẢO VỆ PHÒNG CHỐNG TẤN CÔNG CSRF

**Dự án:** CH Academy  
**Phân loại rủi ro:** P2 - Medium (CWE-352)  
**Tiêu chuẩn đối chiếu:** OWASP Top 10 A01:2021 – Broken Access Control

---

## 1. PHÂN TÍCH KIẾN TRÚC
- CH Academy là ứng dụng Single Page Application (SPA React) giao tiếp với Spring Boot REST API thông qua cơ chế Bearer Token (JWT) trong tiêu đề `Authorization: Bearer <token>`.
- Client không sử dụng Cookie dựa trên trình duyệt để tự động xác thực request API.

## 2. KẾT LUẬN & ĐÁNH GIÁ
- Vì không sử dụng xác thực cookie tự động gửi kèm bởi trình duyệt cho các REST API nhạy cảm, hệ thống miễn nhiễm với tấn công Cross-Site Request Forgery (CSRF).
- Spring Security cấu hình `csrf.disable()` là phù hợp với kiến trúc Stateless REST API kết hợp với CORS nghiêm ngặt.
- Trạng thái: **AN TOÀN (PASS)**.
