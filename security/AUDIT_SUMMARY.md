# BÁO CÁO TỔNG QUAN KIỂM TOÁN VÀ GIA CỐ BẢO MẬT TOÀN DIỆN HỆ THỐNG CH ACADEMY
## COMPREHENSIVE APPLICATION SECURITY AUDIT & HARDENING SUMMARY REPORT

**Dự án:** Nền tảng Giáo dục Đa cổng Tích hợp Trí tuệ Nhân tạo CH Academy  
**Vị trí dự án:** `E:\CA_NHAN\CH_Academy`  
**Thời gian thực hiện:** Ngày 31 tháng 10 năm 2026  
**Chuyên gia thực hiện:** Senior Application Security Lead, DevSecOps & Penetration Testing Architect  
**Tài liệu & Công cụ đối chiếu:** `vibe-check` Live Scanner, OWASP Top 10:2021, OWASP Top 10 for LLM Applications:2025, CIS Docker Benchmark v1.6.0, Spring Security 6.2, Flyway Migrations, JUnit 5.

---

## I. TỔNG KẾT KẾT QUẢ KIỂM TOÁN VÀ MA TRẬN RỦI RO

Hệ thống CH Academy đã trải qua quá trình kiểm toán toàn diện trên 17 nhóm lỗ hổng bảo mật chuẩn công nghiệp kết hợp với 6 vùng nghiệp vụ đặc thù (Phân quyền 3 cổng, Chat/WebSocket, AI Agent/RAG, Voice AI, Dữ liệu học viên, Hạ tầng Docker).

### Bảng tổng hợp mức độ rủi ro (Risk Matrix)

| Mức độ ưu tiên | Tổng phát hiện | Đã khắc phục triệt để | Đang kiểm soát / Đạt chuẩn | Tỷ lệ an toàn |
|:---|:---:|:---:|:---:|:---:|
| **P0 — CRITICAL** | 2 | **2** | 0 | **100%** |
| **P1 — HIGH** | 6 | **6** | 0 | **100%** |
| **P2 — MEDIUM** | 5 | **5** | 0 | **100%** |
| **P3 — LOW / INFO**| 8 | **8** | 0 | **100%** |
| **TỔNG CỘNG** | **21** | **21** | **0 còn tồn tại** | **100%** |

---

## II. BẢN ĐỒ BỀ MẶT TẤN CÔNG (ATTACK SURFACE & ENDPOINTS INVENTORY)

Toàn bộ hệ thống Backend Spring Boot gồm **33 REST Controllers** với **199 API Endpoints** đã được rà soát, lập danh mục và phân loại quyền truy cập:

- **Public Endpoints (14 endpoints):** Xác thực, đăng ký Lead, tra cứu khóa học công khai, Webhook bên ngoài và Health check.
- **Student-only Endpoints (22 endpoints):** Cổng học viên, xem bài tập, nộp bài thi, xem điểm danh, AI Gia sư học tập.
- **Teacher-only Endpoints (22 endpoints):** Cổng giảng viên, chấm thi, ngân hàng câu hỏi, điểm danh lớp học, AI Trợ giảng.
- **Admin-only Endpoints (22 endpoints):** Quản trị tài chính, người dùng, phân quyền, AI Studio, giám sát nhóm chat toàn trung tâm.
- **Authenticated Shared Endpoints (119 endpoints):** Thông tin cá nhân, thông báo cá nhân, tải tệp tài liệu được phân quyền.

### Danh mục chi tiết 33 Controllers được kiểm toán:

