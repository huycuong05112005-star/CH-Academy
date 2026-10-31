# 21. DOCKER & PRODUCTION SECURITY Security Report

## Status: PASS (ĐÃ CÔ LẬP CỔNG DOCKER & THIẾT LẬP CHECKLIST TRIỂN KHAI)

## Findings
1. **Docker Compose:**
   - Dịch vụ CSDL PostgreSQL được cấu hình trong `docker-compose.yml`.
   - Trước khi sửa: Cổng 5432 bị mở ra tất cả các interface mạng.
   - Sau khi sửa: Cổng 5432 được ràng buộc chặt chẽ vào `127.0.0.1`.
2. **Cấu hình Spring Boot Production:**
   - Chỉ mở cổng HTTP 8088 cho backend và 5173 cho frontend.
   - Actuator nhạy cảm đã được bảo vệ bằng Spring Security yêu cầu quyền quản trị viên cao nhất.

## What's at risk
- Lộ cổng quản trị hoặc cơ sở dữ liệu khi triển khai lên máy chủ VPS/Cloud công cộng.

## What's already secure
- Database chạy trong mạng nội bộ Docker bridge network `ch_academy_network`.
- Có healthcheck tự động giám sát trạng thái CSDL (`pg_isready`).

## Recommendations
- Khi đưa vào môi trường Production chính thức:
  1. Đổi mật khẩu database `POSTGRES_PASSWORD` thành chuỗi ngẫu nhiên dài từ 24 ký tự trở lên.
  2. Bật HTTPS / SSL thông qua Nginx Reverse Proxy hoặc Cloudflare CDN.
  3. Bật HSTS trên Nginx để bắt buộc toàn bộ kết nối đi qua HTTPS.

## Remediation Implemented
- Đã chỉnh sửa `docker-compose.yml` cố định cổng vào `127.0.0.1:${POSTGRES_PORT:-5432}:5432`.

## Verification Results
- Container `ch_academy_postgres` khởi động khỏe mạnh (healthy) và chỉ chấp nhận kết nối nội bộ.
