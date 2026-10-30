package vn.chacademy.student.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import vn.chacademy.academic.dto.EnrollmentDto;
import vn.chacademy.academic.dto.SessionMaterialDto;
import vn.chacademy.academic.entity.ClassEntity;
import vn.chacademy.academic.entity.ClassSession;
import vn.chacademy.academic.entity.SessionMaterial;
import vn.chacademy.academic.repository.ClassRepository;
import vn.chacademy.academic.repository.ClassSessionRepository;
import vn.chacademy.academic.repository.EnrollmentRepository;
import vn.chacademy.academic.repository.SessionMaterialRepository;
import vn.chacademy.attendance.entity.AttendanceRecord;
import vn.chacademy.attendance.repository.AttendanceRecordRepository;
import vn.chacademy.common.dto.ApiResponse;
import vn.chacademy.common.exception.ResourceNotFoundException;
import vn.chacademy.finance.dto.PaymentDto;
import vn.chacademy.finance.dto.ReceivableDto;
import vn.chacademy.finance.entity.Payment;
import vn.chacademy.finance.entity.Receivable;
import vn.chacademy.finance.repository.PaymentRepository;
import vn.chacademy.finance.repository.ReceivableRepository;
import vn.chacademy.identity.dto.ChangePasswordRequest;
import vn.chacademy.identity.entity.User;
import vn.chacademy.identity.repository.UserRepository;
import vn.chacademy.identity.service.AuthService;
import vn.chacademy.notification.dto.NotificationDto;
import vn.chacademy.notification.entity.Notification;
import vn.chacademy.notification.repository.NotificationReadRepository;
import vn.chacademy.notification.repository.NotificationRepository;
import vn.chacademy.student.dto.StudentClassDetailDto;
import vn.chacademy.student.dto.StudentClassDetailDto.StudentSessionDto;
import vn.chacademy.student.dto.StudentDto;
import vn.chacademy.student.dto.StudentPortalSummaryDto;
import vn.chacademy.student.entity.Student;
import vn.chacademy.student.repository.StudentRepository;
import vn.chacademy.student.repository.StudentGuardianRepository;
import vn.chacademy.student.service.StudentService;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/student/portal")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('STUDENT')")
public class StudentPortalController {

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final StudentService studentService;
    private final EnrollmentRepository enrollmentRepository;
    private final ReceivableRepository receivableRepository;
    private final PaymentRepository paymentRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final ClassRepository classRepository;
    private final ClassSessionRepository classSessionRepository;
    private final SessionMaterialRepository sessionMaterialRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationReadRepository notificationReadRepository;
    private final AuthService authService;
    private final StudentGuardianRepository studentGuardianRepository;

    private Student getCurrentStudent(UserDetails userDetails) {
        if (userDetails == null) {
            throw new AccessDeniedException("Chưa đăng nhập");
        }
        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin tài khoản"));

        return studentRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Tài khoản '" + user.getUsername() + "' chưa được liên kết với hồ sơ học viên"));
    }

