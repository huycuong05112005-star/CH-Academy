package vn.chacademy.student.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.chacademy.common.dto.ApiResponse;
import vn.chacademy.student.dto.CreateStudentRequest;
import vn.chacademy.student.dto.StudentDto;
import vn.chacademy.student.dto.StudentStatsDto;
import vn.chacademy.student.dto.UpdateStudentRequest;
import vn.chacademy.student.service.StudentService;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/students")
@RequiredArgsConstructor
public class StudentController {

    private final StudentService studentService;
    private final vn.chacademy.common.audit.service.AuditService auditService;

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF', 'ADMISSIONS_STAFF', 'ACCOUNTANT', 'TEACHER')")
    public ResponseEntity<ApiResponse<StudentStatsDto>> getStudentStats() {
        return ResponseEntity.ok(ApiResponse.success(studentService.getStudentStats()));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF', 'ADMISSIONS_STAFF', 'ACCOUNTANT', 'TEACHER')")
    public ResponseEntity<ApiResponse<Page<StudentDto>>> searchStudents(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String targetType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        Sort sort = direction.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<StudentDto> result = studentService.searchStudents(keyword, status, targetType, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF', 'ADMISSIONS_STAFF', 'ACCOUNTANT', 'TEACHER')")
    public ResponseEntity<ApiResponse<StudentDto>> getStudentById(@PathVariable Long id) {
        StudentDto student = studentService.getStudentById(id);
        return ResponseEntity.ok(ApiResponse.success(student));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF', 'ADMISSIONS_STAFF')")
    public ResponseEntity<ApiResponse<StudentDto>> createStudent(
            @org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails,
            jakarta.servlet.http.HttpServletRequest httpRequest,
            @Valid @RequestBody CreateStudentRequest request) {
        StudentDto created = studentService.createStudent(request);
        String username = userDetails != null ? userDetails.getUsername() : "STAFF";
        String ip = httpRequest != null ? httpRequest.getRemoteAddr() : "127.0.0.1";
        auditService.recordAction(username, "ADMISSIONS_STAFF", "STUDENT_CREATE", "STUDENT", created.getId().toString(),
                "Tạo mới hồ sơ học viên: " + created.getFullName() + " (" + created.getStudentCode() + ")", ip);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo hồ sơ học viên thành công", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF', 'ADMISSIONS_STAFF')")
    public ResponseEntity<ApiResponse<StudentDto>> updateStudent(
            @PathVariable Long id,
            @org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails,
            jakarta.servlet.http.HttpServletRequest httpRequest,
            @Valid @RequestBody UpdateStudentRequest request) {
        StudentDto updated = studentService.updateStudent(id, request);
        String username = userDetails != null ? userDetails.getUsername() : "STAFF";
        String ip = httpRequest != null ? httpRequest.getRemoteAddr() : "127.0.0.1";
        auditService.recordAction(username, "ADMISSIONS_STAFF", "STUDENT_UPDATE", "STUDENT", id.toString(),
                "Cập nhật hồ sơ học viên: " + updated.getFullName(), ip);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật hồ sơ học viên thành công", updated));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF')")
    public ResponseEntity<ApiResponse<StudentDto>> updateStudentStatus(
            @PathVariable Long id,
            @org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails,
            jakarta.servlet.http.HttpServletRequest httpRequest,
            @RequestBody Map<String, String> body) {
        String status = body.get("status");
        StudentDto updated = studentService.updateStudentStatus(id, status);
        String username = userDetails != null ? userDetails.getUsername() : "STAFF";
        String ip = httpRequest != null ? httpRequest.getRemoteAddr() : "127.0.0.1";
        auditService.recordAction(username, "ACADEMIC_STAFF", "STUDENT_UPDATE", "STUDENT", id.toString(),
                "Đổi trạng thái học viên ID " + id + " thành " + status, ip);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái học viên thành công", updated));
    }

    @PostMapping("/{id}/provision-account")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF', 'ADMISSIONS_STAFF')")
    public ResponseEntity<ApiResponse<vn.chacademy.student.dto.AccountProvisionResponse>> provisionAccount(
            @PathVariable Long id,
            @org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails,
            jakarta.servlet.http.HttpServletRequest httpRequest,
            @RequestBody(required = false) Map<String, String> body) {
        String customPassword = body != null ? body.get("password") : null;
        vn.chacademy.student.dto.AccountProvisionResponse res = studentService.provisionAccount(id, customPassword);
        String username = userDetails != null ? userDetails.getUsername() : "STAFF";
        String ip = httpRequest != null ? httpRequest.getRemoteAddr() : "127.0.0.1";
        auditService.recordAction(username, "ADMISSIONS_STAFF", "ACCOUNT_PROVISION", "STUDENT", id.toString(),
                "Cấp tài khoản đăng nhập cho học viên ID " + id + " (username: " + res.getUsername() + ")", ip);
        return ResponseEntity.ok(ApiResponse.success(res.getMessage(), res));
    }

    @PostMapping("/{id}/enroll-and-pay")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF', 'ADMISSIONS_STAFF', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<StudentDto>> enrollAndPay(
            @PathVariable Long id,
            @Valid @RequestBody vn.chacademy.student.dto.EnrollAndPayRequest request,
            @org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails,
            jakarta.servlet.http.HttpServletRequest httpRequest) {
        Long staffId = null;
        if (userDetails != null) {
            staffId = studentService.getStaffIdByUsername(userDetails.getUsername());
        }
        StudentDto res = studentService.enrollAndPay(id, request, staffId);
        String username = userDetails != null ? userDetails.getUsername() : "STAFF";
        String ip = httpRequest != null ? httpRequest.getRemoteAddr() : "127.0.0.1";
        auditService.recordAction(username, "ACCOUNTANT", "ENROLL_AND_PAY", "STUDENT", id.toString(),
                "Ghi danh lớp ID " + request.getClassId() + " và ghi nhận tài chính học viên ID " + id, ip);
        return ResponseEntity.ok(ApiResponse.success("Ghi danh, sinh học phí & cập nhật tài khoản thành công", res));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteStudent(
            @PathVariable Long id,
            @org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails,
            jakarta.servlet.http.HttpServletRequest httpRequest) {
        studentService.deleteStudent(id);
        String username = userDetails != null ? userDetails.getUsername() : "ADMIN";
        String ip = httpRequest != null ? httpRequest.getRemoteAddr() : "127.0.0.1";
        auditService.recordAction(username, "SUPER_ADMIN", "STUDENT_DELETE", "STUDENT", id.toString(),
                "Lưu trữ hồ sơ học viên ID " + id, ip);
        return ResponseEntity.ok(ApiResponse.success("Lưu trữ hồ sơ học viên thành công", null));
    }
}
