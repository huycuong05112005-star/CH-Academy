package vn.chacademy.assessment.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
    public ResponseEntity<ApiResponse<AttemptResultDto>> gradeManual(
            @PathVariable Long attemptId,
            @RequestBody ManualGradeRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        User teacher = getAuthenticatedUser(userDetails);
        ExamAttempt attempt = examAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy lượt thi với ID: " + attemptId));

        if (req.getItems() != null) {
            for (var item : req.getItems()) {
                attemptAnswerRepository.findByAttemptIdAndQuestionId(attemptId, item.getQuestionId())
                        .ifPresent(ans -> {
                            if (item.getScore() != null) {
                                ans.setScore(item.getScore());
                                ans.setIsCorrect(item.getScore().compareTo(ans.getMaxScore()) >= 0);
                            }
                            if (item.getTeacherFeedback() != null) {
                                ans.setTeacherFeedback(item.getTeacherFeedback());
                            }
                            if (item.getRubricBreakdown() != null) {
                                ans.setRubricBreakdown(item.getRubricBreakdown());
                            }
                            ans.setAutoGraded(false);
                            ans.setUpdatedAt(Instant.now());
                            attemptAnswerRepository.save(ans);
                        });
            }
        }

        // Tính lại tổng điểm sau khi chấm tự luận
        List<AttemptAnswer> allAnswers = attemptAnswerRepository.findByAttemptId(attemptId);
        BigDecimal totalScore = BigDecimal.ZERO;
        BigDecimal maxScore = BigDecimal.ZERO;
        for (AttemptAnswer a : allAnswers) {
            if (a.getScore() != null) totalScore = totalScore.add(a.getScore());
            if (a.getMaxScore() != null) maxScore = maxScore.add(a.getMaxScore());
        }

        attempt.setTotalScore(totalScore.setScale(2, RoundingMode.HALF_UP));
        attempt.setMaxScore(maxScore.setScale(2, RoundingMode.HALF_UP));

        BigDecimal percentage = BigDecimal.ZERO;
        if (maxScore.compareTo(BigDecimal.ZERO) > 0) {
            percentage = totalScore.divide(maxScore, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100)).setScale(2, RoundingMode.HALF_UP);
        }
        attempt.setPercentage(percentage);

        BigDecimal passPercent = attempt.getExam().getPassPercentage() != null ?
                attempt.getExam().getPassPercentage() : BigDecimal.valueOf(50.00);
        attempt.setIsPassed(percentage.compareTo(passPercent) >= 0);

        attempt.setStatus("GRADED");
        attempt.setGradedAt(Instant.now());
        attempt.setGradedBy(teacher);
        attempt.setUpdatedAt(Instant.now());
        examAttemptRepository.save(attempt);

        AttemptResultDto result = examAttemptService.getAttemptResult(attempt.getId(), teacher, true);
        return ResponseEntity.ok(ApiResponse.success("Đã hoàn tất chấm điểm tự luận", result));
    }
}
