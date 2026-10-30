# HƯỚNG DẪN CẤU HÌNH & TRIỂN KHAI HỆ THỐNG (DEPLOYMENT CONFIGURATION)
**Dự án:** Nền tảng Quản trị & Đào tạo Trực tuyến CH Academy  
**Phiên bản:** v2.4 Enterprise Production Ready  
**Ngày phát hành:** 2026-10-29  

---

## 1. KIẾN TRÚC HẠ TẦNG VÀ CÔNG NGHỆ (INFRASTRUCTURE STACK)

| Thành phần | Công nghệ / Phiên bản | Cổng (Port) mặc định | Vai trò trong hệ thống |
| :--- | :--- | :--- | :--- |
| **Cơ sở dữ liệu** | PostgreSQL 16 Alpine | `5432` | Lưu trữ dữ liệu quan hệ, Flyway schema migration |
| **Backend Core API** | Java 21 LTS / Spring Boot 3.5 | `8088` | RESTful API, Stateless JWT, Spring Security 6.x |
| **Frontend Web App** | React 19 + TypeScript + Vite | `5173` (Dev) / `80, 443` (Prod) | SPA phục vụ Quản trị viên, Giảng viên và Học viên |
| **Reverse Proxy & SSL** | Nginx Alpine / Caddy | `80`, `443` | Định tuyến ngược, cân bằng tải, chấm dứt SSL/TLS |
| **Container Engine** | Docker & Docker Compose v2 | N/A | Đóng gói môi trường đồng nhất và cô lập dịch vụ |

---

## 2. DANH MỤC BIẾN MÔI TRƯỜNG (ENVIRONMENT CONFIGURATION)

### 2.1. Tệp cấu hình Backend (`backend/.env` hoặc biến môi trường hệ thống)

```ini
# ==========================================
# CH ACADEMY BACKEND ENVIRONMENT VARIABLES
# ==========================================

# Cấu hình Cổng máy chủ
SERVER_PORT=8088
SPRING_PROFILES_ACTIVE=prod

# Kết nối Cơ sở dữ liệu PostgreSQL
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/ch_academy?useUnicode=true&characterEncoding=UTF-8
SPRING_DATASOURCE_USERNAME=ch_academy_user
SPRING_DATASOURCE_PASSWORD=ch_academy_secure_password
SPRING_JPA_HIBERNATE_DDL_AUTO=validate
SPRING_FLYWAY_ENABLED=true
SPRING_FLYWAY_LOCATIONS=classpath:db/migration

# Khóa bí mật JWT (Yêu cầu độ dài tối thiểu 256-bit Hex/Base64)
JWT_SECRET=4c87b92f0e63459c87d4a23e59b20d3a7718e24fa8b301cd45ef76123490abcd
JWT_EXPIRATION_HOURS=24

# Cấu hình Google Cloud OAuth SSO (Dành cho Cổng Học viên)
# Đăng ký tại: https://console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Cấu hình Meta Facebook OAuth SSO
# Đăng ký tại: https://developers.facebook.com/apps
FACEBOOK_CLIENT_ID=your-facebook-app-id
FACEBOOK_CLIENT_SECRET=your-facebook-app-secret

# Cấu hình Thư mục lưu trữ tệp tin tải lên (Slide, PDF, Giáo trình)
CH_ACADEMY_STORAGE_PATH=./uploads
CH_ACADEMY_MAX_FILE_SIZE_MB=50
```

### 2.2. Tệp cấu hình Frontend (`frontend/.env.production`)

```ini
# ==========================================
# CH ACADEMY FRONTEND PRODUCTION CONFIG
# ==========================================

# Đường dẫn API Backend
VITE_API_BASE_URL=https://api.chacademy.edu.vn/api/v1

# Tên thương hiệu hiển thị
VITE_APP_TITLE="CH Academy — Hệ thống Quản trị & Đào tạo Trực tuyến"

# Client ID cho nút Đăng nhập bằng Google trên giao diện
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# App ID cho nút Đăng nhập bằng Facebook trên giao diện
VITE_FACEBOOK_APP_ID=your-facebook-app-id
```

---

## 3. CÁC BƯỚC TRIỂN KHAI PRODUCTION (DEPLOYMENT STEPS)

### Bước 1: Khởi động Cơ sở dữ liệu PostgreSQL
Sử dụng tệp `docker-compose.yml` có sẵn tại thư mục gốc:

