package vn.chacademy.academic.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import vn.chacademy.academic.dto.CreateMaterialRequest;
import vn.chacademy.academic.dto.SessionMaterialDto;
import vn.chacademy.academic.dto.TeacherPortalDto.*;
import vn.chacademy.academic.entity.ClassEntity;
import vn.chacademy.academic.entity.ClassSession;
import vn.chacademy.academic.entity.Enrollment;
import vn.chacademy.academic.entity.SessionMaterial;
import vn.chacademy.academic.entity.Teacher;
import vn.chacademy.academic.repository.ClassRepository;
import vn.chacademy.academic.repository.ClassSessionRepository;
import vn.chacademy.academic.repository.EnrollmentRepository;
import vn.chacademy.academic.repository.SessionMaterialRepository;
import vn.chacademy.academic.repository.TeacherRepository;
import vn.chacademy.attendance.dto.AttendanceRecordDto;
import vn.chacademy.attendance.dto.BulkAttendanceRequest;
import vn.chacademy.attendance.service.AttendanceService;
import vn.chacademy.common.dto.ApiResponse;
import vn.chacademy.common.exception.ResourceNotFoundException;
import vn.chacademy.identity.entity.User;
import vn.chacademy.identity.repository.UserRepository;
import vn.chacademy.notification.dto.NotificationDto;
import vn.chacademy.notification.repository.NotificationRepository;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/teacher/portal")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
public class TeacherPortalController {

    private final UserRepository userRepository;
    private final TeacherRepository teacherRepository;
    private final ClassRepository classRepository;
    private final ClassSessionRepository classSessionRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final SessionMaterialRepository sessionMaterialRepository;
    private final AttendanceService attendanceService;
    private final NotificationRepository notificationRepository;
    private final vn.chacademy.common.audit.service.AuditService auditService;
    private final vn.chacademy.attendance.repository.AttendanceRecordRepository attendanceRecordRepository;

    private Teacher getCurrentTeacher(UserDetails userDetails) {
        if (userDetails == null) {
            throw new AccessDeniedException("Chưa đăng nhập");
        }
        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản"));

        return teacherRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Tài khoản chưa được liên kết với hồ sơ Giáo viên"));
    }

    private User getCurrentUser(UserDetails userDetails) {
        return userRepository.findByUsername(userDetails.getUsername()).orElse(null);
    }