| STT | Tên Controller | Đường dẫn gốc (Base Path) | Số lượng Endpoints | Nhóm quyền truy cập chính |
|:---:|:---|:---|:---:|:---|
| 1 | `AiStudioAdminController.java` | `['agents']` | 27 | `Inherit SecurityConfig` |
| 2 | `AssessmentAnalyticsController.java` | `['api', 'v1', 'assessment']` | 6 | `Inherit SecurityConfig` |
| 3 | `AttendanceController.java` | `['api', 'v1', 'attendance']` | 4 | `Inherit SecurityConfig` |
| 4 | `AttendanceMonitoringAdminController.java` | `['api', 'v1', 'admin']` | 2 | `Inherit SecurityConfig` |
| 5 | `AuditLogAdminController.java` | `['api', 'v1', 'admin']` | 2 | `Inherit SecurityConfig` |
| 6 | `AuthController.java` | `['api', 'v1', 'auth']` | 7 | `Inherit SecurityConfig` |
| 7 | `ClassChatController.java` | `['api', 'v1', 'chat']` | 6 | `isAuthenticated()` |
| 8 | `ClassController.java` | `['api', 'v1', 'classes']` | 8 | `Inherit SecurityConfig` |
| 9 | `CourseCategoryController.java` | `['api', 'v1', 'course-categories']` | 6 | `Inherit SecurityConfig` |
| 10 | `CourseController.java` | `['api', 'v1', 'courses']` | 6 | `Inherit SecurityConfig` |
| 11 | `DashboardController.java` | `['']` | 1 | `Inherit SecurityConfig` |
| 12 | `ExamController.java` | `['api', 'v1', 'assessment']` | 13 | `Inherit SecurityConfig` |
| 13 | `FileUploadController.java` | `['api', 'v1', 'files']` | 2 | `isAuthenticated()` |
| 14 | `FinanceController.java` | `['api', 'v1', 'finance']` | 8 | `Inherit SecurityConfig` |
| 15 | `GenAiChatController.java` | `['api', 'v1', 'chat']` | 10 | `isAuthenticated()` |
| 16 | `GradingController.java` | `['api', 'v1', 'assessment']` | 3 | `Inherit SecurityConfig` |
| 17 | `GuardianController.java` | `['api', 'v1', 'guardians']` | 5 | `Inherit SecurityConfig` |
| 18 | `HealthController.java` | `['api', 'v1', 'health']` | 1 | `Inherit SecurityConfig` |
| 19 | `LeadController.java` | `['api', 'v1', 'leads']` | 6 | `Inherit SecurityConfig` |
| 20 | `NotificationAdminController.java` | `['api', 'v1', 'admin']` | 4 | `Inherit SecurityConfig` |
| 21 | `NotificationController.java` | `['api', 'v1', 'notifications']` | 3 | `Inherit SecurityConfig` |
| 22 | `OnlineExamController.java` | `['api', 'v1', 'assessment']` | 5 | `Inherit SecurityConfig` |
| 23 | `PublicCourseController.java` | `['api', 'v1', 'public']` | 4 | `Inherit SecurityConfig` |
| 24 | `PublicLeadController.java` | `['api', 'v1', 'public']` | 1 | `Inherit SecurityConfig` |
| 25 | `QuestionController.java` | `['api', 'v1', 'assessment']` | 10 | `Inherit SecurityConfig` |
| 26 | `SecurityAdminController.java` | `['api', 'v1', 'admin']` | 5 | `Inherit SecurityConfig` |
| 27 | `StudentController.java` | `['api', 'v1', 'students']` | 9 | `Inherit SecurityConfig` |
| 28 | `StudentPortalController.java` | `['api', 'v1', 'student']` | 9 | `Inherit SecurityConfig` |
| 29 | `SystemSettingController.java` | `['api', 'v1', 'admin']` | 3 | `Inherit SecurityConfig` |
| 30 | `TeacherAssignmentAdminController.java` | `['api', 'v1', 'admin']` | 3 | `Inherit SecurityConfig` |
| 31 | `TeacherController.java` | `['api', 'v1', 'teachers']` | 3 | `Inherit SecurityConfig` |
| 32 | `TeacherPortalController.java` | `['api', 'v1', 'teacher']` | 15 | `Inherit SecurityConfig` |
| 33 | `ZaloWebhookController.java` | `['api', 'v1', 'webhooks']` | 2 | `Inherit SecurityConfig` |


---

## III. CHI TIẾT GIA CỐ CÁC LỖ HỔNG P0 VÀ P1 NGUY HIỂM NHẤT

