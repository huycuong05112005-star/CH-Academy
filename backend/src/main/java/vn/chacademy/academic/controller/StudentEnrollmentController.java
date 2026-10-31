package vn.chacademy.academic.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import vn.chacademy.academic.dto.ClassDto;
import vn.chacademy.academic.dto.CreateEnrollmentRequestDto;
import vn.chacademy.academic.dto.EnrollmentRequestDto;
import vn.chacademy.academic.dto.StudentLearningHistoryDto;
import vn.chacademy.academic.service.EnrollmentRequestService;
import vn.chacademy.common.dto.ApiResponse;
import vn.chacademy.common.exception.ResourceNotFoundException;
import vn.chacademy.identity.entity.User;
import vn.chacademy.identity.repository.UserRepository;

import java.util.List;

@RestController
@RequestMapping("/api/v1/student")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class StudentEnrollmentController {

    private final EnrollmentRequestService requestService;
    private final UserRepository userRepository;

    private User getAuthenticatedUser(UserDetails userDetails) {
        if (userDetails == null) return null;
        return userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin tài khoản"));
    }

    @GetMapping("/available-classes")
    public ResponseEntity<ApiResponse<List<ClassDto>>> getAvailableClasses(
            @RequestParam(required = false) String academicYear) {
        return ResponseEntity.ok(ApiResponse.success(requestService.getAvailableClassesForRegistration(academicYear)));
    }

    @GetMapping("/enrollment-requests")
    public ResponseEntity<ApiResponse<List<EnrollmentRequestDto>>> getMyRequests(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        return ResponseEntity.ok(ApiResponse.success(requestService.getMyEnrollmentRequests(user)));
    }

    @PostMapping("/enrollment-requests")
    public ResponseEntity<ApiResponse<EnrollmentRequestDto>> submitRequest(
            @Valid @RequestBody CreateEnrollmentRequestDto dto,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        EnrollmentRequestDto res = requestService.submitEnrollmentRequest(user, dto);
        return ResponseEntity.ok(ApiResponse.success("Gửi yêu cầu đăng ký khóa học thành công", res));
    }

    @PostMapping("/enrollment-requests/{id}/cancel")
    public ResponseEntity<ApiResponse<EnrollmentRequestDto>> cancelRequest(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        EnrollmentRequestDto res = requestService.cancelMyRequest(user, id);
        return ResponseEntity.ok(ApiResponse.success("Đã hủy yêu cầu đăng ký", res));
    }

    @GetMapping("/learning-history")
    public ResponseEntity<ApiResponse<List<StudentLearningHistoryDto>>> getLearningHistory(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        return ResponseEntity.ok(ApiResponse.success(requestService.getStudentLearningHistory(user)));
    }
}
