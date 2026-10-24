package vn.chacademy.finance.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentAllocationDto {
    private Long id;
    private Long paymentId;
    private Long receivableId;
    private String receivableCode;
    private String receivableTitle;
    private BigDecimal allocatedAmount;
    private Instant createdAt;
}
