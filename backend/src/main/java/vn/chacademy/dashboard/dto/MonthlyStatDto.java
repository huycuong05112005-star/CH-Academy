package vn.chacademy.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyStatDto {
    private String month; // e.g. "T09/2026", "T10/2026"
    private BigDecimal revenue;
    private long newEnrollments;
    private long completedSessions;
}