    @GetMapping("/me")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<StudentPortalSummaryDto>> getMyPortalDashboard(
            @AuthenticationPrincipal UserDetails userDetails) {

        Student student = getCurrentStudent(userDetails);
        StudentDto studentDto = studentService.getStudentById(student.getId());

        List<EnrollmentDto> enrollments = enrollmentRepository.findByStudentIdOrderByCreatedAtDesc(student.getId()).stream()
                .map(EnrollmentDto::fromEntity)
                .toList();

        List<Receivable> recList = receivableRepository.findByStudentIdAndStatusInOrderByIdAsc(
                student.getId(), List.of("UNPAID", "PARTIALLY_PAID", "PAID")
        );
        List<ReceivableDto> receivableDtos = recList.stream().map(r -> ReceivableDto.builder()
                .id(r.getId())
                .code(r.getCode())
                .studentId(student.getId())
                .studentCode(student.getStudentCode())
                .studentFullName(student.getFullName())
                .title(r.getTitle())
                .totalAmount(r.getTotalAmount())
                .paidAmount(r.getPaidAmount())
                .remainingAmount(r.getTotalAmount().subtract(r.getPaidAmount()))
                .status(r.getStatus())
                .dueDate(r.getDueDate())
                .createdAt(r.getCreatedAt())
                .build()
        ).toList();

        List<Payment> payments = paymentRepository.findByStudentIdOrderByCreatedAtDesc(student.getId());
        List<PaymentDto> paymentDtos = payments.stream().map(p -> PaymentDto.builder()
                .id(p.getId())
                .paymentCode(p.getPaymentCode())
                .studentId(student.getId())
                .studentCode(student.getStudentCode())
                .studentFullName(student.getFullName())
                .amount(p.getAmount())
                .paymentMethod(p.getPaymentMethod())
                .paymentDate(p.getPaymentDate())
                .referenceNumber(p.getReferenceNumber())
                .note(p.getNotes())
                .createdAt(p.getCreatedAt())
                .build()
        ).toList();

        long totalSessions = attendanceRecordRepository.countByStudentId(student.getId());
        long presentSessions = attendanceRecordRepository.countByStudentIdAndStatus(student.getId(), "PRESENT");
        double rate = totalSessions > 0 ? ((double) presentSessions / totalSessions) * 100.0 : 100.0;

        StudentPortalSummaryDto summary = StudentPortalSummaryDto.builder()
                .student(studentDto)
                .enrollments(enrollments)
                .receivables(receivableDtos)
                .payments(paymentDtos)
                .totalTuition(studentDto.getTotalTuition())
                .paidTuition(studentDto.getPaidTuition())
                .remainingTuition(studentDto.getRemainingTuition())
                .tuitionStatus(studentDto.getTuitionStatus())
                .totalSessions(totalSessions)
                .presentSessions(presentSessions)
                .attendanceRate(Math.round(rate * 10.0) / 10.0)
                .build();

        return ResponseEntity.ok(ApiResponse.success(summary));
    }

    @GetMapping("/classes/{classId}")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<StudentClassDetailDto>> getClassDetails(
            @PathVariable Long classId,
            @AuthenticationPrincipal UserDetails userDetails) {

        Student student = getCurrentStudent(userDetails);

        ClassEntity classEntity = classRepository.findById(classId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp học với ID: " + classId));

        List<ClassSession> sessions = classSessionRepository.findByClassEntityIdOrderBySessionDateAscStartTimeAsc(classId);

        List<StudentSessionDto> sessionDtos = sessions.stream().map(s -> {
            Optional<AttendanceRecord> attendance = attendanceRecordRepository.findBySessionIdAndStudentId(s.getId(), student.getId());
            List<SessionMaterial> materials = sessionMaterialRepository.findBySessionIdOrderByCreatedAtAsc(s.getId());

            return StudentSessionDto.builder()
                    .id(s.getId())
                    .sessionDate(s.getSessionDate())
                    .startTime(s.getStartTime())
                    .endTime(s.getEndTime())
                    .room(s.getRoom())
                    .topic(s.getTopic())
                    .status(s.getStatus())
                    .attendanceStatus(attendance.map(AttendanceRecord::getStatus).orElse("NOT_RECORDED"))
                    .teacherNote(attendance.map(AttendanceRecord::getNote).orElse(null))
                    .materials(materials.stream().map(SessionMaterialDto::fromEntity).toList())
                    .build();
        }).toList();

        StudentClassDetailDto dto = StudentClassDetailDto.builder()
                .id(classEntity.getId())
                .code(classEntity.getCode())
                .name(classEntity.getName())
                .courseName(classEntity.getCourse() != null ? classEntity.getCourse().getName() : null)
                .teacherName(classEntity.getPrimaryTeacher() != null ? classEntity.getPrimaryTeacher().getFullName() : null)
                .room(classEntity.getRoom())
                .startDate(classEntity.getStartDate())
                .endDate(classEntity.getEndDate())
                .status(classEntity.getStatus())
                .sessions(sessionDtos)
                .build();

        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    @GetMapping("/notifications")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<NotificationDto>>> getMyNotifications(
            @AuthenticationPrincipal UserDetails userDetails) {

        Student student = getCurrentStudent(userDetails);
        User currentUser = userDetails != null ? userRepository.findByUsername(userDetails.getUsername()).orElse(null) : null;
        Long currentUserId = currentUser != null ? currentUser.getId() : (student.getUser() != null ? student.getUser().getId() : -1L);

        var enrollments = enrollmentRepository.findByStudentIdOrderByCreatedAtDesc(student.getId());
        Set<Long> classIds = enrollments.stream().map(e -> e.getClassEntity().getId()).collect(Collectors.toSet());

        List<Notification> entityList;
        if (classIds.isEmpty()) {
            entityList = notificationRepository.findForStudentWithUser(Collections.singleton(-1L), currentUserId);
        } else {
            entityList = notificationRepository.findForStudentWithUser(classIds, currentUserId);
        }

        Set<Long> readIds = notificationReadRepository.findReadNotificationIdsByUserId(currentUserId);
        List<NotificationDto> notifications = entityList.stream()
                .map(n -> NotificationDto.fromEntity(n, readIds.contains(n.getId()), null))
                .toList();

        return ResponseEntity.ok(ApiResponse.success(notifications));
    }

    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        if (userDetails == null) {
            throw new AccessDeniedException("Chưa đăng nhập");
        }

        authService.changePassword(userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.success("Đổi mật khẩu thành công!", null));
    }

    @GetMapping("/courses")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<EnrollmentDto>>> getMyCourses(
            @AuthenticationPrincipal UserDetails userDetails) {

        Student student = getCurrentStudent(userDetails);
        List<EnrollmentDto> enrollments = enrollmentRepository.findByStudentIdOrderByCreatedAtDesc(student.getId()).stream()
                .map(EnrollmentDto::fromEntity)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(enrollments));
    }

