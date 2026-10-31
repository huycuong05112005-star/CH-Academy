# BÁO CÁO BẢO MẬT: 16. KIỂM TOÁN THƯ VIỆN VÀ PHỤ THUỘC (DEPENDENCY AUDIT)

**Dự án:** CH Academy  
**Phân loại rủi ro:** P2 - Medium (CWE-1395)  
**Tiêu chuẩn đối chiếu:** OWASP Top 10 A06:2021 – Vulnerable and Outdated Components

---

## 1. PHÂN TÍCH DEPENDENCY BACKEND & FRONTEND
- **Backend:**
  - Spring Boot 3.5.0, Spring Framework 6.2.7.
  - Hibernate ORM 6.6.15.Final.
  - PostgreSQL Driver 42.7.x.
  - JJWT 0.12.6 (sử dụng chuẩn ký HMAC SHA256 an toàn).
- **Frontend:**
  - React 19 / Vite 8.3.5.
  - Lucide React, TailwindCSS.

## 2. KẾT LUẬN & ĐỀ XUẤT
- Không phát hiện thư viện chứa lỗ hổng RCE đã công bố (như Log4Shell).
- Khuyến nghị kích hoạt GitHub Dependabot để tự động nhận thông báo khi có bản cập nhật bảo mật cho các gói npm và maven.