```bash
docker compose up -d postgres
```

Kiểm tra trạng thái container và tính sẵn sàng:
```bash
docker ps --filter "name=ch_academy_postgres"
docker exec -it ch_academy_postgres pg_isready -U ch_academy_user -d ch_academy
```

### Bước 2: Build và Khởi chạy Backend Spring Boot
Kiểm thử và đóng gói file thực thi `.jar`:

```bash
cd backend
./mvnw clean package -DskipTests=false
java -jar target/ch-academy-backend-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod
```

Hệ thống Flyway sẽ tự động kiểm tra và chạy tuần tự từ `V1` đến `V19__Add_Password_Control_And_Security_Fields.sql`, bảo đảm cấu trúc bảng an ninh được cập nhật toàn vẹn mà không gây gián đoạn dữ liệu.

### Bước 3: Build và Triển khai Frontend với Nginx
Biên dịch mã nguồn React/TypeScript thành bộ tệp tĩnh tối ưu:

```bash
cd frontend
npm ci
npm run build
```

Cấu hình máy chủ Web Nginx (`/etc/nginx/conf.d/ch_academy.conf`):

```nginx
server {
    listen 80;
    server_name portal.chacademy.edu.vn;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name portal.chacademy.edu.vn;

    ssl_certificate /etc/letsencrypt/live/portal.chacademy.edu.vn/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/portal.chacademy.edu.vn/privkey.pem;

    root /var/www/ch_academy/frontend/dist;
    index index.html;

    # Gzip Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;

    # Single Page Application (SPA) Routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Reverse Proxy cho API Backend
    location /api/v1/ {
        proxy_pass http://127.0.0.1:8088/api/v1/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Cache static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## 4. GIÁM SÁT HỆ THỐNG VÀ HEALTH CHECKS

Backend cung cấp các điểm giám sát tự động phục vụ Kubernetes, Docker Compose health check hoặc Uptime Kuma:

1. **Liveness Health Endpoint:**
   - URL: `GET http://localhost:8088/api/v1/health`
   - Phản hồi:
     ```json
     {
       "status": "UP",
       "service": "CH Academy Backend",
       "version": "0.0.1-SNAPSHOT",
       "timestamp": "2026-10-29T16:08:29.792",
       "message": "Hệ thống đang hoạt động bình thường"
     }
     ```
2. **Spring Boot Actuator:**
   - URL: `GET http://localhost:8088/api/v1/actuator/health`
   - Kiểm tra kết nối Database connection pool (HikariCP) và bộ nhớ JVM.

---

## 5. QUY TRÌNH SAO LƯU & PHỤC HỒI DỮ LIỆU (BACKUP & DISASTER RECOVERY)

### 5.1. Sao lưu tự động định kỳ (Daily Automated Backup)
Tạo script sao lưu hàng ngày lúc 02:00 sáng lưu vào thư mục an toàn hoặc lưu trữ đám mây:

```bash
#!/bin/bash
BACKUP_DIR="/data/backups/postgresql"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="$BACKUP_DIR/ch_academy_db_$TIMESTAMP.sql.gz"

mkdir -p $BACKUP_DIR
docker exec -t ch_academy_postgres pg_dump -U ch_academy_user -d ch_academy | gzip > $FILENAME

# Giữ lại các bản sao lưu trong vòng 30 ngày gần nhất
find $BACKUP_DIR -type f -name "*.sql.gz" -mtime +30 -delete
echo "Sao lưu thành công: $FILENAME"
```

### 5.2. Phục hồi dữ liệu khi có sự cố (Restoration Procedure)
Khi cần khôi phục lại dữ liệu từ một bản sao lưu cụ thể:

```bash
gunzip -c /data/backups/postgresql/ch_academy_db_20261029_020000.sql.gz | docker exec -i ch_academy_postgres psql -U ch_academy_user -d ch_academy
```

---

## 6. KẾT LUẬN

Tài liệu cấu hình này chuẩn hóa toàn bộ các thông số kỹ thuật cần thiết để triển khai CH Academy trên mọi môi trường máy chủ (Bare-metal Linux, AWS EC2, Google Cloud Compute Engine hoặc Docker Swarm/Kubernetes). Hệ thống được đóng gói hoàn chỉnh, bảo đảm an toàn dữ liệu, tính sẵn sàng cao và khả năng bảo trì lâu dài.

