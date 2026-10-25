package vn.chacademy.attendance.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import vn.chacademy.academic.entity.ClassEntity;
import vn.chacademy.academic.entity.ClassSession;
import vn.chacademy.academic.repository.ClassSessionRepository;
import vn.chacademy.academic.repository.EnrollmentRepository;
import vn.chacademy.attendance.dto.AttendanceMonitoringDto;
import vn.chacademy.attendance.dto.AttendanceRecordDto;
import vn.chacademy.attendance.entity.AttendanceRecord;
import vn.chacademy.attendance.repository.AttendanceRecordRepository;
import vn.chacademy.attendance.service.AttendanceService;
import vn.chacademy.common.dto.ApiResponse;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/attendance-monitoring")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF', 'ADMIN')")
public class AttendanceMonitoringAdminController {

    private final ClassSessionRepository classSessionRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final AttendanceService attendanceService;

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<AttendanceMonitoringDto>>> getMonitoringSessions(
            @RequestParam(required = false) Long classId,
            @RequestParam(required = false) Long teacherId,
            @RequestParam(required = false) String markedFilter, // ALL, UNMARKED, MARKED
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate
    ) {
        List<ClassSession> sessions = classSessionRepository.findAll();

        List<AttendanceMonitoringDto> result = new ArrayList<>();

        for (ClassSession s : sessions) {
            ClassEntity c = s.getClassEntity();
            if (c == null) continue;

            if (classId != null && !c.getId().equals(classId)) continue;
            if (teacherId != null) {
                Long tid = s.getTeacher() != null ? s.getTeacher().getId() : (c.getPrimaryTeacher() != null ? c.getPrimaryTeacher().getId() : null);
                if (tid == null || !tid.equals(teacherId)) continue;
            }
            if (fromDate != null && s.getSessionDate().isBefore(fromDate)) continue;
            if (toDate != null && s.getSessionDate().isAfter(toDate)) continue;

            List<AttendanceRecord> records = attendanceRecordRepository.findBySessionId(s.getId());
            boolean isMarked = !records.isEmpty();

            if ("UNMARKED".equalsIgnoreCase(markedFilter) && isMarked) continue;
            if ("MARKED".equalsIgnoreCase(markedFilter) && !isMarked) continue;

            int totalEnrolled = enrollmentRepository.findByClassEntityIdOrderByCreatedAtDesc(c.getId()).size();
            int present = (int) records.stream().filter(r -> "PRESENT".equalsIgnoreCase(r.getStatus())).count();
            int late = (int) records.stream().filter(r -> "LATE".equalsIgnoreCase(r.getStatus())).count();
            int absent = (int) records.stream().filter(r -> "ABSENT".equalsIgnoreCase(r.getStatus())).count();
            int excused = (int) records.stream().filter(r -> "EXCUSED".equalsIgnoreCase(r.getStatus())).count();

            String teacherName = s.getTeacher() != null ? s.getTeacher().getFullName()
                    : (c.getPrimaryTeacher() != null ? c.getPrimaryTeacher().getFullName() : "Chưa phân công");
            Long tid = s.getTeacher() != null ? s.getTeacher().getId()
                    : (c.getPrimaryTeacher() != null ? c.getPrimaryTeacher().getId() : null);

            result.add(AttendanceMonitoringDto.builder()
                    .sessionId(s.getId())
                    .classId(c.getId())
                    .classCode(c.getCode())
                    .className(c.getName())
                    .teacherId(tid)
                    .teacherName(teacherName)
                    .sessionDate(s.getSessionDate())
                    .startTime(s.getStartTime())
                    .endTime(s.getEndTime())
                    .room(s.getRoom())
                    .topic(s.getTopic())
                    .sessionStatus(s.getStatus())
                    .isMarked(isMarked)
                    .totalEnrolled(totalEnrolled)
                    .presentCount(present)
                    .lateCount(late)
                    .absentCount(absent)
                    .excusedCount(excused)
                    .build());
        }

        result.sort((a, b) -> b.getSessionDate().compareTo(a.getSessionDate()));
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/sessions/{sessionId}")
    public ResponseEntity<ApiResponse<List<AttendanceRecordDto>>> getSessionDetails(@PathVariable Long sessionId) {
        List<AttendanceRecordDto> list = attendanceService.getSessionAttendance(sessionId);
        return ResponseEntity.ok(ApiResponse.success(list));
    }
}
