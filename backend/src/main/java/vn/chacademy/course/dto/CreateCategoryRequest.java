package vn.chacademy.course.dto;

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
public class CreateCategoryRequest {

    @NotBlank(message = "Mã danh mục không được để trống")
    @Size(max = 30, message = "Mã danh mục tối đa 30 ký tự")
    @Pattern(regexp = "^[A-Z0-9_-]+$", message = "Mã danh mục chỉ được chứa chữ hoa, số, dấu gạch nối và gạch dưới")
    private String code;

    @NotBlank(message = "Tên danh mục không được để trống")
    @Size(max = 150, message = "Tên danh mục tối đa 150 ký tự")
    private String name;

    private String description;

    @Builder.Default
    private Integer displayOrder = 0;

    @Builder.Default
    private Boolean isActive = true;
}
