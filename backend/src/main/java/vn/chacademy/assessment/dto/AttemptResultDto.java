package vn.chacademy.assessment.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttemptResultDto {
    private Long attemptId;
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
    private Long durationSeconds;
    private BigDecimal totalScore;
    private BigDecimal maxScore;
    private BigDecimal percentage;
    private Boolean isPassed;
    private Integer correctCount;
    private Integer incorrectCount;
    private Integer unattemptedCount;
    private Boolean canReviewAnswers;
    @Builder.Default
    private List<AnswerDetailDto> answers = new ArrayList<>();

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AnswerDetailDto {
        private Long questionId;
        private String code;
        private String type;
        private String topic;
        private String difficulty;
        private String content;
        private BigDecimal points;
        private BigDecimal score;
        private Boolean isCorrect;
        private String studentSelectedOptions;
        private String studentTextAnswer;
        private String correctAnswer;
        private String explanation;
        private String teacherFeedback;
        private String rubricBreakdown;
        private List<QuestionOptionDto> options;
    }
}
