# CH Academy — Nền Tảng Quản Lý Giáo Dục Đa Phân Hệ (Multi-Portal Education Platform)

> **Tên sản phẩm:** CH Academy  
> **Kiến trúc:** Modular Monolith (Spring Boot 3.5.0 + React 19 + PostgreSQL 16)  
> **Hệ thống phân hệ:** 4 Phân hệ thống nhất (Public, Admin, Teacher, Student)  
> **Ngôn ngữ giao diện:** Tiếng Việt (Vietnamese)  
> **Múi giờ nghiệp vụ:** `Asia/Ho_Chi_Minh` (GMT+7)  
> **Định dạng tiền tệ:** Việt Nam Đồng (VND)  
> **Nhận diện thiết kế:** Chuyên nghiệp, hiện đại, tối giản, chủ đạo Deep Navy (`#0E1B2E` / `#142B4A`) và Trắng/Nền tối, hỗ trợ đầy đủ Dark/Light Mode.

---

## 1. TỔNG QUAN HỆ THỐNG VÀ 4 PHÂN HỆ THỐNG NHẤT

**CH Academy** là nền tảng quản trị hoạt động đào tạo toàn diện, tích hợp đầy đủ các cổng làm việc theo vai trò:

1. **Website Tuyển sinh Công khai (Public Portal - `/`):**
   - Giới thiệu trung tâm, tầm nhìn, sứ mệnh, cam kết chất lượng (`/`, `/about`).
   - Danh mục khóa học động từ database, bộ lọc tìm kiếm theo danh mục và đối tượng (`/courses`).
   - Biểu mẫu đăng ký nhận tư vấn trực tuyến tích hợp cơ chế chống bot Honeypot (`/contact`, form trang chủ).
   - Quy định điều khoản dịch vụ (`/terms`) và chính sách bảo vệ quyền riêng tư học viên & trẻ em (`/privacy`).

2. **Cổng Quản trị Trung tâm (Admin Portal - `/admin/*`):**
   - **Bảng điều khiển (Dashboard):** Tổng hợp số liệu thực tế về học viên, lớp học, tỷ lệ chuyển đổi tuyển sinh, tài chính doanh thu/công nợ và danh sách các buổi học 7 ngày tới.
   - **Quản lý Khóa học & Lớp học:** Quản lý khóa học, mở lớp, cấu hình lịch học trong tuần và tự động sinh các buổi học.
   - **Phân công Giáo viên (Teacher Assignments):** Quản lý phân bổ giáo viên chính và trợ giảng cho từng lớp học.
   - **Quản lý Học viên & Người giám hộ:** Hồ sơ học sinh, quan hệ đa chiều với phụ huynh, hiển thị tài khoản cấp mới cho học viên.
   - **Tuyển sinh & Leads CRM:** Tiếp nhận khách hàng tiềm năng, lịch sử chăm sóc và chuyển đổi nguyên tử sang học viên chính thức.
   - **Giám sát Chuyên cần (Attendance Monitoring):** Theo dõi các buổi học chưa điểm danh và tỷ lệ chuyên cần trung bình từng lớp.
   - **Học phí & Tài chính:** Lập khoản phải thu, ghi nhận thu học phí, tự động phân bổ giảm trừ nợ theo nguyên tắc **FIFO**, xử lý hoàn phí có kiểm soát.
   - **Trung tâm Thông báo:** Phát hành thông báo theo phạm vi (`ALL`, `CLASS`, `TEACHERS`, `STUDENTS`).
   - **Nhật ký Kiểm toán (Audit Logs):** Truy vết toàn bộ các hành động thay đổi nhạy cảm trong hệ thống dành riêng cho `SUPER_ADMIN`.

3. **Cổng Giảng dạy Giáo viên (Teacher Portal - `/teacher/*`):**
   - **Dashboard Giáo viên:** Danh sách các lớp được phân công, lịch dạy theo ngày và 7 ngày tới, tài liệu vừa đăng.
   - **Chi tiết Lớp học:** Danh sách học viên trong lớp, thông tin liên hệ cần thiết cho giảng dạy.
   - **Điểm danh Buổi học:** Ghi nhận chuyên cần từng buổi học (`PRESENT`, `ABSENT`, `LATE`, `EXCUSED`) kèm ghi chú.
   - **Quản lý Tài liệu Học tập:** Tải lên bài giảng slide, file bài tập, tài liệu PDF gắn trực tiếp vào từng buổi học cụ thể.
   - **Thông báo Lớp học:** Đăng thông báo gửi riêng cho học sinh trong lớp mình phụ trách.
   - **Bảo mật Tài chính:** Giáo viên bị ẩn hoàn toàn mọi thông tin về học phí và số tiền đóng của học viên.

