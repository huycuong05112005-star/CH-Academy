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
public class RecordPaymentRequest {

    @NotNull(message = "ID học viên không được để trống")
    private Long studentId;

    private Long receivableId;

    @NotNull(message = "Số tiền thanh toán không được để trống")
    @DecimalMin(value = "1.00", message = "Số tiền thanh toán phải lớn hơn 0")
    private BigDecimal amount;

    @NotBlank(message = "Phương thức thanh toán không được để trống")
    private String paymentMethod; // CASH, BANK_TRANSFER, POS, etc.

    private LocalDate paymentDate;

    private String referenceNumber;

    private String note;
}
