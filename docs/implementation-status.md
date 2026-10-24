# Báo cáo Trạng thái Triển khai Hệ thống CH Academy

> **Phiên bản:** 1.0.0  
> **Khởi tạo:** 24/10/2026  
> **Cập nhật lần cuối:** 24/10/2026  
> **Trạng thái tổng quan:** Đang triển khai tích cực theo Master Plan

---

## 1. Trạng thái Nền móng Kỹ thuật (Checkpoint Giai đoạn 0)

| Thành phần | Trạng thái | Cấu hình & Ghi chú |
|---|---|---|
| **Môi trường** | ✅ Sẵn sàng | Windows 11, Node.js 24.21.0, Java 25.0.1 (source 21) |
| **Database** | ✅ Hoạt động | PostgreSQL 16 (Docker: `ch_academy_postgres`), port 5432, volume `postgres_data` |
| **Backend** | ✅ Hoạt động | Spring Boot 3.5.0, port 8088 (tránh xung đột với XAMPP 8080) |
| **Frontend** | ✅ Hoạt động | React 19, Vite 8, TypeScript, port 5173 |
| **Flyway** | ✅ V1 Applied | Đã áp dụng `V1__Initial_Schema.sql` (`system_info` table) |
| **Kiểm thử** | ✅ Đạt 100% | Backend: 2/2 tests pass; Frontend: 10/10 tests pass |
| **Build** | ✅ Thành công | Backend compile pass, Frontend production build pass |

---

## 2. Kế hoạch & Tiến độ Triển khai theo Module

- [x] **Giai đoạn 0: Kiểm tra hiện trạng & xác minh nền móng**
- [x] **Giai đoạn 1: Thiết kế tổng thể (Architecture, ERD, Security Matrix, API Specification)**
- [x] **Giai đoạn 2: Nền tảng bảo mật & Quản lý người dùng (Users, Roles, Permissions, JWT, Spring Security)**
- [x] **Giai đoạn 3: Quản lý Khóa học & Danh mục (Courses, Categories, Levels)**
- [x] **Giai đoạn 4: Quản lý Học viên & Người giám hộ (Students, Guardians, Relations)**
- [x] **Giai đoạn 5: Tuyển sinh & Khách hàng tiềm năng (Leads, Activities, Conversion)**
- [x] **Giai đoạn 6: Lớp học, Lịch học & Ghi danh (Classes, Schedules, Conflict Detection, Enrollments)**
- [x] **Giai đoạn 7: Điểm danh & Chuyên cần (Attendance, Sessions, Stats)**
- [ ] **Giai đoạn 8: Học phí, Công nợ & Thanh toán (Receivables, Payments, Allocations, Invoices)**
- [ ] **Giai đoạn 9: Dashboard & Báo cáo số liệu thực tế (Admin/Teacher/Student metrics)**
- [ ] **Giai đoạn 10: Website công khai (Landing, Courses catalog, Course detail, Lead form)**
- [ ] **Giai đoạn 11: Kiểm thử tổng thể & Tối ưu (Unit, Integration, E2E flow)**
- [ ] **Giai đoạn 12: Bàn giao, hoàn thiện tài liệu & Script vận hành**

---

## 3. Nhật ký Thay đổi Chi tiết

