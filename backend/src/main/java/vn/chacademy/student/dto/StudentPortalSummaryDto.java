package vn.chacademy.student.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.chacademy.academic.dto.EnrollmentDto;
import vn.chacademy.finance.dto.PaymentDto;
import vn.chacademy.finance.dto.ReceivableDto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentPortalSummaryDto {
    private StudentDto student;
    @Builder.Default
    private List<EnrollmentDto> enrollments = new ArrayList<>();
    @Builder.Default
    private List<ReceivableDto> receivables = new ArrayList<>();
    @Builder.Default
    private List<PaymentDto> payments = new ArrayList<>();

    private BigDecimal totalTuition;
    private BigDecimal paidTuition;
    private BigDecimal remainingTuition;
    private String tuitionStatus;

    private long totalSessions;
    private long presentSessions;
    private double attendanceRate;
}
