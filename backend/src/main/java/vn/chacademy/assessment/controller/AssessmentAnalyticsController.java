package vn.chacademy.assessment.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import vn.chacademy.assessment.dto.ClassAssessmentAnalyticsDto;
import vn.chacademy.assessment.dto.ExamAnalyticsDto;
import vn.chacademy.assessment.dto.SessionQualityDto;
import vn.chacademy.assessment.dto.StudentAnalyticsDto;
import vn.chacademy.assessment.dto.StudentClassDetailDto;
import vn.chacademy.assessment.service.AssessmentAnalyticsService;
import vn.chacademy.common.dto.ApiResponse;

import java.time.LocalDate;
import vn.chacademy.identity.entity.User;
import vn.chacademy.identity.repository.UserRepository;
import vn.chacademy.student.entity.Student;
import vn.chacademy.student.repository.StudentRepository;

@RestController
@RequestMapping("/api/v1/assessment/analytics")
@RequiredArgsConstructor
public class AssessmentAnalyticsController {

    private final AssessmentAnalyticsService analyticsService;
    private final UserRepository userRepository;
    private final StudentRepository studentRepository;

    private User getAuthenticatedUser(UserDetails userDetails) {
        if (userDetails == null) return null;
        return userRepository.findByUsername(userDetails.getUsername()).orElse(null);
    }

    @GetMapping("/exam/{examId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF', 'TEACHER', 'ADMIN')")
    public ResponseEntity<ApiResponse<ExamAnalyticsDto>> getExamAnalytics(@PathVariable Long examId) {
        ExamAnalyticsDto dto = analyticsService.getExamAnalytics(examId);
        return ResponseEntity.ok(ApiResponse.success("Thống kê đề thi", dto));
    }

    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF', 'TEACHER', 'ADMIN')")
    public ResponseEntity<ApiResponse<StudentAnalyticsDto>> getStudentAnalytics(@PathVariable Long studentId) {
        StudentAnalyticsDto dto = analyticsService.getStudentAnalytics(studentId);
        return ResponseEntity.ok(ApiResponse.success("Phân tích học viên", dto));
    }

    @GetMapping("/my-progress")
    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN', 'SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF')")
    public ResponseEntity<ApiResponse<StudentAnalyticsDto>> getMyProgress(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        if (user == null) {
            throw new IllegalStateException("Chưa xác thực người dùng");
        }
        Student currentStudent = studentRepository.findByUserId(user.getId()).orElse(null);
        if (currentStudent == null) {
            return ResponseEntity.ok(ApiResponse.success(
                    StudentAnalyticsDto.builder()
                            .totalExamsTaken(0)
                            .passedCount(0)
                            .averageScore(java.math.BigDecimal.ZERO)
                            .passRate(java.math.BigDecimal.ZERO)
                            .build()
            ));
        }
        StudentAnalyticsDto dto = analyticsService.getStudentAnalytics(currentStudent.getId());
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    @GetMapping("/class/{classId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF', 'TEACHER', 'ADMIN')")
    public ResponseEntity<ApiResponse<ClassAssessmentAnalyticsDto>> getClassAnalytics(
            @PathVariable Long classId,
            @RequestParam(required = false) Long examId,
            @RequestParam(required = false) Long sessionId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String status) {
        ClassAssessmentAnalyticsDto dto = analyticsService.getClassAssessmentAnalytics(classId, examId, sessionId, startDate, endDate, status);
        return ResponseEntity.ok(ApiResponse.success("Thống kê kết quả theo lớp", dto));
    }

    @GetMapping("/student/{studentId}/class/{classId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF', 'TEACHER', 'ADMIN')")
    public ResponseEntity<ApiResponse<StudentClassDetailDto>> getStudentClassDetail(
            @PathVariable Long studentId,
            @PathVariable Long classId) {
        StudentClassDetailDto dto = analyticsService.getStudentClassDetail(studentId, classId);
        return ResponseEntity.ok(ApiResponse.success("Chi tiết kết quả học viên", dto));
    }

    @GetMapping("/session/{sessionId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF', 'TEACHER', 'ADMIN')")
    public ResponseEntity<ApiResponse<SessionQualityDto>> getSessionQuality(
            @PathVariable Long sessionId) {
        SessionQualityDto dto = analyticsService.getSessionQuality(sessionId);
        return ResponseEntity.ok(ApiResponse.success("Phân tích chất lượng buổi học", dto));
    }
}
