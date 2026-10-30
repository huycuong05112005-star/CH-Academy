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
import vn.chacademy.academic.dto.ClassDto;
import vn.chacademy.academic.dto.CreateClassRequest;
import vn.chacademy.academic.dto.CreateEnrollmentRequest;
import vn.chacademy.academic.dto.EnrollmentDto;
import vn.chacademy.academic.service.AcademicService;
import vn.chacademy.academic.dto.ClassSessionDto;
import vn.chacademy.academic.entity.ClassSession;
import vn.chacademy.academic.repository.ClassSessionRepository;
import vn.chacademy.assessment.repository.ExamRepository;
import vn.chacademy.assessment.repository.QuestionRepository;
import vn.chacademy.common.dto.ApiResponse;

import java.util.List;

@RestController
@RequestMapping("/api/v1/classes")
@RequiredArgsConstructor
public class ClassController {

    private final AcademicService academicService;
    private final vn.chacademy.common.audit.service.AuditService auditService;
    private final ClassSessionRepository classSessionRepository;
    private final QuestionRepository questionRepository;
    private final ExamRepository examRepository;

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
    public ResponseEntity<ApiResponse<ClassDto>> createClass(
            @org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails,
            jakarta.servlet.http.HttpServletRequest httpRequest,
            @Valid @RequestBody CreateClassRequest request) {
        ClassDto created = academicService.createClass(request);
        String username = userDetails != null ? userDetails.getUsername() : "ACADEMIC";
        String ip = httpRequest != null ? httpRequest.getRemoteAddr() : "127.0.0.1";
        auditService.recordAction(username, "ACADEMIC_STAFF", "CLASS_CREATE", "CLASS", created.getId().toString(),
                "Tạo lớp học: " + created.getName() + " (" + created.getCode() + ")", ip);
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
    public ResponseEntity<ApiResponse<EnrollmentDto>> enrollStudent(
            @org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails,
            jakarta.servlet.http.HttpServletRequest httpRequest,
            @Valid @RequestBody CreateEnrollmentRequest request) {
        EnrollmentDto enrolled = academicService.enrollStudent(request);
        String username = userDetails != null ? userDetails.getUsername() : "STAFF";
        String ip = httpRequest != null ? httpRequest.getRemoteAddr() : "127.0.0.1";
        auditService.recordAction(username, "ADMISSIONS_STAFF", "ENROLLMENT_CREATE", "ENROLLMENT", enrolled.getId().toString(),
                "Ghi danh học viên vào lớp " + enrolled.getClassCode(), ip);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Ghi danh học viên vào lớp thành công", enrolled));
    }

    @GetMapping("/{id}/sessions")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF', 'TEACHER', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<List<ClassSessionDto>>> getClassSessions(@PathVariable Long id) {
        List<ClassSession> sessions = classSessionRepository.findByClassEntityIdOrderBySessionDateAscStartTimeAsc(id);
        List<ClassSessionDto> dtos = new java.util.ArrayList<>();
        int sNum = 1;
        for (ClassSession s : sessions) {
            ClassSessionDto dto = ClassSessionDto.fromEntity(s);
            dto.setSessionNumber(sNum++);
            int qCount = (int) questionRepository.searchQuestions(null, null, s.getId(), null, null, null, null, null, org.springframework.data.domain.PageRequest.of(0, 1)).getTotalElements();
            int eCount = (int) examRepository.searchExams(null, null, s.getId(), null, null, null, org.springframework.data.domain.PageRequest.of(0, 1)).getTotalElements();
            dto.setQuestionCount(qCount);
            dto.setExamCount(eCount);
            dtos.add(dto);
        }
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }
}
