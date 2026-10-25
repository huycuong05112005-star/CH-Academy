package vn.chacademy.student.dto;

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
public class EnrollAndPayRequest {

    @NotNull(message = "Lớp học không được để trống")
    private Long classId;

    private BigDecimal paidAmount;

    @Builder.Default
    private String paymentMethod = "BANK_TRANSFER";

    private String referenceNumber;

    private String notes;

    @Builder.Default
    private Boolean provisionAccount = true;
}