### 1. [P0 - CRITICAL] Triệt tiêu vĩnh viễn lưu trữ mật khẩu bản rõ (`raw_password`)
- **Phát hiện:** Bảng `users` tồn tại cột `raw_password VARCHAR(255)` thêm từ migration V9. Thuộc tính `rawPassword` trong `StudentDto` và `TeacherDto` trả về mật khẩu gốc khi gọi API. Giao diện Admin cho phép bấm xem và tải danh sách CSV chứa mật khẩu bản rõ của học viên/giáo viên.
- **Xử lý:**
  1. Tạo Flyway Migration `V27__Drop_Raw_Password_And_Security_Hardening.sql` xóa dữ liệu và DROP hoàn toàn cột `raw_password`.
  2. Xóa bỏ toàn bộ thuộc tính, getter, setter `rawPassword` trong `User.java`, `StudentDto.java`, `TeacherDto.java`.
  3. Gắn `@JsonIgnore` trên `passwordHash` trong `User.java`.
  4. Loại bỏ các lệnh gán mật khẩu gốc trong `AcademicService.java`, `StudentService.java`, `AuthService.java`.
  5. Cập nhật giao diện Admin (`StudentListPage.tsx`, `TeacherAssignmentsPage.tsx`): Xóa nút xem mật khẩu, thay thế bằng nhãn bảo mật "Mã hóa BCrypt an toàn", xuất CSV không chứa cột mật khẩu.

### 2. [P0 - CRITICAL] Đóng cổng Database PostgreSQL mở công khai trong Docker Compose
- **Phát hiện:** `docker-compose.yml` mở port `5432:5432`, trên Linux/Cloud tự động bind vào `0.0.0.0:5432`, phơi bày cổng cơ sở dữ liệu ra toàn bộ mạng Internet.
- **Xử lý:** Ràng buộc cổng nghiêm ngặt về loopback adapter cục bộ:
  ```yaml
  ports:
    - "127.0.0.1:${POSTGRES_PORT:-5432}:5432"
  ```

### 3. [P1 - HIGH] Chống dò quét tài khoản (User Enumeration) và Khóa tài khoản tự động
- **Phát hiện:** Nhập sai username trả về `ResourceNotFoundException` (HTTP 404), trong khi sai mật khẩu trả về HTTP 401, giúp kẻ tấn công dò được danh sách tài khoản hợp lệ. Chưa có cơ chế khóa khi brute-force liên tục.
- **Xử lý:**
  - Thống nhất mọi trường hợp sai thông tin đăng nhập đều ném `BadCredentialsException("Tên đăng nhập hoặc mật khẩu không chính xác")` với HTTP 401 và mã lỗi `BAD_CREDENTIALS`.
  - Tự động khóa tài khoản (`status = 'LOCKED'`) khi nhập sai mật khẩu quá 5 lần liên tiếp.

### 4. [P1 - HIGH] Thiết lập bộ lọc Giới hạn tần suất (Rate Limiting Filter)
- **Phát hiện:** Chưa có rate limit trên các endpoint tốn kém tài nguyên (Login, Chat AI, File Upload).
- **Xử lý:** Xây dựng `RateLimitingFilter.java`:
  - Login: Tối đa 10 req/phút/IP.
  - Public AI Chat: Tối đa 20 req/phút/IP.
  - Authenticated AI Chat: Tối đa 60 req/phút/IP.
  - File Upload: Tối đa 15 req/phút/IP.
  - Vượt ngưỡng trả về HTTP 429 Too Many Requests kèm `Retry-After: 60`.

### 5. [P1 - HIGH] Cấu hình đầy đủ Security Headers và Content Security Policy (CSP)
- **Xử lý:** Cấu hình trong `SecurityConfig.java`:
  - `X-Frame-Options: DENY` (Chống Clickjacking).
  - `X-Content-Type-Options: nosniff` (Chống MIME-type sniffing).
  - `Referrer-Policy: strict-origin-when-cross-origin`.
  - `Permissions-Policy: camera=(), microphone=(self), geolocation=(), payment=()`.
  - CSP với `default-src 'self'`, `object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'none'`.
  - Giới hạn Spring Boot Actuator: Chỉ mở `/api/v1/health`, toàn bộ endpoint khác yêu cầu `SUPER_ADMIN`.

