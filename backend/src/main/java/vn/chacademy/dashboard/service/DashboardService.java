package vn.chacademy.dashboard.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.chacademy.academic.entity.ClassSession;
import vn.chacademy.academic.repository.ClassRepository;
import vn.chacademy.academic.repository.ClassSessionRepository;
import vn.chacademy.academic.repository.EnrollmentRepository;
import vn.chacademy.course.repository.CourseRepository;
import vn.chacademy.dashboard.dto.DashboardStatsDto;
import vn.chacademy.dashboard.dto.UpcomingSessionDto;
import vn.chacademy.finance.repository.ReceivableRepository;
import vn.chacademy.lead.repository.LeadRepository;
import vn.chacademy.student.repository.StudentRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
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
    private final ClassSessionRepository classSessionRepository;
    private final vn.chacademy.academic.repository.AcademicYearRepository academicYearRepository;

    private static final ZoneId VIETNAM_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    @Transactional(readOnly = true)
    public DashboardStatsDto getDashboardStats() {
        return getDashboardStats(null);
    }

    @Transactional(readOnly = true)
    public DashboardStatsDto getDashboardStats(String requestedYear) {
        LocalDate today = LocalDate.now(VIETNAM_ZONE);

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

        // 2. Available Academic Years list từ Database động (vượt qua giới hạn 2028)
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

        // 4. Academic Year Scoped Metrics
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

        // Leads in this academic year
        long totalLeads = leadRepository.countByCreatedAtBetween(academicStartInstant, academicEndInstant);
        long convertedLeads = leadRepository.countByStatusAndCreatedAtBetween("CONVERTED", academicStartInstant, academicEndInstant);
        double conversionRate = 0.0;
        if (totalLeads > 0) {
            conversionRate = BigDecimal.valueOf((double) convertedLeads / totalLeads * 100)
                    .setScale(1, RoundingMode.HALF_UP)
                    .doubleValue();
        }

        // Finances in this academic year
        BigDecimal totalReceivable = receivableRepository.sumReceivablesBetween(academicStartDate, academicEndDate);
        BigDecimal totalPaid = receivableRepository.sumPaidBetween(academicStartDate, academicEndDate);
        if (totalPaid == null) {
            totalPaid = BigDecimal.ZERO;
        }
        if (totalReceivable == null) {
            totalReceivable = BigDecimal.ZERO;
        }
        BigDecimal totalDebt = totalReceivable.subtract(totalPaid).max(BigDecimal.ZERO);

        // 5. Sessions in this academic year
        List<ClassSession> sessions;
        boolean isCurrentYear = selectedYear.equals(currentAcademicYear);
        if (isCurrentYear) {
            LocalDate nextPeriod = today.plusDays(14);
            sessions = classSessionRepository.findSessionsInDateRange(null, null, today, nextPeriod);
            if (sessions.isEmpty()) {
                sessions = classSessionRepository.findSessionsInDateRange(null, null, today.minusDays(7), nextPeriod);
            }
        } else {
            // For other academic years, query up to 15 sessions in that year
            sessions = classSessionRepository.findSessionsInDateRange(null, null, academicStartDate, academicEndDate);
        }

        List<UpcomingSessionDto> upcomingDtos = sessions.stream()
                .limit(15)
                .map(this::toUpcomingSessionDto)
                .collect(Collectors.toList());

        return DashboardStatsDto.builder()
                .academicYear(selectedYear)
                .availableAcademicYears(availableYears)
                .totalStudents(totalStudents)
                .activeStudents(activeStudents)
                .totalStudentsCenter(totalStudentsCenter)
                .totalCourses(totalCourses)
                .activeClasses(activeClasses)
                .totalLeads(totalLeads)
                .convertedLeads(convertedLeads)
                .leadConversionRate(conversionRate)
                .totalReceivable(totalReceivable)
                .totalPaid(totalPaid)
                .totalDebt(totalDebt)
                .upcomingSessions(upcomingDtos)
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
