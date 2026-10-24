package vn.chacademy.lead.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.chacademy.common.exception.BadRequestException;
import vn.chacademy.common.exception.ResourceNotFoundException;
import vn.chacademy.course.entity.Course;
import vn.chacademy.course.repository.CourseRepository;
import vn.chacademy.identity.entity.User;
import vn.chacademy.identity.repository.UserRepository;
import vn.chacademy.lead.dto.*;
import vn.chacademy.lead.entity.Lead;
import vn.chacademy.lead.entity.LeadActivity;
import vn.chacademy.lead.repository.LeadActivityRepository;
import vn.chacademy.lead.repository.LeadRepository;
import vn.chacademy.student.entity.Guardian;
import vn.chacademy.student.entity.Student;
import vn.chacademy.student.entity.StudentGuardian;
import vn.chacademy.student.entity.StudentGuardianId;
import vn.chacademy.student.repository.GuardianRepository;
import vn.chacademy.student.repository.StudentGuardianRepository;
import vn.chacademy.student.repository.StudentRepository;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.concurrent.atomic.AtomicLong;

@Service
@RequiredArgsConstructor
public class LeadService {

    private final LeadRepository leadRepository;
    private final LeadActivityRepository leadActivityRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final GuardianRepository guardianRepository;
    private final StudentGuardianRepository studentGuardianRepository;

    private static final Set<String> VALID_STATUSES = Set.of("NEW", "CONTACTED", "CONSULTING", "APPOINTMENT", "CONVERTED", "LOST");
    private static final Set<String> VALID_SOURCES = Set.of("WEBSITE", "FACEBOOK", "REFERRAL", "WALK_IN", "HOTLINE", "OTHER");
    private static final AtomicLong CODE_COUNTER = new AtomicLong(System.currentTimeMillis() % 1000000);

    @Transactional(readOnly = true)
    public Page<LeadDto> searchLeads(String keyword, String status, String source, Long assignedStaffId, Pageable pageable) {
        String cleanKeyword = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;
        String cleanStatus = (status != null && !status.trim().isEmpty()) ? status.trim().toUpperCase() : null;
        String cleanSource = (source != null && !source.trim().isEmpty()) ? source.trim().toUpperCase() : null;

        return leadRepository.searchLeads(cleanKeyword, cleanStatus, cleanSource, assignedStaffId, pageable)
                .map(LeadDto::fromEntity);
    }

