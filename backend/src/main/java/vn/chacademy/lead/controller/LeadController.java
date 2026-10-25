package vn.chacademy.lead.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import vn.chacademy.common.dto.ApiResponse;
import vn.chacademy.identity.entity.User;
import vn.chacademy.identity.repository.UserRepository;
import vn.chacademy.lead.dto.*;
import vn.chacademy.lead.service.LeadService;

@RestController
@RequestMapping("/api/v1/leads")
@RequiredArgsConstructor
public class LeadController {

    private final LeadService leadService;
    private final UserRepository userRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ADMISSIONS_STAFF', 'ACADEMIC_STAFF')")
    public ResponseEntity<ApiResponse<Page<LeadDto>>> searchLeads(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String source,
            @RequestParam(required = false) Long assignedStaffId,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        Page<LeadDto> page = leadService.searchLeads(keyword, status, source, assignedStaffId, pageable);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ADMISSIONS_STAFF', 'ACADEMIC_STAFF')")
    public ResponseEntity<ApiResponse<LeadDto>> getLeadById(@PathVariable Long id) {
        LeadDto lead = leadService.getLeadById(id);
        return ResponseEntity.ok(ApiResponse.success(lead));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ADMISSIONS_STAFF')")
    public ResponseEntity<ApiResponse<LeadDto>> createLead(@Valid @RequestBody CreateLeadRequest request) {
        LeadDto created = leadService.createLead(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo khách hàng tiềm năng thành công", created));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ADMISSIONS_STAFF')")
    public ResponseEntity<ApiResponse<LeadDto>> updateLeadStatus(
            @PathVariable Long id,
            @RequestParam String status,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        Long staffId = resolveUserId(userDetails);
        LeadDto updated = leadService.updateLeadStatus(id, status, staffId);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái thành công", updated));
    }

    @PostMapping("/{id}/activities")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ADMISSIONS_STAFF')")
    public ResponseEntity<ApiResponse<LeadActivityDto>> addActivity(
            @PathVariable Long id,
            @Valid @RequestBody AddActivityRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        Long staffId = resolveUserId(userDetails);
        LeadActivityDto activity = leadService.addActivity(id, request, staffId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Thêm lịch sử chăm sóc thành công", activity));
    }

    @PostMapping("/{id}/convert")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ADMISSIONS_STAFF')")
    public ResponseEntity<ApiResponse<LeadDto>> convertLead(
            @PathVariable Long id,
            @Valid @RequestBody ConvertLeadRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        Long staffId = resolveUserId(userDetails);
        LeadDto converted = leadService.convertLeadToStudent(id, request, staffId);
        return ResponseEntity.ok(ApiResponse.success("Chuyển đổi thành học viên thành công", converted));
    }

    private Long resolveUserId(UserDetails userDetails) {
        if (userDetails == null) return null;
        return userRepository.findByUsername(userDetails.getUsername())
                .map(User::getId)
                .orElse(null);
    }
}
