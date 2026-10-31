# 07. CSRF (CROSS-SITE REQUEST FORGERY) Security Report

## Status: PASS (KIẾN TRÚC STATELESS JWT REST API)

## Findings
1. **Cơ chế xác thực ứng dụng:**
   - CH Academy xây dựng theo kiến trúc hiện đại: Single Page Application (SPA React) tách biệt hoàn toàn với Spring Boot REST API.
   - Xác thực người dùng dựa trên Bearer Token (JWT) được truyền trong HTTP Request Header:
     `Authorization: Bearer <token>`
   - Hệ thống không sử dụng Cookie của trình duyệt để tự động xác thực các yêu cầu API thay đổi dữ liệu (POST, PUT, DELETE, PATCH).
2. **Cấu hình Spring Security:**
   - Trong `SecurityConfig.java`: `csrf(AbstractHttpConfigurer::disable)` được cấu hình có chủ đích, hoàn toàn phù hợp với chuẩn bảo mật REST API Stateless.

## What's at risk
- Tấn công CSRF chỉ có thể xảy ra khi trình duyệt tự động gửi kèm cookie phiên đăng nhập khi người dùng bấm vào liên kết trên trang web độc hại của kẻ tấn công. Do CH Academy không xác thực qua cookie tự động, nguy cơ này hoàn toàn bị loại trừ.

## What's already secure
- Mọi API thay đổi trạng thái đều bắt buộc phải có tiêu đề `Authorization` hợp lệ mà mã JavaScript độc hại từ trang web khác không thể tự động đính kèm do chính sách Same-Origin Policy (SOP).

## Recommendations
- Tiếp tục duy trì việc truyền token qua tiêu đề `Authorization`.
- Không chuyển đổi cơ chế xác thực sang Cookie trừ khi triển khai đầy đủ cờ `SameSite=Strict`, `HttpOnly`, `Secure` và CSRF Token kép.

## Remediation Implemented
- Đã thẩm tra kiến trúc và xác nhận tính an toàn của mô hình Bearer Token.

## Verification Results
- Vibe Check Scanner: `INFO - No cookies set on the landing page` (Hệ thống không phụ thuộc vào cookie phiên).
