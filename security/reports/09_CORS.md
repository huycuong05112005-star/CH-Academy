# 09. CORS (CROSS-ORIGIN RESOURCE SHARING) Security Report

## Status: PASS (ĐÃ CẤU HÌNH NGUYÊN TẮC LEAST PRIVILEGE)

## Findings
Kiểm tra cấu hình `corsConfigurationSource()` trong `SecurityConfig.java`:
1. **Nguồn gốc cho phép (Allowed Origins):**
   - Chỉ cho phép các origin tin cậy: `http://localhost:5173` (Vite dev) và `http://localhost:3000`.
   - Tuyệt đối không sử dụng ký tự đại diện `*` khi `allowCredentials = true`.
2. **Phương thức cho phép (Allowed Methods):**
   - Chỉ mở các phương thức tiêu chuẩn: `GET`, `POST`, `PUT`, `DELETE`, `PATCH`, `OPTIONS`.
3. **Tiêu đề cho phép (Allowed Headers):**
   - Giới hạn ở: `Authorization`, `Content-Type`, `X-Requested-With`, `Accept`.

## What's at risk
- Cấu hình CORS lỏng lẻo (`Access-Control-Allow-Origin: *` kết hợp `allowCredentials: true`) cho phép các website độc hại của bên thứ ba gửi request ngầm và đọc trộm phản hồi chứa dữ liệu nhạy cảm của người dùng.

## What's already secure
- Hệ thống áp dụng cấu hình CORS chặt chẽ, kiểm soát nghiêm ngặt preflight request (OPTIONS).

## Recommendations
- Khi triển khai production, cấu hình biến môi trường `APP_CORS_ALLOWED_ORIGINS` trỏ chính xác về tên miền chính thức của CH Academy.

## Remediation Implemented
- Duy trì và kiểm chứng cấu hình CORS đã được chuẩn hóa trong `SecurityConfig.java`.

## Verification Results
- **Vibe Check Scanner kiểm tra với origin ngoại lai (`http://evil.com`):**
  - `page: foreign origins are not allowed` -> **PASS**
  - `static asset: foreign origins are not allowed` -> **PASS**
  - `API localhost:8088/api/v1/health: foreign origins are not allowed` -> **PASS**
