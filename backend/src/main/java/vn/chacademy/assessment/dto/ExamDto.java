package vn.chacademy.assessment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import vn.chacademy.assessment.entity.Exam;
import vn.chacademy.assessment.entity.ExamAssignment;
import vn.chacademy.assessment.entity.ExamQuestion;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamDto {
    private Long id;
    private String title;
    private String code;
    private String description;
    private Long courseId;
    private String courseName;
    private Long teacherId;
    private String teacherName;
    private Integer durationMinutes;
    private BigDecimal passPercentage;
    private Integer maxAttempts;
    private Boolean shuffleQuestions;
    private Boolean shuffleOptions;
    private String showResultMode;
    private Instant startTime;
    private Instant endTime;
    private Long sessionId;
    private String sessionTopic;
    private String sessionDate;
    private Long classId;
    private String className;
    private String status;
    private Integer version;
    private Integer questionCount;
    private BigDecimal totalPoints;
    private String createdByName;
    private Long reviewedById;
    private String reviewedByName;
    private Instant reviewedAt;
    private String reviewFeedback;
    private String rejectionReason;
    private Instant submittedAt;
    private Instant publishedAt;
    private Instant createdAt;
    private Instant updatedAt;
    @Builder.Default
    private List<ExamQuestionItemDto> questions = new ArrayList<>();
    @Builder.Default
    private List<Long> assignedClassIds = new ArrayList<>();

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ExamQuestionItemDto {
        private Long questionId;
        private String code;
        private String type;
        private String difficulty;
        private String topic;
        private String content;
        private BigDecimal points;
        private Integer sortOrder;
        private List<QuestionOptionDto> options;
    }

    public static ExamDto fromEntity(Exam entity, boolean studentSafe) {
        if (entity == null) return null;
        BigDecimal totalPts = BigDecimal.ZERO;
        List<ExamQuestionItemDto> qItems = new ArrayList<>();

        if (entity.getExamQuestions() != null) {
            for (ExamQuestion eq : entity.getExamQuestions()) {
                if (eq.getPoints() != null) {
                    totalPts = totalPts.add(eq.getPoints());
                }
                if (eq.getQuestion() != null) {
                    qItems.add(ExamQuestionItemDto.builder()
                            .questionId(eq.getQuestion().getId())
                            .code(eq.getQuestion().getCode())
                            .type(eq.getQuestion().getType())
                            .difficulty(eq.getQuestion().getDifficulty())
                            .topic(eq.getQuestion().getTopic())
                            .content(eq.getQuestion().getContent())
                            .points(eq.getPoints())
                            .sortOrder(eq.getSortOrder())
                            .options(eq.getQuestion().getOptions() != null ?
                                    eq.getQuestion().getOptions().stream()
                                            .map(o -> QuestionOptionDto.fromEntity(o, studentSafe))
                                            .toList() : new ArrayList<>())
                            .build());
                }
            }
        }

        List<Long> classIds = new ArrayList<>();
        if (entity.getAssignments() != null) {
            for (ExamAssignment a : entity.getAssignments()) {
                if (a.getClassEntity() != null) {
                    classIds.add(a.getClassEntity().getId());
                }
            }
        }

        return ExamDto.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .code(entity.getCode())
                .description(entity.getDescription())
                .courseId(entity.getCourse() != null ? entity.getCourse().getId() : null)
                .courseName(entity.getCourse() != null ? entity.getCourse().getName() : null)
                .sessionId(entity.getSession() != null ? entity.getSession().getId() : null)
                .sessionTopic(entity.getSession() != null ? entity.getSession().getTopic() : null)
                .sessionDate(entity.getSession() != null && entity.getSession().getSessionDate() != null ? entity.getSession().getSessionDate().toString() : null)
                .classId(entity.getSession() != null && entity.getSession().getClassEntity() != null ? entity.getSession().getClassEntity().getId() : null)
                .className(entity.getSession() != null && entity.getSession().getClassEntity() != null ? entity.getSession().getClassEntity().getName() : null)
                .teacherId(entity.getTeacher() != null ? entity.getTeacher().getId() : null)
                .teacherName(entity.getTeacher() != null ? entity.getTeacher().getFullName() : null)
                .durationMinutes(entity.getDurationMinutes())
                .passPercentage(entity.getPassPercentage())
                .maxAttempts(entity.getMaxAttempts())
                .shuffleQuestions(entity.getShuffleQuestions())
                .shuffleOptions(entity.getShuffleOptions())
                .showResultMode(entity.getShowResultMode())
                .startTime(entity.getStartTime())
                .endTime(entity.getEndTime())
                .status(entity.getStatus())
                .version(entity.getVersion())
                .questionCount(qItems.size())
                .totalPoints(totalPts)
                .createdByName(entity.getCreatedBy() != null ? entity.getCreatedBy().getFullName() : null)
                .reviewedById(entity.getReviewedBy() != null ? entity.getReviewedBy().getId() : null)
                .reviewedByName(entity.getReviewedBy() != null ? entity.getReviewedBy().getFullName() : null)
                .reviewedAt(entity.getReviewedAt())
                .reviewFeedback(entity.getReviewFeedback())
                .rejectionReason(entity.getRejectionReason())
                .submittedAt(entity.getSubmittedAt())
                .publishedAt(entity.getPublishedAt())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .questions(qItems)
                .assignedClassIds(classIds)
                .build();
    }
}
