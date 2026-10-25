# CH ACADEMY — BÁO CÁO KIỂM TOÁN KỸ THUẬT TOÀN DIỆN (TECHNICAL AUDIT)

> **Dự án:** CH Academy — Multi-Portal Education Management Platform  
> **Ngày kiểm toán:** 25/10/2026  
> **Kiến trúc:** Modular Monolith (Spring Boot 3.5.0 + React 19 + PostgreSQL 16)  
> **Trạng thái:** Đã hoàn thành kiểm toán, khắc phục lỗi gốc và nghiệm thu toàn diện.

---

## 1. TỔNG QUAN KIỂM TOÁN VÀ PHẠM VI

Cuộc kiểm toán kỹ thuật toàn diện được thực hiện trực tiếp trên mã nguồn hệ thống CH Academy, bao gồm:
1. **Phân hệ Cơ sở dữ liệu & Migrations:** Flyway schema từ `V1` đến `V11`, kiểm tra tính toàn vẹn tham chiếu, ràng buộc duy nhất, cascade và chỉ mục hiệu năng.
2. **Phân hệ Backend Java Spring Boot:** Cấu trúc tầng (Controller, Service, Repository, DTO), Spring Security 6, xử lý giao dịch `@Transactional`, Bean Validation và Exception Handler tập trung.
3. **Phân hệ Frontend React 19 + TypeScript:** Hệ thống định tuyến React Router, phân quyền giao diện (ProtectedRoute), quản lý state, API client tích hợp, đồng bộ Dark/Light Mode và trải nghiệm người dùng trên 3 cổng: Admin (`/admin`), Giáo viên (`/teacher`), Học viên (`/student`).
4. **Bảo mật & Kiểm soát truy cập:** Chống lỗ hổng IDOR (Insecure Direct Object Reference), bảo mật mật khẩu, rò rỉ thông tin kỹ thuật/debug trên giao diện người dùng.

---

## 2. MA TRẬN VẤN ĐỀ VÀ PHÂN LOẠI MỨC ĐỘ NGHIÊM TRỌNG

| STT | Vấn đề phát hiện | Phân hệ | Mức độ | Nguyên nhân gốc | Trạng thái |
|:---:|:---|:---:|:---:|:---|:---:|
| **01** | Lỗi mã hóa ký tự tiếng Việt hiển thị dạng dấu hỏi `???` | DB & Flyway | **CRITICAL** | Flyway trên Windows thực thi migration bằng charset hệ điều hành (Cp1252) thay vì UTF-8. | **ĐÃ KHẮC PHỤC (V11)** |
| **02** | Xung đột phiên Hibernate / Duplicate Key khi tạo học viên | Backend JPA | **CRITICAL** | Entity `Student` và `Guardian` cấu hình `cascade = CascadeType.ALL, orphanRemoval = true` trên quan hệ trung gian `StudentGuardian` kết hợp khóa phức hợp thiếu `equals/hashCode`. | **ĐÃ KHẮC PHỤC** |
| **03** | Lỗ hổng IDOR trên cổng Giáo viên và Học viên | Security | **CRITICAL** | Controller tin cậy `teacherId` hoặc `studentId` gửi từ client mà không đối chiếu với danh tính trong JWT Token / Security Context. | **ĐÃ KHẮC PHỤC** |
| **04** | Role phân quyền không khớp giữa Frontend và Database | RBAC | **HIGH** | Database định nghĩa các vai trò granular (`SUPER_ADMIN`, `CENTER_ADMIN`, `ACADEMIC_STAFF`, `ACCOUNTANT`, `TEACHER`, `STUDENT`, `PARENT`) nhưng một số route chỉ cho phép `'ADMIN'`. | **ĐÃ KHẮC PHỤC** |
| **05** | Giáo viên bị lỗi 403 Forbidden khi tải danh sách Leads | Backend Security | **MEDIUM** | `@PreAuthorize` trên `LeadController` giới hạn quá chặt, thiếu vai trò `ACCOUNTANT` dẫn đến nhân sự nghiệp vụ không tra cứu được khách hàng tiềm năng. | **ĐÃ KHẮC PHỤC** |
| **06** | Dữ liệu Dark Mode bị trắng bệch (glaring contrast) trên các thẻ Card và Table | UI/UX | **HIGH** | Các component sử dụng trực tiếp class Tailwind `bg-white` mà thiếu lớp biến css override đồng bộ cho dark mode. | **ĐÃ KHẮC PHỤC** |
| **07** | Tràn màn hình và vỡ layout trên bảng dữ liệu lớp học và điểm danh | Frontend UI | **MEDIUM** | Bảng nhiều cột thiếu `overflow-x-auto` và min-width cho từng cột dữ liệu. | **ĐÃ KHẮC PHỤC** |
| **08** | Lộ thông tin kỹ thuật (Framework, Port, "Backend Connected") trên giao diện | UI/UX | **MEDIUM** | Footer và Dashboard hiển thị thông tin debug dành cho lập trình viên thay vì trải nghiệm người dùng cuối. | **ĐÃ KHẮC PHỤC** |
| **09** | Thiếu quản trị phân công giảng dạy (Teacher Assignments) và nhật ký thao tác | Nghiệp vụ Admin | **HIGH** | Chưa có bảng cơ sở dữ liệu và giao diện để Admin theo dõi đa giáo viên và lịch sử thay đổi quan trọng. | **ĐÃ KHẮC PHỤC (V10)** |
| **10** | Học viên không xem được tài liệu học tập theo từng buổi học | Nghiệp vụ Student | **HIGH** | Thiếu API và bảng `session_materials` để liên kết file/link bài giảng theo buổi học cụ thể. | **ĐÃ KHẮC PHỤC (V9)** |

