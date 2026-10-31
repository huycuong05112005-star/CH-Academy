# HƯỚNG DẪN TRIỂN KHAI VẬN HÀNH HỆ THỐNG (DEPLOYMENT GUIDE)

## 1. YÊU CẦU MÔI TRƯỜNG HỆ THỐNG

- **Hệ điều hành:** Linux (Ubuntu 22.04 LTS / Debian 12) hoặc Windows Server.
- **Java Runtime:** JDK 21 hoặc OpenJDK 25.
- **Node.js:** Node 20.x hoặc 22.x LTS, npm 10.x.
- **Cơ sở dữ liệu:** PostgreSQL 16 trở lên (chạy qua Docker Container hoặc Native Service).
- **Công cụ dòng lệnh:** Docker & Docker Compose, Git, cURL.

---

## 2. QUY TRÌNH KHỞI CHẠY HỆ THỐNG

### Bước 1: Khởi động Cơ sở dữ liệu PostgreSQL
```bash
# Khởi động container Postgres từ docker-compose.yml
docker compose up -d postgres

# Kiểm tra trạng thái hoạt động của Postgres
docker compose ps
```

### Bước 2: Build và Khởi động Backend Spring Boot
```bash
# Biên dịch và chạy Flyway migrations tự động
./mvnw clean compile -pl backend

# Chạy ứng dụng backend (Port 8088)
./mvnw spring-boot:run -pl backend
```
*Lưu ý:* Khi khởi động lần đầu, Flyway sẽ tự động chạy toàn bộ migration từ `V1` đến `V25` để đồng bộ bảng và dữ liệu mẫu chuẩn.

### Bước 3: Build và Khởi động Frontend React Vite
```bash
# Cài đặt thư viện dependencies
npm --prefix frontend install

# Kiểm thử tự động
npm --prefix frontend test -- --run

# Biên dịch sản phẩm production
npm --prefix frontend run build

# Chạy dev server phục vụ phát triển
npm --prefix frontend run dev
```

---

## 3. THÔNG TIN TRUY CẬP VÀ TÀI KHOẢN MẪU

| Phân hệ | Đường dẫn truy cập | Tài khoản đăng nhập | Mật khẩu mặc định | Vai trò hệ thống |
|---|---|---|---|---|
| **Cổng Quản trị** | `http://localhost:5173/admin` | `admin` | `Admin@123456` | Quản trị viên tối cao (SUPER_ADMIN) |
| **Cổng Giảng viên** | `http://localhost:5173/teacher` | `nam.le` | `Teacher@123456` | Giảng viên chính (TEACHER) |
| **Cổng Học viên** | `http://localhost:5173/student` | `thuylinh.nguyen@gmail.com` | `Student@123456` | Học viên (STUDENT - HV20240002) |
| **Website Công khai** | `http://localhost:5173/` | Không cần đăng nhập | - | Khách vãng lai & Học viên tra cứu |

---

## 4. BẢO TRÌ & GIÁM SÁT HỆ THỐNG

- **Kiểm tra trạng thái sức khỏe:** `GET http://localhost:8088/api/v1/health`
- **Kiểm tra Actuator:** `GET http://localhost:8088/api/v1/actuator`
- **Sao lưu cơ sở dữ liệu:**
  ```bash
  docker exec ch_academy_postgres pg_dump -U ch_academy_user -d ch_academy > backup_$(date +%Y%m%d).sql
  ```
- **Lưu ý bảo toàn dữ liệu:** Tuyệt đối không sử dụng lệnh `docker compose down -v` vì sẽ xóa volume lưu trữ dữ liệu PostgreSQL.
