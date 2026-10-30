package vn.chacademy.course.controller;

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
import vn.chacademy.course.dto.CourseDto;
import vn.chacademy.course.dto.CreateCourseRequest;
import vn.chacademy.course.dto.UpdateCourseRequest;
import vn.chacademy.course.service.CourseService;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;
    private final vn.chacademy.common.audit.service.AuditService auditService;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF', 'ADMISSIONS_STAFF', 'TEACHER')")
    public ResponseEntity<ApiResponse<Page<CourseDto>>> searchCourses(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String targetAudience,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        Sort sort = direction.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<CourseDto> result = courseService.searchCourses(keyword, categoryId, targetAudience, status, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF', 'ADMISSIONS_STAFF', 'TEACHER')")
    public ResponseEntity<ApiResponse<CourseDto>> getCourseById(@PathVariable Long id) {
        CourseDto course = courseService.getCourseById(id);
        return ResponseEntity.ok(ApiResponse.success(course));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF')")
    public ResponseEntity<ApiResponse<CourseDto>> createCourse(
            @org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails,
            jakarta.servlet.http.HttpServletRequest httpRequest,
            @Valid @RequestBody CreateCourseRequest request) {
        CourseDto created = courseService.createCourse(request);
        String username = userDetails != null ? userDetails.getUsername() : "ADMIN";
        String ip = httpRequest != null ? httpRequest.getRemoteAddr() : "127.0.0.1";
        auditService.recordAction(username, "ACADEMIC_STAFF", "COURSE_CREATE", "COURSE", created.getId().toString(),
                "Tạo mới khóa học: " + created.getName() + " (" + created.getCode() + ")", ip);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo khóa học thành công", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF')")
    public ResponseEntity<ApiResponse<CourseDto>> updateCourse(
            @PathVariable Long id,
            @org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails,
            jakarta.servlet.http.HttpServletRequest httpRequest,
            @Valid @RequestBody UpdateCourseRequest request) {
        CourseDto updated = courseService.updateCourse(id, request);
        String username = userDetails != null ? userDetails.getUsername() : "ADMIN";
        String ip = httpRequest != null ? httpRequest.getRemoteAddr() : "127.0.0.1";
        auditService.recordAction(username, "ACADEMIC_STAFF", "COURSE_UPDATE", "COURSE", id.toString(),
                "Cập nhật khóa học: " + updated.getName() + " (" + updated.getCode() + ")", ip);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật khóa học thành công", updated));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF')")
    public ResponseEntity<ApiResponse<CourseDto>> updateCourseStatus(
            @PathVariable Long id,
            @org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails,
            jakarta.servlet.http.HttpServletRequest httpRequest,
            @RequestBody Map<String, String> body) {
        String status = body.get("status");
        CourseDto updated = courseService.updateCourseStatus(id, status);
        String username = userDetails != null ? userDetails.getUsername() : "ADMIN";
        String ip = httpRequest != null ? httpRequest.getRemoteAddr() : "127.0.0.1";
        auditService.recordAction(username, "ACADEMIC_STAFF", "COURSE_UPDATE", "COURSE", id.toString(),
                "Chuyển trạng thái khóa học ID " + id + " sang " + status, ip);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái khóa học thành công", updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteCourse(
            @PathVariable Long id,
            @org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails,
            jakarta.servlet.http.HttpServletRequest httpRequest) {
        courseService.deleteCourse(id);
        String username = userDetails != null ? userDetails.getUsername() : "ADMIN";
        String ip = httpRequest != null ? httpRequest.getRemoteAddr() : "127.0.0.1";
        auditService.recordAction(username, "SUPER_ADMIN", "COURSE_DELETE", "COURSE", id.toString(),
                "Lưu trữ khóa học ID " + id, ip);
        return ResponseEntity.ok(ApiResponse.success("Lưu trữ khóa học thành công", null));
    }
}
