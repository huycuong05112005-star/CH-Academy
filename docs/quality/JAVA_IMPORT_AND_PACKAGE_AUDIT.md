# CH ACADEMY — KIỂM TOÁN CẤU TRÚC PACKAGE VÀ IMPORT TOÀN DỰ ÁN
## Document: JAVA_IMPORT_AND_PACKAGE_AUDIT.md

---

## 1. BẢNG ĐỐI CHIẾU 9 CLASS ĐƯỢC YÊU CẦU KIỂM TRA ĐẶC BIỆT

| Class Name | Package thực tế | File path trên đĩa | Kiểm tra Import trong ClassController | Trạng thái |
| :--- | :--- | :--- | :--- | :---: |
| `CreateClassRequest` | `vn.chacademy.academic.dto` | `backend/src/main/java/vn/chacademy/academic/dto/CreateClassRequest.java` | `import vn.chacademy.academic.dto.CreateClassRequest;` | **CHÍNH XÁC (FIXED)** |
| `CreateEnrollmentRequest` | `vn.chacademy.academic.dto` | `backend/src/main/java/vn/chacademy/academic/dto/CreateEnrollmentRequest.java` | `import vn.chacademy.academic.dto.CreateEnrollmentRequest;` | **CHÍNH XÁC (FIXED)** |
| `EnrollmentDto` | `vn.chacademy.academic.dto` | `backend/src/main/java/vn/chacademy/academic/dto/EnrollmentDto.java` | `import vn.chacademy.academic.dto.EnrollmentDto;` | **CHÍNH XÁC (FIXED)** |
| `ClassSessionDto` | `vn.chacademy.academic.dto` | `backend/src/main/java/vn/chacademy/academic/dto/ClassSessionDto.java` | `import vn.chacademy.academic.dto.ClassSessionDto;` | **CHÍNH XÁC (FIXED)** |
| `ClassSession` | `vn.chacademy.academic.entity` | `backend/src/main/java/vn/chacademy/academic/entity/ClassSession.java` | `import vn.chacademy.academic.entity.ClassSession;` | **CHÍNH XÁC (FIXED)** |
| `ClassSessionRepository` | `vn.chacademy.academic.repository` | `backend/src/main/java/vn/chacademy/academic/repository/ClassSessionRepository.java` | `import vn.chacademy.academic.repository.ClassSessionRepository;` | **CHÍNH XÁC (FIXED)** |
| `ExamRepository` | `vn.chacademy.assessment.repository` | `backend/src/main/java/vn/chacademy/assessment/repository/ExamRepository.java` | `import vn.chacademy.assessment.repository.ExamRepository;` | **CHÍNH XÁC (FIXED)** |
| `QuestionRepository` | `vn.chacademy.assessment.repository` | `backend/src/main/java/vn/chacademy/assessment/repository/QuestionRepository.java` | `import vn.chacademy.assessment.repository.QuestionRepository;` | **CHÍNH XÁC (FIXED)** |
| `AuditService` | `vn.chacademy.common.audit.service` | `backend/src/main/java/vn/chacademy/common/audit/service/AuditService.java` | Khai báo FQCN: `vn.chacademy.common.audit.service.AuditService auditService;` | **CHÍNH XÁC (FIXED)** |

---

## 2. RÀ SOÁT CÁC PACKAGE TRỌNG YẾU

### 2.1. Package `vn.chacademy.academic.*`
- **Controller**: `ClassController`, `ClassScheduleController`, `TeacherAssignmentAdminController`, `AcademicYearController`, `AdminEnrollmentRequestController`, `StudentEnrollmentController`, `TeacherPortalController`.
- **Entity**: `ClassEntity`, `ClassSchedule`, `ClassSession`, `Enrollment`, `Teacher`, `TeacherAssignment`, `AcademicYear`, `EnrollmentRequest`.
- **Repository**: `ClassRepository`, `ClassScheduleRepository`, `ClassSessionRepository`, `EnrollmentRepository`, `TeacherRepository`, `TeacherAssignmentRepository`, `AcademicYearRepository`, `EnrollmentRequestRepository`.
- **DTO**: Tất cả các Request và Response DTO đều tuân thủ nguyên tắc đóng gói (encapsulation), sử dụng `@Getter`, `@Setter`, `@Builder`, `@NoArgsConstructor`, `@AllArgsConstructor` chuẩn Lombok.

### 2.2. Package `vn.chacademy.common.exception.*`
- `AppException.java`: Base exception class thừa kế từ `RuntimeException`, lưu trữ `HttpStatus` và mã lỗi nghiệp vụ `errorCode`.
- `BadRequestException.java`: Khởi tạo mã lỗi HTTP 400.
- `ResourceNotFoundException.java`: Khởi tạo mã lỗi HTTP 404 khi không tìm thấy tài nguyên.
- `GlobalExceptionHandler.java`: Bắt tập trung toàn bộ ngoại lệ và trả về cấu trúc `ApiResponse<T>` thống nhất.

### 2.3. Package `vn.chacademy.common.audit.service.*`
- `AuditService.java`: Cung cấp hàm `recordAction(username, userRole, action, entityType, entityId, description, ipAddress)` ghi nhận hành vi quản trị vào cơ sở dữ liệu `audit_logs` để thanh tra.
