package vn.chacademy.security.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import vn.chacademy.common.dto.ApiResponse;
import vn.chacademy.common.exception.ResourceNotFoundException;
import vn.chacademy.identity.entity.User;
import vn.chacademy.identity.repository.UserRepository;
import vn.chacademy.security.entity.SecurityAlert;
import vn.chacademy.security.service.SecurityCenterService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/security")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ADMIN')")
public class SecurityCenterController {

    private final SecurityCenterService securityCenterService;
    private final UserRepository userRepository;

    private User getAuthenticatedUser(UserDetails userDetails) {
        if (userDetails == null) return null;
        return userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin tài khoản"));
    }

    @GetMapping("/overview")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getOverview() {
        return ResponseEntity.ok(ApiResponse.success(securityCenterService.getSecurityOverview()));
    }

    @GetMapping("/alerts")
    public ResponseEntity<ApiResponse<List<SecurityAlert>>> getAlerts(
            @RequestParam(required = false) String severity,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(ApiResponse.success(securityCenterService.getAlerts(severity, status)));
    }

    @PutMapping("/alerts/{id}/status")
    public ResponseEntity<ApiResponse<SecurityAlert>> updateAlertStatus(
            @PathVariable Long id,
            @RequestParam String status,
            @RequestParam(required = false) String notes,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        SecurityAlert updated = securityCenterService.updateAlertStatus(id, status, notes, user);
        return ResponseEntity.ok(ApiResponse.success("Đã cập nhật trạng thái cảnh báo an ninh", updated));
    }

    @GetMapping("/sessions")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getSessions() {
        return ResponseEntity.ok(ApiResponse.success(securityCenterService.getActiveSessions()));
    }

    @DeleteMapping("/sessions/{id}")
    public ResponseEntity<ApiResponse<Void>> revokeSession(
            @PathVariable Long id,
            @RequestParam(required = false) String reason) {
        securityCenterService.revokeSession(id, reason);
        return ResponseEntity.ok(ApiResponse.success("Đã thu hồi phiên đăng nhập thành công", null));
    }

    @GetMapping("/audit-summary")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAuditSummary() {
        return ResponseEntity.ok(ApiResponse.success(securityCenterService.getAuditSummary()));
    }
}
