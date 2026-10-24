# CH Academy - Hệ thống Quản lý Trung tâm Giáo dục

Hệ thống quản lý toàn diện cho trung tâm giáo dục CH Academy, hỗ trợ quản lý học viên, lớp học, giáo viên và học phí.

## Công nghệ sử dụng

| Thành phần    | Công nghệ                              | Phiên bản   |
|---------------|----------------------------------------|-------------|
| Frontend      | React + TypeScript + Vite              | React 19, Vite 8 |
| Backend       | Java Spring Boot + Maven               | Spring Boot 3.5.0, Java 21 |
| Database      | PostgreSQL                             | 16-alpine   |
| ORM           | Spring Data JPA + Hibernate            | 6.x         |
| Migration DB  | Flyway                                 | 10.x        |
| Container     | Docker + Docker Compose                | 29.x        |
| Test Backend  | JUnit 5 + Spring Boot Test             | -           |
| Test Frontend | Vitest + React Testing Library         | -           |

## Cấu trúc dự án

```
CH-Academy/
├── frontend/              # Ứng dụng React + TypeScript
│   ├── src/
│   │   ├── api/           # API client tập trung
│   │   ├── test/          # Kiểm thử
│   │   ├── App.tsx        # Component gốc
│   │   ├── App.css        # Styles
│   │   └── index.css      # Design system tokens
│   ├── .env               # Biến môi trường (không commit)
│   ├── .env.example       # Mẫu biến môi trường
│   └── vite.config.ts     # Cấu hình Vite + Vitest
│
├── backend/               # Spring Boot Java API
│   ├── src/main/java/vn/chacademy/
│   │   ├── ChAcademyApplication.java   # Main class
│   │   └── common/
│   │       ├── config/CorsConfig.java  # CORS configuration
│   │       └── controller/HealthController.java
│   ├── src/main/resources/
│   │   ├── application.properties      # Cấu hình Spring Boot
│   │   └── db/migration/              # Flyway migrations
│   │       └── V1__Initial_Schema.sql
│   ├── src/test/                       # Tests
│   └── pom.xml                        # Maven dependencies
│
├── database/
│   └── init/                          # SQL scripts khởi tạo DB
│
├── docs/                              # Tài liệu kiến trúc
├── docker-compose.yml                 # PostgreSQL local
├── .env                               # Cấu hình môi trường (không commit)
├── .env.example                       # Mẫu cấu hình
└── README.md
```

## Yêu cầu hệ thống

- **Java JDK 21+** (đã cài: JDK 25)
- **Node.js 18+** (đã cài: v24.21.0)
- **Docker Desktop** (đã cài: v29.x)
- **Docker Compose** (đã cài: v2.40.x)

> ⚠️ Maven chưa được cài toàn cục. Dùng `mvnw.cmd` (Maven Wrapper) trong thư mục `backend/`.

---

## Hướng dẫn chạy trên Windows 11

### Bước 1: Clone hoặc mở dự án

```powershell
cd E:\CA_NHAN\CH-Academy
```

### Bước 2: Sao chép file cấu hình môi trường

```powershell
# Tại thư mục gốc
copy .env.example .env

# Tại thư mục frontend
copy frontend\.env.example frontend\.env
```

Chỉnh sửa file `.env` với mật khẩu database bạn muốn dùng.

### Bước 3: Khởi động PostgreSQL (Docker)

```powershell
# Khởi động PostgreSQL trong background
docker compose up -d

# Kiểm tra PostgreSQL đã sẵn sàng
docker compose ps
docker compose logs postgres
```

PostgreSQL chạy tại: `localhost:5432`  
Database: `ch_academy`

### Bước 4: Chạy Backend Spring Boot

```powershell
cd backend

# Lần đầu: Maven Wrapper sẽ tự tải Maven 3.9.9 (~10-20 giây)
.\mvnw.cmd spring-boot:run
```

> **Lần đầu chạy:** Maven Wrapper tự tải Maven (~8MB) và các dependencies (~50MB). Cần kết nối Internet.

Backend sẵn sàng tại: `http://localhost:8088`  
Health endpoint: `http://localhost:8088/api/v1/health`

### Bước 5: Chạy Frontend React

Mở terminal mới:

```powershell
cd frontend
npm install          # Lần đầu cài dependencies
npm run dev
```

Frontend sẵn sàng tại: `http://localhost:5173`

---

## Chạy kiểm thử

### Backend Tests

```powershell
cd backend
.\mvnw.cmd test
```

Các test sử dụng H2 in-memory database, **không cần PostgreSQL đang chạy**.

### Frontend Tests

```powershell
cd frontend
npm run test         # Chạy một lần
npm run test:watch   # Chạy ở chế độ watch (auto-rerun)
```

---

## URL và Endpoints

| URL | Mô tả |
|-----|-------|
| `http://localhost:5173` | Frontend React |
| `http://localhost:8088/api/v1/health` | Backend Health Check |
| `http://localhost:8088/api/v1/actuator/health` | Spring Actuator Health |
| `localhost:5432` | PostgreSQL Database |

---

## Dừng các dịch vụ

```powershell
# Dừng Docker containers
docker compose down

# Dừng và xóa data (cẩn thận!)
docker compose down -v
```

---

## Kiến trúc hệ thống

```
Browser (port 5173)
    │
    ▼
Frontend React + Vite
    │ API calls (VITE_API_BASE_URL)
    ▼
Backend Spring Boot (port 8088)
    │ JPA/Hibernate
    ▼
PostgreSQL (port 5432)  ←── Docker Container
    │
    ▼ (Flyway runs on startup)
Migrations V1, V2, ...
```

---

## Biến môi trường

### Root `.env`

| Biến | Mô tả | Mặc định |
|------|-------|---------|
| `POSTGRES_DB` | Tên database | `ch_academy` |
| `POSTGRES_USER` | Username DB | `ch_academy_user` |
| `POSTGRES_PASSWORD` | Mật khẩu DB | *(cần đặt)* |
| `POSTGRES_PORT` | Cổng PostgreSQL | `5432` |
| `BACKEND_PORT` | Cổng backend | `8088` |

### `frontend/.env`

| Biến | Mô tả | Mặc định |
|------|-------|---------|
| `VITE_API_BASE_URL` | URL gốc API backend | `http://localhost:8088/api/v1` |

---

## Bước tiếp theo

- [ ] Thiết kế ERD và tạo migration cho các entity chính (Student, Teacher, Class, Course)
- [ ] Xây dựng CRUD API cho Student và Course
- [ ] Triển khai Spring Security + JWT authentication
- [ ] Xây dựng giao diện quản lý học viên
- [ ] Thêm unit tests cho Service layer
- [ ] Cấu hình CI/CD pipeline

---

## Ghi chú phát triển

- **Flyway Migration:** Tên file phải theo đúng quy tắc `V{version}__{Mô_tả}.sql`
- **CORS:** Thêm URL mới vào `app.cors.allowed-origins` trong `application.properties`
- **API Convention:** Tất cả endpoint đều có tiền tố `/api/v1/`
- **Secrets:** Không bao giờ commit file `.env` có mật khẩu thật