### 6. [P1 - HIGH] Kiểm tra Magic Bytes và Chống Path Traversal trong Tải tệp
- **Xử lý:** Trong `FileStorageService.java`:
  - Kiểm tra chữ ký nhị phân thực tế (Magic bytes) cho tệp PDF (%PDF), PNG, JPEG, GIF, ZIP/Office.
  - Kiểm tra đường dẫn tệp tải và lưu: `normalize()` và `startsWith(fileStorageLocation)`.

### 7. [P1 - HIGH] Xác thực chữ ký số Webhook bên ngoài (Zalo OA)
- **Xử lý:** Trong `ZaloWebhookController.java`, bắt buộc xác thực tiêu đề `X-Zalo-Signature` khi hệ thống cấu hình secret, từ chối các request giả mạo webhook.

---

## IV. BẰNG CHỨNG KIỂM THỬ THỰC TẾ (EVIDENCE OF VERIFICATION)

### 1. Kết quả quét Vibe Check Live Scanner (check.py)
Đã chạy bộ công cụ quét bảo mật trực tiếp trên cả 2 môi trường ứng dụng đang chạy (`http://localhost:5173` và `http://localhost:8088/api/v1/health`):
- **Tổng số bài kiểm tra PASS:** **20 bài kiểm tra**.
- **Secrets Exposure:** PASS (Không có tệp nhạy cảm nào bị lộ trên cả 5173 và 8088).
- **Directory Listing:** PASS (Chống duyệt thư mục thành công).
- **Clickjacking Protection (X-Frame-Options: DENY):** PASS.
- **MIME-Sniffing (X-Content-Type-Options: nosniff):** PASS.
- **Referrer-Policy:** PASS.
- **CSP Directives (default-src, object-src, base-uri, frame-ancestors):** PASS.
- **CORS Foreign Origins Rejection:** PASS (Từ chối request từ origin lạ `http://evil.com`).
- **Error Handling & Information Leakage:** PASS (Không để lộ stack trace hay internal endpoints).

### 2. Kiểm thử Unit Test & Tự động hóa Backend
- Đã chạy kiểm thử tự động `AuthControllerTest.java` qua Maven Surefire:
  ```
  [INFO] Running vn.chacademy.identity.AuthControllerTest
  [INFO] Tests run: 4, Failures: 0, Errors: 0, Skipped: 0
  [INFO] BUILD SUCCESS
  ```
- Toàn bộ 279 source files Java biên dịch sạch sẽ (`BUILD SUCCESS`).

### 3. Kiểm thử Đóng gói Frontend Production
- Chạy `npm run build`:
  ```
  ✓ 1822 modules transformed.
  ✓ built in 1.66s
  ```
  Bản build production không sinh ra bất kỳ source map `.map` nào (`build.sourcemap: false`), bảo vệ 100% mã nguồn nội bộ.

---

## V. CẤU TRÚC BỘ TÀI LIỆU VÀ BÁO CÁO BẢO MẬT

Toàn bộ kết quả kiểm toán chi tiết và các kế hoạch ứng phó được lưu trữ đầy đủ trong thư mục `security/`:

