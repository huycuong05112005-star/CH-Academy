package vn.chacademy.academic.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import vn.chacademy.academic.dto.AssignTeacherRequest;
import vn.chacademy.academic.dto.TeacherAssignmentDto;
import vn.chacademy.academic.entity.ClassEntity;
import vn.chacademy.academic.entity.Teacher;
import vn.chacademy.academic.entity.TeacherAssignment;
import vn.chacademy.academic.repository.ClassRepository;
import vn.chacademy.academic.repository.TeacherAssignmentRepository;
import vn.chacademy.academic.repository.TeacherRepository;
import vn.chacademy.common.audit.service.AuditService;
import vn.chacademy.common.dto.ApiResponse;
import vn.chacademy.common.exception.ResourceNotFoundException;
import vn.chacademy.identity.entity.User;
import vn.chacademy.identity.repository.UserRepository;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/teacher-assignments")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF', 'ADMIN')")
public class TeacherAssignmentAdminController {

    private final TeacherAssignmentRepository teacherAssignmentRepository;
    private final ClassRepository classRepository;
    private final TeacherRepository teacherRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<TeacherAssignmentDto>>> getAllAssignments(
            @RequestParam(required = false) Long classId,
            @RequestParam(required = false) Long teacherId) {

        List<TeacherAssignment> list;
        if (classId != null) {
            list = teacherAssignmentRepository.findByClassEntityIdOrderByCreatedAtDesc(classId);
        } else if (teacherId != null) {
            list = teacherAssignmentRepository.findByTeacherIdOrderByCreatedAtDesc(teacherId);
        } else {
            list = teacherAssignmentRepository.findAllByOrderByCreatedAtDesc();
        }

        List<TeacherAssignmentDto> dtos = list.stream().map(TeacherAssignmentDto::fromEntity).toList();
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    @PostMapping
    @Transactional
    public ResponseEntity<ApiResponse<TeacherAssignmentDto>> assignTeacher(
            @Valid @RequestBody AssignTeacherRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        ClassEntity classEntity = classRepository.findById(request.getClassId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp học với ID: " + request.getClassId()));

        Teacher teacher = teacherRepository.findById(request.getTeacherId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy giáo viên với ID: " + request.getTeacherId()));

        User actor = userDetails != null ? userRepository.findByUsername(userDetails.getUsername()).orElse(null) : null;

        String role = (request.getRole() != null && !request.getRole().isBlank()) ? request.getRole() : "PRIMARY";
        LocalDate startDate = request.getStartDate() != null ? request.getStartDate() : LocalDate.now();

        // Update class primary teacher if role is PRIMARY
        if ("PRIMARY".equalsIgnoreCase(role)) {
            classEntity.setPrimaryTeacher(teacher);
            classRepository.save(classEntity);
        }

        TeacherAssignment assignment = TeacherAssignment.builder()
                .classEntity(classEntity)
                .teacher(teacher)
                .role(role)
                .status("ACTIVE")
                .startDate(startDate)
                .assignedBy(actor)
                .notes(request.getNotes())
                .build();

        TeacherAssignment saved = teacherAssignmentRepository.save(assignment);

        auditService.recordAction(actor, "TEACHER_ASSIGN", "CLASS", classEntity.getId().toString(),
                "Phân công giáo viên " + teacher.getFullName() + " vào lớp " + classEntity.getName() + " (vai trò: " + role + ")", null);

        return ResponseEntity.ok(ApiResponse.success("Phân công giáo viên thành công", TeacherAssignmentDto.fromEntity(saved)));
    }

    @PutMapping("/{id}/end")
    @Transactional
    public ResponseEntity<ApiResponse<TeacherAssignmentDto>> endAssignment(
            @PathVariable Long id,
            @RequestParam(required = false) String reason,
            @AuthenticationPrincipal UserDetails userDetails) {

        TeacherAssignment assignment = teacherAssignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bản ghi phân công với ID: " + id));

        assignment.setStatus("ENDED");
        assignment.setEndDate(LocalDate.now());
        if (reason != null && !reason.isBlank()) {
            assignment.setNotes((assignment.getNotes() != null ? assignment.getNotes() + " | " : "") + "Kết thúc: " + reason);
        }

        TeacherAssignment updated = teacherAssignmentRepository.save(assignment);
        User actor = userDetails != null ? userRepository.findByUsername(userDetails.getUsername()).orElse(null) : null;

        auditService.recordAction(actor, "TEACHER_UNASSIGN", "CLASS", assignment.getClassEntity().getId().toString(),
                "Kết thúc phân công giáo viên " + assignment.getTeacher().getFullName() + " tại lớp " + assignment.getClassEntity().getName(), null);

        return ResponseEntity.ok(ApiResponse.success("Đã kết thúc phân công giáo viên", TeacherAssignmentDto.fromEntity(updated)));
    }
}
