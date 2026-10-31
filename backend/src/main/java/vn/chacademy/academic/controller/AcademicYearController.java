package vn.chacademy.academic.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.chacademy.academic.dto.AcademicYearDto;
import vn.chacademy.academic.dto.CreateAcademicYearRequest;
import vn.chacademy.academic.service.AcademicYearService;
import vn.chacademy.common.dto.ApiResponse;

import java.util.List;

@RestController
@RequestMapping("/api/v1/academic-years")
@RequiredArgsConstructor
public class AcademicYearController {

    private final AcademicYearService academicYearService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AcademicYearDto>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(academicYearService.getAllAcademicYears()));
    }

    @GetMapping("/current")
    public ResponseEntity<ApiResponse<AcademicYearDto>> getCurrent() {
        return ResponseEntity.ok(ApiResponse.success(academicYearService.getCurrentAcademicYear()));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF', 'ADMIN')")
    public ResponseEntity<ApiResponse<AcademicYearDto>> create(@Valid @RequestBody CreateAcademicYearRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Tạo năm học thành công", academicYearService.createAcademicYear(request)));
    }

    @PutMapping("/{id}/set-current")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ADMIN')")
    public ResponseEntity<ApiResponse<AcademicYearDto>> setCurrent(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Đã thiết lập năm học hiện tại", academicYearService.setCurrentYear(id)));
    }
}
