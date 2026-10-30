package vn.chacademy.assessment.dto;

import lombok.*;
import vn.chacademy.assessment.entity.Question;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionDto {
    private Long id;
    private Long bankId;
    private String bankName;
    private Long courseId;
    private String courseName;
    private String code;
    private String type;
    private String difficulty;
    private String topic;
    private String learningOutcome;
    private String content;
    private BigDecimal defaultPoints;
    private String explanation; // null nếu là student-safe
    private String rubricJson;  // null nếu là student-safe
    private String answerKey;   // null nếu là student-safe
    private Long sessionId;
    private String sessionTopic;
    private String sessionDate;
    private Long classId;
    private String className;
    private String status;
    private String createdByName;
    private Instant createdAt;
    private Instant updatedAt;
    @Builder.Default
    private List<QuestionOptionDto> options = new ArrayList<>();

    public static QuestionDto fromEntity(Question entity, boolean studentSafe) {
        if (entity == null) return null;
        return QuestionDto.builder()
                .id(entity.getId())
                .bankId(entity.getBank() != null ? entity.getBank().getId() : null)
                .bankName(entity.getBank() != null ? entity.getBank().getName() : null)
                .courseId(entity.getCourse() != null ? entity.getCourse().getId() : null)
                .courseName(entity.getCourse() != null ? entity.getCourse().getName() : null)
                .sessionId(entity.getSession() != null ? entity.getSession().getId() : null)
                .sessionTopic(entity.getSession() != null ? entity.getSession().getTopic() : null)
                .sessionDate(entity.getSession() != null && entity.getSession().getSessionDate() != null ? entity.getSession().getSessionDate().toString() : null)
                .classId(entity.getSession() != null && entity.getSession().getClassEntity() != null ? entity.getSession().getClassEntity().getId() : null)
                .className(entity.getSession() != null && entity.getSession().getClassEntity() != null ? entity.getSession().getClassEntity().getName() : null)
                .code(entity.getCode())
                .type(entity.getType())
                .difficulty(entity.getDifficulty())
                .topic(entity.getTopic())
                .learningOutcome(entity.getLearningOutcome())
                .content(entity.getContent())
                .defaultPoints(entity.getDefaultPoints())
                .explanation(studentSafe ? null : entity.getExplanation())
                .rubricJson(studentSafe ? null : entity.getRubricJson())
                .answerKey(studentSafe ? null : entity.getAnswerKey())
                .status(entity.getStatus())
                .createdByName(entity.getCreatedBy() != null ? entity.getCreatedBy().getFullName() : null)
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .options(entity.getOptions() != null ?
                        entity.getOptions().stream()
                                .map(o -> QuestionOptionDto.fromEntity(o, studentSafe))
                                .collect(Collectors.toList()) : new ArrayList<>())
                .build();
    }
}
