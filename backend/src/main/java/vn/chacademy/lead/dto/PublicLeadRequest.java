package vn.chacademy.lead.dto;

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
public class PublicLeadRequest {

    @NotBlank(message = "Họ và tên không được để trống")
    @Size(max = 150, message = "Họ và tên không được vượt quá 150 ký tự")
    private String fullName;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(regexp = "^(0[3|5|7|8|9])[0-9]{8}$", message = "Số điện thoại không hợp lệ (định dạng VN: 10 chữ số)")
    private String phone;

    @Size(max = 100, message = "Email không được vượt quá 100 ký tự")
    private String email;

    private Long targetCourseId;

    @Size(max = 1000, message = "Nội dung ghi chú tối đa 1000 ký tự")
    private String notes;

    // Honeypot field for anti-bot spam protection: must be empty
    private String websiteUrl;
}