    @GetMapping("/profile")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<TeacherProfileDto>> getProfile(@AuthenticationPrincipal UserDetails userDetails) {
        Teacher teacher = getCurrentTeacher(userDetails);
        List<ClassEntity> classes = classRepository.findByPrimaryTeacherIdOrderByStartDateDesc(teacher.getId());

        int totalStudents = 0;
        for (ClassEntity c : classes) {
            totalStudents += enrollmentRepository.findByClassEntityIdOrderByCreatedAtDesc(c.getId()).size();
        }

        TeacherProfileDto dto = TeacherProfileDto.builder()
                .id(teacher.getId())
                .teacherCode(teacher.getTeacherCode())
                .fullName(teacher.getFullName())
                .email(teacher.getEmail())
                .phone(teacher.getPhone())
                .specialization(teacher.getSpecialization())
                .bio(teacher.getBio())
                .status(teacher.getStatus())
                .totalClasses(classes.size())
                .activeStudents(totalStudents)
                .build();

        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    @GetMapping("/classes")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<TeacherClassDto>>> getMyClasses(@AuthenticationPrincipal UserDetails userDetails) {
        Teacher teacher = getCurrentTeacher(userDetails);
        List<ClassEntity> classes = classRepository.findByPrimaryTeacherIdOrderByStartDateDesc(teacher.getId());

        List<TeacherClassDto> dtoList = classes.stream().map(c -> {
            List<Enrollment> enrollments = enrollmentRepository.findByClassEntityIdOrderByCreatedAtDesc(c.getId());
            List<ClassSession> sessions = classSessionRepository.findByClassEntityIdOrderBySessionDateAscStartTimeAsc(c.getId());

            return TeacherClassDto.builder()
                    .id(c.getId())
                    .code(c.getCode())
                    .name(c.getName())
                    .courseId(c.getCourse() != null ? c.getCourse().getId() : null)
                    .courseName(c.getCourse() != null ? c.getCourse().getName() : null)
                    .courseCode(c.getCourse() != null ? c.getCourse().getCode() : null)
                    .room(c.getRoom())
                    .startDate(c.getStartDate())
                    .endDate(c.getEndDate())
                    .status(c.getStatus())
                    .enrolledStudents(enrollments.size())
                    .totalSessions(sessions.size())
                    .build();
        }).toList();

        return ResponseEntity.ok(ApiResponse.success(dtoList));
    }

    @GetMapping("/classes/{classId}")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<TeacherClassDto>> getClassDetails(
            @PathVariable Long classId,
            @AuthenticationPrincipal UserDetails userDetails) {

        Teacher teacher = getCurrentTeacher(userDetails);
        ClassEntity c = classRepository.findById(classId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp học với ID: " + classId));

        // Kiểm tra quyền: Chỉ giáo viên phụ trách lớp mới được xem
        if (c.getPrimaryTeacher() == null || !c.getPrimaryTeacher().getId().equals(teacher.getId())) {
            // Cho phép Admin xem hoặc kiểm tra xem giáo viên có buổi dạy nào trong lớp không
            boolean teachesSession = classSessionRepository.findByClassEntityIdOrderBySessionDateAscStartTimeAsc(classId)
                    .stream().anyMatch(s -> s.getTeacher() != null && s.getTeacher().getId().equals(teacher.getId()));
            if (!teachesSession) {
                throw new AccessDeniedException("Bạn không có quyền truy cập lớp học này.");
            }
        }

        List<Enrollment> enrollments = enrollmentRepository.findByClassEntityIdOrderByCreatedAtDesc(c.getId());
        List<TeacherStudentDto> students = enrollments.stream().map(e -> {
            var s = e.getStudent();
            return TeacherStudentDto.builder()
                    .studentId(s.getId())
                    .studentCode(s.getStudentCode())
                    .fullName(s.getFullName())
                    .email(s.getEmail())
                    .phone(s.getPhone())
                    .gender(s.getGender())
                    .dateOfBirth(s.getDateOfBirth())
                    .enrollmentDate(e.getEnrollmentDate())
                    .status(e.getStatus())
                    .build();
        }).toList();

        List<ClassSession> sessions = classSessionRepository.findByClassEntityIdOrderBySessionDateAscStartTimeAsc(c.getId());
        List<TeacherSessionDto> sessionDtos = sessions.stream().map(s -> {
            List<SessionMaterial> materials = sessionMaterialRepository.findBySessionIdOrderByCreatedAtAsc(s.getId());
            return TeacherSessionDto.builder()
                    .id(s.getId())
                    .classId(c.getId())
                    .sessionDate(s.getSessionDate())
                    .startTime(s.getStartTime())
                    .endTime(s.getEndTime())
                    .room(s.getRoom())
                    .topic(s.getTopic())
                    .status(s.getStatus())
                    .materials(materials.stream().map(SessionMaterialDto::fromEntity).toList())
                    .build();
        }).toList();

        TeacherClassDto dto = TeacherClassDto.builder()
                .id(c.getId())
                .code(c.getCode())
                .name(c.getName())
                .courseId(c.getCourse() != null ? c.getCourse().getId() : null)
                .courseName(c.getCourse() != null ? c.getCourse().getName() : null)
                .courseCode(c.getCourse() != null ? c.getCourse().getCode() : null)
                .room(c.getRoom())
                .startDate(c.getStartDate())
                .endDate(c.getEndDate())
                .status(c.getStatus())
                .enrolledStudents(students.size())
                .totalSessions(sessionDtos.size())
                .students(students)
                .sessions(sessionDtos)
                .build();

        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    @GetMapping("/sessions/{sessionId}")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<TeacherSessionDto>> getSessionDetails(
            @PathVariable Long sessionId,
            @AuthenticationPrincipal UserDetails userDetails) {

        ClassSession session = classSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy buổi học ID: " + sessionId));

        List<SessionMaterial> materials = sessionMaterialRepository.findBySessionIdOrderByCreatedAtAsc(sessionId);

        TeacherSessionDto dto = TeacherSessionDto.builder()
                .id(session.getId())
                .classId(session.getClassEntity().getId())
                .sessionDate(session.getSessionDate())
                .startTime(session.getStartTime())
                .endTime(session.getEndTime())
                .room(session.getRoom())
                .topic(session.getTopic())
                .status(session.getStatus())
                .materials(materials.stream().map(SessionMaterialDto::fromEntity).toList())
                .build();

        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    @GetMapping("/sessions/{sessionId}/attendance")
    public ResponseEntity<ApiResponse<List<AttendanceRecordDto>>> getSessionAttendance(
            @PathVariable Long sessionId) {
        List<AttendanceRecordDto> list = attendanceService.getSessionAttendance(sessionId);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @PostMapping("/sessions/{sessionId}/attendance")
    public ResponseEntity<ApiResponse<List<AttendanceRecordDto>>> markAttendance(
            @PathVariable Long sessionId,
            @Valid @RequestBody BulkAttendanceRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        User currentUser = getCurrentUser(userDetails);
        Long userId = currentUser != null ? currentUser.getId() : null;
        List<AttendanceRecordDto> records = attendanceService.markSessionAttendance(sessionId, request, userId);

        ClassSession session = classSessionRepository.findById(sessionId).orElse(null);
        String sessionTopic = session != null ? session.getTopic() : "Buổi #" + sessionId;
        auditService.recordAction(currentUser, "ATTENDANCE_RECORD", "SESSION", sessionId.toString(),
                "Điểm danh cho buổi học: " + sessionTopic + " (" + records.size() + " học viên)", null);

        return ResponseEntity.ok(ApiResponse.success("Đã cập nhật điểm danh thành công", records));
    }

    @PostMapping("/sessions/{sessionId}/materials")
    @Transactional
    public ResponseEntity<ApiResponse<SessionMaterialDto>> uploadMaterial(
            @PathVariable Long sessionId,
            @Valid @RequestBody CreateMaterialRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        ClassSession session = classSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy buổi học ID: " + sessionId));

        User currentUser = getCurrentUser(userDetails);

        SessionMaterial material = SessionMaterial.builder()
                .session(session)
                .title(request.getTitle())
                .description(request.getDescription())
                .materialType(request.getMaterialType() != null ? request.getMaterialType().toUpperCase() : "DOCUMENT")
                .fileUrl(request.getFileUrl())
                .uploadedBy(currentUser)
                .build();

        SessionMaterial saved = sessionMaterialRepository.save(material);

        auditService.recordAction(currentUser, "MATERIAL_UPLOAD", "SESSION_MATERIAL", saved.getId().toString(),
                "Tải lên tài liệu: " + saved.getTitle() + " (" + saved.getMaterialType() + ") cho buổi " + session.getTopic(), null);

        return ResponseEntity.ok(ApiResponse.success("Tải lên tài liệu thành công", SessionMaterialDto.fromEntity(saved)));
    }

    @DeleteMapping("/materials/{materialId}")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> deleteMaterial(
            @PathVariable Long materialId,
            @AuthenticationPrincipal UserDetails userDetails) {

        SessionMaterial material = sessionMaterialRepository.findById(materialId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài liệu ID: " + materialId));

        User currentUser = getCurrentUser(userDetails);
        auditService.recordAction(currentUser, "MATERIAL_DELETE", "SESSION_MATERIAL", materialId.toString(),
                "Xóa tài liệu: " + material.getTitle(), null);

        sessionMaterialRepository.delete(material);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa tài liệu thành công", null));
    }

    @GetMapping("/notifications")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<NotificationDto>>> getMyNotifications(
            @AuthenticationPrincipal UserDetails userDetails) {

        Teacher teacher = getCurrentTeacher(userDetails);
        List<ClassEntity> classes = classRepository.findByPrimaryTeacherIdOrderByStartDateDesc(teacher.getId());
        Set<Long> classIds = classes.stream().map(ClassEntity::getId).collect(Collectors.toSet());

        List<NotificationDto> notifications;
        if (classIds.isEmpty()) {
            notifications = notificationRepository.findForTeacher(Collections.singleton(-1L)).stream()
                    .map(NotificationDto::fromEntity)
                    .toList();
        } else {
            notifications = notificationRepository.findForTeacher(classIds).stream()
                    .map(NotificationDto::fromEntity)
                    .toList();
        }

        return ResponseEntity.ok(ApiResponse.success(notifications));
    }

    @PostMapping("/announcements")
    @Transactional
    public ResponseEntity<ApiResponse<NotificationDto>> createClassAnnouncement(
            @Valid @RequestBody vn.chacademy.notification.dto.CreateNotificationRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        Teacher teacher = getCurrentTeacher(userDetails);
        User currentUser = getCurrentUser(userDetails);

        if (request.getTargetClassId() == null) {
            throw new IllegalArgumentException("Giáo viên phải chọn lớp học cụ thể để gửi thông báo");
        }

        ClassEntity classEntity = classRepository.findById(request.getTargetClassId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp học với ID: " + request.getTargetClassId()));

        // Bảo mật: Đảm bảo giáo viên phụ trách lớp học này
        if (classEntity.getPrimaryTeacher() == null || !classEntity.getPrimaryTeacher().getId().equals(teacher.getId())) {
            throw new AccessDeniedException("Bạn không phụ trách lớp học này, không thể gửi thông báo.");
        }

        vn.chacademy.notification.entity.Notification notification = vn.chacademy.notification.entity.Notification.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .targetAudience("CLASS")
                .targetClass(classEntity)
                .priority(request.getPriority() != null ? request.getPriority() : "NORMAL")
                .createdBy(currentUser)
                .build();

        vn.chacademy.notification.entity.Notification saved = notificationRepository.save(notification);

        auditService.recordAction(currentUser, "NOTIFICATION_SEND", "NOTIFICATION", saved.getId().toString(),
                "Giáo viên phát thông báo cho lớp " + classEntity.getName() + ": " + saved.getTitle(), null);

        return ResponseEntity.ok(ApiResponse.success("Đã gửi thông báo thành công", NotificationDto.fromEntity(saved)));
    }

    @GetMapping("/announcements/my-sent")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<NotificationDto>>> getMySentAnnouncements(
            @AuthenticationPrincipal UserDetails userDetails) {

        User currentUser = getCurrentUser(userDetails);
        if (currentUser == null) {
            return ResponseEntity.ok(ApiResponse.success(Collections.emptyList()));
        }

        List<NotificationDto> sent = notificationRepository.findByCreatedByIdOrderByCreatedAtDesc(currentUser.getId())
                .stream()
                .map(NotificationDto::fromEntity)
                .toList();

        return ResponseEntity.ok(ApiResponse.success(sent));
    }

    @DeleteMapping("/announcements/{id}")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> deleteMyAnnouncement(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        User currentUser = getCurrentUser(userDetails);
        vn.chacademy.notification.entity.Notification notif = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông báo ID: " + id));

        if (notif.getCreatedBy() == null || !notif.getCreatedBy().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Bạn không có quyền xóa thông báo này");
        }

        notificationRepository.delete(notif);
        auditService.recordAction(currentUser, "NOTIFICATION_DELETE", "NOTIFICATION", id.toString(),
                "Thu hồi thông báo: " + notif.getTitle(), null);

        return ResponseEntity.ok(ApiResponse.success("Đã xóa thông báo thành công", null));
    }

    @GetMapping("/sessions/unmarked")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<TeacherSessionDto>>> getUnmarkedSessions(
            @AuthenticationPrincipal UserDetails userDetails) {

        Teacher teacher = getCurrentTeacher(userDetails);
        List<ClassEntity> classes = classRepository.findByPrimaryTeacherIdOrderByStartDateDesc(teacher.getId());

        List<TeacherSessionDto> unmarked = new ArrayList<>();
        for (ClassEntity c : classes) {
            List<ClassSession> sessions = classSessionRepository.findByClassEntityIdOrderBySessionDateAscStartTimeAsc(c.getId());
            for (ClassSession s : sessions) {
                var records = attendanceRecordRepository.findBySessionId(s.getId());
                if (records.isEmpty()) {
                    unmarked.add(TeacherSessionDto.builder()
                            .id(s.getId())
                            .classId(c.getId())
                            .sessionDate(s.getSessionDate())
                            .startTime(s.getStartTime())
                            .endTime(s.getEndTime())
                            .room(s.getRoom())
                            .topic(s.getTopic() + " (" + c.getName() + ")")
                            .status(s.getStatus())
                            .materials(Collections.emptyList())
                            .build());
                }
            }
        }

        return ResponseEntity.ok(ApiResponse.success(unmarked));
    }
}
