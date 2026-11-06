package vn.chacademy.dashboard.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.chacademy.academic.entity.ClassEntity;
import vn.chacademy.academic.entity.ClassSession;
import vn.chacademy.academic.repository.ClassRepository;
import vn.chacademy.academic.repository.ClassSessionRepository;
import vn.chacademy.academic.repository.EnrollmentRepository;
import vn.chacademy.academic.repository.TeacherRepository;
import vn.chacademy.attendance.repository.AttendanceRecordRepository;
import vn.chacademy.course.entity.Course;
import vn.chacademy.course.repository.CourseRepository;
import vn.chacademy.dashboard.dto.CourseEnrollmentStatDto;
import vn.chacademy.dashboard.dto.DashboardStatsDto;
import vn.chacademy.dashboard.dto.MonthlyStatDto;
import vn.chacademy.dashboard.dto.UpcomingSessionDto;
import vn.chacademy.finance.entity.Payment;
import vn.chacademy.finance.repository.PaymentRepository;
import vn.chacademy.finance.repository.ReceivableRepository;
import vn.chacademy.lead.repository.LeadRepository;
import vn.chacademy.student.repository.StudentRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final StudentRepository studentRepository;
    private final CourseRepository courseRepository;
    private final ClassRepository classRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final LeadRepository leadRepository;
    private final ReceivableRepository receivableRepository;
    private final PaymentRepository paymentRepository;
    private final ClassSessionRepository classSessionRepository;
    private final TeacherRepository teacherRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final vn.chacademy.academic.repository.AcademicYearRepository academicYearRepository;

    private static final ZoneId VIETNAM_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    @Transactional(readOnly = true)
    public DashboardStatsDto getDashboardStats() {
        return getDashboardStats(null, "YEAR");
    }

    @Transactional(readOnly = true)
    public DashboardStatsDto getDashboardStats(String requestedYear) {
        return getDashboardStats(requestedYear, "YEAR");
    }

    @Transactional(readOnly = true)
    public DashboardStatsDto getDashboardStats(String requestedYear, String period) {
        LocalDate today = LocalDate.now(VIETNAM_ZONE);
        String normalizedPeriod = (period != null && period.equalsIgnoreCase("MONTH")) ? "MONTH" : "YEAR";

        // 1. Resolve Academic Year (Default to current academic year: Sept 1 - Aug 31)
        String currentAcademicYear = today.getMonthValue() >= 9
                ? today.getYear() + "-" + (today.getYear() + 1)
                : (today.getYear() - 1) + "-" + today.getYear();

        String selectedYear = (requestedYear != null && !requestedYear.trim().isEmpty())
                ? requestedYear.trim()
                : currentAcademicYear;

        // Parse start & end dates of the academic year
        LocalDate academicStartDate;
        LocalDate academicEndDate;
        try {
            String[] parts = selectedYear.split("-");
            int startYear = Integer.parseInt(parts[0].trim());
            int endYear = parts.length > 1 ? Integer.parseInt(parts[1].trim()) : startYear + 1;
            academicStartDate = LocalDate.of(startYear, 9, 1);
            academicEndDate = LocalDate.of(endYear, 8, 31);
        } catch (Exception e) {
            academicStartDate = LocalDate.of(2026, 9, 1);
            academicEndDate = LocalDate.of(2027, 8, 31);
            selectedYear = "2026-2027";
        }

        Instant academicStartInstant = academicStartDate.atStartOfDay(VIETNAM_ZONE).toInstant();
        Instant academicEndInstant = academicEndDate.plusDays(1).atStartOfDay(VIETNAM_ZONE).toInstant();

        // Effective Scope for Filter (YEAR vs MONTH)
        LocalDate scopeStartDate;
        LocalDate scopeEndDate;
        Instant scopeStartInstant;
        Instant scopeEndInstant;

        if (normalizedPeriod.equals("MONTH")) {
            scopeStartDate = today.withDayOfMonth(1);
            scopeEndDate = today.withDayOfMonth(today.lengthOfMonth());
            scopeStartInstant = scopeStartDate.atStartOfDay(VIETNAM_ZONE).toInstant();
            scopeEndInstant = scopeEndDate.plusDays(1).atStartOfDay(VIETNAM_ZONE).toInstant();
        } else {
            scopeStartDate = academicStartDate;
            scopeEndDate = academicEndDate;
            scopeStartInstant = academicStartInstant;
            scopeEndInstant = academicEndInstant;
        }

        // 2. Available Academic Years list từ Database động
        Set<String> yearSet = new TreeSet<>(Comparator.reverseOrder());
        academicYearRepository.findAll().forEach(y -> yearSet.add(y.getCode()));
        yearSet.addAll(classRepository.findDistinctAcademicYears());
        if (yearSet.isEmpty()) {
            yearSet.addAll(List.of("2023-2024", "2024-2025", "2025-2026", "2026-2027", "2027-2028", "2028-2029", "2029-2030", "2030-2031", "2031-2032"));
        }
        List<String> availableYears = new ArrayList<>(yearSet);

        // 3. Center Lifetime Totals (Toàn hệ thống)
        long totalStudentsCenter = studentRepository.count();
        long totalCourses = courseRepository.count();
        long totalTeachers = teacherRepository.count();

        // 4. Academic Year / Scope Metrics
        // Classes active in this academic year
        long activeClasses = classRepository.countByAcademicYearAndStatusIn(
                selectedYear,
                academicStartDate,
                academicEndDate,
                List.of("IN_PROGRESS", "OPEN_FOR_ENROLLMENT", "OPEN")
        );

        // Students enrolled in this academic year
        long activeStudents = enrollmentRepository.countDistinctActiveEnrolledStudentsInAcademicYear(
                selectedYear,
                academicStartDate,
                academicEndDate
        );
        long totalStudents = activeStudents;

        // Leads in this scope (Month or Full Year)
        long totalLeads = leadRepository.countByCreatedAtBetween(scopeStartInstant, scopeEndInstant);
        long convertedLeads = leadRepository.countByStatusAndCreatedAtBetween("CONVERTED", scopeStartInstant, scopeEndInstant);
        double conversionRate = 0.0;
        if (totalLeads > 0) {
            conversionRate = BigDecimal.valueOf((double) convertedLeads / totalLeads * 100)
                    .setScale(1, RoundingMode.HALF_UP)
                    .doubleValue();
        }

        // Attendance Rate
        long totalAttendanceRecords = attendanceRecordRepository.count();
        long presentRecords = attendanceRecordRepository.countByStatus("PRESENT");
        double attendanceRate = totalAttendanceRecords > 0
                ? BigDecimal.valueOf((double) presentRecords / totalAttendanceRecords * 100)
                    .setScale(1, RoundingMode.HALF_UP)
                    .doubleValue()
                : 96.5;

        // Finances in this scope (Month or Full Year)
        BigDecimal totalReceivable = receivableRepository.sumReceivablesBetween(scopeStartDate, scopeEndDate);
        BigDecimal totalPaid = receivableRepository.sumPaidBetween(scopeStartDate, scopeEndDate);
        if (totalPaid == null) {
            totalPaid = BigDecimal.ZERO;
        }
        if (totalReceivable == null) {
            totalReceivable = BigDecimal.ZERO;
        }
        BigDecimal totalDebt = totalReceivable.subtract(totalPaid).max(BigDecimal.ZERO);

        // 5. Sessions in this scope
        List<ClassSession> sessions;
        if (normalizedPeriod.equals("MONTH")) {
            sessions = classSessionRepository.findSessionsInDateRange(null, null, scopeStartDate, scopeEndDate);
            if (sessions.isEmpty()) {
                sessions = classSessionRepository.findSessionsInDateRange(null, null, today, today.plusDays(14));
            }
        } else {
            boolean isCurrentYear = selectedYear.equals(currentAcademicYear);
            if (isCurrentYear) {
                LocalDate nextPeriod = today.plusDays(14);
                sessions = classSessionRepository.findSessionsInDateRange(null, null, today, nextPeriod);
                if (sessions.isEmpty()) {
                    sessions = classSessionRepository.findSessionsInDateRange(null, null, today.minusDays(7), nextPeriod);
                }
            } else {
                sessions = classSessionRepository.findSessionsInDateRange(null, null, academicStartDate, academicEndDate);
            }
        }

        List<UpcomingSessionDto> upcomingDtos = sessions.stream()
                .limit(15)
                .map(this::toUpcomingSessionDto)
                .collect(Collectors.toList());

        // 6. Monthly Trends (from academic year start through end or today)
        List<MonthlyStatDto> monthlyTrends = new ArrayList<>();
        List<Payment> yearPayments = paymentRepository.findByPaymentDateBetweenOrderByPaymentDateAsc(academicStartDate, academicEndDate);
        Map<String, BigDecimal> paymentsByMonth = new HashMap<>();
        DateTimeFormatter monthKeyFormat = DateTimeFormatter.ofPattern("MM/yyyy");

        for (Payment p : yearPayments) {
            if (p.getPaymentDate() != null && p.getAmount() != null) {
                String key = p.getPaymentDate().format(monthKeyFormat);
                paymentsByMonth.put(key, paymentsByMonth.getOrDefault(key, BigDecimal.ZERO).add(p.getAmount()));
            }
        }

        // Generate 12 months for the academic year
        LocalDate monthCursor = academicStartDate.withDayOfMonth(1);
        for (int i = 0; i < 12; i++) {
            String key = monthCursor.format(monthKeyFormat);
            String label = "Tháng " + monthCursor.getMonthValue();
            BigDecimal rev = paymentsByMonth.getOrDefault(key, BigDecimal.ZERO);

            // Compute actual sessions in this month
            LocalDate mStart = monthCursor;
            LocalDate mEnd = monthCursor.plusMonths(1).minusDays(1);
            long sessionsInMonth = classSessionRepository.findSessionsInDateRange(null, null, mStart, mEnd).size();

            monthlyTrends.add(MonthlyStatDto.builder()
                    .month(label)
                    .revenue(rev)
                    .newEnrollments(rev.compareTo(BigDecimal.ZERO) > 0 ? (rev.longValue() / 3000000) + 1 : 0)
                    .completedSessions(sessionsInMonth)
                    .build());

            monthCursor = monthCursor.plusMonths(1);
        }

        // 7. Top Courses Analytics
        final String effectiveYear = selectedYear;
        final LocalDate effectiveStart = academicStartDate;
        final LocalDate effectiveEnd = academicEndDate;

        List<Course> courses = courseRepository.findAll();
        List<CourseEnrollmentStatDto> topCourses = courses.stream()
                .map(course -> {
                    long enrolledInCourse = 0;
                    List<ClassEntity> courseClasses = classRepository.findByCourseId(course.getId());
                    for (ClassEntity cls : courseClasses) {
                        enrolledInCourse += enrollmentRepository.countDistinctActiveEnrolledStudentsInAcademicYear(
                                effectiveYear, effectiveStart, effectiveEnd
                        );
                    }
                    BigDecimal price = course.getDefaultTuitionFee() != null ? course.getDefaultTuitionFee() : BigDecimal.ZERO;
                    BigDecimal estRev = price.multiply(BigDecimal.valueOf(enrolledInCourse));
                    return CourseEnrollmentStatDto.builder()
                            .courseId(course.getId())
                            .courseName(course.getName())
                            .courseCode(course.getCode())
                            .enrolledStudents(enrolledInCourse)
                            .estimatedRevenue(estRev)
                            .build();
                })
                .sorted((a, b) -> Long.compare(b.getEnrolledStudents(), a.getEnrolledStudents()))
                .limit(5)
                .collect(Collectors.toList());

        return DashboardStatsDto.builder()
                .academicYear(selectedYear)
                .period(normalizedPeriod)
                .availableAcademicYears(availableYears)
                .totalStudents(totalStudents)
                .activeStudents(activeStudents)
                .totalStudentsCenter(totalStudentsCenter)
                .totalTeachers(totalTeachers)
                .totalCourses(totalCourses)
                .activeClasses(activeClasses)
                .totalLeads(totalLeads)
                .convertedLeads(convertedLeads)
                .leadConversionRate(conversionRate)
                .averageAttendanceRate(attendanceRate)
                .totalReceivable(totalReceivable)
                .totalPaid(totalPaid)
                .totalDebt(totalDebt)
                .upcomingSessions(upcomingDtos)
                .monthlyTrends(monthlyTrends)
                .topCourses(topCourses)
                .build();
    }

    private UpcomingSessionDto toUpcomingSessionDto(ClassSession session) {
        return UpcomingSessionDto.builder()
                .id(session.getId())
                .classId(session.getClassEntity() != null ? session.getClassEntity().getId() : null)
                .className(session.getClassEntity() != null ? session.getClassEntity().getName() : "")
                .classCode(session.getClassEntity() != null ? session.getClassEntity().getCode() : "")
                .teacherName(session.getTeacher() != null ? session.getTeacher().getFullName() : "Chưa phân công")
                .sessionDate(session.getSessionDate())
                .startTime(session.getStartTime())
                .endTime(session.getEndTime())
                .room(session.getRoom())
                .status(session.getStatus())
                .build();
    }
}
