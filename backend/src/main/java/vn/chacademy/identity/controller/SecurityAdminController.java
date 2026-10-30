package vn.chacademy.identity.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import vn.chacademy.common.audit.dto.AuditLogDto;
import vn.chacademy.common.dto.ApiResponse;
import vn.chacademy.identity.dto.ResetPasswordResponse;
import vn.chacademy.identity.dto.UserSecurityDto;
import vn.chacademy.identity.service.SecurityAdminService;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/security")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ADMIN')")
public class SecurityAdminController {

    private final SecurityAdminService securityAdminService;

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<UserSecurityDto>>> getUsers(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status) {

        List<UserSecurityDto> list = securityAdminService.getStaffAndTeacherSecurityList(keyword, role, status);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @PostMapping("/users/{id}/require-password-change")
    public ResponseEntity<ApiResponse<Void>> requirePasswordChange(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        securityAdminService.requirePasswordChange(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Đã yêu cầu tài khoản đổi mật khẩu trong lần đăng nhập tiếp theo", null));
    }

    @PostMapping("/users/{id}/reset-password")
    public ResponseEntity<ApiResponse<ResetPasswordResponse>> resetPassword(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        ResetPasswordResponse response = securityAdminService.generateResetPasswordToken(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Khởi tạo mã đặt lại mật khẩu an toàn thành công", response));
    }

    @PostMapping("/users/{id}/toggle-lock")
    public ResponseEntity<ApiResponse<Void>> toggleLock(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        securityAdminService.toggleAccountLock(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Đã cập nhật trạng thái khóa tài khoản", null));
    }

    @GetMapping("/audit")
    public ResponseEntity<ApiResponse<List<AuditLogDto>>> getSecurityAuditHistory() {
        List<AuditLogDto> list = securityAdminService.getSecurityAuditHistory();
        return ResponseEntity.ok(ApiResponse.success(list));
    }
}

