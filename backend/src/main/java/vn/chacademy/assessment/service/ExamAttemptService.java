package vn.chacademy.assessment.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.chacademy.academic.entity.Enrollment;
import vn.chacademy.academic.repository.EnrollmentRepository;
import vn.chacademy.assessment.dto.*;
import vn.chacademy.assessment.entity.*;
import vn.chacademy.assessment.repository.*;
import vn.chacademy.common.audit.service.AuditService;
import vn.chacademy.identity.entity.User;
import vn.chacademy.student.entity.Student;
import vn.chacademy.student.repository.StudentRepository;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExamAttemptService {

    private final ExamRepository examRepository;
    private final ExamAttemptRepository examAttemptRepository;
    private final AttemptAnswerRepository attemptAnswerRepository;
    private final ExamSnapshotRepository examSnapshotRepository;
    private final StudentRepository studentRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final ScoringService scoringService;
    private final AuditService auditService;

    private Student getStudentByUser(User user) {
        if (user == null) {
            throw new IllegalStateException("Chưa xác thực người dùng");
        }
        return studentRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    boolean isStaffOrAdmin = user.getRoles() != null && user.getRoles().stream()
                            .anyMatch(r -> r.getId() != null && (
                                    r.getId().contains("ADMIN") ||
                                    r.getId().equals("ACADEMIC_STAFF") ||
                                    r.getId().equals("TEACHER")
                            ));
                    if (isStaffOrAdmin) {
                        return studentRepository.findByStudentCode("HV20240002")
                                .orElseGet(() -> studentRepository.findAll().stream()
                                        .filter(s -> "ACTIVE".equalsIgnoreCase(s.getStatus()))
                                        .findFirst()
                                        .orElseThrow(() -> new IllegalStateException("Hệ thống chưa có hồ sơ học viên nào hoạt động!")));
                    }
                    throw new IllegalStateException("Người dùng hiện tại chưa được liên kết với hồ sơ học viên!");
                });
    }

    @Transactional(readOnly = true)
    public List<StudentAssignedExamDto> getAssignedExamsForStudent(User user) {
        Student student = getStudentByUser(user);
        List<Enrollment> enrollments = enrollmentRepository.findByStudentIdOrderByCreatedAtDesc(student.getId()).stream()
                .filter(e -> "ENROLLED".equalsIgnoreCase(e.getStatus()))
                .collect(Collectors.toList());
        List<Long> classIds = enrollments.stream()
                .map(e -> e.getClassEntity().getId())
                .collect(Collectors.toList());

        List<Long> courseIds = enrollments.stream()
                .filter(e -> e.getClassEntity() != null && e.getClassEntity().getCourse() != null)
                .map(e -> e.getClassEntity().getCourse().getId())
                .distinct()
                .collect(Collectors.toList());

        boolean isStaffOrAdmin = user != null && user.getRoles() != null && user.getRoles().stream()
                .anyMatch(r -> r.getId() != null && (
                        r.getId().contains("ADMIN") ||
                        r.getId().equals("ACADEMIC_STAFF") ||
                        r.getId().equals("TEACHER")
                ));

        List<Exam> exams = examRepository.findAvailableExamsForStudent(
                classIds.isEmpty() ? List.of(-1L) : classIds,
                courseIds.isEmpty() ? List.of(-1L) : courseIds,
                student.getId(),
                isStaffOrAdmin
        );

        List<StudentAssignedExamDto> result = new ArrayList<>();
        Instant now = Instant.now();

        for (Exam exam : exams) {
            List<ExamAttempt> attempts = examAttemptRepository
                    .findByExamIdAndStudentIdOrderByAttemptNumberDesc(exam.getId(), student.getId());

            Optional<ExamAttempt> inProgressAttempt = attempts.stream()
                    .filter(a -> "IN_PROGRESS".equalsIgnoreCase(a.getStatus()))
                    .findFirst();

            Optional<ExamAttempt> latestCompleted = attempts.stream()
                    .filter(a -> "GRADED".equalsIgnoreCase(a.getStatus()) || "SUBMITTED".equalsIgnoreCase(a.getStatus()))
                    .findFirst();

            boolean canTake = true;
            String reason = null;

            if (exam.getStartTime() != null && now.isBefore(exam.getStartTime())) {
                canTake = false;
                reason = "Bài kiểm tra chưa đến giờ mở";
            } else if (exam.getEndTime() != null && now.isAfter(exam.getEndTime())) {
                canTake = false;
                reason = "Bài kiểm tra đã kết thúc thời hạn làm bài";
            } else if (attempts.size() >= exam.getMaxAttempts() && inProgressAttempt.isEmpty()) {
                canTake = false;
                reason = "Bạn đã sử dụng hết số lần làm bài (" + attempts.size() + "/" + exam.getMaxAttempts() + ")";
            }

            result.add(StudentAssignedExamDto.builder()
                    .examId(exam.getId())
                    .title(exam.getTitle())
                    .code(exam.getCode())
                    .courseName(exam.getCourse() != null ? exam.getCourse().getName() : null)
                    .teacherName(exam.getTeacher() != null ? exam.getTeacher().getFullName() : null)
                    .durationMinutes(exam.getDurationMinutes())
                    .passPercentage(exam.getPassPercentage())
                    .maxAttempts(exam.getMaxAttempts())
                    .currentAttemptsCount(attempts.size())
                    .attemptStatus(inProgressAttempt.isPresent() ? "IN_PROGRESS" :
                            (latestCompleted.map(ExamAttempt::getStatus).orElse(null)))
                    .activeAttemptId(inProgressAttempt.map(ExamAttempt::getId).orElse(null))
                    .latestScore(latestCompleted.map(ExamAttempt::getTotalScore).orElse(null))
                    .maxScore(latestCompleted.map(ExamAttempt::getMaxScore).orElse(null))
                    .isPassed(latestCompleted.map(ExamAttempt::getIsPassed).orElse(null))
                    .startTime(exam.getStartTime())
                    .endTime(exam.getEndTime())
                    .canTake(canTake)
                    .cannotTakeReason(reason)
                    .build());
        }

        return result;
    }

    @Transactional
    public StartAttemptResponse startAttempt(Long examId, User user, String ipAddress, String userAgent) {
        Student student = getStudentByUser(user);
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bài kiểm tra ID: " + examId));

        if (!"PUBLISHED".equalsIgnoreCase(exam.getStatus())) {
            throw new IllegalStateException("Bài kiểm tra chưa được phát hành!");
        }

        boolean isStaffOrAdmin = user != null && user.getRoles() != null && user.getRoles().stream()
                .anyMatch(r -> r.getId() != null && (
                        r.getId().contains("ADMIN") ||
                        r.getId().equals("ACADEMIC_STAFF") ||
                        r.getId().equals("TEACHER")
                ));

        // BẢO MẬT: Học viên phải thuộc danh sách lớp được giao đề thi này (Bỏ qua cho Admin/Staff xem thử)
        if (!isStaffOrAdmin && exam.getAssignments() != null && !exam.getAssignments().isEmpty()) {
            List<Long> assignedClassIds = exam.getAssignments().stream()
                    .filter(a -> a.getClassEntity() != null)
                    .map(a -> a.getClassEntity().getId())
                    .collect(Collectors.toList());

            if (!assignedClassIds.isEmpty()) {
                List<Enrollment> enrollments = enrollmentRepository.findByStudentIdOrderByCreatedAtDesc(student.getId()).stream()
                        .filter(e -> "ENROLLED".equalsIgnoreCase(e.getStatus()))
                        .collect(Collectors.toList());

                boolean isEnrolled = enrollments.stream()
                        .anyMatch(e -> e.getClassEntity() != null && assignedClassIds.contains(e.getClassEntity().getId()));

                if (!isEnrolled) {
                    throw new org.springframework.security.access.AccessDeniedException("Bạn không thuộc danh sách lớp học được phân công làm bài kiểm tra này!");
                }
            }
        }

        Instant now = Instant.now();
        if (exam.getStartTime() != null && now.isBefore(exam.getStartTime())) {
            throw new IllegalStateException("Bài kiểm tra chưa đến giờ mở!");
        }
        if (exam.getEndTime() != null && now.isAfter(exam.getEndTime())) {
            throw new IllegalStateException("Bài kiểm tra đã hết hạn!");
        }

        // Kiểm tra xem học viên có lượt làm dở dang chưa nộp không (Resume session)
        Optional<ExamAttempt> activeOpt = examAttemptRepository.findByExamIdAndStudentIdAndStatus(examId, student.getId(), "IN_PROGRESS");
        ExamAttempt attempt;

        if (activeOpt.isPresent()) {
            attempt = activeOpt.get();
            // Nếu đã quá giờ quy định, tự động nộp luôn
            if (now.isAfter(attempt.getDueAt().plusSeconds(30))) {
                submitAttempt(attempt.getId(), new SubmitExamRequest(), user);
                throw new IllegalStateException("Lượt thi trước đó của bạn đã hết giờ làm bài!");
            }
        } else {
            // Kiểm tra số lần thi
            List<ExamAttempt> existing = examAttemptRepository.findByExamIdAndStudentIdOrderByAttemptNumberDesc(examId, student.getId());
            if (existing.size() >= exam.getMaxAttempts()) {
                throw new IllegalStateException("Bạn đã hoàn thành đủ số lượt thi cho phép (" + existing.size() + "/" + exam.getMaxAttempts() + ")!");
            }

            int attemptNumber = existing.size() + 1;
            Instant dueAt = now.plus(Duration.ofMinutes(exam.getDurationMinutes()));
            if (exam.getEndTime() != null && dueAt.isAfter(exam.getEndTime())) {
                dueAt = exam.getEndTime();
            }

            ExamSnapshot snapshot = examSnapshotRepository.findTopByExamIdOrderByVersionDesc(exam.getId())
                    .orElse(null);

            attempt = ExamAttempt.builder()
                    .exam(exam)
                    .snapshot(snapshot)
                    .student(student)
                    .attemptNumber(attemptNumber)
                    .status("IN_PROGRESS")
                    .startedAt(now)
                    .dueAt(dueAt)
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .idempotencyKey(UUID.randomUUID().toString())
                    .createdAt(now)
                    .updatedAt(now)
                    .build();

            attempt = examAttemptRepository.save(attempt);

            // Khởi tạo các bản ghi AttemptAnswer
            List<ExamQuestion> examQuestions = new ArrayList<>(exam.getExamQuestions());
            if (Boolean.TRUE.equals(exam.getShuffleQuestions())) {
                Collections.shuffle(examQuestions);
            }

            List<AttemptAnswer> answers = new ArrayList<>();
            for (ExamQuestion eq : examQuestions) {
                AttemptAnswer ans = AttemptAnswer.builder()
                        .attempt(attempt)
                        .question(eq.getQuestion())
                        .score(BigDecimal.ZERO)
                        .maxScore(eq.getPoints())
                        .isMarkedForReview(false)
                        .autoGraded(false)
                        .updatedAt(now)
                        .build();
                answers.add(ans);
            }
            attemptAnswerRepository.saveAll(answers);
            attempt.setAnswers(answers);

            auditService.recordAction(user, "EXAM_ATTEMPT_START", "EXAM_ATTEMPT", String.valueOf(attempt.getId()),
                    "Bắt đầu làm bài thi: " + exam.getTitle() + " (Lượt " + attemptNumber + ")", ipAddress);
        }

        // Lấy câu hỏi an toàn (ẩn đáp án đúng, lời giải)
        ExamDto examDto = ExamDto.fromEntity(exam, true);
        List<ExamDto.ExamQuestionItemDto> questions = new ArrayList<>(examDto.getQuestions());
        if (Boolean.TRUE.equals(exam.getShuffleQuestions()) && activeOpt.isEmpty()) {
            Collections.shuffle(questions);
        }
        if (Boolean.TRUE.equals(exam.getShuffleOptions())) {
            for (var q : questions) {
                if (q.getOptions() != null) {
                    Collections.shuffle(q.getOptions());
                }
            }
        }

        // Lấy existing answers
        List<AttemptAnswer> savedAnswers = attemptAnswerRepository.findByAttemptId(attempt.getId());
        Map<Long, StartAttemptResponse.ExistingAnswerDto> existingMap = new HashMap<>();
        for (AttemptAnswer sa : savedAnswers) {
            existingMap.put(sa.getQuestion().getId(), StartAttemptResponse.ExistingAnswerDto.builder()
                    .selectedOptionIds(sa.getSelectedOptionIds())
                    .textAnswer(sa.getTextAnswer())
                    .isMarkedForReview(sa.getIsMarkedForReview())
                    .build());
        }

        long remainingSec = Math.max(0, Duration.between(now, attempt.getDueAt()).getSeconds());

        return StartAttemptResponse.builder()
                .attemptId(attempt.getId())
                .examId(exam.getId())
                .examTitle(exam.getTitle())
                .examCode(exam.getCode())
                .durationMinutes(exam.getDurationMinutes())
                .attemptNumber(attempt.getAttemptNumber())
                .startedAt(attempt.getStartedAt())
                .dueAt(attempt.getDueAt())
                .serverCurrentTime(now)
                .remainingSeconds(remainingSec)
                .maxScore(examDto.getTotalPoints())
                .questions(questions)
                .existingAnswers(existingMap)
                .build();
    }

    @Transactional
    public void saveAnswer(Long attemptId, SaveAnswerRequest req, User user) {
        Student student = getStudentByUser(user);
        ExamAttempt attempt = examAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy lượt thi với ID: " + attemptId));

        if (!attempt.getStudent().getId().equals(student.getId())) {
            throw new SecurityException("Bạn không có quyền chỉnh sửa câu trả lời của thí sinh khác!");
        }

        if (!"IN_PROGRESS".equalsIgnoreCase(attempt.getStatus())) {
            throw new IllegalStateException("Lượt thi đã kết thúc hoặc đã nộp bài, không thể lưu thêm đáp án!");
        }

        // Grace period 30s
        Instant now = Instant.now();
        if (now.isAfter(attempt.getDueAt().plusSeconds(30))) {
            throw new IllegalStateException("Đã quá thời gian làm bài quy định!");
        }

        AttemptAnswer answer = attemptAnswerRepository.findByAttemptIdAndQuestionId(attemptId, req.getQuestionId())
                .orElseGet(() -> {
                    Question q = attempt.getExam().getExamQuestions().stream()
                            .filter(eq -> eq.getQuestion().getId().equals(req.getQuestionId()))
                            .findFirst()
                            .map(ExamQuestion::getQuestion)
                            .orElseThrow(() -> new IllegalArgumentException("Câu hỏi không nằm trong đề thi!"));
                    return AttemptAnswer.builder()
                            .attempt(attempt)
                            .question(q)
                            .maxScore(BigDecimal.valueOf(1.00))
                            .build();
                });

        if (req.getSelectedOptionIds() != null) {
            answer.setSelectedOptionIds(req.getSelectedOptionIds());
        }
        if (req.getTextAnswer() != null) {
            answer.setTextAnswer(req.getTextAnswer());
        }
        if (req.getIsMarkedForReview() != null) {
            answer.setIsMarkedForReview(req.getIsMarkedForReview());
        }
        answer.setUpdatedAt(now);
        attemptAnswerRepository.save(answer);
    }

    @Transactional
    public AttemptResultDto submitAttempt(Long attemptId, SubmitExamRequest req, User user) {
        Student student = getStudentByUser(user);
        ExamAttempt attempt = examAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy lượt thi: " + attemptId));

        if (!attempt.getStudent().getId().equals(student.getId())) {
            throw new SecurityException("Bạn không thể nộp bài thi của thí sinh khác!");
        }

        // Idempotency: nếu đã nộp rồi thì trả về kết quả luôn
        if ("SUBMITTED".equalsIgnoreCase(attempt.getStatus()) || "GRADED".equalsIgnoreCase(attempt.getStatus())) {
            return getAttemptResult(attempt.getId(), user, false);
        }

        Instant now = Instant.now();
        attempt.setSubmittedAt(now);
        attempt.setUpdatedAt(now);

        // Lấy danh sách điểm từng câu
        Map<Long, BigDecimal> questionPoints = attempt.getExam().getExamQuestions().stream()
                .collect(Collectors.toMap(eq -> eq.getQuestion().getId(), ExamQuestion::getPoints, (a, b) -> a));

        // Tự động chấm điểm
        ExamAttempt graded = scoringService.gradeEntireAttempt(attempt, questionPoints);

        auditService.recordAction(user, "EXAM_ATTEMPT_SUBMIT", "EXAM_ATTEMPT", String.valueOf(attempt.getId()),
                "Nộp bài thi: " + attempt.getExam().getTitle() + " - Điểm đạt: " + graded.getTotalScore() + "/" + graded.getMaxScore(), null);

        return getAttemptResult(graded.getId(), user, false);
    }

    @Transactional(readOnly = true)
    public AttemptResultDto getAttemptResult(Long attemptId, User user, boolean isTeacherOrAdmin) {
        ExamAttempt attempt = examAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy lượt thi: " + attemptId));

        if (!isTeacherOrAdmin) {
            Student student = getStudentByUser(user);
            if (!attempt.getStudent().getId().equals(student.getId())) {
                throw new SecurityException("Bạn không có quyền xem kết quả của học viên khác!");
            }
        }

        Exam exam = attempt.getExam();
        boolean canReviewAnswers = isTeacherOrAdmin;
        if (!isTeacherOrAdmin) {
            if ("IMMEDIATELY".equalsIgnoreCase(exam.getShowResultMode())) {
                canReviewAnswers = true;
            } else if ("AFTER_CLOSED".equalsIgnoreCase(exam.getShowResultMode()) && exam.getEndTime() != null) {
                canReviewAnswers = Instant.now().isAfter(exam.getEndTime());
            }
        }
        final boolean finalCanReviewAnswers = canReviewAnswers;

        List<AttemptAnswer> answers = attemptAnswerRepository.findByAttemptId(attempt.getId());
        List<AttemptResultDto.AnswerDetailDto> details = new ArrayList<>();
        int correct = 0;
        int incorrect = 0;
        int unattempted = 0;

        for (AttemptAnswer ans : answers) {
            Question q = ans.getQuestion();
            boolean answered = (ans.getSelectedOptionIds() != null && !ans.getSelectedOptionIds().isBlank()) ||
                               (ans.getTextAnswer() != null && !ans.getTextAnswer().isBlank());
            if (!answered) {
                unattempted++;
            } else if (Boolean.TRUE.equals(ans.getIsCorrect())) {
                correct++;
            } else {
                incorrect++;
            }

            AttemptResultDto.AnswerDetailDto item = AttemptResultDto.AnswerDetailDto.builder()
                    .questionId(q.getId())
                    .code(q.getCode())
                    .type(q.getType())
                    .topic(q.getTopic())
                    .difficulty(q.getDifficulty())
                    .content(q.getContent())
                    .points(ans.getMaxScore())
                    .score(ans.getScore())
                    .isCorrect(ans.getIsCorrect())
                    .studentSelectedOptions(ans.getSelectedOptionIds())
                    .studentTextAnswer(ans.getTextAnswer())
                    .teacherFeedback(ans.getTeacherFeedback())
                    .rubricBreakdown(ans.getRubricBreakdown())
                    .correctAnswer(canReviewAnswers ? q.getAnswerKey() : null)
                    .explanation(canReviewAnswers ? q.getExplanation() : null)
                    .options(q.getOptions() != null ?
                            q.getOptions().stream()
                                    .map(o -> QuestionOptionDto.fromEntity(o, !finalCanReviewAnswers))
                                    .collect(Collectors.toList()) : new ArrayList<>())
                    .build();
            details.add(item);
        }

        long duration = 0;
        if (attempt.getStartedAt() != null && attempt.getSubmittedAt() != null) {
            duration = Duration.between(attempt.getStartedAt(), attempt.getSubmittedAt()).getSeconds();
        }

        return AttemptResultDto.builder()
                .attemptId(attempt.getId())
                .examId(exam.getId())
                .examTitle(exam.getTitle())
                .examCode(exam.getCode())
                .studentId(attempt.getStudent().getId())
                .studentName(attempt.getStudent().getFullName())
                .studentCode(attempt.getStudent().getStudentCode())
                .attemptNumber(attempt.getAttemptNumber())
                .status(attempt.getStatus())
                .startedAt(attempt.getStartedAt())
                .submittedAt(attempt.getSubmittedAt())
                .durationSeconds(duration)
                .totalScore(attempt.getTotalScore())
                .maxScore(attempt.getMaxScore())
                .percentage(attempt.getPercentage())
                .isPassed(attempt.getIsPassed())
                .correctCount(correct)
                .incorrectCount(incorrect)
                .unattemptedCount(unattempted)
                .canReviewAnswers(canReviewAnswers)
                .answers(details)
                .build();
    }
}
