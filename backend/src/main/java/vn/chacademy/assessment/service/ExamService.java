package vn.chacademy.assessment.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.chacademy.academic.repository.ClassRepository;
import vn.chacademy.academic.repository.TeacherRepository;
import vn.chacademy.assessment.dto.ExamDto;
import vn.chacademy.assessment.dto.ExamReviewDto;
import vn.chacademy.assessment.dto.ApprovalQueueStatsDto;
import vn.chacademy.assessment.entity.*;
import vn.chacademy.assessment.repository.*;
import vn.chacademy.course.entity.Course;
import vn.chacademy.course.repository.CourseRepository;
import vn.chacademy.identity.entity.User;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExamService {

    private final ExamRepository examRepository;
    private final ExamQuestionRepository examQuestionRepository;
    private final ExamAssignmentRepository examAssignmentRepository;
    private final ExamSnapshotRepository examSnapshotRepository;
    private final ExamAttemptRepository examAttemptRepository;
    private final QuestionRepository questionRepository;
    private final QuestionOptionRepository questionOptionRepository;
    private final CourseRepository courseRepository;
    private final TeacherRepository teacherRepository;
    private final ClassRepository classRepository;
    private final vn.chacademy.academic.repository.ClassSessionRepository classSessionRepository;
    private final ExamReviewLogRepository examReviewLogRepository;
    private final vn.chacademy.notification.repository.NotificationRepository notificationRepository;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public Page<ExamDto> searchExams(Long courseId, Long teacherId, Long sessionId, Long classId, String status, String search, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return examRepository.searchExams(courseId, teacherId, sessionId, classId, status, search, pageable)
                .map(e -> ExamDto.fromEntity(e, false));
    }

    @Transactional(readOnly = true)
    public ExamDto getExamById(Long id) {
        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đề thi với ID: " + id));
        return ExamDto.fromEntity(exam, false);
    }

    @Transactional
    public ExamDto createExam(ExamDto dto, User creator) {
        Exam exam = Exam.builder()
                .title(dto.getTitle())
                .code(dto.getCode() != null && !dto.getCode().isBlank() ? dto.getCode() : "EXAM-" + System.currentTimeMillis())
                .description(dto.getDescription())
                .durationMinutes(dto.getDurationMinutes() != null ? dto.getDurationMinutes() : 45)
                .passPercentage(dto.getPassPercentage() != null ? dto.getPassPercentage() : BigDecimal.valueOf(50.00))
                .maxAttempts(dto.getMaxAttempts() != null ? dto.getMaxAttempts() : 1)
                .shuffleQuestions(dto.getShuffleQuestions() != null ? dto.getShuffleQuestions() : true)
                .shuffleOptions(dto.getShuffleOptions() != null ? dto.getShuffleOptions() : true)
                .showResultMode(dto.getShowResultMode() != null ? dto.getShowResultMode() : "IMMEDIATELY")
                .startTime(dto.getStartTime())
                .endTime(dto.getEndTime())
                .status("DRAFT")
                .version(1)
                .createdBy(creator)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        if (dto.getSessionId() != null) {
            classSessionRepository.findById(dto.getSessionId()).ifPresent(s -> {
                exam.setSession(s);
                if (dto.getCourseId() == null && s.getClassEntity() != null) {
                    exam.setCourse(s.getClassEntity().getCourse());
                }
            });
        }
        if (exam.getCourse() == null && dto.getCourseId() != null) {
            courseRepository.findById(dto.getCourseId()).ifPresent(exam::setCourse);
        }
        if (dto.getTeacherId() != null) {
            teacherRepository.findById(dto.getTeacherId()).ifPresent(exam::setTeacher);
        }

        Exam saved = examRepository.save(exam);

        // Lưu câu hỏi vào đề
        if (dto.getQuestions() != null && !dto.getQuestions().isEmpty()) {
            List<ExamQuestion> eqList = new ArrayList<>();
            int sort = 1;
            for (var item : dto.getQuestions()) {
                Question q = resolveOrCreateQuestion(item, saved.getCourse(), creator);
                ExamQuestion eq = ExamQuestion.builder()
                        .exam(saved)
                        .question(q)
                        .points(item.getPoints() != null ? item.getPoints() : q.getDefaultPoints())
                        .sortOrder(item.getSortOrder() != null ? item.getSortOrder() : sort++)
                        .build();
                eqList.add(eq);
            }
            examQuestionRepository.saveAll(eqList);
            saved.setExamQuestions(eqList);
        }

        // Giao đề theo lớp
        if (dto.getAssignedClassIds() != null && !dto.getAssignedClassIds().isEmpty()) {
            List<ExamAssignment> assignments = new ArrayList<>();
            for (Long cId : dto.getAssignedClassIds()) {
                classRepository.findById(cId).ifPresent(cls -> {
                    ExamAssignment ea = ExamAssignment.builder()
                            .exam(saved)
                            .classEntity(cls)
                            .assignedBy(creator)
                            .assignedAt(Instant.now())
                            .dueDate(saved.getEndTime())
                            .build();
                    assignments.add(ea);
                });
            }
            examAssignmentRepository.saveAll(assignments);
            saved.setAssignments(assignments);
        }

        createOrUpdateSnapshot(saved);
        return ExamDto.fromEntity(saved, false);
    }

    @Transactional
    public ExamDto updateExam(Long id, ExamDto dto) {
        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đề thi với ID: " + id));

        // Kiểm tra xem đề đã có lượt thi chưa
        long attemptsCount = examAttemptRepository.countByExamIdAndStatus(id, "SUBMITTED") +
                             examAttemptRepository.countByExamIdAndStatus(id, "GRADED");

        if (dto.getTitle() != null) exam.setTitle(dto.getTitle());
        if (dto.getDescription() != null) exam.setDescription(dto.getDescription());
        if (dto.getDurationMinutes() != null) exam.setDurationMinutes(dto.getDurationMinutes());
        if (dto.getPassPercentage() != null) exam.setPassPercentage(dto.getPassPercentage());
        if (dto.getMaxAttempts() != null) exam.setMaxAttempts(dto.getMaxAttempts());
        if (dto.getShuffleQuestions() != null) exam.setShuffleQuestions(dto.getShuffleQuestions());
        if (dto.getShuffleOptions() != null) exam.setShuffleOptions(dto.getShuffleOptions());
        if (dto.getShowResultMode() != null) exam.setShowResultMode(dto.getShowResultMode());
        if (dto.getStartTime() != null) exam.setStartTime(dto.getStartTime());
        if (dto.getEndTime() != null) exam.setEndTime(dto.getEndTime());
        if (dto.getStatus() != null) exam.setStatus(dto.getStatus());
        exam.setUpdatedAt(Instant.now());

        if (dto.getSessionId() != null) {
            classSessionRepository.findById(dto.getSessionId()).ifPresent(s -> {
                exam.setSession(s);
                if (exam.getCourse() == null && s.getClassEntity() != null) {
                    exam.setCourse(s.getClassEntity().getCourse());
                }
            });
        }
        if (dto.getCourseId() != null) {
            courseRepository.findById(dto.getCourseId()).ifPresent(exam::setCourse);
        }
        if (dto.getTeacherId() != null) {
            teacherRepository.findById(dto.getTeacherId()).ifPresent(exam::setTeacher);
        }

        // Nếu đã có lượt thi và sửa câu hỏi -> Tăng version đề thi
        if (dto.getQuestions() != null && !dto.getQuestions().isEmpty()) {
            if (attemptsCount > 0) {
                exam.setVersion(exam.getVersion() + 1);
            }
            examQuestionRepository.deleteByExamId(exam.getId());
            List<ExamQuestion> eqList = new ArrayList<>();
            int sort = 1;
            for (var item : dto.getQuestions()) {
                Question q = resolveOrCreateQuestion(item, exam.getCourse(), null);
                ExamQuestion eq = ExamQuestion.builder()
                        .exam(exam)
                        .question(q)
                        .points(item.getPoints() != null ? item.getPoints() : q.getDefaultPoints())
                        .sortOrder(item.getSortOrder() != null ? item.getSortOrder() : sort++)
                        .build();
                eqList.add(eq);
            }
            examQuestionRepository.saveAll(eqList);
            exam.setExamQuestions(eqList);
        }

        if (dto.getAssignedClassIds() != null) {
            examAssignmentRepository.deleteByExamId(exam.getId());
            List<ExamAssignment> assignments = new ArrayList<>();
            for (Long cId : dto.getAssignedClassIds()) {
                classRepository.findById(cId).ifPresent(cls -> {
                    ExamAssignment ea = ExamAssignment.builder()
                            .exam(exam)
                            .classEntity(cls)
                            .assignedBy(exam.getCreatedBy())
                            .assignedAt(Instant.now())
                            .dueDate(exam.getEndTime())
                            .build();
                    assignments.add(ea);
                });
            }
            examAssignmentRepository.saveAll(assignments);
            exam.setAssignments(assignments);
        }

        Exam saved = examRepository.save(exam);
        createOrUpdateSnapshot(saved);
        return ExamDto.fromEntity(saved, false);
    }

    @Transactional
    public ExamDto duplicateExam(Long id, User creator) {
        Exam source = examRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đề thi với ID: " + id));
        String newCode = "EXAM-" + System.currentTimeMillis();
        Exam copy = Exam.builder()
                .title(source.getTitle() + " (Bản sao)")
                .code(newCode)
                .description(source.getDescription())
                .course(source.getCourse())
                .teacher(source.getTeacher())
                .session(source.getSession())
                .durationMinutes(source.getDurationMinutes())
                .passPercentage(source.getPassPercentage())
                .maxAttempts(source.getMaxAttempts())
                .shuffleQuestions(source.getShuffleQuestions())
                .shuffleOptions(source.getShuffleOptions())
                .showResultMode(source.getShowResultMode())
                .status("DRAFT")
                .version(1)
                .createdBy(creator)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
        copy = examRepository.save(copy);

        if (source.getExamQuestions() != null && !source.getExamQuestions().isEmpty()) {
            List<ExamQuestion> copyEqs = new ArrayList<>();
            for (ExamQuestion eq : source.getExamQuestions()) {
                ExamQuestion copyEq = ExamQuestion.builder()
                        .exam(copy)
                        .question(eq.getQuestion())
                        .points(eq.getPoints())
                        .sortOrder(eq.getSortOrder())
                        .build();
                copyEqs.add(copyEq);
            }
            examQuestionRepository.saveAll(copyEqs);
            copy.setExamQuestions(copyEqs);
        }
        return getExamById(copy.getId());
    }

    @Transactional
    public ExamDto submitForReview(Long id, User actor) {
        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đề thi với ID: " + id));

        if (!"DRAFT".equalsIgnoreCase(exam.getStatus()) && !"CHANGES_REQUESTED".equalsIgnoreCase(exam.getStatus())) {
            throw new IllegalStateException("Chỉ đề thi ở trạng thái Bản nháp (DRAFT) hoặc Yêu cầu sửa (CHANGES_REQUESTED) mới được gửi duyệt! Trạng thái hiện tại: " + exam.getStatus());
        }

        if (exam.getExamQuestions() == null || exam.getExamQuestions().isEmpty()) {
            throw new IllegalStateException("Đề thi chưa có câu hỏi nào. Vui lòng thêm ít nhất một câu hỏi trước khi gửi duyệt!");
        }

        exam.setStatus("PENDING_REVIEW");
        exam.setSubmittedAt(Instant.now());
        exam.setUpdatedAt(Instant.now());
        Exam saved = examRepository.save(exam);

        // Lưu lịch sử kiểm duyệt
        examReviewLogRepository.save(ExamReviewLog.builder()
                .exam(saved)
                .version(saved.getVersion())
                .action("SUBMIT_FOR_REVIEW")
                .actor(actor)
                .actorName(actor != null ? actor.getFullName() : "Giảng viên")
                .actorRole(actor != null ? "TEACHER" : "USER")
                .comment("Giảng viên nộp đề thi lên Ban Quản Trị để kiểm duyệt chất lượng")
                .createdAt(Instant.now())
                .build());

        // Gửi thông báo đến Quản trị viên
        try {
            notificationRepository.save(vn.chacademy.notification.entity.Notification.builder()
                    .title("Đề thi mới chờ duyệt: " + saved.getTitle())
                    .content("Giảng viên " + (actor != null ? actor.getFullName() : "") + " đã gửi đề thi [" + saved.getCode() + "] (" + saved.getExamQuestions().size() + " câu hỏi) chờ phê duyệt.")
                    .targetAudience("ALL")
                    .priority("HIGH")
                    .createdBy(actor)
                    .build());
        } catch (Exception e) {
            log.warn("Failed to send review notification: {}", e.getMessage());
        }

        return ExamDto.fromEntity(saved, false);
    }

    @Transactional
    public ExamDto approveExam(Long id, User adminActor, String comment) {
        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đề thi với ID: " + id));

        if (!"PENDING_REVIEW".equalsIgnoreCase(exam.getStatus()) && !"CHANGES_REQUESTED".equalsIgnoreCase(exam.getStatus())) {
            throw new IllegalStateException("Chỉ đề thi đang chờ duyệt (PENDING_REVIEW) mới có thể được phê duyệt!");
        }

        // Kiểm tra an ninh: Giảng viên không được tự duyệt đề của chính mình
        if (exam.getCreatedBy() != null && adminActor != null && exam.getCreatedBy().getId().equals(adminActor.getId())) {
            boolean isSuperAdmin = adminActor.getRoles().stream().anyMatch(r -> "SUPER_ADMIN".equalsIgnoreCase(r.getId()) || "ROLE_SUPER_ADMIN".equalsIgnoreCase(r.getName()));
            if (!isSuperAdmin) {
                throw new org.springframework.security.access.AccessDeniedException("Quy tắc an ninh: Giảng viên không được tự phê duyệt đề thi do chính mình tạo ra!");
            }
        }

        String effectiveComment = (comment != null && !comment.isBlank()) ? comment : "Đề thi đã được Ban Quản Trị phê duyệt, đạt tiêu chuẩn khảo thí.";

        exam.setStatus("APPROVED");
        exam.setReviewedBy(adminActor);
        exam.setReviewedAt(Instant.now());
        exam.setReviewFeedback(effectiveComment);
        exam.setUpdatedAt(Instant.now());
        Exam saved = examRepository.save(exam);

        // Lưu lịch sử kiểm duyệt
        examReviewLogRepository.save(ExamReviewLog.builder()
                .exam(saved)
                .version(saved.getVersion())
                .action("APPROVE")
                .actor(adminActor)
                .actorName(adminActor != null ? adminActor.getFullName() : "Admin")
                .actorRole(adminActor != null ? "ADMIN" : "SUPER_ADMIN")
                .comment(effectiveComment)
                .createdAt(Instant.now())
                .build());

        // Gửi thông báo đến Giảng viên tạo đề
        try {
            if (saved.getCreatedBy() != null) {
                notificationRepository.save(vn.chacademy.notification.entity.Notification.builder()
                        .title("Đề thi đã được phê duyệt: " + saved.getTitle())
                        .content("Đề thi [" + saved.getCode() + "] đã được Ban Quản Trị phê duyệt. Bạn có thể tiến hành giao đề thi cho lớp học.")
                        .targetAudience("USER")
                        .targetUser(saved.getCreatedBy())
                        .priority("HIGH")
                        .createdBy(adminActor)
                        .build());
            }
        } catch (Exception e) {
            log.warn("Failed to notify teacher on approval: {}", e.getMessage());
        }

        return ExamDto.fromEntity(saved, false);
    }

    @Transactional
    public ExamDto requestChanges(Long id, User adminActor, String feedback) {
        if (feedback == null || feedback.isBlank()) {
            throw new IllegalArgumentException("Yêu cầu chỉnh sửa bắt buộc phải nhập nội dung góp ý chi tiết!");
        }

        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đề thi với ID: " + id));

        if (!"PENDING_REVIEW".equalsIgnoreCase(exam.getStatus())) {
            throw new IllegalStateException("Chỉ đề thi đang chờ duyệt (PENDING_REVIEW) mới có thể yêu cầu chỉnh sửa!");
        }

        exam.setStatus("CHANGES_REQUESTED");
        exam.setReviewedBy(adminActor);
        exam.setReviewedAt(Instant.now());
        exam.setReviewFeedback(feedback);
        exam.setUpdatedAt(Instant.now());
        Exam saved = examRepository.save(exam);

        // Lưu lịch sử kiểm duyệt
        examReviewLogRepository.save(ExamReviewLog.builder()
                .exam(saved)
                .version(saved.getVersion())
                .action("REQUEST_CHANGES")
                .actor(adminActor)
                .actorName(adminActor != null ? adminActor.getFullName() : "Admin")
                .actorRole(adminActor != null ? "ADMIN" : "SUPER_ADMIN")
                .comment(feedback)
                .createdAt(Instant.now())
                .build());

        // Gửi thông báo đến Giảng viên
        try {
            if (saved.getCreatedBy() != null) {
                notificationRepository.save(vn.chacademy.notification.entity.Notification.builder()
                        .title("Đề thi cần chỉnh sửa: " + saved.getTitle())
                        .content("Ban Quản Trị yêu cầu chỉnh sửa đề thi [" + saved.getCode() + "]. Góp ý: " + feedback)
                        .targetAudience("USER")
                        .targetUser(saved.getCreatedBy())
                        .priority("HIGH")
                        .createdBy(adminActor)
                        .build());
            }
        } catch (Exception e) {
            log.warn("Failed to notify teacher on change request: {}", e.getMessage());
        }

        return ExamDto.fromEntity(saved, false);
    }

    @Transactional
    public ExamDto rejectExam(Long id, User adminActor, String reason) {
        if (reason == null || reason.isBlank()) {
            throw new IllegalArgumentException("Từ chối đề thi bắt buộc phải nhập lý do cụ thể!");
        }

        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đề thi với ID: " + id));

        if (!"PENDING_REVIEW".equalsIgnoreCase(exam.getStatus()) && !"CHANGES_REQUESTED".equalsIgnoreCase(exam.getStatus())) {
            throw new IllegalStateException("Chỉ đề thi đang chờ duyệt mới có thể từ chối!");
        }

        exam.setStatus("REJECTED");
        exam.setReviewedBy(adminActor);
        exam.setReviewedAt(Instant.now());
        exam.setRejectionReason(reason);
        exam.setUpdatedAt(Instant.now());
        Exam saved = examRepository.save(exam);

        // Lưu lịch sử kiểm duyệt
        examReviewLogRepository.save(ExamReviewLog.builder()
                .exam(saved)
                .version(saved.getVersion())
                .action("REJECT")
                .actor(adminActor)
                .actorName(adminActor != null ? adminActor.getFullName() : "Admin")
                .actorRole(adminActor != null ? "ADMIN" : "SUPER_ADMIN")
                .comment(reason)
                .createdAt(Instant.now())
                .build());

        // Gửi thông báo đến Giảng viên
        try {
            if (saved.getCreatedBy() != null) {
                notificationRepository.save(vn.chacademy.notification.entity.Notification.builder()
                        .title("Đề thi bị từ chối: " + saved.getTitle())
                        .content("Đề thi [" + saved.getCode() + "] không được phê duyệt. Lý do: " + reason)
                        .targetAudience("USER")
                        .targetUser(saved.getCreatedBy())
                        .priority("HIGH")
                        .createdBy(adminActor)
                        .build());
            }
        } catch (Exception e) {
            log.warn("Failed to notify teacher on rejection: {}", e.getMessage());
        }

        return ExamDto.fromEntity(saved, false);
    }

    @Transactional
    public ExamDto publishExam(Long id, List<Long> classIds, User publisher) {
        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đề thi với ID: " + id));

        if (exam.getExamQuestions() == null || exam.getExamQuestions().isEmpty()) {
            throw new IllegalStateException("Không thể phát hành đề thi chưa có câu hỏi!");
        }

        // QUY TẮC BẢO MẬT BẮT BUỘC: Đề thi PHẢI ĐƯỢC ADMIN DUYỆT (APPROVED) mới được phát hành
        if (!"APPROVED".equalsIgnoreCase(exam.getStatus())) {
            throw new IllegalStateException("Chỉ đề thi đã được Ban Quản Trị phê duyệt (APPROVED) mới được phép phát hành cho học sinh! Trạng thái hiện tại: " + exam.getStatus());
        }

        // Cập nhật lớp được giao nếu có truyền lên
        if (classIds != null && !classIds.isEmpty()) {
            examAssignmentRepository.deleteByExamId(exam.getId());
            List<ExamAssignment> assignments = new ArrayList<>();
            for (Long cId : classIds) {
                classRepository.findById(cId).ifPresent(cls -> {
                    ExamAssignment ea = ExamAssignment.builder()
                            .exam(exam)
                            .classEntity(cls)
                            .assignedBy(publisher)
                            .assignedAt(Instant.now())
                            .dueDate(exam.getEndTime())
                            .build();
                    assignments.add(ea);
                });
            }
            examAssignmentRepository.saveAll(assignments);
            if (exam.getAssignments() != null) {
                exam.getAssignments().clear();
                exam.getAssignments().addAll(assignments);
            } else {
                exam.setAssignments(assignments);
            }
        }

        if (exam.getAssignments() == null || exam.getAssignments().isEmpty()) {
            throw new IllegalStateException("Đề thi chưa được giao cho bất kỳ lớp học nào. Vui lòng chọn lớp học trước khi phát hành!");
        }

        exam.setStatus("PUBLISHED");
        exam.setPublishedAt(Instant.now());
        exam.setUpdatedAt(Instant.now());
        Exam saved = examRepository.save(exam);

        createOrUpdateSnapshot(saved);

        // Lưu lịch sử kiểm duyệt
        examReviewLogRepository.save(ExamReviewLog.builder()
                .exam(saved)
                .version(saved.getVersion())
                .action("PUBLISH")
                .actor(publisher)
                .actorName(publisher != null ? publisher.getFullName() : "Giảng viên")
                .actorRole(publisher != null ? "TEACHER" : "ADMIN")
                .comment("Phát hành đề thi chính thức cho học viên các lớp")
                .createdAt(Instant.now())
                .build());

        // Gửi thông báo đến học viên các lớp được giao
        try {
            for (var a : saved.getAssignments()) {
                if (a.getClassEntity() != null) {
                    notificationRepository.save(vn.chacademy.notification.entity.Notification.builder()
                            .title("Bài kiểm tra mới: " + saved.getTitle())
                            .content("Lớp " + a.getClassEntity().getName() + " có bài kiểm tra mới [" + saved.getTitle() + "]. Thời lượng: " + saved.getDurationMinutes() + " phút. Hạn chót: " + (saved.getEndTime() != null ? saved.getEndTime() : "Theo lịch lớp"))
                            .targetAudience("CLASS")
                            .targetClass(a.getClassEntity())
                            .priority("HIGH")
                            .createdBy(publisher)
                            .build());
                }
            }
        } catch (Exception e) {
            log.warn("Failed to notify students on publish: {}", e.getMessage());
        }

        return ExamDto.fromEntity(saved, false);
    }

    @Transactional(readOnly = true)
    public List<ExamReviewDto> getReviewHistory(Long examId) {
        return examReviewLogRepository.findByExamIdOrderByCreatedAtDesc(examId).stream()
                .map(ExamReviewDto::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public ApprovalQueueStatsDto getApprovalStats() {
        return ApprovalQueueStatsDto.builder()
                .pendingReviewCount(examRepository.countByStatus("PENDING_REVIEW"))
                .approvedCount(examRepository.countByStatus("APPROVED"))
                .changesRequestedCount(examRepository.countByStatus("CHANGES_REQUESTED"))
                .rejectedCount(examRepository.countByStatus("REJECTED"))
                .draftCount(examRepository.countByStatus("DRAFT"))
                .publishedCount(examRepository.countByStatus("PUBLISHED"))
                .build();
    }

    private Question resolveOrCreateQuestion(ExamDto.ExamQuestionItemDto item, Course course, User creator) {
        if (item.getQuestionId() != null && item.getQuestionId() > 0) {
            return questionRepository.findById(item.getQuestionId())
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy câu hỏi: " + item.getQuestionId()));
        }
        String code = item.getCode() != null && !item.getCode().isBlank()
                ? item.getCode()
                : "Q-MANUAL-" + (System.currentTimeMillis() % 1000000);
        Question q = Question.builder()
                .code(code)
                .course(course)
                .type(item.getType() != null ? item.getType() : "SINGLE_CHOICE")
                .difficulty(item.getDifficulty() != null ? item.getDifficulty() : "MEDIUM")
                .topic(item.getTopic() != null ? item.getTopic() : "Chung")
                .content(item.getContent())
                .defaultPoints(item.getPoints() != null ? item.getPoints() : BigDecimal.ONE)
                .createdBy(creator)
                .build();
        Question savedQ = questionRepository.save(q);
        if (item.getOptions() != null && !item.getOptions().isEmpty()) {
            List<QuestionOption> options = new ArrayList<>();
            int optOrder = 1;
            for (var opt : item.getOptions()) {
                QuestionOption qo = QuestionOption.builder()
                        .question(savedQ)
                        .optionCode(opt.getOptionCode() != null ? opt.getOptionCode() : String.valueOf((char) ('A' + optOrder - 1)))
                        .content(opt.getContent())
                        .isCorrect(Boolean.TRUE.equals(opt.getIsCorrect()))
                        .sortOrder(opt.getSortOrder() != null ? opt.getSortOrder() : optOrder++)
                        .build();
                options.add(qo);
            }
            questionOptionRepository.saveAll(options);
            savedQ.setOptions(options);
        }
        return savedQ;
    }

    @Transactional
    public ExamSnapshot createOrUpdateSnapshot(Exam exam) {
        try {
            ExamDto snapshotDto = ExamDto.fromEntity(exam, false);
            String json = objectMapper.writeValueAsString(snapshotDto);
            ExamSnapshot snapshot = ExamSnapshot.builder()
                    .exam(exam)
                    .version(exam.getVersion())
                    .snapshotJson(json)
                    .createdAt(Instant.now())
                    .build();
            return examSnapshotRepository.save(snapshot);
        } catch (Exception e) {
            log.error("Failed to serialize exam snapshot: {}", e.getMessage(), e);
            return null;
        }
    }
}