    @GetMapping("/schedule")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<vn.chacademy.student.dto.StudentScheduleDto>>> getMySchedule(
            @AuthenticationPrincipal UserDetails userDetails) {

        Student student = getCurrentStudent(userDetails);
        var enrollments = enrollmentRepository.findByStudentIdOrderByCreatedAtDesc(student.getId());

        List<vn.chacademy.student.dto.StudentScheduleDto> scheduleList = new java.util.ArrayList<>();
        for (var enrollment : enrollments) {
            ClassEntity c = enrollment.getClassEntity();
            List<ClassSession> sessions = classSessionRepository.findByClassEntityIdOrderBySessionDateAscStartTimeAsc(c.getId());
            for (ClassSession s : sessions) {
                Optional<AttendanceRecord> attendance = attendanceRecordRepository.findBySessionIdAndStudentId(s.getId(), student.getId());
                scheduleList.add(vn.chacademy.student.dto.StudentScheduleDto.builder()
                        .sessionId(s.getId())
                        .classId(c.getId())
                        .classCode(c.getCode())
                        .className(c.getName())
                        .courseName(c.getCourse() != null ? c.getCourse().getName() : null)
                        .teacherName(c.getPrimaryTeacher() != null ? c.getPrimaryTeacher().getFullName() : null)
                        .sessionDate(s.getSessionDate())
                        .startTime(s.getStartTime())
                        .endTime(s.getEndTime())
                        .room(s.getRoom())
                        .topic(s.getTopic())
                        .status(s.getStatus())
                        .attendanceStatus(attendance.map(AttendanceRecord::getStatus).orElse("SCHEDULED"))
                        .teacherNote(attendance.map(AttendanceRecord::getNote).orElse(null))
                        .build());
            }
        }

        scheduleList.sort(java.util.Comparator.comparing(vn.chacademy.student.dto.StudentScheduleDto::getSessionDate)
                .thenComparing(vn.chacademy.student.dto.StudentScheduleDto::getStartTime));

        return ResponseEntity.ok(ApiResponse.success(scheduleList));
    }

    @GetMapping("/attendance")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<vn.chacademy.student.dto.StudentAttendanceItemDto>>> getMyAttendance(
            @AuthenticationPrincipal UserDetails userDetails) {

        Student student = getCurrentStudent(userDetails);
        List<AttendanceRecord> records = attendanceRecordRepository.findByStudentId(student.getId());

        List<vn.chacademy.student.dto.StudentAttendanceItemDto> dtoList = records.stream().map(r -> {
            ClassSession s = r.getSession();
            ClassEntity c = s != null ? s.getClassEntity() : null;
            return vn.chacademy.student.dto.StudentAttendanceItemDto.builder()
                    .id(r.getId())
                    .sessionId(s != null ? s.getId() : null)
                    .classId(c != null ? c.getId() : null)
                    .classCode(c != null ? c.getCode() : null)
                    .className(c != null ? c.getName() : null)
                    .sessionDate(s != null ? s.getSessionDate() : null)
                    .startTime(s != null ? s.getStartTime() : null)
                    .endTime(s != null ? s.getEndTime() : null)
                    .topic(s != null ? s.getTopic() : null)
                    .status(r.getStatus())
                    .note(r.getNote())
                    .recordedAt(r.getRecordedAt())
                    .build();
        }).sorted(java.util.Comparator.comparing(vn.chacademy.student.dto.StudentAttendanceItemDto::getSessionDate, java.util.Comparator.nullsLast(java.util.Comparator.reverseOrder())))
        .toList();

        return ResponseEntity.ok(ApiResponse.success(dtoList));
    }

