package vn.chacademy.finance.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProcessRefundRequest {

    @NotNull(message = "ID thanh toán không được để trống")
    private Long paymentId;

    @NotNull(message = "Số tiền hoàn lại không được để trống")
    @DecimalMin(value = "1.00", message = "Số tiền hoàn lại phải lớn hơn 0")
    private BigDecimal amount;

    @NotBlank(message = "Lý do hoàn tiền không được để trống")
    private String reason;
}
