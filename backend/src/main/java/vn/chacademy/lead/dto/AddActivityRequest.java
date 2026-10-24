package vn.chacademy.lead.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddActivityRequest {

    @NotBlank(message = "Loại hoạt động không được để trống")
    @Pattern(regexp = "^(CALL|MESSAGE|MEETING|NOTE|STATUS_CHANGE)$", message = "Loại hoạt động không hợp lệ")
    private String actionType;

    @NotBlank(message = "Nội dung hoạt động không được để trống")
    private String content;
}
