package vn.chacademy.academic.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import vn.chacademy.academic.dto.EnrollmentRequestDto;
import vn.chacademy.academic.dto.ReviewEnrollmentRequestDto;
import vn.chacademy.academic.service.EnrollmentRequestService;
import vn.chacademy.common.dto.ApiResponse;
import vn.chacademy.common.exception.ResourceNotFoundException;
import vn.chacademy.identity.entity.User;
import vn.chacademy.identity.repository.UserRepository;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/enrollment-requests")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF', 'ADMIN')")
public class AdminEnrollmentRequestController {

    private final EnrollmentRequestService requestService;
    private final UserRepository userRepository;

    private User getAuthenticatedUser(UserDetails userDetails) {
        if (userDetails == null) return null;
        return userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin tài khoản"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<EnrollmentRequestDto>>> getRequests(
            @RequestParam(required = false) String academicYear,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(ApiResponse.success(requestService.getRequestsForAdmin(academicYear, status)));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<EnrollmentRequestDto>> approve(
            @PathVariable Long id,
            @RequestBody(required = false) ReviewEnrollmentRequestDto dto,
            @AuthenticationPrincipal UserDetails userDetails) {
        User adminUser = getAuthenticatedUser(userDetails);
        EnrollmentRequestDto res = requestService.approveRequest(id, adminUser, dto);
        return ResponseEntity.ok(ApiResponse.success("Đã phê duyệt yêu cầu đăng ký khóa học", res));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<EnrollmentRequestDto>> reject(
            @PathVariable Long id,
            @RequestBody(required = false) ReviewEnrollmentRequestDto dto,
            @AuthenticationPrincipal UserDetails userDetails) {
        User adminUser = getAuthenticatedUser(userDetails);
        EnrollmentRequestDto res = requestService.rejectRequest(id, adminUser, dto);
        return ResponseEntity.ok(ApiResponse.success("Đã từ chối yêu cầu đăng ký", res));
    }
}
