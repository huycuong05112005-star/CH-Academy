package vn.chacademy.student.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.chacademy.student.entity.Student;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentDto {
    private Long id;
    private String studentCode;
    private String fullName;
    private LocalDate dateOfBirth;
    private String gender;
    private String phone;
    private String email;
    private String address;
    private String targetType;
    private String status;
    private String internalNotes;
    private Instant createdAt;
    private Instant updatedAt;
    @Builder.Default
    private List<StudentGuardianDto> guardians = new ArrayList<>();

    // Automated Finance & Account Enrichment
    private Boolean hasUserAccount;
    private String username;
    private String enrolledCourseName;
    private String enrolledClassName;
    private BigDecimal totalTuition;
    private BigDecimal paidTuition;
    private BigDecimal remainingTuition;
    private String tuitionStatus;

    public static StudentDto fromEntity(Student s) {
        if (s == null) return null;
        List<StudentGuardianDto> guardianDtos = new ArrayList<>();
        if (s.getStudentGuardians() != null) {
            guardianDtos = s.getStudentGuardians().stream()
                    .map(StudentGuardianDto::fromEntity)
                    .collect(Collectors.toList());
        }

        boolean hasAccount = s.getUser() != null;
        String userLogin = hasAccount ? s.getUser().getUsername() : null;

        return StudentDto.builder()
                .id(s.getId())
                .studentCode(s.getStudentCode())
                .fullName(s.getFullName())
                .dateOfBirth(s.getDateOfBirth())
                .gender(s.getGender())
                .phone(s.getPhone())
                .email(s.getEmail())
                .address(s.getAddress())
                .targetType(s.getTargetType())
                .status(s.getStatus())
                .internalNotes(s.getInternalNotes())
                .createdAt(s.getCreatedAt())
                .updatedAt(s.getUpdatedAt())
                .guardians(guardianDtos)
                .hasUserAccount(hasAccount)
                .username(userLogin)
                .totalTuition(BigDecimal.ZERO)
                .paidTuition(BigDecimal.ZERO)
                .remainingTuition(BigDecimal.ZERO)
                .tuitionStatus("NO_ENROLLMENT")
                .build();
    }
}
