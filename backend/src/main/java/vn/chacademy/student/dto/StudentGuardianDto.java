package vn.chacademy.student.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.chacademy.student.entity.StudentGuardian;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentGuardianDto {
    private Long guardianId;
    private String guardianCode;
    private String fullName;
    private String phone;
    private String email;
    private String relationshipType;
    private Boolean isPrimaryContact;

    public static StudentGuardianDto fromEntity(StudentGuardian sg) {
        if (sg == null || sg.getGuardian() == null) return null;
        return StudentGuardianDto.builder()
                .guardianId(sg.getGuardian().getId())
                .guardianCode(sg.getGuardian().getGuardianCode())
                .fullName(sg.getGuardian().getFullName())
                .phone(sg.getGuardian().getPhone())
                .email(sg.getGuardian().getEmail())
                .relationshipType(sg.getRelationshipType())
                .isPrimaryContact(sg.getIsPrimaryContact())
                .build();
    }
}
