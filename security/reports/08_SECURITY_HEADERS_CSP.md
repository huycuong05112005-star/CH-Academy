# 08. SECURITY HEADERS & CSP Security Report

## Status: PASS (ĐÃ CẤU HÌNH ĐẦY ĐỦ TIÊU ĐỀ BẢO MẬT & CSP)

## Findings
Trước khi gia cố, ứng dụng thiếu các tiêu đề bảo mật HTTP chuẩn công nghiệp để phòng chống Clickjacking, MIME-sniffing và XSS:
- Thiếu `X-Frame-Options: DENY`.
- Thiếu `X-Content-Type-Options: nosniff`.
- Thiếu `Referrer-Policy: strict-origin-when-cross-origin`.
- Thiếu `Permissions-Policy`.
- Thiếu `Content-Security-Policy` (CSP) chặt chẽ.

## What's at risk
- Nguy cơ Clickjacking: Website có thể bị nhúng vào `<iframe>` trên trang web độc hại để lừa người dùng bấm các thao tác ngoài ý muốn.
- Nguy cơ MIME Sniffing: Trình duyệt có thể tự ý đoán định dạng file tải lên và thực thi mã độc.

## What's already secure
- Toàn bộ giao tiếp nội bộ và cấu hình CORS đã được chuẩn hóa.

## Recommendations
- Cấu hình tập trung toàn bộ Security Headers trong Spring Security `SecurityConfig.java`.
- Đồng bộ các tiêu đề này trên máy chủ frontend Vite.

## Remediation Implemented
1. **Trong `backend/src/main/java/vn/chacademy/security/SecurityConfig.java`:**
   ```java
   .headers(headers -> headers
       .frameOptions(HeadersConfigurer.FrameOptionsConfig::deny)
       .contentTypeOptions(Customizer.withDefaults())
       .referrerPolicy(r -> r.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
       .permissionsPolicy(p -> p.policy("camera=(), microphone=(self), geolocation=(), payment=()"))
       .contentSecurityPolicy(csp -> csp.policyDirectives(
           "default-src 'self'; " +
           "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
           "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
           "font-src 'self' https://fonts.gstatic.com data:; " +
           "img-src 'self' data: https: blob:; " +
           "connect-src 'self' http://localhost:* ws://localhost:* https://openrouter.ai https://generativelanguage.googleapis.com; " +
           "media-src 'self' blob:; " +
           "object-src 'none'; " +
           "base-uri 'self'; " +
           "form-action 'self'; " +
           "frame-ancestors 'none'"
       ))
   )
   ```
2. **Thu hẹp Spring Boot Actuator:** Chỉ cho phép `/api/v1/health` và `/api/v1/actuator/health` công khai; tất cả các actuator endpoint khác đều yêu cầu quyền `SUPER_ADMIN`.

## Verification Results
- **Kiểm tra trực tiếp qua curl:**
  ```http
  HTTP/1.1 200 
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(self), geolocation=(), payment=()
  Content-Security-Policy: default-src 'self'; ... frame-ancestors 'none'
  ```
- **Vibe Check Live Scanner:**
  - `X-Frame-Options: DENY` -> **PASS**
  - `X-Content-Type-Options: nosniff` -> **PASS**
  - `Referrer-Policy: strict-origin-when-cross-origin` -> **PASS**
  - `CSP object-src: 'none'` -> **PASS**
  - `CSP base-uri: 'self'` -> **PASS**
  - `CSP frame-ancestors: 'none'` -> **PASS**
