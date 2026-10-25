package vn.chacademy.common.audit.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.chacademy.common.audit.dto.AuditLogDto;
import vn.chacademy.common.audit.service.AuditService;
import vn.chacademy.common.dto.ApiResponse;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/audit-logs")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
public class AuditLogAdminController {

    private final AuditService auditService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<AuditLogDto>>> getAuditLogs(
            @RequestParam(required = false) String actor,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String resourceType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Page<AuditLogDto> result = auditService.getAuditLogs(actor, action, resourceType, page, size);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/recent")
    public ResponseEntity<ApiResponse<List<AuditLogDto>>> getRecentLogs() {
        List<AuditLogDto> list = auditService.getRecentLogs();
        return ResponseEntity.ok(ApiResponse.success(list));
    }
}
