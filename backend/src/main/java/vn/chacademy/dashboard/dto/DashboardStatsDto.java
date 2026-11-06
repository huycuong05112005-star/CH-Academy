package vn.chacademy.dashboard.dto;

import java.math.BigDecimal;
import java.util.List;

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

    public DashboardStatsDto() {
    }

    public DashboardStatsDto(String academicYear, String period, List<String> availableAcademicYears,
                             long totalStudents, long activeStudents, long totalStudentsCenter,
                             long totalTeachers, long totalCourses, long activeClasses,
                             long totalLeads, long convertedLeads, double leadConversionRate,
                             double averageAttendanceRate, BigDecimal totalReceivable,
                             BigDecimal totalPaid, BigDecimal totalDebt,
                             List<UpcomingSessionDto> upcomingSessions,
                             List<MonthlyStatDto> monthlyTrends,
                             List<CourseEnrollmentStatDto> topCourses) {
        this.academicYear = academicYear;
        this.period = period;
        this.availableAcademicYears = availableAcademicYears;
        this.totalStudents = totalStudents;
        this.activeStudents = activeStudents;
        this.totalStudentsCenter = totalStudentsCenter;
        this.totalTeachers = totalTeachers;
        this.totalCourses = totalCourses;
        this.activeClasses = activeClasses;
        this.totalLeads = totalLeads;
        this.convertedLeads = convertedLeads;
        this.leadConversionRate = leadConversionRate;
        this.averageAttendanceRate = averageAttendanceRate;
        this.totalReceivable = totalReceivable;
        this.totalPaid = totalPaid;
        this.totalDebt = totalDebt;
        this.upcomingSessions = upcomingSessions;
        this.monthlyTrends = monthlyTrends;
        this.topCourses = topCourses;
    }

    public static DashboardStatsDtoBuilder builder() {
        return new DashboardStatsDtoBuilder();
    }

    // Getters and Setters
    public String getAcademicYear() {
        return academicYear;
    }

    public void setAcademicYear(String academicYear) {
        this.academicYear = academicYear;
    }

    public String getPeriod() {
        return period;
    }

    public void setPeriod(String period) {
        this.period = period;
    }

    public List<String> getAvailableAcademicYears() {
        return availableAcademicYears;
    }

    public void setAvailableAcademicYears(List<String> availableAcademicYears) {
        this.availableAcademicYears = availableAcademicYears;
    }

    public long getTotalStudents() {
        return totalStudents;
    }

    public void setTotalStudents(long totalStudents) {
        this.totalStudents = totalStudents;
    }

    public long getActiveStudents() {
        return activeStudents;
    }

    public void setActiveStudents(long activeStudents) {
        this.activeStudents = activeStudents;
    }

    public long getTotalStudentsCenter() {
        return totalStudentsCenter;
    }

    public void setTotalStudentsCenter(long totalStudentsCenter) {
        this.totalStudentsCenter = totalStudentsCenter;
    }

    public long getTotalTeachers() {
        return totalTeachers;
    }

    public void setTotalTeachers(long totalTeachers) {
        this.totalTeachers = totalTeachers;
    }

    public long getTotalCourses() {
        return totalCourses;
    }

    public void setTotalCourses(long totalCourses) {
        this.totalCourses = totalCourses;
    }

    public long getActiveClasses() {
        return activeClasses;
    }

    public void setActiveClasses(long activeClasses) {
        this.activeClasses = activeClasses;
    }

    public long getTotalLeads() {
        return totalLeads;
    }

    public void setTotalLeads(long totalLeads) {
        this.totalLeads = totalLeads;
    }

    public long getConvertedLeads() {
        return convertedLeads;
    }

    public void setConvertedLeads(long convertedLeads) {
        this.convertedLeads = convertedLeads;
    }

    public double getLeadConversionRate() {
        return leadConversionRate;
    }

    public void setLeadConversionRate(double leadConversionRate) {
        this.leadConversionRate = leadConversionRate;
    }

    public double getAverageAttendanceRate() {
        return averageAttendanceRate;
    }

    public void setAverageAttendanceRate(double averageAttendanceRate) {
        this.averageAttendanceRate = averageAttendanceRate;
    }

    public BigDecimal getTotalReceivable() {
        return totalReceivable;
    }

    public void setTotalReceivable(BigDecimal totalReceivable) {
        this.totalReceivable = totalReceivable;
    }

    public BigDecimal getTotalPaid() {
        return totalPaid;
    }

    public void setTotalPaid(BigDecimal totalPaid) {
        this.totalPaid = totalPaid;
    }

    public BigDecimal getTotalDebt() {
        return totalDebt;
    }

    public void setTotalDebt(BigDecimal totalDebt) {
        this.totalDebt = totalDebt;
    }

    public List<UpcomingSessionDto> getUpcomingSessions() {
        return upcomingSessions;
    }

    public void setUpcomingSessions(List<UpcomingSessionDto> upcomingSessions) {
        this.upcomingSessions = upcomingSessions;
    }

    public List<MonthlyStatDto> getMonthlyTrends() {
        return monthlyTrends;
    }

    public void setMonthlyTrends(List<MonthlyStatDto> monthlyTrends) {
        this.monthlyTrends = monthlyTrends;
    }

    public List<CourseEnrollmentStatDto> getTopCourses() {
        return topCourses;
    }

    public void setTopCourses(List<CourseEnrollmentStatDto> topCourses) {
        this.topCourses = topCourses;
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
            DashboardStatsDto dto = new DashboardStatsDto();
            dto.academicYear = this.academicYear;
            dto.period = this.period;
            dto.availableAcademicYears = this.availableAcademicYears;
            dto.totalStudents = this.totalStudents;
            dto.activeStudents = this.activeStudents;
            dto.totalStudentsCenter = this.totalStudentsCenter;
            dto.totalTeachers = this.totalTeachers;
            dto.totalCourses = this.totalCourses;
            dto.activeClasses = this.activeClasses;
            dto.totalLeads = this.totalLeads;
            dto.convertedLeads = this.convertedLeads;
            dto.leadConversionRate = this.leadConversionRate;
            dto.averageAttendanceRate = this.averageAttendanceRate;
            dto.totalReceivable = this.totalReceivable;
            dto.totalPaid = this.totalPaid;
            dto.totalDebt = this.totalDebt;
            dto.upcomingSessions = this.upcomingSessions;
            dto.monthlyTrends = this.monthlyTrends;
            dto.topCourses = this.topCourses;
            return dto;
        }
    }
}
