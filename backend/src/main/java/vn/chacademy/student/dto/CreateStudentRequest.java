package vn.chacademy.student.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
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
public class CreateStudentRequest {

    @NotBlank(message = "Mã học viên không được để trống")
    @Size(max = 30, message = "Mã học viên tối đa 30 ký tự")
    @Pattern(regexp = "^[A-Z0-9_-]+$", message = "Mã học viên chỉ được chứa chữ hoa, số và gạch ngang")
    private String studentCode;

    @NotBlank(message = "Họ và tên học viên không được để trống")
    @Size(max = 150, message = "Họ và tên tối đa 150 ký tự")
    private String fullName;

    private LocalDate dateOfBirth;

    @Builder.Default
    private String gender = "OTHER"; // MALE, FEMALE, OTHER

    @Pattern(regexp = "^(0[0-9]{9})?$", message = "Số điện thoại không đúng định dạng (10 chữ số)")
    private String phone;

    private String email;

    private String address;

    @Builder.Default
    private String targetType = "ADULT"; // KID, ADULT

    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, INACTIVE, GRADUATED, DROPPED

    private String internalNotes;

    // Optional list of guardian relationships to link upon creation
    private List<GuardianLinkRequest> guardians;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GuardianLinkRequest {
        private Long guardianId;
        private String relationshipType; // FATHER, MOTHER, GUARDIAN, OTHER
        private Boolean isPrimaryContact;
    }
}
