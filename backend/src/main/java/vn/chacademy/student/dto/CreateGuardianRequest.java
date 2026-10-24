package vn.chacademy.student.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateGuardianRequest {

    @NotBlank(message = "Mã người giám hộ không được để trống")
    @Size(max = 30, message = "Mã người giám hộ tối đa 30 ký tự")
    @Pattern(regexp = "^[A-Z0-9_-]+$", message = "Mã người giám hộ chỉ được chứa chữ hoa, số và gạch ngang")
    private String guardianCode;

    @NotBlank(message = "Họ và tên người giám hộ không được để trống")
    @Size(max = 150, message = "Họ và tên tối đa 150 ký tự")
    private String fullName;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(regexp = "^(0[0-9]{9})$", message = "Số điện thoại phải gồm 10 chữ số bắt đầu bằng số 0")
    private String phone;

    private String email;

    private String address;

    private String occupation;
}