4. **Cổng Học tập Học viên (Student Portal - `/student/*`):**
   - **Dashboard Học viên:** Khóa học đang theo học, buổi học kế tiếp, thông báo mới nhất từ trung tâm và giáo viên.
   - **Lộ trình Khóa học:** Danh sách các buổi học, bài giảng và tài liệu học tập tải về theo từng buổi.
   - **Lịch sử Chuyên cần:** Tra cứu kết quả điểm danh của bản thân qua từng buổi học.
   - **Học phí & Công nợ:** Xem số tiền phải đóng theo khóa học, lịch sử các đợt đã đóng và số tiền còn thiếu minh bạch.
   - **Bảo vệ Quyền riêng tư (Anti-IDOR):** Chỉ truy cập được các lớp học viên đã đăng ký hợp lệ.

---

## 2. HỆ THỐNG TÀI LIỆU KỸ THUẬT CHUYÊN SÂU (MASTER DOCUMENTATION)

Để đảm bảo tài liệu được tinh gọn, rõ ràng và dễ tra cứu, toàn bộ tài liệu kỹ thuật của dự án đã được chuẩn hóa thành 4 tài liệu chủ đạo:

1. 🎙️ [DOCS_VOICE_AI_MASTER.md](file:///e:/CA_NHAN/CH_Academy/DOCS_VOICE_AI_MASTER.md): Toàn bộ kiến trúc Real-time Voice AI, nhận diện STT tiếng Việt, phát TTS phân đoạn câu, bộ đệm an toàn dual fallback và tối ưu độ trễ đàm thoại 2 chiều.
2. 🤖 [DOCS_AI_PLATFORM_MASTER.md](file:///e:/CA_NHAN/CH_Academy/DOCS_AI_PLATFORM_MASTER.md): Trung tâm AI Studio, quản lý Agent, Kho tri thức (KB) vs Tài liệu Chunking, Inspector Modal, tích hợp Zalo OA Webhook HMAC-SHA256 và Lead Capture.
3. 💬 [DOCS_CLASS_CHAT_MASTER.md](file:///e:/CA_NHAN/CH_Academy/DOCS_CLASS_CHAT_MASTER.md): Kiến trúc Chat nhóm lớp học, cơ chế phân quyền tham gia theo Enrollment, bộ chuyển lớp (Class Switcher) và đồng bộ tự động theo khóa học.
4. 🛡️ [DOCS_SYSTEM_AUDIT_MASTER.md](file:///e:/CA_NHAN/CH_Academy/DOCS_SYSTEM_AUDIT_MASTER.md): Kiểm toán bảo mật hệ thống, RBAC 8 vai trò, hệ thống quản trị năm học động (Flyway V28), chống xung đột session đa tab và ma trận kiểm thử E2E.

---

## 3. CÔNG NGHỆ VÀ KHUNG PHÁT TRIỂN

| Thành phần | Công nghệ chính | Phiên bản |
|---|---|---|
| **Frontend** | React, TypeScript, Vite, React Router, Lucide Icons | React 19, Vite 8 |
| **Styling** | Vanilla CSS Design Tokens, Deep Navy Theme, Dark/Light Mode đồng bộ | Chuẩn hóa |
| **Backend** | Java 21 LTS, Spring Boot, Spring Security 6, Spring Data JPA | 3.5.0 |
| **Bảo mật** | JJWT (JSON Web Token 0.12.6), BCrypt Password Hashing, Anti-IDOR | Chuẩn hóa |
| **Cơ sở dữ liệu** | PostgreSQL 16 trong Docker container `ch_academy_postgres` | 16-alpine |
| **Migration DB** | Flyway Migrations V1 đến V11 (Chuẩn hóa ký tự UTF-8) | 10.x |
| **Kiểm thử Backend** | JUnit 5, Spring Boot Test, MockMvc, H2 Test Profile | **34 / 34 PASSED** |
| **Kiểm thử Frontend** | Vitest, React Testing Library, jsdom | **32 / 32 PASSED** |
| **Production Build** | `tsc -b && vite build` | **0 errors, Exit 0** |

---

## 3. CẤU TRÚC THƯ MỤC DỰ ÁN

```
CH-Academy/
├── frontend/                     # Phân hệ Giao diện React 19 + TypeScript
│   ├── src/
│   │   ├── api/                  # API clients (auth, courses, teacher, students, attendance, ...)
│   │   ├── components/           # Components dùng chung (Navbar, Footer, ProtectedRoute, ...)
│   │   ├── context/              # AuthContext (quản lý phiên đăng nhập, user, token, dark mode)
│   │   ├── layouts/              # AdminLayout (Sidebar, Header, Breadcrumbs)
│   │   ├── pages/
│   │   │   ├── admin/            # Dashboard, Courses, Students, Leads, Classes, Attendance, Finance, ...
│   │   │   ├── teacher/          # TeacherDashboardPage, TeacherClassDetailPage, TeacherAttendancePage
│   │   │   ├── student/          # StudentPortalPage (Lớp học, tài liệu, điểm danh, học phí)
│   │   │   ├── auth/             # LoginPage
│   │   │   └── public/           # LandingPage, CoursesPublicPage, AboutPage, ContactPage, ...
│   │   ├── test/                 # 10 test suites Vitest tự động (32 bài test)
│   │   ├── types/                # Định nghĩa TypeScript đồng bộ với Backend DTOs
│   │   ├── App.tsx               # Cấu hình định tuyến 4 phân hệ (React Router)
│   │   ├── index.css             # Design Tokens & Surface Overrides Dark Mode
│   │   └── main.tsx
│   └── package.json
│
├── backend/                      # Phân hệ API Spring Boot 3.5.0
│   ├── src/main/java/vn/chacademy/
│   │   ├── academic/             # Module Lớp học, Lịch học, Giáo viên, Tài liệu, Phân công
│   │   ├── attendance/           # Module Điểm danh và Giám sát Chuyên cần
│   │   ├── common/               # ApiResponse, Exception Handler, Audit Log, EmailService
│   │   ├── course/               # Module Khóa học và Danh mục
│   │   ├── dashboard/            # Module Dashboard thống kê số liệu thực tế
│   │   ├── finance/              # Module Học phí, Khoản phải thu, Thanh toán, FIFO
│   │   ├── identity/             # Module Người dùng, Tài khoản và Xác thực
│   │   ├── lead/                 # Module Tuyển sinh và Khách hàng tiềm năng (CRM)
│   │   ├── notification/         # Module Thông cáo nội bộ theo phạm vi
│   │   ├── security/             # Spring Security filter chain, JWT provider, UserDetails
│   │   └── student/              # Module Học viên, Người giám hộ và Cổng học viên
│   ├── src/main/resources/
│   │   ├── application.properties# Cấu hình cổng 8088, DB UTF-8, JWT secret, múi giờ
│   │   └── db/migration/         # Flyway Migrations tuần tự từ V1 đến V11
│   ├── src/test/                 # 10 test classes tự động JUnit 5 (34 bài test)
│   └── pom.xml
│
├── database/                     # Docker scripts và backup SQL
├── docs/                         # Tài liệu kỹ thuật hoàn chỉnh
│   ├── TECHNICAL_AUDIT.md        # Báo cáo kiểm toán kỹ thuật toàn diện & khắc phục lỗi
│   ├── ARCHITECTURE.md           # Kiến trúc Modular Monolith & phân tầng bảo mật
│   ├── DATABASE.md               # Sơ đồ ERD 27 bảng và Flyway Migrations V1-V11
│   ├── API.md                    # Đặc tả toàn bộ RESTful API dưới /api/v1/*
│   ├── TEST_REPORT.md            # Báo cáo kết quả kiểm thử Backend (34) & Frontend (32)
│   └── IMPLEMENTATION_STATUS.md  # Trạng thái 100% hoàn thành các giai đoạn & luồng nghiệp vụ
├── docker-compose.yml            # Khởi tạo container PostgreSQL 16
├── .env.example                  # Mẫu cấu hình biến môi trường
└── README.md                     # Hướng dẫn sử dụng và vận hành
```

---

## 4. HƯỚNG DẪN CÀI ĐẶT VÀ KHỞI CHẠY TRÊN WINDOWS

### Bước 1: Yêu cầu môi trường
- Hệ điều hành: **Windows 10 / 11**
- **Docker Desktop** (đã khởi động)
- **Node.js 18+** (khuyên dùng Node 20 LTS)
- **Java JDK 21+** (khuyên dùng Eclipse Temurin hoặc OpenJDK 21)

### Bước 2: Khởi động Cơ sở dữ liệu PostgreSQL
Tại thư mục gốc dự án:
```powershell
# Khởi động container PostgreSQL trong chế độ nền
docker compose up -d

# Kiểm tra container đang hoạt động (cổng 5432)
docker compose ps
```
> **Lưu ý an toàn:** Tuyệt đối không chạy `docker compose down -v` để bảo toàn dữ liệu học viên và các migration đã áp dụng.

### Bước 3: Khởi động Backend Spring Boot
Mở một cửa sổ PowerShell mới:
```powershell
cd backend

# Khởi chạy backend qua Maven Wrapper
.\mvnw.cmd spring-boot:run
```
- Backend khởi động trên cổng: **`http://localhost:8088`** *(cấu hình cổng 8088 để tránh xung đột với Apache/XAMPP cổng 8080)*.
- Kiểm tra trạng thái hoạt động: `http://localhost:8088/api/v1/health`

### Bước 4: Khởi động Frontend React
Mở một cửa sổ PowerShell mới:
```powershell
cd frontend

# Cài đặt dependencies (nếu chạy lần đầu)
npm install

# Khởi chạy máy chủ phát triển
npm run dev
```
- Frontend sẵn sàng tại: **`http://localhost:5173`**

---

## 5. TÀI KHOẢN ĐĂNG NHẬP MẶC ĐỊNH (MÔI TRƯỜNG PHÁT TRIỂN)

Hệ thống đã nạp sẵn các tài khoản kiểm thử tương ứng với từng cổng làm việc:

| Cổng làm việc | Tên đăng nhập (Username / Email) | Mật khẩu mặc định | Vai trò (Role) | Mô tả quyền hạn |
|:---:|---|---|---|---|
| **Admin Portal** | `admin` (hoặc `admin@chacademy.vn`) | `Admin@123456` | `SUPER_ADMIN` | Toàn quyền quản trị vận hành trung tâm |
| **Teacher Portal** | `gv.hoangnam` | `Teacher@123456` | `TEACHER` | Xem lớp dạy, điểm danh, đăng tài liệu, đăng thông báo |
| **Student Portal** | `thuylinh.nguyen@gmail.com` | `Student@123456` | `STUDENT` | Xem lớp học, bài giảng, điểm danh, học phí cá nhân |

> **Cơ chế điều hướng thông minh:** Khi đăng nhập tại `/login`, hệ thống sẽ tự động phát hiện vai trò của tài khoản và chuyển hướng trực tiếp đến cổng tương ứng:
> - Tài khoản Giáo viên -> tự động vào `/teacher`
> - Tài khoản Học viên -> tự động vào `/student`
> - Tài khoản Quản trị -> tự động vào `/admin`

---

## 6. HƯỚNG DẪN THỰC THI KIỂM THỬ TỰ ĐỘNG

### 6.1 Kiểm thử Backend (JUnit 5 + Spring Boot Test)
```powershell
cd backend
.\mvnw.cmd test
```
- **Kết quả:** `Tests run: 34, Failures: 0, Errors: 0, Skipped: 0` (**100% PASSED**).

### 6.2 Kiểm thử Frontend (Vitest + React Testing Library)
```powershell
cd frontend
npm run test -- --run
```
- **Kết quả:** `Test Files: 10 passed (10)`, `Tests: 32 passed (32)` (**100% PASSED**).

### 6.3 Biên dịch Kiểm tra Sản xuất (Production Build)
```powershell
cd frontend
npm run build
```
- Kiểm tra kiểu dữ liệu TypeScript (`tsc -b`) và đóng gói tài nguyên tĩnh (0 lỗi, Exit Code 0).

---

## 7. SAO LƯU VÀ PHỤC HỒI DỮ LIỆU (BACKUP & RESTORE)

### Sao lưu Cơ sở dữ liệu (Backup)
```powershell
docker exec -t ch_academy_postgres pg_dump -U ch_academy_user -d ch_academy > backup_ch_academy.sql
```

### Phục hồi Cơ sở dữ liệu (Restore)
```powershell
Get-Content backup_ch_academy.sql | docker exec -i ch_academy_postgres psql -U ch_academy_user -d ch_academy
```

---

## 8. HỆ THỐNG TÀI LIỆU DỰ ÁN CHI TIẾT TRONG THƯ MỤC `docs/`

- **[docs/TECHNICAL_AUDIT.md](docs/TECHNICAL_AUDIT.md):** Báo cáo kiểm toán kỹ thuật toàn diện, phân tích nguyên nhân gốc và giải pháp xử lý 10 nhóm vấn đề quan trọng.
- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md):** Sơ đồ kiến trúc Modular Monolith, ranh giới domain, luồng bảo mật RBAC & Anti-IDOR.
- **[docs/DATABASE.md](docs/DATABASE.md):** Thiết kế ERD 27 bảng, từ điển dữ liệu, ràng buộc toàn vẹn và lộ trình Flyway V1 -> V11.
- **[docs/API.md](docs/API.md):** Danh mục hợp đồng RESTful API chi tiết theo từng phân hệ dưới tiền tố `/api/v1/*`.
- **[docs/TEST_REPORT.md](docs/TEST_REPORT.md):** Báo cáo thực thi kiểm thử thực tế với 34 backend tests và 32 frontend tests.
- **[docs/IMPLEMENTATION_STATUS.md](docs/IMPLEMENTATION_STATUS.md):** Ma trận trạng thái 100% hoàn thành các giai đoạn và 9 luồng nghiệp vụ cốt lõi.
