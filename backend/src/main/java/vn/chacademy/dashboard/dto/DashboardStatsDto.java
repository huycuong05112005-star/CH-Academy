package vn.chacademy.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
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

    public static DashboardStatsDtoBuilder builder() {
        return new DashboardStatsDtoBuilder();
    }

    public static class DashboardStatsDtoBuilder {
        private String academicYear;
        private String period;
        private List<String> availableAcademicYears;
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

        public DashboardStatsDtoBuilder academicYear(String academicYear) {
            this.academicYear = academicYear;
            return this;
        }

        public DashboardStatsDtoBuilder period(String period) {
            this.period = period;
            return this;
        }

        public DashboardStatsDtoBuilder availableAcademicYears(List<String> availableAcademicYears) {
            this.availableAcademicYears = availableAcademicYears;
            return this;
        }

        public DashboardStatsDtoBuilder totalStudents(long totalStudents) {
            this.totalStudents = totalStudents;
            return this;
        }

        public DashboardStatsDtoBuilder activeStudents(long activeStudents) {
            this.activeStudents = activeStudents;
            return this;
        }

        public DashboardStatsDtoBuilder totalStudentsCenter(long totalStudentsCenter) {
            this.totalStudentsCenter = totalStudentsCenter;
            return this;
        }

        public DashboardStatsDtoBuilder totalTeachers(long totalTeachers) {
            this.totalTeachers = totalTeachers;
            return this;
        }

        public DashboardStatsDtoBuilder totalCourses(long totalCourses) {
            this.totalCourses = totalCourses;
            return this;
        }

        public DashboardStatsDtoBuilder activeClasses(long activeClasses) {
            this.activeClasses = activeClasses;
            return this;
        }

        public DashboardStatsDtoBuilder totalLeads(long totalLeads) {
            this.totalLeads = totalLeads;
            return this;
        }

        public DashboardStatsDtoBuilder convertedLeads(long convertedLeads) {
            this.convertedLeads = convertedLeads;
            return this;
        }

        public DashboardStatsDtoBuilder leadConversionRate(double leadConversionRate) {
            this.leadConversionRate = leadConversionRate;
            return this;
        }

        public DashboardStatsDtoBuilder averageAttendanceRate(double averageAttendanceRate) {
            this.averageAttendanceRate = averageAttendanceRate;
            return this;
        }

        public DashboardStatsDtoBuilder totalReceivable(BigDecimal totalReceivable) {
            this.totalReceivable = totalReceivable;
            return this;
        }

        public DashboardStatsDtoBuilder totalPaid(BigDecimal totalPaid) {
            this.totalPaid = totalPaid;
            return this;
        }

        public DashboardStatsDtoBuilder totalDebt(BigDecimal totalDebt) {
            this.totalDebt = totalDebt;
            return this;
        }

        public DashboardStatsDtoBuilder upcomingSessions(List<UpcomingSessionDto> upcomingSessions) {
            this.upcomingSessions = upcomingSessions;
            return this;
        }

        public DashboardStatsDtoBuilder monthlyTrends(List<MonthlyStatDto> monthlyTrends) {
            this.monthlyTrends = monthlyTrends;
            return this;
        }

        public DashboardStatsDtoBuilder topCourses(List<CourseEnrollmentStatDto> topCourses) {
            this.topCourses = topCourses;
            return this;
        }

        public DashboardStatsDto build() {
            return new DashboardStatsDto(
                    academicYear,
                    period,
                    availableAcademicYears,
                    totalStudents,
                    activeStudents,
                    totalStudentsCenter,
                    totalTeachers,
                    totalCourses,
                    activeClasses,
                    totalLeads,
                    convertedLeads,
                    leadConversionRate,
                    averageAttendanceRate,
                    totalReceivable,
                    totalPaid,
                    totalDebt,
                    upcomingSessions,
                    monthlyTrends,
                    topCourses
            );
        }
    }
}
