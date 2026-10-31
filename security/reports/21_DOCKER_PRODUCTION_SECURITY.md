# BÁO CÁO BẢO MẬT: 21. BẢO MẬT HẠ TẦNG DOCKER VÀ MÔI TRƯỜNG PRODUCTION

**Dự án:** CH Academy  
**Phân loại rủi ro:** P0 - Critical (CWE-200 / CWE-284)  
**Tiêu chuẩn đối chiếu:** CIS Docker Benchmark v1.6.0

---

## 1. LỖ HỔNG PHÁT HIỆN TRƯỚC KHI GIA CỐ
- Trong file `docker-compose.yml`, dịch vụ cơ sở dữ liệu PostgreSQL được cấu hình mở cổng công khai:
  ```yaml
  ports:
    - "${POSTGRES_PORT:-5432}:5432"
  ```
  Khi triển khai trên máy chủ Linux/Cloud có IP tĩnh, Docker sẽ tự động bind cổng này vào `0.0.0.0:5432`, phơi bày cổng cơ sở dữ liệu ra toàn bộ mạng Internet công cộng!

## 2. BIỆN PHÁP KHẮC PHỤC TRIỆT ĐỂ
- Cập nhật cấu hình cổng trong `docker-compose.yml` ràng buộc nghiêm ngặt vào loopback adapter nội bộ:
  ```yaml
  ports:
    - "127.0.0.1:${POSTGRES_PORT:-5432}:5432"
  ```
  Ngăn chặn hoàn toàn truy cập trực tiếp từ Internet vào CSDL PostgreSQL. Mọi kết nối bắt buộc phải đi qua backend hoặc SSH tunnel có xác thực.

## 3. THIẾT LẬP PRODUCTION SECURITY CHECKLIST
1. Chạy container với tài nguyên giới hạn (CPU, RAM).
2. Không lưu trữ mật khẩu root mặc định trong compose file khi triển khai thực tế.
3. Giám sát các tiến trình container và tự động khởi động lại khi có sự cố (`restart: unless-stopped`).
- Trạng thái: **ĐÃ GIA CỐ VÀ KHẮC PHỤC (PASS)**.
