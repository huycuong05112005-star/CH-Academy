package vn.chacademy.attendance.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import vn.chacademy.academic.repository.ClassSessionRepository;
import vn.chacademy.attendance.dto.AttendanceRecordDto;
import vn.chacademy.attendance.dto.AttendanceStatsDto;
import vn.chacademy.attendance.dto.BulkAttendanceRequest;
import vn.chacademy.attendance.service.AttendanceService;
import vn.chacademy.common.dto.ApiResponse;
import vn.chacademy.identity.entity.User;
import vn.chacademy.identity.repository.UserRepository;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/attendance")
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;
    private final ClassSessionRepository classSessionRepository;
    private final UserRepository userRepository;

    @GetMapping("/sessions/{sessionId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF', 'TEACHER')")
    public ResponseEntity<ApiResponse<List<AttendanceRecordDto>>> getSessionAttendance(@PathVariable Long sessionId) {
        List<AttendanceRecordDto> records = attendanceService.getSessionAttendance(sessionId);
        return ResponseEntity.ok(ApiResponse.success(records));
    }

    @PostMapping("/sessions/{sessionId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF', 'TEACHER')")
    public ResponseEntity<ApiResponse<List<AttendanceRecordDto>>> markAttendance(
            @PathVariable Long sessionId,
            @Valid @RequestBody BulkAttendanceRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        Long staffId = resolveUserId(userDetails);
        List<AttendanceRecordDto> saved = attendanceService.markSessionAttendance(sessionId, request, staffId);
        return ResponseEntity.ok(ApiResponse.success("Lưu kết quả điểm danh thành công", saved));
    }

    @GetMapping("/students/{studentId}/stats")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF', 'TEACHER', 'STUDENT', 'PARENT')")
    public ResponseEntity<ApiResponse<AttendanceStatsDto>> getStudentStats(@PathVariable Long studentId) {
        AttendanceStatsDto stats = attendanceService.getStudentAttendanceStats(studentId);
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/sessions")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF', 'TEACHER')")
    public ResponseEntity<ApiResponse<List<vn.chacademy.academic.dto.ClassSessionDto>>> getSessions(
            @RequestParam(required = false) Long classId,
            @RequestParam(required = false) Long teacherId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        LocalDate start = startDate != null ? startDate : LocalDate.now().minusDays(7);
        LocalDate end = endDate != null ? endDate : LocalDate.now().plusDays(30);

        List<vn.chacademy.academic.dto.ClassSessionDto> sessions = classSessionRepository
                .findSessionsInDateRange(classId, teacherId, start, end).stream()
                .map(vn.chacademy.academic.dto.ClassSessionDto::fromEntity)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(sessions));
    }

    private Long resolveUserId(UserDetails userDetails) {
        if (userDetails == null) return null;
        return userRepository.findByUsername(userDetails.getUsername())
                .map(User::getId)
                .orElse(null);
    }
}
