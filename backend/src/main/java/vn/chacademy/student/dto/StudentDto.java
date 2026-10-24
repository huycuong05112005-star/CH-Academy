package vn.chacademy.student.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.chacademy.student.entity.Student;

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

    public static StudentDto fromEntity(Student s) {
        if (s == null) return null;
        List<StudentGuardianDto> guardianDtos = new ArrayList<>();
        if (s.getStudentGuardians() != null) {
            guardianDtos = s.getStudentGuardians().stream()
                    .map(StudentGuardianDto::fromEntity)
                    .collect(Collectors.toList());
        }

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
                .build();
    }
}
