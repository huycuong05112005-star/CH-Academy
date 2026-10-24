package vn.chacademy.finance.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
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
public class CreateReceivableRequest {

    @NotNull(message = "ID học viên không được để trống")
    private Long studentId;

    private Long enrollmentId;

    @NotBlank(message = "Tiêu đề khoản thu không được để trống")
    private String title;

    @NotNull(message = "Số tiền phải thu không được để trống")
    @DecimalMin(value = "1.00", message = "Số tiền phải thu phải lớn hơn 0")
    private BigDecimal totalAmount;

    private LocalDate dueDate;

    private String note;
}