    @Transactional(readOnly = true)
    public LeadDto getLeadById(Long id) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khách hàng tiềm năng với ID: " + id));
        return LeadDto.fromEntity(lead);
    }

    @Transactional
    public LeadDto createLead(CreateLeadRequest request) {
        String source = request.getSource() != null ? request.getSource().trim().toUpperCase() : "WALK_IN";
        if (!VALID_SOURCES.contains(source)) {
            throw new BadRequestException("Nguồn khách hàng không hợp lệ. Cho phép: " + VALID_SOURCES);
        }

        Course course = null;
        if (request.getTargetCourseId() != null) {
            course = courseRepository.findById(request.getTargetCourseId())
                    .orElseThrow(() -> new BadRequestException("Không tìm thấy khóa học với ID: " + request.getTargetCourseId()));
        }

        User staff = null;
        if (request.getAssignedStaffId() != null) {
            staff = userRepository.findById(request.getAssignedStaffId())
                    .orElseThrow(() -> new BadRequestException("Không tìm thấy nhân viên với ID: " + request.getAssignedStaffId()));
        }

        String leadCode = generateLeadCode();

        Lead lead = Lead.builder()
                .leadCode(leadCode)
                .fullName(request.getFullName().trim())
                .phone(request.getPhone().trim())
                .email(request.getEmail() != null && !request.getEmail().isBlank() ? request.getEmail().trim() : null)
                .source(source)
                .targetCourse(course)
                .assignedStaff(staff)
                .status("NEW")
                .notes(request.getNotes())
                .build();

        Lead saved = leadRepository.save(lead);

        // Auto log creation activity
        LeadActivity activity = LeadActivity.builder()
                .lead(saved)
                .staff(staff)
                .actionType("NOTE")
                .content("Khách hàng tiềm năng được tạo trên hệ thống từ nguồn " + source)
                .activityTime(Instant.now())
                .build();
        leadActivityRepository.save(activity);
        saved.getActivities().add(activity);

        return LeadDto.fromEntity(saved);
    }

    @Transactional
    public LeadDto createPublicLead(PublicLeadRequest request) {
        // Honeypot spam check: bots that fill the hidden field are discarded
        if (request.getWebsiteUrl() != null && !request.getWebsiteUrl().isBlank()) {
            throw new BadRequestException("Yêu cầu không hợp lệ.");
        }

        Course course = null;
        if (request.getTargetCourseId() != null) {
            course = courseRepository.findById(request.getTargetCourseId()).orElse(null);
        }

        // Avoid duplicate active leads for the same phone within active cycle
        boolean existsActive = leadRepository.existsByPhoneAndStatusNot(request.getPhone().trim(), "CONVERTED");
        if (existsActive) {
            // Update notes or add activity to existing lead rather than duplicate
            // We can still create with a notification note
        }

        String leadCode = generateLeadCode();

        Lead lead = Lead.builder()
                .leadCode(leadCode)
                .fullName(request.getFullName().trim())
                .phone(request.getPhone().trim())
                .email(request.getEmail() != null && !request.getEmail().isBlank() ? request.getEmail().trim() : null)
                .source("WEBSITE")
                .targetCourse(course)
                .status("NEW")
                .notes(request.getNotes())
                .build();

        Lead saved = leadRepository.save(lead);

        LeadActivity activity = LeadActivity.builder()
                .lead(saved)
                .actionType("NOTE")
                .content("Đăng ký tư vấn trực tuyến từ Website công khai" + (course != null ? " cho khóa học: " + course.getName() : ""))
                .activityTime(Instant.now())
                .build();
        leadActivityRepository.save(activity);
        saved.getActivities().add(activity);

        return LeadDto.fromEntity(saved);
    }

    @Transactional
    public LeadDto updateLeadStatus(Long id, String status, Long currentUserId) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khách hàng tiềm năng với ID: " + id));

        String cleanStatus = status.trim().toUpperCase();
        if (!VALID_STATUSES.contains(cleanStatus)) {
            throw new BadRequestException("Trạng thái không hợp lệ: " + status + ". Cho phép: " + VALID_STATUSES);
        }

        String oldStatus = lead.getStatus();
        lead.setStatus(cleanStatus);
        Lead saved = leadRepository.save(lead);

        User staff = currentUserId != null ? userRepository.findById(currentUserId).orElse(null) : null;

        LeadActivity activity = LeadActivity.builder()
                .lead(saved)
                .staff(staff)
                .actionType("STATUS_CHANGE")
                .content("Cập nhật trạng thái từ [" + oldStatus + "] sang [" + cleanStatus + "]")
                .activityTime(Instant.now())
                .build();
        leadActivityRepository.save(activity);
        saved.getActivities().add(activity);

        return LeadDto.fromEntity(saved);
    }

    @Transactional
    public LeadActivityDto addActivity(Long leadId, AddActivityRequest request, Long currentUserId) {
        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khách hàng tiềm năng với ID: " + leadId));

        User staff = currentUserId != null ? userRepository.findById(currentUserId).orElse(null) : null;

        LeadActivity activity = LeadActivity.builder()
                .lead(lead)
                .staff(staff)
                .actionType(request.getActionType())
                .content(request.getContent().trim())
                .activityTime(Instant.now())
                .build();

        LeadActivity saved = leadActivityRepository.save(activity);
        return LeadActivityDto.fromEntity(saved);
    }

    @Transactional
    public LeadDto convertLeadToStudent(Long leadId, ConvertLeadRequest request, Long currentUserId) {
        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khách hàng tiềm năng với ID: " + leadId));

        if ("CONVERTED".equalsIgnoreCase(lead.getStatus()) || lead.getConvertedStudent() != null) {
            throw new BadRequestException("Khách hàng này đã được chuyển đổi thành học viên trước đó.");
        }

        // Generate student code HV + year + sequence
        String studentCode = "HV" + (System.currentTimeMillis() % 1000000);
        while (studentRepository.existsByStudentCode(studentCode)) {
            studentCode = "HV" + (System.currentTimeMillis() % 1000000 + 1);
        }

        String studentType = request.getStudentType() != null ? request.getStudentType().trim().toUpperCase() : "ADULT";

        Student student = Student.builder()
                .studentCode(studentCode)
                .fullName(lead.getFullName())
                .dateOfBirth(request.getDob())
                .gender(request.getGender() != null ? request.getGender().trim().toUpperCase() : "OTHER")
                .phone(lead.getPhone())
                .email(lead.getEmail())
                .address(request.getAddress())
                .targetType(studentType)
                .status("ACTIVE")
                .internalNotes("Chuyển đổi từ khách hàng tiềm năng mã: " + lead.getLeadCode())
                .build();

        Student savedStudent = studentRepository.save(student);

        // If KID and guardian info supplied, link guardian
        if ("KID".equals(studentType)) {
            Guardian guardian = null;
            if (request.getExistingGuardianId() != null) {
                guardian = guardianRepository.findById(request.getExistingGuardianId()).orElse(null);
            } else if (request.getGuardianFullName() != null && !request.getGuardianFullName().isBlank()) {
                guardian = Guardian.builder()
                        .fullName(request.getGuardianFullName().trim())
                        .phone(request.getGuardianPhone() != null ? request.getGuardianPhone().trim() : lead.getPhone())
                        .email(request.getGuardianEmail() != null ? request.getGuardianEmail().trim() : null)
                        .address(request.getAddress())
                        .build();
                guardian = guardianRepository.save(guardian);
            }

            if (guardian != null) {
                StudentGuardian link = StudentGuardian.builder()
                        .id(new StudentGuardianId(savedStudent.getId(), guardian.getId()))
                        .student(savedStudent)
                        .guardian(guardian)
                        .relationshipType(request.getGuardianRelationship() != null ? request.getGuardianRelationship().trim().toUpperCase() : "PARENT")
                        .isPrimaryContact(true)
                        .build();
                studentGuardianRepository.save(link);
                savedStudent.setStudentGuardians(List.of(link));
            }
        }

        // Update Lead
        lead.setStatus("CONVERTED");
        lead.setConvertedStudent(savedStudent);
        Lead updatedLead = leadRepository.save(lead);

        // Log activity
        User staff = currentUserId != null ? userRepository.findById(currentUserId).orElse(null) : null;
        LeadActivity activity = LeadActivity.builder()
                .lead(updatedLead)
                .staff(staff)
                .actionType("STATUS_CHANGE")
                .content("Đã chuyển đổi thành công thành học viên chính thức: " + savedStudent.getFullName() + " (Mã: " + savedStudent.getStudentCode() + ")")
                .activityTime(Instant.now())
                .build();
        leadActivityRepository.save(activity);
        updatedLead.getActivities().add(activity);

        return LeadDto.fromEntity(updatedLead);
    }

    private synchronized String generateLeadCode() {
        return "LEAD" + String.format("%06d", CODE_COUNTER.incrementAndGet());
    }
}
