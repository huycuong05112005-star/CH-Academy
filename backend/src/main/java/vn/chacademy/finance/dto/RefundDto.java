package vn.chacademy.finance.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RefundDto {
    private Long id;
    private String refundCode;
    private Long paymentId;
    private String paymentCode;
    private BigDecimal amount;
    private String reason;
    private String approvedByName;
    private LocalDate refundDate;
    private Instant createdAt;
}
