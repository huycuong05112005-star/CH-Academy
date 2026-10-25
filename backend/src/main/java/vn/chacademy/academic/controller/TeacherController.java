package vn.chacademy.academic.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.chacademy.academic.dto.CreateTeacherRequest;
import vn.chacademy.academic.dto.TeacherDto;
import vn.chacademy.academic.service.AcademicService;
import vn.chacademy.common.dto.ApiResponse;

import java.util.List;

@RestController
@RequestMapping("/api/v1/teachers")
@RequiredArgsConstructor
public class TeacherController {

    private final AcademicService academicService;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<TeacherDto>>> getAllTeachers() {
        List<TeacherDto> list = academicService.getAllTeachers();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<TeacherDto>>> getActiveTeachers() {
        List<TeacherDto> list = academicService.getActiveTeachers();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF', 'ADMIN')")
    public ResponseEntity<ApiResponse<TeacherDto>> createTeacher(@Valid @RequestBody CreateTeacherRequest request) {
        TeacherDto created = academicService.createTeacher(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo thông tin giáo viên và tài khoản thành công", created));
    }
}
