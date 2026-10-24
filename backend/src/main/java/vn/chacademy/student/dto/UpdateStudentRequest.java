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
public class UpdateStudentRequest {

    @NotBlank(message = "Mã học viên không được để trống")
    @Size(max = 30, message = "Mã học viên tối đa 30 ký tự")
    @Pattern(regexp = "^[A-Z0-9_-]+$", message = "Mã học viên chỉ được chứa chữ hoa, số và gạch ngang")
    private String studentCode;

    @NotBlank(message = "Họ và tên học viên không được để trống")
    @Size(max = 150, message = "Họ và tên tối đa 150 ký tự")
    private String fullName;

    private LocalDate dateOfBirth;

    @NotBlank(message = "Giới tính không được để trống")
    private String gender;

    @Pattern(regexp = "^(0[0-9]{9})?$", message = "Số điện thoại không đúng định dạng (10 chữ số)")
    private String phone;

    private String email;

    private String address;

    @NotBlank(message = "Phân loại học viên không được để trống")
    private String targetType;

    @NotBlank(message = "Trạng thái không được để trống")
    private String status;

    private String internalNotes;

    private List<CreateStudentRequest.GuardianLinkRequest> guardians;
}
