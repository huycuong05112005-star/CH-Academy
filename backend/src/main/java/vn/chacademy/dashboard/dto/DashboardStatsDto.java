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
    private String period;
    private List<String> availableAcademicYears;

    // Academic Year Scoped Metrics
    private long totalStudents;
    private long activeStudents;
    private long totalStudentsCenter;
    private long totalTeachers;
    private long totalCourses;
    private long activeClasses;
    private long totalLeads;
    private long convertedLeads;
    private double leadConversionRate;
    private double averageAttendanceRate;

    private BigDecimal totalReceivable;
    private BigDecimal totalPaid;
    private BigDecimal totalDebt;

    private List<UpcomingSessionDto> upcomingSessions;
    private List<MonthlyStatDto> monthlyTrends;
    private List<CourseEnrollmentStatDto> topCourses;
}
