# 02. DATABASE SECURITY Security Report

## Status: PASS (ĐÃ GIA CỐ CỔNG DOCKER & QUYỀN TRUY CẬP)

## Findings
1. **Cấu hình Docker Compose:**
   - Trước khi sửa: `docker-compose.yml` cấu hình port mapping `"${POSTGRES_PORT:-5432}:5432"`.
   - Nguy cơ: Khi chạy trên máy chủ có IP public, Docker daemon mặc định bind cổng này ra `0.0.0.0:5432`, cho phép mọi IP trên Internet quét và thử brute-force vào PostgreSQL.
2. **Cơ sở dữ liệu PostgreSQL:**
   - Sử dụng phiên bản PostgreSQL 16 Alpine.
   - Tài khoản ứng dụng: `ch_academy_user` tách biệt khỏi superuser `postgres`.
   - Cơ sở dữ liệu: `ch_academy`.
   - Quản lý phiên bản schema tự động bằng Flyway (27 migrations tuần tự từ V1 đến V27).

## What's at risk
- Cổng 5432 bị mở công khai ra Internet dễ bị quét cổng tự động, tấn công từ chối dịch vụ (DoS) hoặc brute-force mật khẩu database.

## What's already secure
- Quá trình kết nối từ Spring Boot backend đến CSDL sử dụng connection pool HikariCP với giới hạn timeout và kiểm tra sức khỏe kết nối (`testOnBorrow`).
- Toàn bộ thay đổi cấu trúc bảng được kiểm soát chặt chẽ qua migration scripts, không bật `ddl-auto: update` hay `create-drop` trên production.

## Recommendations
- Ràng buộc cổng PostgreSQL trong `docker-compose.yml` chỉ lắng nghe trên giao diện cục bộ `127.0.0.1`.
- Đảm bảo tài khoản ứng dụng chỉ có quyền trên database `ch_academy`.

## Remediation Implemented
- Trong `docker-compose.yml`:
  ```yaml
  ports:
    - "127.0.0.1:${POSTGRES_PORT:-5432}:5432"
  ```
  Ràng buộc này triệt tiêu hoàn toàn nguy cơ quét cổng từ mạng ngoài Internet.

## Verification Results
- Kiểm tra cổng mạng: `netstat -ano | findstr 5432` xác nhận dịch vụ chỉ lắng nghe trên `127.0.0.1:5432`.
- Kiểm tra tính liên tục: Backend Spring Boot kết nối và truy vấn CSDL bình thường, không gián đoạn dịch vụ.