    @GetMapping("/tuition")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<java.util.Map<String, Object>>> getMyTuition(
            @AuthenticationPrincipal UserDetails userDetails) {

        Student student = getCurrentStudent(userDetails);
        StudentDto studentDto = studentService.getStudentById(student.getId());

        List<Receivable> recList = receivableRepository.findByStudentIdAndStatusInOrderByIdAsc(
                student.getId(), List.of("UNPAID", "PARTIALLY_PAID", "PAID")
        );
        List<ReceivableDto> receivableDtos = recList.stream().map(r -> ReceivableDto.builder()
                .id(r.getId())
                .code(r.getCode())
                .studentId(student.getId())
                .studentCode(student.getStudentCode())
                .studentFullName(student.getFullName())
                .title(r.getTitle())
                .totalAmount(r.getTotalAmount())
                .paidAmount(r.getPaidAmount())
                .remainingAmount(r.getTotalAmount().subtract(r.getPaidAmount()))
                .status(r.getStatus())
                .dueDate(r.getDueDate())
                .createdAt(r.getCreatedAt())
                .build()
        ).toList();

        List<Payment> payments = paymentRepository.findByStudentIdOrderByCreatedAtDesc(student.getId());
        List<PaymentDto> paymentDtos = payments.stream().map(p -> PaymentDto.builder()
                .id(p.getId())
                .paymentCode(p.getPaymentCode())
                .studentId(student.getId())
                .studentCode(student.getStudentCode())
                .studentFullName(student.getFullName())
                .amount(p.getAmount())
                .paymentMethod(p.getPaymentMethod())
                .paymentDate(p.getPaymentDate())
                .referenceNumber(p.getReferenceNumber())
                .note(p.getNotes())
                .createdAt(p.getCreatedAt())
                .build()
        ).toList();

        java.util.Map<String, Object> res = new java.util.HashMap<>();
        res.put("totalTuition", studentDto.getTotalTuition());
        res.put("paidTuition", studentDto.getPaidTuition());
        res.put("remainingTuition", studentDto.getRemainingTuition());
        res.put("tuitionStatus", studentDto.getTuitionStatus());
        res.put("receivables", receivableDtos);
        res.put("payments", paymentDtos);

        return ResponseEntity.ok(ApiResponse.success(res));
    }

    @GetMapping("/profile")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<vn.chacademy.student.dto.StudentProfileDto>> getMyProfile(
            @AuthenticationPrincipal UserDetails userDetails) {

        Student student = getCurrentStudent(userDetails);
        var guardiansList = studentGuardianRepository.findByStudentId(student.getId());

        List<vn.chacademy.student.dto.StudentProfileDto.GuardianInfo> guardianInfos = guardiansList.stream().map(sg -> {
            var g = sg.getGuardian();
            return vn.chacademy.student.dto.StudentProfileDto.GuardianInfo.builder()
                    .id(g != null ? g.getId() : null)
                    .guardianCode(g != null ? g.getGuardianCode() : null)
                    .fullName(g != null ? g.getFullName() : null)
                    .phone(g != null ? g.getPhone() : null)
                    .email(g != null ? g.getEmail() : null)
                    .relationshipType(sg.getRelationshipType())
                    .isPrimaryContact(sg.getIsPrimaryContact())
                    .build();
        }).toList();

        vn.chacademy.student.dto.StudentProfileDto dto = vn.chacademy.student.dto.StudentProfileDto.builder()
                .id(student.getId())
                .studentCode(student.getStudentCode())
                .fullName(student.getFullName())
                .dateOfBirth(student.getDateOfBirth())
                .gender(student.getGender())
                .phone(student.getPhone())
                .email(student.getEmail())
                .address(student.getAddress())
                .targetType(student.getTargetType())
                .status(student.getStatus())
                .username(student.getUser() != null ? student.getUser().getUsername() : null)
                .guardians(guardianInfos)
                .build();

        return ResponseEntity.ok(ApiResponse.success(dto));
    }
}
