package vn.chacademy.dashboard.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vn.chacademy.common.dto.ApiResponse;
import vn.chacademy.dashboard.dto.DashboardStatsDto;
import vn.chacademy.dashboard.service.DashboardService;

@RestController
@RequestMapping({"/api/v1/dashboard", "/api/v1/admin/dashboard"})
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping({"", "/", "/stats"})
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ADMIN', 'ACADEMIC_STAFF', 'ADMISSIONS_STAFF', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<DashboardStatsDto>> getDashboardStats(
            @RequestParam(required = false) String academicYear) {
        DashboardStatsDto stats = dashboardService.getDashboardStats(academicYear);
        return ResponseEntity.ok(ApiResponse.success("Lấy số liệu thống kê thành công", stats));
    }
}
