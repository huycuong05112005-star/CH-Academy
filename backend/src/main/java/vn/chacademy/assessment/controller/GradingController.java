package vn.chacademy.assessment.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import vn.chacademy.assessment.dto.AttemptResultDto;
import vn.chacademy.assessment.dto.GradingAttemptDto;
import vn.chacademy.assessment.dto.ManualGradeRequest;
import vn.chacademy.assessment.entity.AttemptAnswer;
import vn.chacademy.assessment.entity.ExamAttempt;
import vn.chacademy.assessment.repository.AttemptAnswerRepository;
import vn.chacademy.assessment.repository.ExamAttemptRepository;
import vn.chacademy.assessment.service.ExamAttemptService;
import vn.chacademy.common.dto.ApiResponse;
import vn.chacademy.identity.entity.User;
import vn.chacademy.identity.repository.UserRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/v1/assessment/grading")
@RequiredArgsConstructor
public class GradingController {

    private final ExamAttemptRepository examAttemptRepository;
    private final AttemptAnswerRepository attemptAnswerRepository;
    private final ExamAttemptService examAttemptService;
    private final UserRepository userRepository;

    private User getAuthenticatedUser(UserDetails userDetails) {
        if (userDetails == null) return null;
        return userRepository.findByUsername(userDetails.getUsername()).orElse(null);
    }

    @GetMapping("/attempts")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF', 'TEACHER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Page<GradingAttemptDto>>> searchAttempts(
            @RequestParam(required = false) Long examId,
            @RequestParam(required = false) Long studentId,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<GradingAttemptDto> attempts = examAttemptRepository
                .searchAttempts(examId, studentId, status, PageRequest.of(page, size))
                .map(GradingAttemptDto::fromEntity);
        return ResponseEntity.ok(ApiResponse.success(attempts));
    }

    @GetMapping("/attempts/{attemptId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF', 'TEACHER', 'ADMIN')")
    public ResponseEntity<ApiResponse<AttemptResultDto>> getAttemptDetail(
            @PathVariable Long attemptId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        AttemptResultDto result = examAttemptService.getAttemptResult(attemptId, user, true);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping("/attempts/{attemptId}/manual")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF', 'TEACHER', 'ADMIN')")
    @Transactional
    public ResponseEntity<ApiResponse<AttemptResultDto>> gradeManual(
            @PathVariable Long attemptId,
            @RequestBody ManualGradeRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        User teacher = getAuthenticatedUser(userDetails);
        AttemptResultDto result = examAttemptService.gradeManualAttempt(attemptId, req, teacher);
        return ResponseEntity.ok(ApiResponse.success("Đã hoàn tất chấm điểm tự luận", result));
    }
}
