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

    @GetMapping("/admin/settings")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF', 'ADMISSIONS_STAFF', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<SystemSettingsDto>> getSettings() {
        SystemSettingsDto settings = systemSettingService.getSettings();
        return ResponseEntity.ok(ApiResponse.success("Lấy cấu hình hệ thống thành công", settings));
    }

    @PutMapping("/admin/settings")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN')")
    public ResponseEntity<ApiResponse<SystemSettingsDto>> updateSettings(@Valid @RequestBody SystemSettingsDto dto) {
        SystemSettingsDto updated = systemSettingService.updateSettings(dto);
        return ResponseEntity.ok(ApiResponse.success("Đã lưu cấu hình hệ thống thành công!", updated));
    }

    @GetMapping("/public/settings")
    public ResponseEntity<ApiResponse<SystemSettingsDto>> getPublicSettings() {
        SystemSettingsDto settings = systemSettingService.getPublicSettings();
        return ResponseEntity.ok(ApiResponse.success(settings));
    }
}
