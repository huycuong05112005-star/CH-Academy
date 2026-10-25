# CH Academy — Hệ thống Quản lý Trung tâm Giáo dục Toàn diện

> **Tên sản phẩm:** CH Academy  
> **Kiến trúc:** Modular Monolith (Spring Boot 3.5.0 + React 19 + PostgreSQL 16)  
> **Ngôn ngữ giao diện:** Tiếng Việt (Vietnamese)  
> **Múi giờ nghiệp vụ:** `Asia/Ho_Chi_Minh` (GMT+7)  
> **Định dạng tiền tệ:** Việt Nam Đồng (VND)  
> **Nhận diện thiết kế:** Chuyên nghiệp, hiện đại, tối giản, chủ đạo Xanh Navy (`#142B4A`) và Trắng (`#FFFFFF`)

---

## 1. Tổng Quan Hệ Thống

**CH Academy** là giải pháp phần mềm quản trị hoạt động đào tạo kết hợp website giới thiệu và tuyển sinh trực tuyến chuẩn hóa dành cho trung tâm giáo dục đa đối tượng (cả trẻ em và người lớn).

Hệ thống bao gồm hai phân hệ chính:
1. **Website Công khai (Public Portal):**
   - Giới thiệu trung tâm, tầm nhìn, sứ mệnh, cam kết chất lượng đào tạo (`/`, `/about`).
   - Danh mục khóa học động từ database, bộ lọc tìm kiếm theo danh mục và đối tượng (`/courses`).
   - Mẫu đăng ký nhận tư vấn trực tuyến tích hợp cơ chế chống bot/spam Honeypot (`/contact`, form trang chủ).
   - Quy định điều khoản dịch vụ (`/terms`) và chính sách bảo vệ quyền riêng tư học viên & trẻ em (`/privacy`).
2. **Cổng Quản trị Vận hành (Admin Portal - `/admin`):**
   - **Xác thực & Phân quyền (RBAC):** Đăng nhập JWT, bảo vệ endpoint theo vai trò (`SUPER_ADMIN`, `CENTER_ADMIN`, `ACADEMIC_STAFF`, `ADMISSIONS_STAFF`, `ACCOUNTANT`, `TEACHER`, `STUDENT`, `PARENT`).
   - **Bảng điều khiển (Dashboard):** Tổng hợp số liệu thực tế về học viên, lớp học, tỷ lệ chuyển đổi tuyển sinh, tài chính doanh thu/công nợ và danh sách các buổi học 7 ngày tới.
   - **Quản lý Khóa học:** Danh mục, học phí niêm yết, thời lượng, mục tiêu đầu ra.
   - **Quản lý Học viên & Người giám hộ:** Hồ sơ học sinh, liên kết quan hệ phụ huynh–học sinh đa chiều.
   - **Tuyển sinh (CRM/Leads):** Tiếp nhận khách hàng tiềm năng, lịch sử chăm sóc và chuyển đổi nguyên tử sang học viên.
   - **Lớp học & Lịch học:** Xếp lịch học định kỳ trong tuần, tự động sinh các buổi học, thuật toán phát hiện xung đột lịch dạy của giáo viên và phòng học.
   - **Điểm danh & Chuyên cần:** Bảng điểm danh buổi học, ghi nhận trạng thái (`Có mặt`, `Vắng mặt`, `Đi muộn`, `Có phép`), tính tỷ lệ chuyên cần.
   - **Học phí & Tài chính:** Lập khoản phải thu, ghi nhận thu học phí, tự động phân bổ giảm trừ nợ theo FIFO, xử lý hoàn phí có kiểm soát.

---

## 2. Công Nghệ & Khung Phát Triển

| Thành phần | Công nghệ chính | Phiên bản |
|---|---|---|
| **Frontend** | React, TypeScript, Vite, React Router, Lucide Icons | React 19, Vite 8 |
| **Styling** | Vanilla CSS Design Tokens, Navy `#142B4A` + White theme | Chuẩn hóa |
| **Backend** | Java 21, Spring Boot, Spring Security 6, Spring Data JPA | 3.5.0 |
| **Bảo mật** | JJWT (JSON Web Token), BCrypt Password Hashing, CORS | JJWT 0.12.6 |
| **Cơ sở dữ liệu** | PostgreSQL chạy trong Docker container `ch_academy_postgres` | 16-alpine |
| **Migration DB** | Flyway Migrations V1 đến V8 | 10.x |
| **Kiểm thử Backend** | JUnit 5, Spring Boot Test, MockMvc, H2 Test Profile | **33 / 33 PASS** |
| **Kiểm thử Frontend** | Vitest, React Testing Library, jsdom | **32 / 32 PASS** |