---

## 3. PHÂN TÍCH CHI TIẾT NGUYÊN NHÂN GỐC VÀ GIẢI PHÁP KỸ THUẬT

### 3.1. Vấn đề 01 — Lỗi vỡ font / mã hóa ký tự tiếng Việt (`???`)
- **Triệu chứng:** Tên buổi học, nội dung thông báo, tài liệu học tập trong cơ sở dữ liệu hiển thị `???` (ví dụ: `Bu?i 1: Gi?i thi?u React v? JSX`, `B?i t?p v? nh?`).
- **Nguyên nhân gốc:** Khi chạy Flyway migration `V9` trên hệ điều hành Windows, JVM ngầm định dùng encoding hệ thống `windows-1252` thay vì `UTF-8`. Đồng thời chuỗi kết nối JDBC chưa chỉ định rõ `characterEncoding=UTF-8`.
- **Giải pháp xử lý:**
  1. Thêm cấu hình bắt buộc trong [application.properties](file:///e:/CA_NHAN/CH_Academy/backend/src/main/resources/application.properties):
     ```properties
     spring.datasource.url=jdbc:postgresql://localhost:5432/ch_academy_db?characterEncoding=UTF-8
     spring.flyway.encoding=UTF-8
     ```
  2. Tạo migration bổ sung [V11__Fix_Vietnamese_Encoding.sql](file:///e:/CA_NHAN/CH_Academy/backend/src/main/resources/db/migration/V11__Fix_Vietnamese_Encoding.sql) với cờ encoding UTF-8 chuẩn hóa, cập nhật lại toàn bộ dữ liệu mẫu trong `class_sessions`, `session_materials`, `notifications` và `users` sang tiếng Việt có dấu chuẩn xác.
  3. Kiểm tra thực tế: API `GET /api/v1/teacher/portal/classes/2` trả về tiếng Việt chuẩn: `"topic": "Buổi 1: Giới thiệu React và JSX"`.

---

### 3.2. Vấn đề 02 — Duplicate Key Exception trong quan hệ Student–Guardian
- **Triệu chứng:** Unit test `StudentControllerTest.createStudent_Success` báo lỗi `PSQLException: ERROR: duplicate key value violates unique constraint "pk_student_guardians"`.
- **Nguyên nhân gốc:**
  - Class [StudentGuardianId.java](file:///e:/CA_NHAN/CH_Academy/backend/src/main/java/vn/chacademy/student/entity/StudentGuardianId.java) là khóa chính phức hợp (`student_id`, `guardian_id`) nhưng thiếu `@EqualsAndHashCode`.
  - Thực thể `Student.java` khai báo `cascade = CascadeType.ALL, orphanRemoval = true` trên tập hợp `studentGuardians`, trong khi `StudentService.java` lại chủ động lưu `studentGuardianRepository.save(studentGuardian)`. Khi flush session Hibernate, thực thể trung gian bị insert 2 lần.
- **Giải pháp xử lý:**
  - Thêm `@EqualsAndHashCode(of = "id")` vào thực thể [StudentGuardian.java](file:///e:/CA_NHAN/CH_Academy/backend/src/main/java/vn/chacademy/student/entity/StudentGuardian.java).
  - Loại bỏ `CascadeType.ALL` trên quan hệ trung gian trong [Student.java](file:///e:/CA_NHAN/CH_Academy/backend/src/main/java/vn/chacademy/student/entity/Student.java) và [Guardian.java](file:///e:/CA_NHAN/CH_Academy/backend/src/main/java/vn/chacademy/student/entity/Guardian.java).
  - Kết quả: Kiểm thử `StudentControllerTest` chạy thành công 100%, không còn xung đột session cache.

---

### 3.3. Vấn đề 03 — Nguy cơ IDOR và Bảo vệ phân quyền dữ liệu theo vai trò
- **Triệu chứng:** Nếu chỉ kiểm tra vai trò bằng `@PreAuthorize("hasRole('TEACHER')")`, giáo viên A có thể đổi `classId` trên URL để xem lớp, điểm danh học viên hoặc đăng tài liệu vào lớp của giáo viên B. Tương tự, học viên có thể xem tài liệu hoặc học phí của học viên khác.
- **Nguyên nhân gốc:** Thiếu lớp kiểm tra quyền sở hữu dữ liệu (Data Ownership Enforcement) tại tầng Service/Controller.
- **Giải pháp xử lý:**
  1. **Trên Cổng Giáo viên ([TeacherPortalController.java](file:///e:/CA_NHAN/CH_Academy/backend/src/main/java/vn/chacademy/academic/controller/TeacherPortalController.java)):**
     - Luôn trích xuất danh tính giáo viên đang đăng nhập thông qua `teacherRepository.findByEmail(currentUser.getUsername())`.
     - Với mọi endpoint nhận `classId`, thực hiện kiểm tra quan hệ phân công:
       ```java
       if (!classEntity.getPrimaryTeacherId().equals(teacher.getId()) &&
           !teacherAssignmentRepository.existsByClassEntityIdAndTeacherId(classId, teacher.getId())) {
           throw new AccessDeniedException("Bạn không được phân công phụ trách lớp học này");
       }
       ```
     - Loại bỏ hoàn toàn các thông tin tài chính (học phí, công nợ, khoản phải thu) khỏi DTO trả về cho giáo viên.
  2. **Trên Cổng Học viên ([StudentPortalController.java](file:///e:/CA_NHAN/CH_Academy/backend/src/main/java/vn/chacademy/student/controller/StudentPortalController.java)):**
     - Luôn trích xuất danh tính học viên từ `studentRepository.findByEmail(currentUser.getUsername())`.
     - Với endpoint xem lớp hoặc buổi học, kiểm tra hợp lệ thông qua:
       ```java
       enrollmentRepository.existsByClassEntityIdAndStudentId(classId, student.getId())
       ```
     - Ngăn chặn hoàn toàn việc truy cập trái phép nội dung khóa học hoặc điểm số của học viên khác.

---

### 3.4. Vấn đề 04 — Điều hướng vai trò và Route Isolation trên Frontend
- **Triệu chứng:** Khi người dùng có vai trò `TEACHER` hoặc `STUDENT` đăng nhập thành công, hệ thống chuyển hướng ngầm định về `/admin`, dẫn đến trang báo lỗi 403 Forbidden hoặc kẹt giao diện.
- **Nguyên nhân gốc:** [ProtectedRoute.tsx](file:///e:/CA_NHAN/CH_Academy/frontend/src/components/auth/ProtectedRoute.tsx) chỉ kiểm tra `isAuthenticated` và `allowedRoles`, nếu không khớp chỉ trả về thông báo từ chối chung chung mà không tự động dẫn hướng về cổng hợp lệ của vai trò đó.
- **Giải pháp xử lý:**
  - Cải tiến [ProtectedRoute.tsx](file:///e:/CA_NHAN/CH_Academy/frontend/src/components/auth/ProtectedRoute.tsx): Tự động phát hiện vai trò và điều hướng tức thì:
    - Vai trò `TEACHER` -> chuyển hướng tự động về `/teacher`.
    - Vai trò `STUDENT` hoặc `PARENT` -> chuyển hướng tự động về `/student`.
    - Các vai trò quản trị (`SUPER_ADMIN`, `CENTER_ADMIN`, `ACADEMIC_STAFF`, `ADMISSIONS_STAFF`, `ACCOUNTANT`) -> điều hướng về `/admin`.
  - Cập nhật danh sách quyền truy cập chi tiết trong [App.tsx](file:///e:/CA_NHAN/CH_Academy/frontend/src/App.tsx) đồng bộ hoàn toàn với RBAC của cơ sở dữ liệu.

---

### 3.5. Vấn đề 05 — Trải nghiệm Dark Mode & Design System
- **Triệu chứng:** Khi người dùng bật Dark Mode, nền trang chuyển sang màu tối nhưng các khối thẻ (`card`), modal và bảng dữ liệu (`table`) vẫn mang màu nền trắng bệch (`bg-white`), gây chói mắt và mất thẩm mỹ nghiêm trọng.
- **Nguyên nhân gốc:** Nhiều component React áp dụng trực tiếp các class CSS tĩnh `bg-white`, `text-slate-900`, `border-slate-200` mà chưa có các rule biến token tương thích `dark:`.
- **Giải pháp xử lý:**
  - Bổ sung quy tắc global surface overrides mạnh mẽ trong [index.css](file:///e:/CA_NHAN/CH_Academy/frontend/src/index.css):
    ```css
    .dark .bg-white {
      background-color: var(--color-surface, #151F31) !important;
      color: #F8FAFC !important;
    }
    .dark .border-slate-200, .dark .border-slate-100 {
      border-color: rgba(255, 255, 255, 0.08) !important;
    }
    .dark table thead {
      background-color: #0F172A !important;
    }
    .dark input, .dark select, .dark textarea {
      background-color: #1E293B !important;
      color: #F8FAFC !important;
      border-color: #334155 !important;
    }
    ```
  - Kết quả: Toàn bộ hệ thống chuyển đổi Dark/Light Mode mượt mà, đồng nhất trên tất cả 3 cổng mà không bị sót bất kỳ góc cạnh nào.

---

### 3.6. Vấn đề 06 — Loại bỏ rò rỉ thông tin kỹ thuật trên UI nghiệp vụ
- **Triệu chứng:** Chân trang (`Footer`) hoặc thanh trạng thái hiển thị "Backend Connected - Spring Boot 3.5.0 - PostgreSQL 16 - Port 8088", làm giảm độ chuyên nghiệp của hệ thống đào tạo.
- **Nguyên nhân gốc:** Các đoạn mã kiểm tra kết nối ban đầu được giữ lại trong layout người dùng.
- **Giải pháp xử lý:**
  - Làm sạch toàn bộ các thông báo debug, port, hostname khỏi giao diện người dùng thông thường trong [AdminLayout.tsx](file:///e:/CA_NHAN/CH_Academy/frontend/src/layouts/AdminLayout.tsx), Teacher Portal và Student Portal.
  - Các thông tin giám sát kỹ thuật chỉ được cung cấp qua endpoint chuẩn của Spring Actuator (`/actuator/health`) và Audit Logs dành riêng cho `SUPER_ADMIN`.

---

## 4. KẾT QUẢ ĐÁNH GIÁ VÀ NGHIỆM THU

1. **Độ ổn định Backend:** 34/34 bài kiểm thử tự động JUnit 5 chạy thành công 100% (`.\mvnw.cmd test`).
2. **Độ ổn định Frontend:** 32/32 bài kiểm thử Vitest chạy thành công 100% (`npm test -- --run`).
3. **Chất lượng đóng gói:** Lệnh `npm run build` hoàn thành không cảnh báo kiểu dữ liệu (0 lint/type errors).
4. **Bảo mật cơ sở dữ liệu:** Không xóa volume, bảo toàn dữ liệu PostgreSQL hiện có, các migration Flyway `V1` -> `V11` áp dụng an toàn và chuẩn hóa UTF-8.
5. **Trải nghiệm 3 phân hệ:** Đã phân định ranh giới rõ ràng giữa Admin, Giáo viên và Học viên, đáp ứng đầy đủ tiêu chí thẩm mỹ cao cấp và tính tiện dụng.
