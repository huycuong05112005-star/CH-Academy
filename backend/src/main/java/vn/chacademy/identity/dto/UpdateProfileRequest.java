package vn.chacademy.identity.dto;

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
public class UpdateProfileRequest {

    @NotBlank(message = "Họ và tên không được để trống")
    @Size(min = 2, max = 150, message = "Họ và tên phải từ 2 đến 150 ký tự")
    private String fullName;

    @Pattern(regexp = "^(0|\\+84)[0-9]{9,10}$|^$", message = "Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0 hoặc +84)")
    private String phone;

    @Size(max = 255, message = "URL ảnh đại diện tối đa 255 ký tự")
    private String avatarUrl;

    @Size(max = 255, message = "Chuyên môn tối đa 255 ký tự")
    private String specialization;

    @Size(max = 1000, message = "Tiểu sử giới thiệu tối đa 1000 ký tự")
    private String bio;
}
