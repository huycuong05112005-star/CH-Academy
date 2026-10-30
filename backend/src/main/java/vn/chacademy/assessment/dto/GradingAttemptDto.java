package vn.chacademy.assessment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.chacademy.assessment.entity.ExamAttempt;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GradingAttemptDto {
    private Long id;
    private Long examId;
    private String examTitle;
    private String examCode;
    private Long studentId;
    private String studentName;
    private String studentCode;
    private Integer attemptNumber;
    private String status;
    private Instant startedAt;
    private Instant submittedAt;
    private Instant dueAt;
    private BigDecimal totalScore;
    private BigDecimal maxScore;
    private BigDecimal percentage;
    private Boolean isPassed;

    public static GradingAttemptDto fromEntity(ExamAttempt ea) {
        if (ea == null) return null;
        return GradingAttemptDto.builder()
                .id(ea.getId())
                .examId(ea.getExam() != null ? ea.getExam().getId() : null)
                .examTitle(ea.getExam() != null ? ea.getExam().getTitle() : null)
                .examCode(ea.getExam() != null ? ea.getExam().getCode() : null)
                .studentId(ea.getStudent() != null ? ea.getStudent().getId() : null)
                .studentName(ea.getStudent() != null ? ea.getStudent().getFullName() : null)
                .studentCode(ea.getStudent() != null ? ea.getStudent().getStudentCode() : null)
                .attemptNumber(ea.getAttemptNumber())
                .status(ea.getStatus())
                .startedAt(ea.getStartedAt())
                .submittedAt(ea.getSubmittedAt())
                .dueAt(ea.getDueAt())
                .totalScore(ea.getTotalScore())
                .maxScore(ea.getMaxScore())
                .percentage(ea.getPercentage())
                .isPassed(ea.getIsPassed())
                .build();
    }
}
