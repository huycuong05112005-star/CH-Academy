package vn.chacademy.academic.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.chacademy.academic.dto.*;
import vn.chacademy.academic.entity.*;
import vn.chacademy.academic.repository.*;
import vn.chacademy.common.exception.BadRequestException;
import vn.chacademy.common.exception.ResourceNotFoundException;
import vn.chacademy.course.entity.Course;
import vn.chacademy.course.repository.CourseRepository;
import vn.chacademy.student.entity.Student;
import vn.chacademy.student.repository.StudentRepository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AcademicService {

    private final ClassRepository classRepository;
    private final ClassScheduleRepository classScheduleRepository;
    private final ClassSessionRepository classSessionRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final TeacherRepository teacherRepository;
    private final CourseRepository courseRepository;
    private final StudentRepository studentRepository;
    private final vn.chacademy.identity.repository.UserRepository userRepository;
    private final vn.chacademy.identity.repository.RoleRepository roleRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    private static final Set<String> VALID_CLASS_STATUSES = Set.of("PLANNING", "OPEN_FOR_ENROLLMENT", "IN_PROGRESS", "COMPLETED", "CANCELLED");

    // ==========================================
    // TEACHERS
    // ==========================================

    @Transactional(readOnly = true)
    public List<TeacherDto> getAllTeachers() {
        return teacherRepository.findAll().stream()
                .map(TeacherDto::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TeacherDto> getActiveTeachers() {
        return teacherRepository.findByStatus("ACTIVE").stream()
                .map(TeacherDto::fromEntity)
                .toList();
    }

    @Transactional
    public TeacherDto createTeacher(CreateTeacherRequest request) {
        String cleanCode = request.getTeacherCode().trim().toUpperCase();
        if (teacherRepository.existsByTeacherCode(cleanCode)) {
            throw new BadRequestException("Mã giáo viên '" + cleanCode + "' đã tồn tại trên hệ thống");
        }

        vn.chacademy.identity.entity.User teacherUser = null;
        String rawEmail = request.getEmail() != null && !request.getEmail().isBlank() ? request.getEmail().trim().toLowerCase() : null;
        
        if (rawEmail != null) {
            if (userRepository.existsByEmail(rawEmail)) {
                teacherUser = userRepository.findByEmail(rawEmail).orElse(null);
            } else {
                String username = "gv." + cleanCode.toLowerCase().replace(" ", "");
                if (userRepository.existsByUsername(username)) {
                    username = rawEmail.split("@")[0];
                }

                vn.chacademy.identity.entity.Role teacherRole = roleRepository.findById("TEACHER").orElse(null);
                java.util.Set<vn.chacademy.identity.entity.Role> roles = new java.util.HashSet<>();
                if (teacherRole != null) {
                    roles.add(teacherRole);
                }

                String defaultPassword = "Teacher@123456";
                vn.chacademy.identity.entity.User newUser = new vn.chacademy.identity.entity.User();
                newUser.setUsername(username);
                newUser.setEmail(rawEmail);
                newUser.setFullName(request.getFullName().trim());
                newUser.setPhone(request.getPhone() != null ? request.getPhone().trim() : null);
                newUser.setPasswordHash(passwordEncoder.encode(defaultPassword));
                newUser.setRawPassword(defaultPassword);
                newUser.setStatus("ACTIVE");
                newUser.setRoles(roles);

                teacherUser = userRepository.save(newUser);
            }
        }

        Teacher teacher = Teacher.builder()
                .teacherCode(cleanCode)
                .user(teacherUser)
                .fullName(request.getFullName().trim())
                .email(rawEmail)
                .phone(request.getPhone() != null && !request.getPhone().isBlank() ? request.getPhone().trim() : null)
                .specialization(request.getSpecialization())
                .bio(request.getBio())
                .status("ACTIVE")
                .build();

        Teacher saved = teacherRepository.save(teacher);
        return TeacherDto.fromEntity(saved);
    }

    // ==========================================
    // CLASSES
    // ==========================================

    @Transactional(readOnly = true)
    public Page<ClassDto> searchClasses(String keyword, String status, Long courseId, Long teacherId, Pageable pageable) {
        String cleanKeyword = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;
        String cleanStatus = (status != null && !status.trim().isEmpty()) ? status.trim().toUpperCase() : null;

        return classRepository.searchClasses(cleanKeyword, cleanStatus, courseId, teacherId, pageable)
                .map(c -> {
                    int enrolled = (int) enrollmentRepository.countByClassEntityIdAndStatus(c.getId(), "ENROLLED");
                    return ClassDto.fromEntity(c, enrolled);
                });
    }

    @Transactional(readOnly = true)
    public ClassDto getClassById(Long id) {
        ClassEntity c = classRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp học với ID: " + id));
        int enrolled = (int) enrollmentRepository.countByClassEntityIdAndStatus(c.getId(), "ENROLLED");
        return ClassDto.fromEntity(c, enrolled);
    }

    @Transactional
    public ClassDto createClass(CreateClassRequest request) {
        String cleanCode = request.getCode().trim().toUpperCase();
        if (classRepository.existsByCode(cleanCode)) {
            throw new BadRequestException("Mã lớp học '" + cleanCode + "' đã tồn tại trên hệ thống");
        }

        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new BadRequestException("Không tìm thấy khóa học với ID: " + request.getCourseId()));

        Teacher teacher = null;
        if (request.getPrimaryTeacherId() != null) {
            teacher = teacherRepository.findById(request.getPrimaryTeacherId())
                    .orElseThrow(() -> new BadRequestException("Không tìm thấy giáo viên với ID: " + request.getPrimaryTeacherId()));
        }

        if (request.getEndDate() != null && request.getEndDate().isBefore(request.getStartDate())) {
            throw new BadRequestException("Ngày kết thúc không được trước ngày bắt đầu");
        }

        // Validate schedule conflicts
        if (request.getSchedules() != null && !request.getSchedules().isEmpty()) {
            validateScheduleConflicts(request.getSchedules(), teacher != null ? teacher.getId() : null, null);
        }

        String status = request.getStatus() != null ? request.getStatus().toUpperCase() : "PLANNING";
        if (!VALID_CLASS_STATUSES.contains(status)) {
            throw new BadRequestException("Trạng thái lớp học không hợp lệ: " + status);
        }

        ClassEntity classEntity = ClassEntity.builder()
                .code(cleanCode)
                .name(request.getName().trim())
                .course(course)
                .primaryTeacher(teacher)
                .maxCapacity(request.getMaxCapacity() != null ? request.getMaxCapacity() : 15)
                .room(request.getRoom())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .status(status)
                .build();

        ClassEntity saved = classRepository.save(classEntity);

        // Save schedules
        if (request.getSchedules() != null && !request.getSchedules().isEmpty()) {
            List<ClassSchedule> schedules = new ArrayList<>();
            for (ScheduleSlotRequest slot : request.getSchedules()) {
                if (!slot.getStartTime().isBefore(slot.getEndTime())) {
                    throw new BadRequestException("Giờ bắt đầu (" + slot.getStartTime() + ") phải trước giờ kết thúc (" + slot.getEndTime() + ")");
                }
                ClassSchedule s = ClassSchedule.builder()
                        .classEntity(saved)
                        .dayOfWeek(slot.getDayOfWeek())
                        .startTime(slot.getStartTime())
                        .endTime(slot.getEndTime())
                        .room(slot.getRoom() != null ? slot.getRoom() : saved.getRoom())
                        .build();
                schedules.add(s);
            }
            classScheduleRepository.saveAll(schedules);
            saved.setSchedules(schedules);

            // Auto-generate sessions if endDate is present
            if (saved.getEndDate() != null) {
                generateSessionsForClass(saved, schedules);
            }
        }

        return ClassDto.fromEntity(saved, 0);
    }

    private void validateScheduleConflicts(List<ScheduleSlotRequest> slots, Long teacherId, Long excludeClassId) {
        for (ScheduleSlotRequest slot : slots) {
            // Check teacher conflict
            if (teacherId != null) {
                List<ClassSchedule> teacherConflicts = classScheduleRepository.findTeacherRecurringConflicts(
                        teacherId, slot.getDayOfWeek(), slot.getStartTime(), slot.getEndTime(), excludeClassId
                );
                if (!teacherConflicts.isEmpty()) {
                    ClassSchedule conflict = teacherConflicts.get(0);
                    throw new BadRequestException("Xung đột lịch giáo viên: Giáo viên đã có lịch dạy lớp '" +
                            conflict.getClassEntity().getName() + "' vào Thứ " + (slot.getDayOfWeek() == 7 ? "CN" : (slot.getDayOfWeek() + 1)) +
                            " (" + conflict.getStartTime() + " - " + conflict.getEndTime() + ")");
                }
            }

            // Check room conflict
            if (slot.getRoom() != null && !slot.getRoom().isBlank()) {
                List<ClassSchedule> roomConflicts = classScheduleRepository.findRoomRecurringConflicts(
                        slot.getRoom(), slot.getDayOfWeek(), slot.getStartTime(), slot.getEndTime(), excludeClassId
                );
                if (!roomConflicts.isEmpty()) {
                    ClassSchedule conflict = roomConflicts.get(0);
                    throw new BadRequestException("Xung đột phòng học: Phòng '" + slot.getRoom() + "' đã được xếp cho lớp '" +
                            conflict.getClassEntity().getName() + "' vào Thứ " + (slot.getDayOfWeek() == 7 ? "CN" : (slot.getDayOfWeek() + 1)) +
                            " (" + conflict.getStartTime() + " - " + conflict.getEndTime() + ")");
                }
            }
        }
    }

    private void generateSessionsForClass(ClassEntity classEntity, List<ClassSchedule> schedules) {
        List<ClassSession> sessions = new ArrayList<>();
        LocalDate curr = classEntity.getStartDate();
        LocalDate end = classEntity.getEndDate();

        while (!curr.isAfter(end)) {
            // DayOfWeek: 1: Monday, ..., 7: Sunday
            int dow = curr.getDayOfWeek().getValue();
            for (ClassSchedule sch : schedules) {
                if (sch.getDayOfWeek() == dow) {
                    ClassSession session = ClassSession.builder()
                            .classEntity(classEntity)
                            .teacher(classEntity.getPrimaryTeacher())
                            .sessionDate(curr)
                            .startTime(sch.getStartTime())
                            .endTime(sch.getEndTime())
                            .room(sch.getRoom())
                            .status("SCHEDULED")
                            .topic("Buổi học ngày " + curr)
                            .build();
                    sessions.add(session);
                }
            }
            curr = curr.plusDays(1);
        }
        if (!sessions.isEmpty()) {
            classSessionRepository.saveAll(sessions);
        }
    }

    // ==========================================
    // ENROLLMENTS
    // ==========================================

    @Transactional(readOnly = true)
    public List<EnrollmentDto> getEnrollmentsByClassId(Long classId) {
        return enrollmentRepository.findByClassEntityIdOrderByCreatedAtDesc(classId).stream()
                .map(EnrollmentDto::fromEntity)
                .toList();
    }

    @Transactional
    public EnrollmentDto enrollStudent(CreateEnrollmentRequest request) {
        ClassEntity classEntity = classRepository.findById(request.getClassId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp học với ID: " + request.getClassId()));

        Student student = studentRepository.findById(request.getStudentId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học viên với ID: " + request.getStudentId()));

        // Check duplicate enrollment
        if (enrollmentRepository.existsByClassEntityIdAndStudentId(request.getClassId(), request.getStudentId())) {
            throw new BadRequestException("Học viên '" + student.getFullName() + "' đã được ghi danh vào lớp '" + classEntity.getName() + "'");
        }

        // Capacity check
        long currentEnrolled = enrollmentRepository.countByClassEntityIdAndStatus(classEntity.getId(), "ENROLLED");
        if (currentEnrolled >= classEntity.getMaxCapacity()) {
            throw new BadRequestException("Lớp học đã đạt sĩ số tối đa (" + classEntity.getMaxCapacity() + " học viên). Không thể ghi danh thêm!");
        }

        BigDecimal appliedFee = request.getAppliedTuitionFee() != null
                ? request.getAppliedTuitionFee()
                : classEntity.getCourse().getDefaultTuitionFee();

        BigDecimal discount = request.getDiscountAmount() != null
                ? request.getDiscountAmount()
                : BigDecimal.ZERO;

        BigDecimal finalFee = appliedFee.subtract(discount);
        if (finalFee.compareTo(BigDecimal.ZERO) < 0) {
            finalFee = BigDecimal.ZERO;
        }

        Enrollment enrollment = Enrollment.builder()
                .classEntity(classEntity)
                .student(student)
                .enrollmentDate(request.getEnrollmentDate() != null ? request.getEnrollmentDate() : LocalDate.now())
                .appliedTuitionFee(appliedFee)
                .discountAmount(discount)
                .finalFee(finalFee)
                .status("ENROLLED")
                .notes(request.getNotes())
                .build();

        Enrollment saved = enrollmentRepository.save(enrollment);
        return EnrollmentDto.fromEntity(saved);
    }
}
