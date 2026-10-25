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
public class ReceivableDto {
    private Long id;
    private String code;
    private Long studentId;
    private String studentCode;
    private String studentFullName;
    private Long enrollmentId;
    private String className;
    private String title;
    private BigDecimal totalAmount;
    private BigDecimal paidAmount;
    private BigDecimal remainingAmount;
    private String status;
    private LocalDate dueDate;
    private Instant createdAt;
}
