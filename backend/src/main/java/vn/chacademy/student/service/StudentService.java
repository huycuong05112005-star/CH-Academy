package vn.chacademy.student.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.chacademy.academic.entity.ClassEntity;
import vn.chacademy.academic.entity.Enrollment;
import vn.chacademy.academic.repository.ClassRepository;
import vn.chacademy.academic.repository.EnrollmentRepository;
import vn.chacademy.common.exception.BadRequestException;
import vn.chacademy.common.exception.ResourceNotFoundException;
import vn.chacademy.common.service.EmailService;
import vn.chacademy.course.entity.Course;
import vn.chacademy.finance.entity.Payment;
import vn.chacademy.finance.entity.PaymentAllocation;
import vn.chacademy.finance.entity.Receivable;
import vn.chacademy.finance.repository.PaymentAllocationRepository;
import vn.chacademy.finance.repository.PaymentRepository;
import vn.chacademy.finance.repository.ReceivableRepository;
import vn.chacademy.identity.entity.Role;
import vn.chacademy.identity.entity.User;
import vn.chacademy.identity.repository.RoleRepository;
import vn.chacademy.identity.repository.UserRepository;
import vn.chacademy.student.dto.*;
import vn.chacademy.student.entity.Guardian;
import vn.chacademy.student.entity.Student;
import vn.chacademy.student.entity.StudentGuardian;
import vn.chacademy.student.entity.StudentGuardianId;
import vn.chacademy.student.repository.GuardianRepository;
import vn.chacademy.student.repository.StudentGuardianRepository;
import vn.chacademy.student.repository.StudentRepository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class StudentService {

    private final StudentRepository studentRepository;
    private final GuardianRepository guardianRepository;
    private final StudentGuardianRepository studentGuardianRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final ReceivableRepository receivableRepository;
    private final PaymentRepository paymentRepository;
    private final PaymentAllocationRepository allocationRepository;
    private final ClassRepository classRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    private static final Set<String> VALID_STATUSES = Set.of("ACTIVE", "INACTIVE", "GRADUATED", "DROPPED");
    private static final Set<String> VALID_TARGET_TYPES = Set.of("KID", "ADULT");
    private static final Set<String> VALID_GENDERS = Set.of("MALE", "FEMALE", "OTHER");

    @Transactional(readOnly = true)
    public StudentStatsDto getStudentStats() {
        long total = studentRepository.count();
        long active = studentRepository.countByStatus("ACTIVE");
        long enrolled = enrollmentRepository.countDistinctActiveEnrolledStudents();
        long kid = studentRepository.countByTargetType("KID");
        long adult = studentRepository.countByTargetType("ADULT");

        return StudentStatsDto.builder()
                .totalStudents(total)
                .activeStudents(active)
                .enrolledStudents(enrolled)
                .kidStudents(kid)
                .adultStudents(adult)
                .build();
    }

    @Transactional(readOnly = true)
    public Page<StudentDto> searchStudents(String keyword, String status, String targetType, Pageable pageable) {
        String cleanKeyword = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;
        String cleanStatus = (status != null && !status.trim().isEmpty()) ? status.trim().toUpperCase() : null;
        String cleanTargetType = (targetType != null && !targetType.trim().isEmpty()) ? targetType.trim().toUpperCase() : null;

        return studentRepository.searchStudents(cleanKeyword, cleanStatus, cleanTargetType, pageable)
                .map(s -> {
                    StudentDto dto = StudentDto.fromEntity(s);
                    enrichStudentDto(dto, s.getId());
                    return dto;
                });
    }

    @Transactional(readOnly = true)
    public StudentDto getStudentById(Long id) {
        Student s = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học viên với ID: " + id));
        StudentDto dto = StudentDto.fromEntity(s);
        enrichStudentDto(dto, s.getId());
        return dto;
    }

    @Transactional(readOnly = true)
    public StudentDto getStudentByCode(String code) {
        Student s = studentRepository.findByStudentCode(code.trim().toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học viên với mã: " + code));
        StudentDto dto = StudentDto.fromEntity(s);
        enrichStudentDto(dto, s.getId());
        return dto;
    }

    public Long getStaffIdByUsername(String username) {
        if (username == null) return null;
        return userRepository.findByUsername(username).map(User::getId).orElse(null);
    }

    private void enrichStudentDto(StudentDto dto, Long studentId) {
        if (dto == null || studentId == null) return;

        List<Enrollment> enrollments = enrollmentRepository.findByStudentIdOrderByCreatedAtDesc(studentId);
        if (!enrollments.isEmpty()) {
            Enrollment latest = enrollments.get(0);
            if (latest.getClassEntity() != null) {
                dto.setEnrolledClassName(latest.getClassEntity().getName());
                if (latest.getClassEntity().getCourse() != null) {
                    dto.setEnrolledCourseName(latest.getClassEntity().getCourse().getName());
                }
            }
        }

        List<Receivable> receivables = receivableRepository.findByStudentIdAndStatusInOrderByIdAsc(
                studentId, List.of("UNPAID", "PARTIALLY_PAID", "PAID")
        );

        BigDecimal total = BigDecimal.ZERO;
        BigDecimal paid = BigDecimal.ZERO;

        for (Receivable r : receivables) {
            if (r.getTotalAmount() != null) {
                total = total.add(r.getTotalAmount());
            }
            if (r.getPaidAmount() != null) {
                paid = paid.add(r.getPaidAmount());
            }
        }

        if (receivables.isEmpty() && !enrollments.isEmpty()) {
            Enrollment e = enrollments.get(0);
            if (e.getFinalFee() != null && e.getFinalFee().compareTo(BigDecimal.ZERO) > 0) {
                total = e.getFinalFee();
            }
        }

        BigDecimal remaining = total.subtract(paid);
        if (remaining.compareTo(BigDecimal.ZERO) < 0) {
            remaining = BigDecimal.ZERO;
        }

        dto.setTotalTuition(total);
        dto.setPaidTuition(paid);
        dto.setRemainingTuition(remaining);

        if (total.compareTo(BigDecimal.ZERO) == 0 && enrollments.isEmpty()) {
            dto.setTuitionStatus("NO_ENROLLMENT");
        } else if (remaining.compareTo(BigDecimal.ZERO) == 0 && total.compareTo(BigDecimal.ZERO) > 0) {
            dto.setTuitionStatus("PAID");
        } else if (paid.compareTo(BigDecimal.ZERO) > 0 && remaining.compareTo(BigDecimal.ZERO) > 0) {
            dto.setTuitionStatus("PARTIALLY_PAID");
        } else {
            dto.setTuitionStatus("UNPAID");
        }
    }

    @Transactional
    public StudentDto createStudent(CreateStudentRequest request) {
        String cleanCode = request.getStudentCode().trim().toUpperCase();
        if (studentRepository.existsByStudentCode(cleanCode)) {
            throw new BadRequestException("Mã học viên '" + cleanCode + "' đã tồn tại trên hệ thống");
        }

        String targetType = request.getTargetType() != null ? request.getTargetType().trim().toUpperCase() : "ADULT";
        if (!VALID_TARGET_TYPES.contains(targetType)) {
            throw new BadRequestException("Phân loại học viên không hợp lệ. Cho phép: " + VALID_TARGET_TYPES);
        }

        String gender = request.getGender() != null ? request.getGender().trim().toUpperCase() : "OTHER";
        if (!VALID_GENDERS.contains(gender)) {
            throw new BadRequestException("Giới tính không hợp lệ. Cho phép: " + VALID_GENDERS);
        }

        String status = request.getStatus() != null ? request.getStatus().trim().toUpperCase() : "ACTIVE";
        if (!VALID_STATUSES.contains(status)) {
            throw new BadRequestException("Trạng thái không hợp lệ. Cho phép: " + VALID_STATUSES);
        }

        Student student = Student.builder()
                .studentCode(cleanCode)
                .fullName(request.getFullName().trim())
                .dateOfBirth(request.getDateOfBirth())
                .gender(gender)
                .phone(request.getPhone() != null && !request.getPhone().isBlank() ? request.getPhone().trim() : null)
                .email(request.getEmail() != null && !request.getEmail().isBlank() ? request.getEmail().trim() : null)
                .address(request.getAddress())
                .targetType(targetType)
                .status(status)
                .internalNotes(request.getInternalNotes())
                .build();

        Student savedStudent = studentRepository.save(student);

        if (request.getGuardians() != null && !request.getGuardians().isEmpty()) {
            List<StudentGuardian> links = new ArrayList<>();
            for (CreateStudentRequest.GuardianLinkRequest gReq : request.getGuardians()) {
                Guardian guardian = guardianRepository.findById(gReq.getGuardianId())
                        .orElseThrow(() -> new BadRequestException("Không tìm thấy người giám hộ với ID: " + gReq.getGuardianId()));

                StudentGuardian link = StudentGuardian.builder()
                        .id(new StudentGuardianId(savedStudent.getId(), guardian.getId()))
                        .student(savedStudent)
                        .guardian(guardian)
                        .relationshipType(gReq.getRelationshipType() != null ? gReq.getRelationshipType().trim().toUpperCase() : "OTHER")
                        .isPrimaryContact(Boolean.TRUE.equals(gReq.getIsPrimaryContact()))
                        .build();
                links.add(link);
            }
            studentGuardianRepository.saveAll(links);
            savedStudent.setStudentGuardians(links);
        }

        return getStudentById(savedStudent.getId());
    }

    @Transactional
    public StudentDto updateStudent(Long id, UpdateStudentRequest request) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học viên với ID: " + id));

        String cleanCode = request.getStudentCode().trim().toUpperCase();
        if (!student.getStudentCode().equalsIgnoreCase(cleanCode) && studentRepository.existsByStudentCode(cleanCode)) {
            throw new BadRequestException("Mã học viên '" + cleanCode + "' đã tồn tại trên hệ thống");
        }

        String targetType = request.getTargetType().trim().toUpperCase();
        if (!VALID_TARGET_TYPES.contains(targetType)) {
            throw new BadRequestException("Phân loại học viên không hợp lệ. Cho phép: " + VALID_TARGET_TYPES);
        }

        String gender = request.getGender().trim().toUpperCase();
        if (!VALID_GENDERS.contains(gender)) {
            throw new BadRequestException("Giới tính không hợp lệ. Cho phép: " + VALID_GENDERS);
        }

        String status = request.getStatus().trim().toUpperCase();
        if (!VALID_STATUSES.contains(status)) {
            throw new BadRequestException("Trạng thái không hợp lệ. Cho phép: " + VALID_STATUSES);
        }

        student.setStudentCode(cleanCode);
        student.setFullName(request.getFullName().trim());
        student.setDateOfBirth(request.getDateOfBirth());
        student.setGender(gender);
        student.setPhone(request.getPhone() != null && !request.getPhone().isBlank() ? request.getPhone().trim() : null);
        student.setEmail(request.getEmail() != null && !request.getEmail().isBlank() ? request.getEmail().trim() : null);
        student.setAddress(request.getAddress());
        student.setTargetType(targetType);
        student.setStatus(status);
        student.setInternalNotes(request.getInternalNotes());

        if (request.getGuardians() != null) {
            studentGuardianRepository.deleteByStudentId(id);
            List<StudentGuardian> newLinks = new ArrayList<>();
            for (CreateStudentRequest.GuardianLinkRequest gReq : request.getGuardians()) {
                Guardian guardian = guardianRepository.findById(gReq.getGuardianId())
                        .orElseThrow(() -> new BadRequestException("Không tìm thấy người giám hộ với ID: " + gReq.getGuardianId()));

                StudentGuardian link = StudentGuardian.builder()
                        .id(new StudentGuardianId(student.getId(), guardian.getId()))
                        .student(student)
                        .guardian(guardian)
                        .relationshipType(gReq.getRelationshipType() != null ? gReq.getRelationshipType().trim().toUpperCase() : "OTHER")
                        .isPrimaryContact(Boolean.TRUE.equals(gReq.getIsPrimaryContact()))
                        .build();
                newLinks.add(link);
            }
            studentGuardianRepository.saveAll(newLinks);
            student.setStudentGuardians(newLinks);
        }

        studentRepository.save(student);
        return getStudentById(id);
    }

    @Transactional
    public StudentDto updateStudentStatus(Long id, String status) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học viên với ID: " + id));

        String cleanStatus = status.trim().toUpperCase();
        if (!VALID_STATUSES.contains(cleanStatus)) {
            throw new BadRequestException("Trạng thái không hợp lệ: " + status + ". Cho phép: " + VALID_STATUSES);
        }

        student.setStatus(cleanStatus);
        studentRepository.save(student);
        return getStudentById(id);
    }

    @Transactional
    public void deleteStudent(Long id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học viên với ID: " + id));

        student.setStatus("DROPPED");
        studentRepository.save(student);
    }

    @Transactional
    public AccountProvisionResponse provisionAccount(Long studentId, String customPassword) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học viên với ID: " + studentId));

        User user = student.getUser();
        String plainPassword;
        boolean isNew = false;
        boolean emailSent = false;

        if (user == null) {
            isNew = true;
            String username = student.getEmail() != null && !student.getEmail().isBlank()
                    ? student.getEmail().trim().toLowerCase()
                    : student.getStudentCode().toLowerCase();

            if (userRepository.existsByUsername(username)) {
                username = student.getStudentCode().toLowerCase();
            }
            if (userRepository.existsByUsername(username)) {
                username = student.getStudentCode().toLowerCase() + "_" + (System.currentTimeMillis() % 1000);
            }

            plainPassword = (customPassword != null && !customPassword.isBlank())
                    ? customPassword.trim()
                    : "Cha@" + (1000 + (int)(Math.random() * 9000));

            Role studentRole = roleRepository.findById("STUDENT")
                    .orElseGet(() -> roleRepository.save(new Role("STUDENT", "Học viên", "Tài khoản học viên")));

            user = new User();
            user.setUsername(username);
            user.setFullName(student.getFullName());
            user.setEmail(student.getEmail());
            user.setPhone(student.getPhone());
            user.setPasswordHash(passwordEncoder.encode(plainPassword));
            user.setRawPassword(plainPassword);
            user.setStatus("ACTIVE");
            user.setRoles(Set.of(studentRole));

            user = userRepository.save(user);
            student.setUser(user);
            studentRepository.save(student);

            if (student.getEmail() != null && !student.getEmail().isBlank()) {
                emailSent = emailService.sendAccountCredentialsEmail(
                        student.getEmail(),
                        student.getFullName(),
                        user.getUsername(),
                        plainPassword
                );
            }
        } else {
            if (customPassword != null && !customPassword.isBlank()) {
                plainPassword = customPassword.trim();
                user.setPasswordHash(passwordEncoder.encode(plainPassword));
                user.setRawPassword(plainPassword);
                userRepository.save(user);
                if (student.getEmail() != null && !student.getEmail().isBlank()) {
                    emailSent = emailService.sendAccountCredentialsEmail(
                            student.getEmail(),
                            student.getFullName(),
                            user.getUsername(),
                            plainPassword
                    );
                }
            } else {
                plainPassword = "(Mật khẩu hiện tại của bạn)";
            }
        }

        return AccountProvisionResponse.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .plainPassword(plainPassword)
                .emailSent(emailSent)
                .message(isNew ? "Khởi tạo tài khoản thành công" : "Cập nhật tài khoản và mật khẩu mới thành công")
                .build();
    }

    @Transactional
    public StudentDto enrollAndPay(Long studentId, EnrollAndPayRequest request, Long staffId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học viên với ID: " + studentId));

        ClassEntity classEntity = classRepository.findWithDetailsById(request.getClassId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp học với ID: " + request.getClassId()));

        Course course = classEntity.getCourse();
        if (course == null) {
            throw new BadRequestException("Lớp học chưa được gán khóa học.");
        }

        // 1. Enrollment
        Enrollment enrollment = enrollmentRepository.findByClassEntityIdOrderByCreatedAtDesc(classEntity.getId()).stream()
                .filter(e -> e.getStudent().getId().equals(studentId))
                .findFirst()
                .orElse(null);

        BigDecimal tuitionFee = course.getDefaultTuitionFee() != null ? course.getDefaultTuitionFee() : BigDecimal.ZERO;

        if (enrollment == null) {
            long currentEnrolled = enrollmentRepository.countByClassEntityIdAndStatus(classEntity.getId(), "ENROLLED");
            if (currentEnrolled >= classEntity.getMaxCapacity()) {
                throw new BadRequestException("Lớp học đã đạt sĩ số tối đa (" + classEntity.getMaxCapacity() + ").");
            }

            enrollment = Enrollment.builder()
                    .classEntity(classEntity)
                    .student(student)
                    .appliedTuitionFee(tuitionFee)
                    .discountAmount(BigDecimal.ZERO)
                    .finalFee(tuitionFee)
                    .status("ENROLLED")
                    .enrollmentDate(LocalDate.now())
                    .notes(request.getNotes())
                    .build();
            enrollment = enrollmentRepository.save(enrollment);
        }

        // 2. Create Receivable for course tuition
        BigDecimal paidAmount = request.getPaidAmount() != null ? request.getPaidAmount() : tuitionFee;
        if (paidAmount.compareTo(BigDecimal.ZERO) < 0) {
            paidAmount = BigDecimal.ZERO;
        }

        Receivable receivable = Receivable.builder()
                .code("REC" + System.currentTimeMillis())
                .student(student)
                .enrollment(enrollment)
                .title("Học phí khóa: " + course.getName() + " (" + classEntity.getName() + ")")
                .totalAmount(tuitionFee)
                .paidAmount(BigDecimal.ZERO)
                .status("UNPAID")
                .dueDate(LocalDate.now().plusDays(15))
                .build();
        receivable = receivableRepository.save(receivable);

        // 3. Record Payment if paidAmount > 0
        if (paidAmount.compareTo(BigDecimal.ZERO) > 0) {
            User staff = staffId != null ? userRepository.findById(staffId).orElse(null) : null;
            Payment payment = Payment.builder()
                    .paymentCode("PAY" + System.currentTimeMillis())
                    .student(student)
                    .amount(paidAmount)
                    .paymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod().toUpperCase() : "BANK_TRANSFER")
                    .paymentDate(LocalDate.now())
                    .referenceNumber(request.getReferenceNumber())
                    .notes(request.getNotes() != null ? request.getNotes() : "Đóng học phí ghi danh lớp " + classEntity.getName())
                    .createdBy(staff)
                    .build();
            payment = paymentRepository.save(payment);

            BigDecimal allocAmount = paidAmount.min(tuitionFee);
            receivable.setPaidAmount(allocAmount);
            if (allocAmount.compareTo(tuitionFee) >= 0) {
                receivable.setStatus("PAID");
            } else {
                receivable.setStatus("PARTIALLY_PAID");
            }
            receivableRepository.save(receivable);

            PaymentAllocation alloc = PaymentAllocation.builder()
                    .payment(payment)
                    .receivable(receivable)
                    .allocatedAmount(allocAmount)
                    .build();
            allocationRepository.save(alloc);
        }

        BigDecimal remainingDebt = tuitionFee.subtract(paidAmount);
        if (remainingDebt.compareTo(BigDecimal.ZERO) < 0) {
            remainingDebt = BigDecimal.ZERO;
        }

        // 4. Provision account and send email
        if (Boolean.TRUE.equals(request.getProvisionAccount())) {
            AccountProvisionResponse account = provisionAccount(studentId, null);
            if (student.getEmail() != null && !student.getEmail().isBlank()) {
                emailService.sendEnrollmentSuccessEmail(
                        student.getEmail(),
                        student.getFullName(),
                        student.getStudentCode(),
                        course.getName(),
                        classEntity.getName(),
                        tuitionFee,
                        paidAmount,
                        remainingDebt,
                        account.getUsername(),
                        account.getPlainPassword()
                );
            }
        }

        return getStudentById(studentId);
    }
}