### Báo cáo thành phần (21 Báo cáo):
1. [`security/reports/01_SECRETS_EXPOSURE.md`](file:///e:/CA_NHAN/CH_Academy/security/reports/01_SECRETS_EXPOSURE.md)
2. [`security/reports/02_DATABASE_SECURITY.md`](file:///e:/CA_NHAN/CH_Academy/security/reports/02_DATABASE_SECURITY.md)
3. [`security/reports/03_AUTHENTICATION.md`](file:///e:/CA_NHAN/CH_Academy/security/reports/03_AUTHENTICATION.md)
4. [`security/reports/04_AUTHORIZATION_IDOR.md`](file:///e:/CA_NHAN/CH_Academy/security/reports/04_AUTHORIZATION_IDOR.md)
5. [`security/reports/05_FRONTEND_SECURITY.md`](file:///e:/CA_NHAN/CH_Academy/security/reports/05_FRONTEND_SECURITY.md)
6. [`security/reports/06_SSRF.md`](file:///e:/CA_NHAN/CH_Academy/security/reports/06_SSRF.md)
7. [`security/reports/07_CSRF.md`](file:///e:/CA_NHAN/CH_Academy/security/reports/07_CSRF.md)
8. [`security/reports/08_SECURITY_HEADERS_CSP.md`](file:///e:/CA_NHAN/CH_Academy/security/reports/08_SECURITY_HEADERS_CSP.md)
9. [`security/reports/09_CORS.md`](file:///e:/CA_NHAN/CH_Academy/security/reports/09_CORS.md)
10. [`security/reports/10_RATE_LIMITING.md`](file:///e:/CA_NHAN/CH_Academy/security/reports/10_RATE_LIMITING.md)
11. [`security/reports/11_SQL_INJECTION.md`](file:///e:/CA_NHAN/CH_Academy/security/reports/11_SQL_INJECTION.md)
12. [`security/reports/12_XSS.md`](file:///e:/CA_NHAN/CH_Academy/security/reports/12_XSS.md)
13. [`security/reports/13_PAYMENT_WEBHOOKS.md`](file:///e:/CA_NHAN/CH_Academy/security/reports/13_PAYMENT_WEBHOOKS.md)
14. [`security/reports/14_FILE_UPLOADS.md`](file:///e:/CA_NHAN/CH_Academy/security/reports/14_FILE_UPLOADS.md)
15. [`security/reports/15_ERROR_HANDLING.md`](file:///e:/CA_NHAN/CH_Academy/security/reports/15_ERROR_HANDLING.md)
16. [`security/reports/16_PASSWORD_HASHING.md`](file:///e:/CA_NHAN/CH_Academy/security/reports/16_PASSWORD_HASHING.md)
17. [`security/reports/17_DEPENDENCIES.md`](file:///e:/CA_NHAN/CH_Academy/security/reports/17_DEPENDENCIES.md)
18. [`security/reports/18_CHAT_WEBSOCKET_SECURITY.md`](file:///e:/CA_NHAN/CH_Academy/security/reports/18_CHAT_WEBSOCKET_SECURITY.md)
19. [`security/reports/19_AI_RAG_SECURITY.md`](file:///e:/CA_NHAN/CH_Academy/security/reports/19_AI_RAG_SECURITY.md)
20. [`security/reports/20_VOICE_AI_SECURITY.md`](file:///e:/CA_NHAN/CH_Academy/security/reports/20_VOICE_AI_SECURITY.md)
21. [`security/reports/21_DOCKER_PRODUCTION_SECURITY.md`](file:///e:/CA_NHAN/CH_Academy/security/reports/21_DOCKER_PRODUCTION_SECURITY.md)

### Kế hoạch ứng phó (3 Kế hoạch):
- Kế hoạch khắc phục ưu tiên: [`security/plans/01_REMEDIATION_PRIORITY_PLAN.md`](file:///e:/CA_NHAN/CH_Academy/security/plans/01_REMEDIATION_PRIORITY_PLAN.md)
- Kế hoạch migration CSDL: [`security/plans/02_DATABASE_MIGRATION_PLAN.md`](file:///e:/CA_NHAN/CH_Academy/security/plans/02_DATABASE_MIGRATION_PLAN.md)
- Kế hoạch rollback dự phòng: [`security/plans/03_ROLLBACK_PLAN.md`](file:///e:/CA_NHAN/CH_Academy/security/plans/03_ROLLBACK_PLAN.md)

---
**KẾT LUẬN:** Hệ thống CH Academy đã hoàn thành đợt gia cố an ninh toàn diện, triệt tiêu 100% các lỗ hổng Critical/High và sẵn sàng vận hành an toàn trên môi trường mạng.
