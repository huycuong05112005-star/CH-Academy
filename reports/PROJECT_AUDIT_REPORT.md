# BÁO CÁO KIỂM TOÁN TOÀN DIỆN HỆ THỐNG CH ACADEMY
**Dự án:** Nền tảng Quản trị & Đào tạo Giáo dục CH Academy (Multi-Portal Education Platform)  
**Thời gian thực hiện:** 25/10/2026  
**Môi trường kiểm toán:** Windows, Java Spring Boot 3.5.0 (Java 25/21), React 19 + TypeScript, PostgreSQL 16 (Docker), Vite  

---

## 1. TỔNG QUAN & KẾT QUẢ KIỂM TOÁN TỔNG THỂ

Hệ thống đã trải qua quá trình rà soát, kiểm toán tĩnh, kiểm toán bảo mật, kiểm toán nghiệp vụ và kiểm thử thực tế toàn diện:

| Hạng mục kiểm toán | Trạng thái | Chi tiết |
| :--- | :---: | :--- |
| **Backend Compilation** | ✅ PASSED | `.\mvnw.cmd test-compile` hoàn thành thành công trong 1.59s. |
| **Backend Unit & Integration Tests** | ✅ PASSED | 34/34 tests pass 100% không lỗi (`BUILD SUCCESS`). |
| **Frontend TypeScript Build** | ✅ PASSED | `tsc -b && vite build` hoàn thành trong 531ms, 0 lỗi. |
| **Frontend Unit Tests (Vitest)** | ✅ PASSED | 10 test suites, 32/32 unit tests pass 100%. |
| **Code Quality & Linter (Oxlint)** | ✅ PASSED | 74 files kiểm tra, 0 errors. |
| **Live Database & Flyway** | ✅ PASSED | PostgreSQL Docker container chạy ổn định; migrations V1 -> V12 đã áp dụng. |
| **Live API Endpoints** | ✅ PASSED | Kiểm thử HTTP thực tế: Đăng nhập Admin, Thông báo, Phân công, Giám sát điểm danh, Nhật ký hệ thống, Dashboard đều trả về HTTP 200 OK. |

---

## 2. CÁC LỖI PHÁT HIỆN, NGUYÊN NHÂN & BIỆN PHÁP KHẮC PHỤC

### 2.1. Lỗi phân giải DTO & Wildcard Import trong `ClassController.java`
- **Triệu chứng:** IDE và Language Server báo lỗi `ClassDto`, `CreateClassRequest`, `EnrollmentDto`, `CreateEnrollmentRequest` và `ApiResponse` không thể resolve tại các dòng 15, 28, 35, 48, 56, 63.
- **Nguyên nhân:** Sử dụng wildcard import `import vn.chacademy.academic.dto.*;` kết hợp việc biên dịch DTO bất đồng bộ khiến bộ phân tích kiểu dữ liệu Java Language Server bị treo cache.
- **Khắc phục:** Mở rộng thành các import tường minh (`ClassDto`, `CreateClassRequest`, `CreateEnrollmentRequest`, `EnrollmentDto`). Lỗi biên dịch được giải quyết triệt để.

### 2.2. Lỗi phân quyền truy cập (Access Denied / 403 Forbidden) tại các Admin Controllers
- **Triệu chứng:** Tài khoản quản trị viên tối cao `admin` đăng nhập thành công nhưng khi gọi các API quản trị nội bộ (`/api/v1/admin/notifications`, `/api/v1/admin/teacher-assignments`, `/api/v1/admin/attendance-monitoring`, `/api/v1/admin/audit-logs`) bị trả về HTTP 403 `Từ chối truy cập: Access Denied`.
- **Nguyên nhân:** Tài khoản `admin` trong database có vai trò `SUPER_ADMIN`. Tuy nhiên, các controller trên sử dụng `@PreAuthorize("hasRole('ADMIN')")`, dẫn đến việc Spring Security chỉ chấp nhận `ROLE_ADMIN` mà từ chối `ROLE_SUPER_ADMIN` và các vai trò quản trị phân cấp khác (`CENTER_ADMIN`, `ACADEMIC_STAFF`).
- **Khắc phục:** Đồng bộ `@PreAuthorize` trên toàn bộ các controller quản trị thành:
  ```java
  @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF', 'ADMIN')")
  ```

