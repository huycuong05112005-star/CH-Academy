package vn.chacademy.academic.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateMaterialRequest {

    @NotBlank(message = "Tiêu đề tài liệu không được để trống")
    private String title;

    private String description;

    @Builder.Default
    private String materialType = "DOCUMENT"; // SLIDE, DOCUMENT, EXERCISE, VIDEO, LINK

    @NotBlank(message = "Đường dẫn file hoặc liên kết không được để trống")
    private String fileUrl;
}