---

## 3. Cấu Trúc Thư Mục Dự Án

```
CH-Academy/
├── frontend/                     # Phân hệ Giao diện React 19 + TypeScript
│   ├── src/
│   │   ├── api/                  # API client (client.ts, auth.ts, courses.ts, public.ts, ...)
│   │   ├── components/           # Components dùng chung (Navbar, Footer, ProtectedRoute, ...)
│   │   ├── context/              # AuthContext (quản lý trạng thái đăng nhập, user, token)
│   │   ├── layouts/              # Layout Admin (Sidebar, Header, Breadcrumbs)
│   │   ├── pages/
│   │   │   ├── admin/            # Dashboard, Courses, Students, Leads, Classes, Attendance, Finance
│   │   │   ├── auth/             # LoginPage
│   │   │   └── public/           # LandingPage, CoursesPublicPage, AboutPage, ContactPage, ...
│   │   ├── test/                 # 10 test suites Vitest tự động
│   │   ├── types/                # Định nghĩa TypeScript đồng bộ với Backend DTOs
│   │   ├── App.tsx               # Cấu hình định tuyến (React Router)
│   │   └── main.tsx
│   └── package.json
│
├── backend/                      # Phân hệ API Spring Boot 3.5.0
│   ├── src/main/java/vn/chacademy/
│   │   ├── academic/             # Module Lớp học, Lịch học, Giáo viên, Ghi danh
│   │   ├── attendance/           # Module Điểm danh và Chuyên cần
│   │   ├── common/               # ApiResponse, Exception Handler, CORS config
│   │   ├── course/               # Module Khóa học và Danh mục
│   │   ├── dashboard/            # Module Dashboard thống kê số liệu thực tế
│   │   ├── finance/              # Module Học phí, Khoản phải thu, Thanh toán, Hoàn tiền
│   │   ├── identity/             # Module Người dùng và Tài khoản
│   │   ├── lead/                 # Module Tuyển sinh và Khách hàng tiềm năng
│   │   ├── security/             # Spring Security filter chain, JWT provider, UserDetails
│   │   └── student/              # Module Học viên và Người giám hộ
│   ├── src/main/resources/
│   │   ├── application.properties# Cấu hình cổng 8088, DB, JWT secret, múi giờ
│   │   └── db/migration/         # Flyway Migrations tuần tự từ V1 đến V8
│   ├── src/test/                 # 33 bài test tự động JUnit 5
│   └── pom.xml
│
├── database/                     # Docker scripts và backup SQL
├── docs/                         # Tài liệu kỹ thuật hoàn chỉnh
│   ├── api.md                    # Đặc tả toàn bộ REST API
│   ├── architecture.md           # Kiến trúc Modular Monolith
│   ├── database-design.md        # Thiết kế ERD 25 bảng và Schema
│   ├── decisions.md              # Các quyết định kiến trúc (ADR)
│   ├── implementation-status.md  # Trạng thái triển khai 12 giai đoạn
│   ├── security.md               # Mô hình bảo mật và quyền riêng tư
│   └── testing.md                # Hướng dẫn kiểm thử Backend & Frontend
├── docker-compose.yml            # Khởi tạo container PostgreSQL 16
├── .env.example                  # Mẫu cấu hình biến môi trường
└── README.md                     # Tài liệu hướng dẫn sử dụng và vận hành
```

---

## 4. Hướng Dẫn Cài Đặt và Khởi Chạy trên Windows 11

### Bước 1: Yêu cầu môi trường
- Hệ điều hành: **Windows 11**
- **Docker Desktop** (đã khởi động và đang chạy)
- **Node.js 18+** (khuyên dùng Node 20 hoặc 24)
- **Java JDK 21+** (khuyên dùng OpenJDK 21 hoặc 25)

### Bước 2: Khởi động Cơ sở dữ liệu PostgreSQL
Tại thư mục gốc dự án:
```powershell
# Khởi động container PostgreSQL trong chế độ nền
docker compose up -d

# Kiểm tra container đang hoạt động (Trạng thái Up, cổng 5432)
docker compose ps
```
> **Lưu ý an toàn:** Tuyệt đối không chạy `docker compose down -v` để tránh làm mất dữ liệu học viên và các migration đã áp dụng trong volume `postgres_data`.

### Bước 3: Khởi động Backend Spring Boot
Mở một cửa sổ PowerShell mới:
```powershell
cd E:\CA_NHAN\CH-Academy\backend

# Chạy backend qua Maven Wrapper
.\mvnw.cmd spring-boot:run
```
- Backend khởi động thành công trên cổng: **`http://localhost:8088`** *(được định cấu hình tại cổng 8088 để tránh xung đột với Apache/XAMPP cổng 8080)*.
- Kiểm tra trạng thái hoạt động: `http://localhost:8088/api/v1/health`

