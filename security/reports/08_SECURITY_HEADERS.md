# BÁO CÁO BẢO MẬT: 08. CẤU HÌNH TIÊU ĐỀ BẢO MẬT HTTP (SECURITY HEADERS & CSP)

**Dự án:** CH Academy  
**Phân loại rủi ro:** P1 - High (CWE-1021 / CWE-693)  
**Tiêu chuẩn đối chiếu:** OWASP Top 10 A05:2021 – Security Misconfiguration, Vibe Check Category 8

---

## 1. VẤN ĐỀ TRƯỚC KHI GIA CỐ
- Backend và Frontend chưa cấu hình đầy đủ các tiêu đề an ninh bắt buộc:
  - Thiếu `X-Content-Type-Options: nosniff`.
  - Thiếu tiêu đề chống Clickjacking `X-Frame-Options` và `frame-ancestors`.
  - Thiếu `Content-Security-Policy` (CSP) chặt chẽ.
  - Thiếu `Referrer-Policy` và `Permissions-Policy`.

## 2. GIA CỐ TOÀN DIỆN ĐÃ TRIỂN KHAI
1. **Backend `SecurityConfig.java`:**
   - `frameOptions`: DENY.
   - `contentTypeOptions`: nosniff.
   - `referrerPolicy`: strict-origin-when-cross-origin.
   - `permissionsPolicy`: camera=(), microphone=(self), geolocation=(), payment=().
   - `contentSecurityPolicy`:
     `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; connect-src 'self' http://localhost:* https://openrouter.ai https://generativelanguage.googleapis.com; media-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'`.
2. **Frontend `vite.config.ts`:**
   - Cấu hình server headers đồng bộ để bảo vệ cả trong môi trường phát triển lẫn production.

## 3. BẰNG CHỨNG KIỂM THỬ THỰC TẾ
- Kết quả quét Vibe Check Scanner trên cổng 5173 và 8088:
  - `X-Frame-Options: DENY` -> **PASS**
  - `X-Content-Type-Options: nosniff` -> **PASS**
  - `Referrer-Policy: strict-origin-when-cross-origin` -> **PASS**
  - `CSP frame-ancestors: 'none'` -> **PASS**
  - `CSP base-uri: 'self'` -> **PASS**
  - `CSP object-src: 'none'` -> **PASS**
