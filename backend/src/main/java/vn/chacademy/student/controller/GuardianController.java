package vn.chacademy.student.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.chacademy.common.dto.ApiResponse;
import vn.chacademy.student.dto.CreateGuardianRequest;
import vn.chacademy.student.dto.GuardianDto;
import vn.chacademy.student.service.GuardianService;

import java.util.List;

@RestController
@RequestMapping("/api/v1/guardians")
@RequiredArgsConstructor
public class GuardianController {

    private final GuardianService guardianService;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF', 'ADMISSIONS_STAFF', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<Page<GuardianDto>>> searchGuardians(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        Sort sort = direction.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<GuardianDto> result = guardianService.searchGuardians(keyword, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF', 'ADMISSIONS_STAFF', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<List<GuardianDto>>> getAllGuardiansList() {
        List<GuardianDto> list = guardianService.getAllGuardiansList();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF', 'ADMISSIONS_STAFF', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<GuardianDto>> getGuardianById(@PathVariable Long id) {
        GuardianDto guardian = guardianService.getGuardianById(id);
        return ResponseEntity.ok(ApiResponse.success(guardian));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF', 'ADMISSIONS_STAFF')")
    public ResponseEntity<ApiResponse<GuardianDto>> createGuardian(@Valid @RequestBody CreateGuardianRequest request) {
        GuardianDto created = guardianService.createGuardian(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Thêm người giám hộ thành công", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF', 'ADMISSIONS_STAFF')")
    public ResponseEntity<ApiResponse<GuardianDto>> updateGuardian(
            @PathVariable Long id,
            @Valid @RequestBody CreateGuardianRequest request) {
        GuardianDto updated = guardianService.updateGuardian(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật người giám hộ thành công", updated));
    }
}
