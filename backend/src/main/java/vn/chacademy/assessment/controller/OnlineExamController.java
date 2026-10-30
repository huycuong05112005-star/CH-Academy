package vn.chacademy.assessment.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import vn.chacademy.assessment.dto.*;
import vn.chacademy.assessment.service.ExamAttemptService;
import vn.chacademy.common.dto.ApiResponse;
import vn.chacademy.identity.entity.User;
import vn.chacademy.identity.repository.UserRepository;

import java.util.List;

@RestController
@RequestMapping("/api/v1/assessment")
@RequiredArgsConstructor
public class OnlineExamController {

    private final ExamAttemptService examAttemptService;
    private final UserRepository userRepository;

    private User getAuthenticatedUser(UserDetails userDetails) {
        if (userDetails == null) return null;
        return userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new IllegalStateException("Người dùng không tồn tại"));
    }

    @GetMapping("/student/assigned-exams")
    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN', 'SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF')")
    public ResponseEntity<ApiResponse<List<StudentAssignedExamDto>>> getAssignedExams(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        List<StudentAssignedExamDto> list = examAttemptService.getAssignedExamsForStudent(user);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @PostMapping("/exam-room/start/{examId}")
    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN', 'SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF')")
    public ResponseEntity<ApiResponse<StartAttemptResponse>> startOrResumeAttempt(
            @PathVariable Long examId,
            HttpServletRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        String ip = request != null ? request.getRemoteAddr() : "127.0.0.1";
        String ua = request != null ? request.getHeader("User-Agent") : "Unknown";
        StartAttemptResponse response = examAttemptService.startAttempt(examId, user, ip, ua);
        return ResponseEntity.ok(ApiResponse.success("Bắt đầu bài kiểm tra thành công", response));
    }

    @PostMapping("/exam-room/save/{attemptId}")
    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN', 'SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF')")
    public ResponseEntity<ApiResponse<Void>> saveAnswer(
            @PathVariable Long attemptId,
            @Valid @RequestBody SaveAnswerRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        examAttemptService.saveAnswer(attemptId, req, user);
        return ResponseEntity.ok(ApiResponse.success("Đã tự động lưu đáp án", null));
    }

    @PostMapping("/exam-room/submit/{attemptId}")
    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN', 'SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF')")
    public ResponseEntity<ApiResponse<AttemptResultDto>> submitAttempt(
            @PathVariable Long attemptId,
            @RequestBody(required = false) SubmitExamRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        if (req == null) req = new SubmitExamRequest();
        AttemptResultDto result = examAttemptService.submitAttempt(attemptId, req, user);
        return ResponseEntity.ok(ApiResponse.success("Nộp bài thi thành công", result));
    }

    @GetMapping("/exam-room/result/{attemptId}")
    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN', 'SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF', 'TEACHER')")
    public ResponseEntity<ApiResponse<AttemptResultDto>> getResult(
            @PathVariable Long attemptId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        boolean isTeacherOrAdmin = user.getRoles().stream()
                .anyMatch(r -> r.getId().contains("ADMIN") || r.getId().equals("TEACHER") || r.getId().equals("ACADEMIC_STAFF"));
        AttemptResultDto result = examAttemptService.getAttemptResult(attemptId, user, isTeacherOrAdmin);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
