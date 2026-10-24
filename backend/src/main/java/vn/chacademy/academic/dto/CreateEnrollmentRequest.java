package vn.chacademy.academic.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateEnrollmentRequest {

    @NotNull(message = "Lớp học không được để trống")
    private Long classId;

    @NotNull(message = "Học viên không được để trống")
    private Long studentId;

    @JsonFormat(pattern = "yyyy-MM-dd")
    @Builder.Default
    private LocalDate enrollmentDate = LocalDate.now();

    @DecimalMin(value = "0.0", message = "Học phí áp dụng không được âm")
    private BigDecimal appliedTuitionFee; // If null, defaults to course default fee

    @DecimalMin(value = "0.0", message = "Số tiền giảm giá không được âm")
    @Builder.Default
    private BigDecimal discountAmount = BigDecimal.ZERO;

    private String notes;
}
