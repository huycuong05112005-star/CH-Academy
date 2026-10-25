package vn.chacademy.academic.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.chacademy.academic.entity.TeacherAssignment;

import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeacherAssignmentDto {
    private Long id;
    private Long classId;
    private String classCode;
    private String className;
    private Long teacherId;
    private String teacherCode;
    private String teacherName;
    private String role;
    private String status;
    private LocalDate startDate;
    private LocalDate endDate;
    private String assignedByName;
    private String notes;
    private Instant createdAt;

    public static TeacherAssignmentDto fromEntity(TeacherAssignment entity) {
        if (entity == null) return null;
        return TeacherAssignmentDto.builder()
                .id(entity.getId())
                .classId(entity.getClassEntity() != null ? entity.getClassEntity().getId() : null)
                .classCode(entity.getClassEntity() != null ? entity.getClassEntity().getCode() : null)
                .className(entity.getClassEntity() != null ? entity.getClassEntity().getName() : null)
                .teacherId(entity.getTeacher() != null ? entity.getTeacher().getId() : null)
                .teacherCode(entity.getTeacher() != null ? entity.getTeacher().getTeacherCode() : null)
                .teacherName(entity.getTeacher() != null ? entity.getTeacher().getFullName() : null)
                .role(entity.getRole())
                .status(entity.getStatus())
                .startDate(entity.getStartDate())
                .endDate(entity.getEndDate())
                .assignedByName(entity.getAssignedBy() != null ? entity.getAssignedBy().getFullName() : "Admin")
                .notes(entity.getNotes())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