- **24/10/2026**:
  - Xác minh Docker PostgreSQL 16-alpine chạy ổn định trên cổng 5432.
  - Sửa xung đột port 8080 của XAMPP sang port 8088 cho Spring Boot backend.
  - Cài đặt thêm các thư viện frontend phục vụ quản trị: `react-router-dom`, `lucide-react`.
  - Khởi tạo tài liệu theo dõi `docs/implementation-status.md`.
  - **Giai đoạn 1 (Thiết kế tổng thể)**:
    - Xây dựng ERD chi tiết 25 bảng và kiến trúc cơ sở dữ liệu (`docs/database-design.md`).
    - Ghi nhận quyết định kiến trúc Modular Monolith, JWT, BigDecimal, Asia/Ho_Chi_Minh (`docs/decisions.md`).
    - Soạn thảo quy chuẩn REST API, mã lỗi chuẩn hóa và đặc tả endpoint (`docs/api.md`).
  - **Giai đoạn 2 (Bảo mật & Người dùng)**:
    - Thêm `spring-boot-starter-security` và JJWT 0.12.6 vào `backend/pom.xml`.
    - Tạo migration Flyway `V2__Create_Security_And_Users.sql` tạo 5 bảng: `roles`, `permissions`, `role_permissions`, `users`, `user_roles`, seed vai trò, quyền và tài khoản mặc định `admin` (mật khẩu phát triển `Admin@123456`).
    - Tạo cấu trúc Backend: `ApiResponse`, `AppException`, `GlobalExceptionHandler`, các thực thể JPA, Repository, Spring Security 6 stateless filter, `JwtTokenProvider`, `AuthService`, `AuthController`.
    - Kiểm thử Backend: 5/5 tests pass (`AuthControllerTest`, `HealthControllerTest`, `ChAcademyApplicationTests`).
    - Tạo cấu trúc Frontend: `types/auth.ts`, `api/client.ts`, `api/auth.ts`, `context/AuthContext.tsx`, `components/auth/ProtectedRoute.tsx`, `pages/auth/LoginPage.tsx`, `layouts/AdminLayout.tsx`, `pages/admin/DashboardPage.tsx`.
    - Kiểm thử Frontend: 13/13 tests pass, `npm run build` thành công.
    - Chạy trực tiếp xác minh Flyway V2 áp dụng vào PostgreSQL, đăng nhập JWT thành công qua HTTP POST `/api/v1/auth/login` và xác thực qua `/api/v1/auth/me`.
  - **Giai đoạn 3 (Quản lý Khóa học & Danh mục)**:
    - Tạo migration Flyway `V3__Create_Courses_And_Categories.sql` tạo 2 bảng `course_categories`, `courses` với các ràng buộc CHECK và khóa ngoại RESTRICT, seed 4 danh mục và 4 khóa học mẫu chuẩn hóa.
    - Tạo cấu trúc Backend: Thực thể JPA `CourseCategory`, `Course`, Repositories `CourseCategoryRepository`, `CourseRepository`, DTOs (`CourseDto`, `CourseCategoryDto`, `CreateCourseRequest`, `UpdateCourseRequest`, `CreateCategoryRequest`), Services (`CourseCategoryService`, `CourseService`), Controllers (`CourseController`, `CourseCategoryController`, `PublicCourseController`).
    - Thêm dependency `lombok` và `spring-security-test` vào `pom.xml`.
    - Kiểm thử Backend: 10/10 tests pass (thêm 5 bài test trong `CourseControllerTest`).
    - Tạo cấu trúc Frontend: `types/course.ts`, `api/courses.ts`, `pages/admin/courses/CourseListPage.tsx`, đăng ký route `/admin/courses` trong `App.tsx`.
    - Kiểm thử Frontend: 16/16 tests pass (thêm 3 bài test trong `CourseListPage.test.tsx`), `npm run build` thành công.
    - Chạy trực tiếp xác minh Flyway V3 áp dụng vào PostgreSQL, API `/api/v1/public/courses` và `/api/v1/courses` hoạt động chính xác với dữ liệu thật.
  - **Giai đoạn 4 (Quản lý Học viên & Người giám hộ)**:
    - Tạo migration Flyway `V4__Create_Students_And_Guardians.sql` tạo 3 bảng `guardians`, `students`, `student_guardians` với các ràng buộc CHECK và khóa ngoại CASCADE, seed 2 người giám hộ và 3 học viên (cả trẻ em có liên kết phụ huynh và người lớn).
    - Tạo cấu trúc Backend: Thực thể JPA `Guardian`, `Student`, `StudentGuardian`, Repositories `GuardianRepository`, `StudentRepository`, `StudentGuardianRepository`, DTOs (`StudentDto`, `GuardianDto`, `StudentGuardianDto`, `CreateStudentRequest`, `UpdateStudentRequest`, `CreateGuardianRequest`), Services (`StudentService`, `GuardianService`), Controllers (`StudentController`, `GuardianController`).
    - Kiểm thử Backend: 13/13 tests pass (thêm 3 bài test trong `StudentControllerTest`).
    - Tạo cấu trúc Frontend: `types/student.ts`, `api/students.ts`, `pages/admin/students/StudentListPage.tsx`, đăng ký route `/admin/students` trong `App.tsx`.
    - Kiểm thử Frontend: 19/19 tests pass (thêm 3 bài test trong `StudentListPage.test.tsx`), `npm run build` thành công.
    - Chạy trực tiếp xác minh Flyway V4 áp dụng vào PostgreSQL, API `/api/v1/students` và `/api/v1/guardians/all` hoạt động chuẩn xác với quan hệ nhiều-nhiều người giám hộ và học sinh.
  - **Giai đoạn 5 (Tuyển sinh & Khách hàng tiềm năng)**:
    - Tạo migration Flyway `V5__Create_Leads_And_Activities.sql` tạo 2 bảng `leads`, `lead_activities` với ràng buộc CHECK cho nguồn (`WEBSITE`, `FACEBOOK`, `REFERRAL`, `WALK_IN`, `HOTLINE`, `OTHER`), trạng thái (`NEW`, `CONTACTED`, `CONSULTING`, `APPOINTMENT`, `CONVERTED`, `LOST`) và loại hoạt động (`CALL`, `MESSAGE`, `MEETING`, `NOTE`, `STATUS_CHANGE`), seed 2 khách hàng tiềm năng và 1 nhật ký hoạt động.
    - Tạo cấu trúc Backend: Thực thể JPA `Lead`, `LeadActivity`, Repositories `LeadRepository`, `LeadActivityRepository`, DTOs (`LeadDto`, `LeadActivityDto`, `CreateLeadRequest`, `PublicLeadRequest`, `AddActivityRequest`, `ConvertLeadRequest`), Services (`LeadService`), Controllers (`LeadController`, `PublicLeadController`).
    - Triển khai tính năng chuyển đổi nguyên tử (atomic transaction) từ Lead thành Student và liên kết người giám hộ cho trẻ em.
    - Kiểm thử Backend: 17/17 tests pass (thêm 4 bài test trong `LeadControllerTest`).
    - Tạo cấu trúc Frontend: `types/lead.ts`, `api/leads.ts`, `pages/admin/leads/LeadListPage.tsx`, đăng ký route `/admin/leads` trong `App.tsx`.
    - Kiểm thử Frontend: 22/22 tests pass (thêm 3 bài test trong `LeadListPage.test.tsx`), `npm run build` thành công.
    - Chạy trực tiếp xác minh Flyway V5 áp dụng vào PostgreSQL, API công khai `POST /api/v1/public/leads` và API quản trị `GET /api/v1/leads` hoạt động với dữ liệu thực tế trên cổng 8088.
  - **Giai đoạn 6 (Lớp học, Lịch học & Ghi danh)**:
    - Tạo migration Flyway `V6__Create_Classes_Schedules_Enrollments.sql` tạo 5 bảng `teachers`, `classes`, `class_schedules`, `class_sessions`, `enrollments`, có ràng buộc CHECK và khóa ngoại chặt chẽ, seed 2 giáo viên, 2 lớp học mở tuyển sinh, lịch học định kỳ và ghi danh mẫu.
    - Tạo cấu trúc Backend: Thực thể JPA `Teacher`, `ClassEntity`, `ClassSchedule`, `ClassSession`, `Enrollment`, Repositories `TeacherRepository`, `ClassRepository`, `ClassScheduleRepository`, `ClassSessionRepository`, `EnrollmentRepository`, DTOs (`ClassDto`, `TeacherDto`, `ClassScheduleDto`, `EnrollmentDto`, `CreateClassRequest`, `ScheduleSlotRequest`, `CreateEnrollmentRequest`), Service `AcademicService` (có thuật toán phát hiện xung đột lịch giáo viên và phòng học, kiểm tra giới hạn sĩ số lớp học, chống ghi danh trùng lặp, tự động sinh các buổi học class_sessions theo chu kỳ lịch học), Controllers `ClassController`, `TeacherController`.
    - Kiểm thử Backend: 21/21 tests pass (thêm 4 bài test trong `ClassControllerTest`).
    - Tạo cấu trúc Frontend: `types/class.ts`, `api/classes.ts`, `pages/admin/classes/ClassListPage.tsx`, đăng ký route `/admin/classes` trong `App.tsx`.
    - Kiểm thử Frontend: 25/25 tests pass (thêm 3 bài test trong `ClassListPage.test.tsx`), `npm run build` thành công.
    - Chạy trực tiếp xác minh Flyway V6 áp dụng vào PostgreSQL, API `GET /api/v1/teachers/active` và `GET /api/v1/classes` hoạt động chính xác với sĩ số thực tế trên cổng 8088.
  - **Giai đoạn 7 (Điểm danh & Chuyên cần)**:
    - Tạo migration Flyway `V7__Create_Attendance.sql` tạo bảng `attendance_records` với ràng buộc CHECK trạng thái (`PRESENT`, `ABSENT`, `LATE`, `EXCUSED`), khóa duy nhất `UNIQUE(session_id, student_id)`, ghi nhận người điểm danh `recorded_by`, seed 1 buổi học và 1 bản ghi điểm danh mẫu.
    - Tạo cấu trúc Backend: Thực thể JPA `AttendanceRecord`, Repository `AttendanceRecordRepository`, DTOs (`AttendanceRecordDto`, `ClassSessionDto`, `MarkAttendanceRequest`, `BulkAttendanceRequest`, `AttendanceStatsDto`), Service `AttendanceService` (kiểm tra chặt chẽ học viên phải thuộc lớp học mới được điểm danh, cập nhật/upsert kết quả điểm danh, tính toán tỷ lệ phần trăm chuyên cần), Controller `AttendanceController`.
    - Kiểm thử Backend: 24/24 tests pass (thêm 3 bài test trong `AttendanceControllerTest`).
    - Tạo cấu trúc Frontend: `types/attendance.ts`, `api/attendance.ts`, `pages/admin/attendance/AttendancePage.tsx`, đăng ký route `/admin/attendance` trong `App.tsx`.
    - Kiểm thử Frontend: 27/27 tests pass (thêm 2 bài test trong `AttendancePage.test.tsx`), `npm run build` thành công.
    - Chạy trực tiếp xác minh Flyway V7 áp dụng vào PostgreSQL, API `GET /api/v1/attendance/sessions` và `GET /api/v1/attendance/students/{id}/stats` hoạt động chuẩn xác với dữ liệu thực tế trên cổng 8088.