### Bước 4: Khởi động Frontend React
Mở một cửa sổ PowerShell mới:
```powershell
cd E:\CA_NHAN\CH-Academy\frontend

# Cài đặt dependencies (nếu chạy lần đầu)
npm install

# Khởi chạy máy chủ phát triển
npm run dev
```
- Frontend sẵn sàng tại: **`http://localhost:5173`**

---

## 5. Tài Khoản Đăng Nhập Mặc Định (Môi trường Phát triển)

Hệ thống đã nạp sẵn tài khoản quản trị viên phát triển qua migration Flyway:

| Tên đăng nhập (Email) | Mật khẩu mặc định | Vai trò (Role) | Quyền hạn |
|---|---|---|---|
| `admin@chacademy.edu.vn` (hoặc `admin`) | `Admin@123456` | `ROLE_SUPER_ADMIN` | Quản trị toàn quyền toàn bộ hệ thống |

> **Khuyến cáo bảo mật:** Khi triển khai lên môi trường thử nghiệm thực tế hoặc sản xuất, quản trị viên cần đăng nhập và thực hiện đổi mật khẩu ngay tại góc tài khoản hoặc qua API `/api/v1/auth/change-password`.

---

## 6. Hướng Dẫn Thực Thi Kiểm Thử Tự Động

### 6.1 Kiểm thử Backend (JUnit 5 + Spring Boot Test)
```powershell
cd E:\CA_NHAN\CH-Academy\backend
.\mvnw.cmd test
```
- **Kết quả xác minh:** `Tests run: 33, Failures: 0, Errors: 0, Skipped: 0` (100% PASS).
- Sử dụng profile `test` với cơ sở dữ liệu in-memory H2, hoàn toàn cách ly và an toàn với dữ liệu thực tế.

### 6.2 Kiểm thử Frontend (Vitest + React Testing Library)
```powershell
cd E:\CA_NHAN\CH-Academy\frontend

# Chạy một lượt toàn bộ test suites
npm run test -- --run

# Chạy ở chế độ theo dõi thay đổi (Watch mode)
npm run test
```
- **Kết quả xác minh:** `Test Files: 10 passed (10)`, `Tests: 32 passed (32)` (100% PASS).

### 6.3 Biên dịch Sản xuất (Production Build)
```powershell
cd E:\CA_NHAN\CH-Academy\frontend
npm run build
```
- Kiểm tra kiểu dữ liệu TypeScript (`tsc -b`) và đóng gói tài nguyên tĩnh qua Vite vào thư mục `dist/` (0 lỗi).

---

## 7. Sao Lưu và Phục Hồi Dữ Liệu (Backup & Restore)

### Sao lưu Cơ sở dữ liệu (Backup)
```powershell
# Xuất dữ liệu ra file SQL sao lưu
docker exec -t ch_academy_postgres pg_dump -U ch_academy_user -d ch_academy > backup_ch_academy.sql
```

### Phục hồi Cơ sở dữ liệu (Restore)
```powershell
# Nạp lại dữ liệu từ file sao lưu
Get-Content backup_ch_academy.sql | docker exec -i ch_academy_postgres psql -U ch_academy_user -d ch_academy
```

---

## 8. Danh Sách Tài Liệu Dự Án trong Thư Mục `docs/`

- **[docs/implementation-status.md](docs/implementation-status.md):** Báo cáo chi tiết trạng thái 100% hoàn thành các giai đoạn từ 0 đến 12.
- **[docs/architecture.md](docs/architecture.md):** Sơ đồ kiến trúc Modular Monolith và ranh giới trách nhiệm từng module.
- **[docs/database-design.md](docs/database-design.md):** Sơ đồ quan hệ thực thể ERD (Mermaid) 25 bảng và thiết kế chỉ mục, ràng buộc CHECK.
- **[docs/api.md](docs/api.md):** Danh mục chi tiết toàn bộ các RESTful API endpoints, request/response models.
- **[docs/security.md](docs/security.md):** Mô hình bảo mật, cơ chế RBAC, bảo vệ dữ liệu trẻ em và chống spam Honeypot.
- **[docs/testing.md](docs/testing.md):** Hướng dẫn chi tiết kiểm thử Backend, Frontend và kịch bản End-to-End.
- **[docs/decisions.md](docs/decisions.md):** Các bản ghi quyết định kiến trúc cốt lõi (ADR 01 đến ADR 06).
