package vn.chacademy.finance.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinanceOverviewDto {
    private BigDecimal totalReceivables;
    private BigDecimal totalPaid;
    private BigDecimal totalDebt;
    private BigDecimal totalRefunds;
    private long totalReceivableCount;
    private long totalPaymentCount;
}
