package vn.chacademy.dashboard.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.chacademy.academic.entity.ClassSession;
import vn.chacademy.academic.repository.ClassRepository;
import vn.chacademy.academic.repository.ClassSessionRepository;
import vn.chacademy.course.repository.CourseRepository;
import vn.chacademy.dashboard.dto.DashboardStatsDto;
import vn.chacademy.dashboard.dto.UpcomingSessionDto;
import vn.chacademy.finance.repository.PaymentRepository;
import vn.chacademy.finance.repository.ReceivableRepository;
import vn.chacademy.lead.repository.LeadRepository;
import vn.chacademy.student.repository.StudentRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final StudentRepository studentRepository;
    private final CourseRepository courseRepository;
    private final ClassRepository classRepository;
    private final LeadRepository leadRepository;
    private final ReceivableRepository receivableRepository;
    private final PaymentRepository paymentRepository;
    private final ClassSessionRepository classSessionRepository;

    private static final ZoneId VIETNAM_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    @Transactional(readOnly = true)
    public DashboardStatsDto getDashboardStats() {
        long totalStudents = studentRepository.count();
        long activeStudents = studentRepository.countActiveStudents();

        long totalCourses = courseRepository.count();
        long activeClasses = classRepository.countByStatus("IN_PROGRESS");
        if (activeClasses == 0) {
            // Also include PLANNING or OPEN for enrollment
            activeClasses = classRepository.countByStatus("OPEN");
        }

        long totalLeads = leadRepository.count();
        long convertedLeads = leadRepository.countByStatus("CONVERTED");
        double conversionRate = 0.0;
        if (totalLeads > 0) {
            conversionRate = BigDecimal.valueOf((double) convertedLeads / totalLeads * 100)
                    .setScale(1, RoundingMode.HALF_UP)
                    .doubleValue();
        }

        BigDecimal totalReceivable = receivableRepository.sumTotalReceivables();
        BigDecimal totalPaid = paymentRepository.sumTotalPayments();
        if (totalPaid == null) {
            totalPaid = BigDecimal.ZERO;
        }
        if (totalReceivable == null) {
            totalReceivable = BigDecimal.ZERO;
        }
        BigDecimal totalDebt = totalReceivable.subtract(totalPaid);
        if (totalDebt.compareTo(BigDecimal.ZERO) < 0) {
            totalDebt = BigDecimal.ZERO;
        }

        LocalDate today = LocalDate.now(VIETNAM_ZONE);
        LocalDate nextWeek = today.plusDays(7);
        List<ClassSession> sessions = classSessionRepository.findSessionsInDateRange(null, null, today, nextWeek);

        List<UpcomingSessionDto> upcomingDtos = sessions.stream()
                .limit(10)
                .map(this::toUpcomingSessionDto)
                .collect(Collectors.toList());

        return DashboardStatsDto.builder()
                .totalStudents(totalStudents)
                .activeStudents(activeStudents)
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
