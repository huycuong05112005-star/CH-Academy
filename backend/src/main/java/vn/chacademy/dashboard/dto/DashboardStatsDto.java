package vn.chacademy.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsDto {
    private String academicYear;
    private List<String> availableAcademicYears;

    // Academic Year Scoped Metrics
    private long totalStudents;
    private long activeStudents;
    private long totalStudentsCenter;
    private long totalCourses;
    private long activeClasses;
    private long totalLeads;
    private long convertedLeads;
    private double leadConversionRate;

    private BigDecimal totalReceivable;
    private BigDecimal totalPaid;
    private BigDecimal totalDebt;

    private List<UpcomingSessionDto> upcomingSessions;
}
