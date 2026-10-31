# KẾ HOẠCH KHẮC PHỤC VÀ GIA CỐ BẢO MẬT (REMEDIATION PLAN)

**Dự án:** CH Academy  
**Thời gian lập kế hoạch:** 31/10/2026  
**Mục tiêu:** Khắc phục triệt để 100% lỗ hổng P0, P1 và đưa hệ thống vào trạng thái vận hành an toàn.

---

## I. DANH SÁCH HẠNG MỤC ƯU TIÊN VÀ TIẾN ĐỘ THỰC HIỆN

| STT | Hạng mục | Mức độ | Trạng thái | File thực thi |
|:---:|:---|:---:|:---:|:---|
| 1 | Xóa bỏ mật khẩu bản rõ `raw_password` khỏi CSDL | **P0** | **ĐÃ HOÀN THÀNH** | Flyway V27, User.java, DTOs |
| 2 | Loại bỏ lộ mật khẩu trên Frontend và file CSV | **P0** | **ĐÃ HOÀN THÀNH** | StudentListPage.tsx, TeacherAssignmentsPage.tsx |
| 3 | Chống dò quét username và khóa tài khoản sau 5 lần sai | **P1** | **ĐÃ HOÀN THÀNH** | AuthService.java, AuthControllerTest.java |
| 4 | Cấu hình Security Headers, CSP, nosniff, DENY clickjacking | **P1** | **ĐÃ HOÀN THÀNH** | SecurityConfig.java, vite.config.ts |
| 5 | Tích hợp Rate Limiting chống Brute-force & DoS LLM | **P1** | **ĐÃ HOÀN THÀNH** | RateLimitingFilter.java |
| 6 | Kiểm tra Magic Bytes và chống Path Traversal tệp tải lên | **P1** | **ĐÃ HOÀN THÀNH** | FileStorageService.java |
| 7 | Xác thực chữ ký số HMAC-SHA256 cho Webhook | **P1** | **ĐÃ HOÀN THÀNH** | ZaloWebhookController.java |
| 8 | Ràng buộc bảo mật cổng Database Docker về 127.0.0.1 | **P0** | **ĐÃ HOÀN THÀNH** | docker-compose.yml |
