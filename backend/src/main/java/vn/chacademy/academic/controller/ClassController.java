package vn.chacademy.academic.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.chacademy.academic.dto.*;
import vn.chacademy.academic.service.AcademicService;
import vn.chacademy.common.dto.ApiResponse;

import java.util.List;

@RestController
@RequestMapping("/api/v1/classes")
@RequiredArgsConstructor
public class ClassController {

    private final AcademicService academicService;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF', 'TEACHER', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<Page<ClassDto>>> searchClasses(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long courseId,
            @RequestParam(required = false) Long teacherId,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        Page<ClassDto> page = academicService.searchClasses(keyword, status, courseId, teacherId, pageable);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF', 'TEACHER', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<ClassDto>> getClassById(@PathVariable Long id) {
        ClassDto classDto = academicService.getClassById(id);
        return ResponseEntity.ok(ApiResponse.success(classDto));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF')")
    public ResponseEntity<ApiResponse<ClassDto>> createClass(@Valid @RequestBody CreateClassRequest request) {
        ClassDto created = academicService.createClass(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo lớp học và xếp lịch thành công", created));
    }

    @GetMapping("/{id}/enrollments")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF', 'TEACHER', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<List<EnrollmentDto>>> getEnrollments(@PathVariable Long id) {
        List<EnrollmentDto> list = academicService.getEnrollmentsByClassId(id);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @PostMapping("/enrollments")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF', 'ADMISSIONS_STAFF')")
    public ResponseEntity<ApiResponse<EnrollmentDto>> enrollStudent(@Valid @RequestBody CreateEnrollmentRequest request) {
        EnrollmentDto enrolled = academicService.enrollStudent(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Ghi danh học viên vào lớp thành công", enrolled));
    }
}
