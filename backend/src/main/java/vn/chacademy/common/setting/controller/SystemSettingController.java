package vn.chacademy.common.setting.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.chacademy.common.dto.ApiResponse;
import vn.chacademy.common.setting.dto.SystemSettingsDto;
import vn.chacademy.common.setting.service.SystemSettingService;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class SystemSettingController {

    private final SystemSettingService systemSettingService;
    private final vn.chacademy.common.audit.service.AuditService auditService;

    @GetMapping("/admin/settings")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ADMIN', 'ACADEMIC_STAFF', 'ADMISSIONS_STAFF', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<SystemSettingsDto>> getSettings() {
        SystemSettingsDto settings = systemSettingService.getSettings();
        return ResponseEntity.ok(ApiResponse.success("Lấy cấu hình hệ thống thành công", settings));
    }

    @PutMapping("/admin/settings")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ADMIN')")
    public ResponseEntity<ApiResponse<SystemSettingsDto>> updateSettings(
            @org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails,
            jakarta.servlet.http.HttpServletRequest request,
            @Valid @RequestBody SystemSettingsDto dto) {
        SystemSettingsDto updated = systemSettingService.updateSettings(dto);
        String username = userDetails != null ? userDetails.getUsername() : "ADMIN";
        String ip = request != null ? request.getRemoteAddr() : "127.0.0.1";
        auditService.recordAction(username, "SUPER_ADMIN", "SETTINGS_UPDATE", "SETTINGS", "1",
                "Cập nhật cấu hình hệ thống: " + updated.getCenterName() + " (" + updated.getShortName() + ")", ip);
        return ResponseEntity.ok(ApiResponse.success("Đã lưu cấu hình hệ thống thành công!", updated));
    }

    @GetMapping("/public/settings")
    public ResponseEntity<ApiResponse<SystemSettingsDto>> getPublicSettings() {
        SystemSettingsDto settings = systemSettingService.getPublicSettings();
        return ResponseEntity.ok(ApiResponse.success(settings));
    }
}
