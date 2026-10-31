# CH ACADEMY — KIỂM TOÁN BIÊN DỊCH BACKEND & ĐIỀU TRA NGUYÊN NHÂN GỐC
## Document: BACKEND_COMPILATION_AUDIT.md

---

## 1. TỔNG QUAN HIỆN TRẠNG & ĐIỀU TRA LỖI

### 1.1. Hiện tượng ghi nhận
- VS Code IDE hiển thị cảnh báo **"hơn 1.000 lỗi"** trong tab Problems.
- Riêng tệp `ClassController.java` bị báo đỏ **44 lỗi**: Toàn bộ các kiểu dữ liệu, DTO (`CreateClassRequest`, `CreateEnrollmentRequest`, `EnrollmentDto`, `ClassSessionDto`), Entity (`ClassSession`), Repository (`ClassSessionRepository`, `ExamRepository`, `QuestionRepository`) và Service (`AuditService`) đều bị gạch chân đỏ với thông báo `cannot be resolved to a type` hoặc `The import ... cannot be resolved`.
- Các tệp `AcademicService.java` (21 lỗi), `TeacherAssignmentAdminController.java` (13 lỗi), `AuthControllerTest.java` cũng bị báo lỗi tương tự.

---

## 2. NGUYÊN NHÂN GỐC RỄ (ROOT CAUSE ANALYSIS)

Sau khi rà soát toàn diện giữa CLI Compiler (Maven / javac) và Language Server (VS Code / Eclipse JDT LS):

### 2.1. Mã nguồn Java & Cấu trúc Package thực tế hoàn toàn chuẩn xác (100% Valid)
- Tất cả các class mà VS Code báo thiếu **đều thực sự tồn tại** đầy đủ trên đĩa với package khai báo chính xác:
  - `vn.chacademy.academic.dto.ClassSessionDto` -> Tồn tại tại `backend/src/main/java/vn/chacademy/academic/dto/ClassSessionDto.java`.
  - `vn.chacademy.academic.dto.CreateClassRequest` -> Tồn tại tại `backend/src/main/java/vn/chacademy/academic/dto/CreateClassRequest.java`.
  - `vn.chacademy.academic.dto.CreateEnrollmentRequest` -> Tồn tại tại `backend/src/main/java/vn/chacademy/academic/dto/CreateEnrollmentRequest.java`.
  - `vn.chacademy.academic.dto.EnrollmentDto` -> Tồn tại tại `backend/src/main/java/vn/chacademy/academic/dto/EnrollmentDto.java`.
  - `vn.chacademy.academic.entity.ClassSession` -> Tồn tại tại `backend/src/main/java/vn/chacademy/academic/entity/ClassSession.java`.
  - `vn.chacademy.academic.repository.ClassSessionRepository` -> Tồn tại tại `backend/src/main/java/vn/chacademy/academic/repository/ClassSessionRepository.java`.
  - `vn.chacademy.assessment.repository.ExamRepository` -> Tồn tại tại `backend/src/main/java/vn/chacademy/assessment/repository/ExamRepository.java`.
  - `vn.chacademy.assessment.repository.QuestionRepository` -> Tồn tại tại `backend/src/main/java/vn/chacademy/assessment/repository/QuestionRepository.java`.
  - `vn.chacademy.common.audit.service.AuditService` -> Tồn tại tại `backend/src/main/java/vn/chacademy/common/audit/service/AuditService.java`.
  - `vn.chacademy.common.exception.BadRequestException` -> Tồn tại tại `backend/src/main/java/vn/chacademy/common/exception/BadRequestException.java`.
  - `vn.chacademy.common.exception.ResourceNotFoundException` -> Tồn tại tại `backend/src/main/java/vn/chacademy/common/exception/ResourceNotFoundException.java`.

### 2.2. Điểm nghẽn thực sự: Sự phân tách giữa CLI Maven và Eclipse JDT Language Server
1. **Dự án chạy JDK 25.0.1** (`C:\Program Files\Java\jdk-25`):
   - Maven compiler (`javac 25`) biên dịch trực tiếp và thành công 100% (`BUILD SUCCESS`).
2. **Cấu hình VS Code Workspace Multi-Module**:
   - Thư mục gốc mở trong VS Code là `E:\CA_NHAN\CH_Academy` (chứa `pom.xml` đóng vai trò Aggregator POM quản lý module `backend`).
   - Extension Java của VS Code (Red Hat Java / Eclipse JDT) khi mở thư mục gốc không tự động ánh xạ trực tiếp `backend/src/main/java` làm Source Folder mà rơi vào chế độ **Standalone / Unmanaged Project Mode**.
   - Khi ở chế độ này, Eclipse JDT không nạp classpath từ Maven, dẫn đến việc mọi `import vn.chacademy.*` trong `ClassController.java` (44 vị trí) và toàn bộ các class Java khác (hơn 60 files) đều bị gán lỗi `Java(16777218)` / `Java(268435846)`.
   - Tổng số lỗi tích lũy hiển thị trên tab Problems vượt ngưỡng 1.000 lỗi, gây hoang mang nhưng thực chất là lỗi nhận diện của IDE.

---

## 3. GIẢI PHÁP ĐÃ TRIỂN KHAI

1. **Xuất toàn bộ 128 thư viện phụ thuộc**:
   - Chạy lệnh `mvn dependency:copy-dependencies -pl backend -DoutputDirectory=target/dependency`.
   - Toàn bộ Spring Boot, Spring Security, JPA, Hibernate và Lombok 1.18.38 được đưa vào `backend/target/dependency/`.
2. **Cập nhật cấu hình chuẩn cho VS Code ([`.vscode/settings.json`](file:///E:/CA_NHAN/CH_Academy/.vscode/settings.json))**:
   - Khai báo rõ ràng `java.project.sourcePaths`: `["backend/src/main/java", "backend/src/test/java"]`.
   - Khai báo `java.project.outputPath`: `"backend/target/classes"`.
   - Khai báo `java.project.referencedLibraries`: `["backend/target/dependency/*.jar"]`.
   - Kích hoạt `java.jdt.ls.lombokSupport.enabled`: `true`.
   - Loại trừ thư mục `backend/target` và `node_modules` khỏi file watcher để tránh quá tải index.

---

## 4. KẾT QUẢ BIÊN DỊCH VÀ KIỂM THỬ THỰC TẾ

| Lệnh kiểm tra | Kết quả | Chi tiết | Đánh giá |
| :--- | :--- | :--- | :---: |
| `.\mvnw.cmd compile` | **BUILD SUCCESS** | 2/2 modules (Backend & Root) biên dịch thành công 100% | **FIXED** |
| `.\mvnw.cmd test -pl backend` | **BUILD SUCCESS** | 45/45 tests PASS, 0 failures, 0 errors | **FIXED** |
| `npm --prefix frontend run build` | **BUILD SUCCESS** | 1829 modules transformed, 0 lỗi TypeScript | **FIXED** |
