package vn.chacademy.academic.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.chacademy.academic.dto.*;
import vn.chacademy.academic.entity.ClassEntity;
import vn.chacademy.academic.entity.Enrollment;
import vn.chacademy.academic.entity.EnrollmentRequest;
import vn.chacademy.academic.repository.ClassRepository;
import vn.chacademy.academic.repository.EnrollmentRepository;
import vn.chacademy.academic.repository.EnrollmentRequestRepository;
import vn.chacademy.chat.service.ClassChatService;
import vn.chacademy.common.exception.BadRequestException;
import vn.chacademy.common.exception.ResourceNotFoundException;
import vn.chacademy.finance.entity.Receivable;
import vn.chacademy.finance.repository.ReceivableRepository;
import vn.chacademy.identity.entity.User;
import vn.chacademy.student.entity.Student;
import vn.chacademy.student.repository.StudentRepository;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class EnrollmentRequestService {

    private final EnrollmentRequestRepository requestRepository;
    private final ClassRepository classRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final StudentRepository studentRepository;
    private final ReceivableRepository receivableRepository;
    private final ClassChatService classChatService;

    // ==========================================
    // 1. DÀNH CHO HỌC VIÊN (STUDENT WORKFLOW)
    // ==========================================

    @Transactional(readOnly = true)
    public List<ClassDto> getAvailableClassesForRegistration(String academicYear) {
        List<ClassEntity> classes;
        if (academicYear != null && !academicYear.isBlank()) {
            classes = classRepository.findByAcademicYearAndStatus(academicYear.trim(), "OPEN_FOR_ENROLLMENT");
        } else {
            classes = classRepository.findByStatus("OPEN_FOR_ENROLLMENT");
        }
        return classes.stream().map(ClassDto::fromEntity).toList();
    }

    @Transactional(readOnly = true)
    public List<EnrollmentRequestDto> getMyEnrollmentRequests(User user) {
        if (user == null) return List.of();
        return requestRepository.findByStudentUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(EnrollmentRequestDto::fromEntity)
                .toList();
    }

    @Transactional
    public EnrollmentRequestDto submitEnrollmentRequest(User user, CreateEnrollmentRequestDto dto) {
        Student student = studentRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Tài khoản chưa được liên kết với hồ sơ học viên"));

        ClassEntity cls = classRepository.findById(dto.getClassId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp học #" + dto.getClassId()));

        if (!"OPEN_FOR_ENROLLMENT".equalsIgnoreCase(cls.getStatus()) && !"PLANNING".equalsIgnoreCase(cls.getStatus())) {
            throw new BadRequestException("Lớp học '" + cls.getName() + "' hiện không mở nhận đăng ký mới");
        }

        // Kiểm tra xem học viên đã ghi danh thành công chưa
        if (enrollmentRepository.existsByClassEntityIdAndStudentId(cls.getId(), student.getId())) {
            throw new BadRequestException("Học viên đã được ghi danh vào lớp học này");
        }

        // Kiểm tra yêu cầu đang chờ duyệt
        boolean hasPending = requestRepository.existsByClassEntityIdAndStudentIdAndStatusIn(
                cls.getId(), student.getId(), List.of("PENDING")
        );
        if (hasPending) {
            throw new BadRequestException("Bạn đã gửi yêu cầu đăng ký lớp này và đang chờ quản trị viên xét duyệt");
        }

        BigDecimal tuition = BigDecimal.ZERO;
        if (cls.getCourse() != null && cls.getCourse().getDefaultTuitionFee() != null) {
            tuition = cls.getCourse().getDefaultTuitionFee();
        }

        String acaYear = cls.getAcademicYear() != null ? cls.getAcademicYear() : "2026-2027";

        EnrollmentRequest request = EnrollmentRequest.builder()
                .student(student)
                .classEntity(cls)
                .academicYear(acaYear)
                .requestDate(Instant.now())
                .status("PENDING")
                .appliedTuitionFee(tuition)
                .discountAmount(BigDecimal.ZERO)
                .finalFee(tuition)
                .studentNotes(dto.getStudentNotes())
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        EnrollmentRequest saved = requestRepository.save(request);
        log.info("Học viên {} ({}) gửi yêu cầu đăng ký lớp: {} ({})",
                student.getFullName(), student.getStudentCode(), cls.getName(), cls.getCode());

        return EnrollmentRequestDto.fromEntity(saved);
    }

    @Transactional
    public EnrollmentRequestDto cancelMyRequest(User user, Long requestId) {
        EnrollmentRequest req = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy yêu cầu đăng ký #" + requestId));

        if (!req.getStudent().getUser().getId().equals(user.getId())) {
            throw new BadRequestException("Bạn không thể hủy yêu cầu của học viên khác");
        }

        if (!"PENDING".equalsIgnoreCase(req.getStatus())) {
            throw new BadRequestException("Chỉ có thể hủy yêu cầu đang ở trạng thái Chờ duyệt (PENDING)");
        }

        req.setStatus("CANCELLED");
        return EnrollmentRequestDto.fromEntity(requestRepository.save(req));
    }

    @Transactional(readOnly = true)
    public List<StudentLearningHistoryDto> getStudentLearningHistory(User user) {
        Student student = studentRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Tài khoản chưa được liên kết với hồ sơ học viên"));

        List<Enrollment> enrollments = enrollmentRepository.findByStudentIdOrderByCreatedAtDesc(student.getId());
        List<StudentLearningHistoryDto> result = new ArrayList<>();

        for (Enrollment e : enrollments) {
            ClassEntity cls = e.getClassEntity();
            String teacherName = (cls != null && cls.getPrimaryTeacher() != null)
                    ? cls.getPrimaryTeacher().getFullName()
                    : "Chưa phân công";

            result.add(StudentLearningHistoryDto.builder()
                    .enrollmentId(e.getId())
                    .classId(cls != null ? cls.getId() : null)
                    .classCode(cls != null ? cls.getCode() : null)
                    .className(cls != null ? cls.getName() : null)
                    .courseId(cls != null && cls.getCourse() != null ? cls.getCourse().getId() : null)
                    .courseName(cls != null && cls.getCourse() != null ? cls.getCourse().getName() : null)
                    .academicYear(cls != null ? cls.getAcademicYear() : null)
                    .primaryTeacherName(teacherName)
                    .enrollmentDate(e.getEnrollmentDate())
                    .status(e.getStatus())
                    .finalGrade(null)
                    .attendedSessions(null)
                    .totalSessions(null)
                    .attendanceRate(null)
                    .build());
        }

        return result;
    }

    // ==========================================
    // 2. DÀNH CHO QUẢN TRỊ VIÊN (ADMIN WORKFLOW)
    // ==========================================

    @Transactional(readOnly = true)
    public List<EnrollmentRequestDto> getRequestsForAdmin(String academicYear, String status) {
        return requestRepository.findFiltered(
                academicYear != null && !academicYear.isBlank() ? academicYear.trim() : null,
                status != null && !status.isBlank() ? status.trim().toUpperCase() : null
        ).stream().map(EnrollmentRequestDto::fromEntity).toList();
    }

    @Transactional
    public EnrollmentRequestDto approveRequest(Long requestId, User adminUser, ReviewEnrollmentRequestDto dto) {
        EnrollmentRequest req = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy yêu cầu đăng ký #" + requestId));

        if (!"PENDING".equalsIgnoreCase(req.getStatus())) {
            throw new BadRequestException("Yêu cầu này đã được xử lý (trạng thái hiện tại: " + req.getStatus() + ")");
        }

        BigDecimal discount = (dto != null && dto.getDiscountAmount() != null) ? dto.getDiscountAmount() : BigDecimal.ZERO;
        BigDecimal finalFee = req.getAppliedTuitionFee().subtract(discount).max(BigDecimal.ZERO);

        req.setStatus("APPROVED");
        req.setDiscountAmount(discount);
        req.setFinalFee(finalFee);
        req.setReviewedBy(adminUser);
        req.setReviewedAt(Instant.now());
        if (dto != null && dto.getReviewNotes() != null) {
            req.setReviewNotes(dto.getReviewNotes().trim());
        }

        requestRepository.save(req);

        // 1. Tạo Enrollment chính thức
        ClassEntity cls = req.getClassEntity();
        Student st = req.getStudent();

        Enrollment enrollment = Enrollment.builder()
                .student(st)
                .classEntity(cls)
                .enrollmentDate(LocalDate.now())
                .status("ENROLLED")
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        Enrollment savedEnrollment = enrollmentRepository.save(enrollment);

        // 2. Tự động đồng bộ quyền truy cập nhóm chat lớp học
        try {
            classChatService.syncClassGroup(cls.getId());
        } catch (Exception ex) {
            log.warn("Không thể đồng bộ nhóm chat sau khi duyệt đăng ký: {}", ex.getMessage());
        }

        // 3. Tự động sinh khoản phải thu học phí (Receivable)
        if (finalFee.compareTo(BigDecimal.ZERO) > 0) {
            String datePrefix = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
            String recCode = "REC-" + datePrefix + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();

            Receivable rec = Receivable.builder()
                    .code(recCode)
                    .enrollment(savedEnrollment)
                    .student(st)
                    .title("Học phí: " + cls.getName() + " (" + req.getAcademicYear() + ")")
                    .totalAmount(finalFee)
                    .paidAmount(BigDecimal.ZERO)
                    .dueDate(LocalDate.now().plusDays(15))
                    .status("UNPAID")
                    .createdAt(Instant.now())
                    .updatedAt(Instant.now())
                    .build();

            receivableRepository.save(rec);
            log.info("Đã tạo khoản phải thu học phí: {} - Số tiền: {}đ", recCode, finalFee);
        }

        log.info("Admin {} đã duyệt yêu cầu đăng ký #{} cho học viên {}",
                adminUser.getUsername(), requestId, st.getFullName());

        return EnrollmentRequestDto.fromEntity(req);
    }

    @Transactional
    public EnrollmentRequestDto rejectRequest(Long requestId, User adminUser, ReviewEnrollmentRequestDto dto) {
        EnrollmentRequest req = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy yêu cầu đăng ký #" + requestId));

        if (!"PENDING".equalsIgnoreCase(req.getStatus())) {
            throw new BadRequestException("Yêu cầu này đã được xử lý (trạng thái hiện tại: " + req.getStatus() + ")");
        }

        req.setStatus("REJECTED");
        req.setReviewedBy(adminUser);
        req.setReviewedAt(Instant.now());
        if (dto != null && dto.getReviewNotes() != null) {
            req.setReviewNotes(dto.getReviewNotes().trim());
        }

        return EnrollmentRequestDto.fromEntity(requestRepository.save(req));
    }
}
