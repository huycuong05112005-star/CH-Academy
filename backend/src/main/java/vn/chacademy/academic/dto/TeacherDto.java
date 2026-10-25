package vn.chacademy.academic.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.chacademy.academic.entity.Teacher;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeacherDto {
    private Long id;
    private Long userId;
    private String username;
    private String rawPassword;
    private String teacherCode;
    private String fullName;
    private String email;
    private String phone;
    private String specialization;
    private String bio;
    private String status;
    private Instant createdAt;

    public static TeacherDto fromEntity(Teacher t) {
        if (t == null) return null;
        return TeacherDto.builder()
                .id(t.getId())
                .userId(t.getUser() != null ? t.getUser().getId() : null)
                .username(t.getUser() != null ? t.getUser().getUsername() : null)
                .rawPassword(t.getUser() != null ? t.getUser().getRawPassword() : null)
                .teacherCode(t.getTeacherCode())
                .fullName(t.getFullName())
                .email(t.getEmail())
                .phone(t.getPhone())
                .specialization(t.getSpecialization())
                .bio(t.getBio())
                .status(t.getStatus())
                .createdAt(t.getCreatedAt())
                .build();
    }
}
