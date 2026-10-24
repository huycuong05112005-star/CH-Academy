package vn.chacademy.course.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateCourseRequest {

    @NotNull(message = "Danh mục khóa học không được để trống")
    private Long categoryId;

    @NotBlank(message = "Mã khóa học không được để trống")
    @Size(max = 30, message = "Mã khóa học tối đa 30 ký tự")
    @Pattern(regexp = "^[A-Z0-9_-]+$", message = "Mã khóa học chỉ được chứa chữ hoa, số, dấu gạch nối và gạch dưới")
    private String code;

    @NotBlank(message = "Tên khóa học không được để trống")
    @Size(max = 200, message = "Tên khóa học tối đa 200 ký tự")
    private String name;

    private String description;

    @NotBlank(message = "Đối tượng học viên không được để trống")
    private String targetAudience;

    @NotBlank(message = "Trình độ khóa học không được để trống")
    private String level;

    @NotNull(message = "Thời lượng học không được để trống")
    @Min(value = 1, message = "Thời lượng học tối thiểu 1 giờ")
    private Integer durationHours;

    @NotNull(message = "Học phí niêm yết không được để trống")
    @DecimalMin(value = "0.0", inclusive = true, message = "Học phí không được nhỏ hơn 0")
    private BigDecimal defaultTuitionFee;

    private String learningOutcomes;

    @NotNull(message = "Sĩ số tối đa không được để trống")
    @Min(value = 1, message = "Sĩ số tối đa ít nhất 1 học viên")
    private Integer maxStudents;

    @NotBlank(message = "Trạng thái không được để trống")
    private String status;

    @NotNull(message = "Trạng thái công khai không được để trống")
    private Boolean isPublic;
}
