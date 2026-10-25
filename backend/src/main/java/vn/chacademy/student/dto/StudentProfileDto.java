package vn.chacademy.student.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentProfileDto {
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
    private String username;
    private List<GuardianInfo> guardians;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GuardianInfo {
        private Long id;
        private String guardianCode;
        private String fullName;
        private String phone;
        private String email;
        private String relationshipType;
        private Boolean isPrimaryContact;
    }
}