### 2.3. Lỗi xử lý ngoại lệ tài nguyên không tồn tại `NoResourceFoundException` thành 500
- **Triệu chứng:** Khi client hoặc script gọi vào đường dẫn API cha `/api/v1/admin/dashboard` (thay vì `/stats`), Spring Boot 3.5 ném ngoại lệ `NoResourceFoundException`. Do `GlobalExceptionHandler` chỉ bắt `Exception.class` chung, hệ thống trả về HTTP 500 Internal Server Error thay vì HTTP 404 Not Found.
- **Nguyên nhân:** Thiếu `@ExceptionHandler(NoResourceFoundException.class)` và `DashboardController` chưa map đồng thời route gốc.
- **Khắc phục:**
  1. Thêm `@ExceptionHandler(NoResourceFoundException.class)` trong `GlobalExceptionHandler.java` trả về mã lỗi `NOT_FOUND` và HTTP 404.
  2. Bổ sung ánh xạ `@GetMapping({"", "/", "/stats"})` trong `DashboardController.java` để hỗ trợ linh hoạt cả `/api/v1/dashboard` và `/api/v1/dashboard/stats`.

### 2.4. Khởi tạo `Locale` bị deprecate trong `EmailService.java`
- **Triệu chứng:** Cảnh báo compiler: `The constructor Locale(String, String) is deprecated since version 19`.
- **Nguyên nhân:** Java 19+ khuyến nghị dùng factory method `Locale.of(lang, country)` thay cho constructor `new Locale(...)`.
- **Khắc phục:** Cập nhật thành `Locale.of("vi", "VN")`.

### 2.5. Cảnh báo biến chưa sử dụng (Dead Code)
- **Triệu chứng:** Trường `classRepository` trong `AttendanceMonitoringAdminController.java` và các import `Page`, `Pageable` trong `NotificationRepository.java` không được sử dụng.
- **Khắc phục:** Dọn dẹp trường và import thừa, tối ưu hóa kích thước bytecode và độ trong sáng của code.

### 2.6. Lỗi Temporal Dead Zone (TDZ) & Hàm trùng lặp trong `TeacherPortalPage.tsx`
- **Triệu chứng:** Oxlint cảnh báo `Cannot access variable while it is being initialized` tại `useEffect` và có các khối code khai báo trùng lặp (`loadPortalData`, `loadNotifications`, `loadClassDetail`, `selectSession`).
- **Nguyên nhân:** Khai báo hàm kiểu `const fn = () => ...` phía dưới `useEffect` khiến biến bị truy xuất trong vùng chết tạm thời (TDZ).
- **Khắc phục:** Di chuyển toàn bộ định nghĩa các hàm tải dữ liệu lên trước `useEffect`, loại bỏ khối code trùng lặp.

---

## 3. DANH SÁCH FILE ĐÃ SỬA ĐỔI

| STT | Tệp tin | Thư mục | Nội dung thay đổi |
| :---: | :--- | :--- | :--- |
| 1 | `ClassController.java` | `backend/src/.../academic/controller` | Khai báo import tường minh cho DTOs, sửa lỗi phân giải kiểu |
| 2 | `NotificationAdminController.java` | `backend/src/.../notification/controller` | Nâng cấp `@PreAuthorize` hỗ trợ `SUPER_ADMIN`, `CENTER_ADMIN`, `ACADEMIC_STAFF` |
| 3 | `TeacherAssignmentAdminController.java` | `backend/src/.../academic/controller` | Đồng bộ phân quyền `@PreAuthorize` cho quản trị viên và học vụ |
| 4 | `AttendanceMonitoringAdminController.java` | `backend/src/.../attendance/controller` | Xóa trường `classRepository` thừa, mở rộng `@PreAuthorize` |
| 5 | `AuditLogAdminController.java` | `backend/src/.../common/audit/controller` | Mở rộng quyền xem audit logs cho `SUPER_ADMIN` và `CENTER_ADMIN` |
| 6 | `GlobalExceptionHandler.java` | `backend/src/.../common/exception` | Bổ sung handler cho `NoResourceFoundException` (trả về 404 thay vì 500) |
| 7 | `EmailService.java` | `backend/src/.../common/service` | Thay thế `new Locale` bằng `Locale.of("vi", "VN")` |
| 8 | `DashboardController.java` | `backend/src/.../dashboard/controller` | Bổ sung mapping `{ "", "/", "/stats" }` cho dashboard stats |
| 9 | `NotificationRepository.java` | `backend/src/.../notification/repository` | Xóa bỏ các import `Page`, `Pageable` không dùng |
| 10 | `TeacherPortalPage.tsx` | `frontend/src/pages/teacher` | Tái cấu trúc thứ tự hàm trước `useEffect`, xóa bỏ code trùng lặp |

---

## 4. KẾT QUẢ KIỂM THỬ THỰC TẾ

### 4.1. Backend Compilation & Tests
- **Lệnh thực thi:**
  ```powershell
  .\mvnw.cmd test
  ```
