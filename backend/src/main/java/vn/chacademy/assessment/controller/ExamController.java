package vn.chacademy.assessment.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import vn.chacademy.assessment.dto.ExamDto;
import vn.chacademy.assessment.entity.Exam;
import vn.chacademy.assessment.repository.ExamRepository;
import vn.chacademy.assessment.service.ExamService;
import vn.chacademy.assessment.service.ScoringService;
import vn.chacademy.common.dto.ApiResponse;
import vn.chacademy.identity.entity.User;
import vn.chacademy.identity.repository.UserRepository;

@RestController
@RequestMapping("/api/v1/assessment/exams")
@RequiredArgsConstructor
public class ExamController {

    private final ExamService examService;
    private final ScoringService scoringService;
    private final ExamRepository examRepository;
    private final UserRepository userRepository;

    private User getAuthenticatedUser(UserDetails userDetails) {
        if (userDetails == null) return null;
        return userRepository.findByUsername(userDetails.getUsername()).orElse(null);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF', 'TEACHER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Page<ExamDto>>> searchExams(
            @RequestParam(required = false) Long courseId,
            @RequestParam(required = false) Long teacherId,
            @RequestParam(required = false) Long sessionId,
            @RequestParam(required = false) Long classId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<ExamDto> result = examService.searchExams(courseId, teacherId, sessionId, classId, status, search, page, size);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách đề thi thành công", result));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF', 'TEACHER', 'ADMIN')")
    public ResponseEntity<ApiResponse<ExamDto>> getExam(@PathVariable Long id) {
        ExamDto dto = examService.getExamById(id);
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF', 'TEACHER', 'ADMIN')")
    public ResponseEntity<ApiResponse<ExamDto>> createExam(
            @Valid @RequestBody ExamDto dto,
            @AuthenticationPrincipal UserDetails userDetails) {
        User creator = getAuthenticatedUser(userDetails);
        ExamDto created = examService.createExam(dto, creator);
        return ResponseEntity.ok(ApiResponse.success("Tạo đề thi thành công", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF', 'TEACHER', 'ADMIN')")
    public ResponseEntity<ApiResponse<ExamDto>> updateExam(
            @PathVariable Long id,
            @Valid @RequestBody ExamDto dto) {
        ExamDto updated = examService.updateExam(id, dto);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật đề thi thành công", updated));
    }

    @PostMapping("/{id}/submit-review")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF', 'TEACHER', 'ADMIN')")
    public ResponseEntity<ApiResponse<ExamDto>> submitForReview(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User actor = getAuthenticatedUser(userDetails);
        ExamDto result = examService.submitForReview(id, actor);
        return ResponseEntity.ok(ApiResponse.success("Đã gửi đề thi lên Ban Quản Trị phê duyệt thành công", result));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF', 'ADMIN')")
    public ResponseEntity<ApiResponse<ExamDto>> approveExam(
            @PathVariable Long id,
            @RequestBody(required = false) vn.chacademy.assessment.dto.ApprovalActionRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User adminActor = getAuthenticatedUser(userDetails);
        String comment = request != null ? request.getComment() : null;
        ExamDto result = examService.approveExam(id, adminActor, comment);
        return ResponseEntity.ok(ApiResponse.success("Phê duyệt đề thi thành công! Đề thi đã đủ điều kiện để giao cho lớp học.", result));
    }

    @PostMapping("/{id}/request-changes")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF', 'ADMIN')")
    public ResponseEntity<ApiResponse<ExamDto>> requestChanges(
            @PathVariable Long id,
            @RequestBody vn.chacademy.assessment.dto.ApprovalActionRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User adminActor = getAuthenticatedUser(userDetails);
        String feedback = request != null && request.getEffectiveFeedback() != null ? request.getEffectiveFeedback() : "";
        ExamDto result = examService.requestChanges(id, adminActor, feedback);
        return ResponseEntity.ok(ApiResponse.success("Đã gửi yêu cầu chỉnh sửa đề thi cho Giảng viên", result));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF', 'ADMIN')")
    public ResponseEntity<ApiResponse<ExamDto>> rejectExam(
            @PathVariable Long id,
            @RequestBody vn.chacademy.assessment.dto.ApprovalActionRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User adminActor = getAuthenticatedUser(userDetails);
        String reason = request != null && request.getEffectiveFeedback() != null ? request.getEffectiveFeedback() : "";
        ExamDto result = examService.rejectExam(id, adminActor, reason);
        return ResponseEntity.ok(ApiResponse.success("Đã từ chối đề thi", result));
    }

    @PostMapping("/{id}/publish")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF', 'TEACHER', 'ADMIN')")
    public ResponseEntity<ApiResponse<ExamDto>> publishExam(
            @PathVariable Long id,
            @RequestBody(required = false) vn.chacademy.assessment.dto.ApprovalActionRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User publisher = getAuthenticatedUser(userDetails);
        java.util.List<Long> classIds = request != null ? request.getEffectiveClassIds() : null;
        ExamDto published = examService.publishExam(id, classIds, publisher);
        return ResponseEntity.ok(ApiResponse.success("Phát hành đề thi cho các lớp thành công!", published));
    }

    @GetMapping("/{id}/review-history")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF', 'TEACHER', 'ADMIN')")
    public ResponseEntity<ApiResponse<java.util.List<vn.chacademy.assessment.dto.ExamReviewDto>>> getReviewHistory(
            @PathVariable Long id) {
        java.util.List<vn.chacademy.assessment.dto.ExamReviewDto> history = examService.getReviewHistory(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy lịch sử kiểm duyệt đề thi thành công", history));
    }

    @GetMapping("/approval-stats")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF', 'ADMIN')")
    public ResponseEntity<ApiResponse<vn.chacademy.assessment.dto.ApprovalQueueStatsDto>> getApprovalStats() {
        vn.chacademy.assessment.dto.ApprovalQueueStatsDto stats = examService.getApprovalStats();
        return ResponseEntity.ok(ApiResponse.success("Lấy thống kê kiểm duyệt đề thi thành công", stats));
    }

    @PostMapping("/{id}/re-grade")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF', 'TEACHER', 'ADMIN')")
    public ResponseEntity<ApiResponse<String>> reGradeExam(@PathVariable Long id) {
        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đề thi với ID: " + id));
        int count = scoringService.reGradeExam(exam);
        return ResponseEntity.ok(ApiResponse.success("Đã chấm lại thành công cho " + count + " lượt thi", null));
    }

    @PostMapping("/{id}/duplicate")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF', 'TEACHER', 'ADMIN')")
    public ResponseEntity<ApiResponse<ExamDto>> duplicateExam(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User creator = getAuthenticatedUser(userDetails);
        ExamDto duplicated = examService.duplicateExam(id, creator);
        return ResponseEntity.ok(ApiResponse.success("Nhân bản đề thi thành công", duplicated));
    }
}
