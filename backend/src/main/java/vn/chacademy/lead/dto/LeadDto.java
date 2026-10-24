package vn.chacademy.lead.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.chacademy.lead.entity.Lead;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeadDto {
    private Long id;
    private String leadCode;
    private String fullName;
    private String phone;
    private String email;
    private String source;
    private Long targetCourseId;
    private String targetCourseName;
    private Long assignedStaffId;
    private String assignedStaffName;
    private String status;
    private String notes;
    private Long convertedStudentId;
    private String convertedStudentCode;
    private String convertedStudentName;
    private Instant createdAt;
    private Instant updatedAt;
    private List<LeadActivityDto> activities;

    public static LeadDto fromEntity(Lead lead) {
        if (lead == null) return null;
        return LeadDto.builder()
                .id(lead.getId())
                .leadCode(lead.getLeadCode())
                .fullName(lead.getFullName())
                .phone(lead.getPhone())
                .email(lead.getEmail())
                .source(lead.getSource())
                .targetCourseId(lead.getTargetCourse() != null ? lead.getTargetCourse().getId() : null)
                .targetCourseName(lead.getTargetCourse() != null ? lead.getTargetCourse().getName() : null)
                .assignedStaffId(lead.getAssignedStaff() != null ? lead.getAssignedStaff().getId() : null)
                .assignedStaffName(lead.getAssignedStaff() != null ? lead.getAssignedStaff().getFullName() : null)
                .status(lead.getStatus())
                .notes(lead.getNotes())
                .convertedStudentId(lead.getConvertedStudent() != null ? lead.getConvertedStudent().getId() : null)
                .convertedStudentCode(lead.getConvertedStudent() != null ? lead.getConvertedStudent().getStudentCode() : null)
                .convertedStudentName(lead.getConvertedStudent() != null ? lead.getConvertedStudent().getFullName() : null)
                .createdAt(lead.getCreatedAt())
                .updatedAt(lead.getUpdatedAt())
                .activities(lead.getActivities() != null
                        ? lead.getActivities().stream().map(LeadActivityDto::fromEntity).toList()
                        : List.of())
                .build();
    }
}