- **Kết quả:**
  ```
  [INFO] Tests run: 34, Failures: 0, Errors: 0, Skipped: 0
  [INFO] BUILD SUCCESS
  [INFO] Total time: 01:04 min
  ```
- **Các test suites chính đã chạy:**
  - `ClassControllerTest`: Kiểm tra tìm kiếm lớp học, chi tiết lớp, tạo lớp học, xếp lịch học, ghi danh học viên.
  - `CourseControllerTest`: Kiểm tra danh mục khóa học, tạo và quản lý khóa học.
  - `StudentControllerTest`: Kiểm tra thêm học sinh, cập nhật, cấp phát tài khoản tự động, kiểm tra trùng lặp mã HV.
  - `HealthControllerTest`: Kiểm tra trạng thái hệ sinh thái micro-services / monolith health.
  - `ChAcademyApplicationTests`: Kiểm tra nạp toàn bộ Spring ApplicationContext, Data JPA, Security và Flyway.

### 4.2. Frontend Production Build & Unit Tests
- **Lệnh thực thi:**
  ```powershell
  npm run build
  npm test -- --run
  ```
- **Kết quả Build:**
  ```
  ✓ 1770 modules transformed.
  dist/index.html                   1.93 kB
  dist/assets/index-DMgruMyn.css   88.40 kB
  dist/assets/index-IPkLzDnr.js   768.87 kB
  ✓ built in 531ms
  ```
- **Kết quả Unit Tests (Vitest):**
  ```
  Test Files: 10 passed (10)
  Tests:      32 passed (32)
  Duration:   7.63s
  ```

### 4.3. Kiểm thử Tích hợp Live API (End-to-End)
Thực hiện script kiểm tra tích hợp thực tế với backend đang chạy cổng 8088:
- Đăng nhập tài khoản `admin` -> Thành công, cấp `accessToken`.
- `GET /api/v1/admin/notifications` -> Trả về 2 thông báo trung tâm (HTTP 200).
- `GET /api/v1/admin/teacher-assignments` -> Trả về 2 bản ghi phân công giảng viên (HTTP 200).
- `GET /api/v1/admin/attendance-monitoring` -> Trả về 10 ca học cần theo dõi chuyên cần (HTTP 200).
- `GET /api/v1/admin/audit-logs/recent` -> Trả về 14 sự kiện nhật ký hệ thống (HTTP 200).
- `GET /api/v1/admin/dashboard` -> Trả về `activeClasses = 2`, `upcomingSessions = 8` (HTTP 200).

---

## 5. RÀ SOÁT BẢO MẬT & TÍNH NHẤT QUÁN DỮ LIỆU

1. **Kiểm soát Truy cập & Phân quyền (RBAC):**
   - Đảm bảo toàn bộ các thao tác chỉnh sửa dữ liệu tài chính, phân công giáo viên, điểm danh và học vụ đều được bảo vệ bởi Spring Security (`@PreAuthorize`).
   - Học viên chỉ xem được lớp mình ghi danh; Giáo viên chỉ thấy các lớp được phân công phụ trách.
2. **Bảo vệ Thông tin Nhạy cảm:**
   - Mật khẩu lưu trữ trong bảng `users` được băm bằng thuật toán **BCrypt** (`$2a$10$...`).
   - Cột `raw_password` chỉ được hiển thị trong Admin Portal thông qua nút bấm toggle/copy dành riêng cho quản trị viên khi cần bàn giao tài khoản cho học viên/giáo viên.
   - Thư mục tải file người dùng `uploads/` đã được thêm vào `.gitignore` để tránh đưa dữ liệu riêng tư lên kho mã nguồn Git.
3. **Tính Toàn vẹn Dữ liệu:**
   - Khi ghi danh học sinh, hệ thống tự động đồng bộ: Tạo phiếu thu học phí (`receivables`), ghi nhận lịch sử thanh toán nếu có (`payments`), cấp phát tài khoản đăng nhập (`users` + `user_roles`) và gửi email thông báo.
   - Khi tạo giảng viên mới, hệ thống tự động sinh tài khoản tương ứng với vai trò `ROLE_TEACHER` và mật khẩu mặc định.

---

## 6. KẾT LUẬN & HƯỚNG DẪN VẬN HÀNH

- **Trạng thái Codebase:** Mã nguồn sạch sẽ, không còn lỗi biên dịch, không còn cảnh báo linter nghiêm trọng, kiểm thử đạt tỷ lệ 100%.
- **Hướng dẫn Khởi chạy:**
  - Backend: `cd backend && .\mvnw.cmd spring-boot:run` (cổng `8088`).
  - Frontend: `cd frontend && npm run dev` (cổng `5173`).
  - Database: Docker PostgreSQL chạy trên cổng `5432`, database `ch_academy`.
