package vn.chacademy.assessment.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StartAttemptResponse {
    private Long attemptId;
    private Long examId;
    private String examTitle;
    private String examCode;
    private Integer durationMinutes;
    private Integer attemptNumber;
    private Instant startedAt;
    private Instant dueAt;
    private Instant serverCurrentTime;
    private Long remainingSeconds;
    private BigDecimal maxScore;
    @Builder.Default
    private List<ExamDto.ExamQuestionItemDto> questions = new ArrayList<>();
    @Builder.Default
    private Map<Long, ExistingAnswerDto> existingAnswers = Map.of();

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ExistingAnswerDto {
        private String selectedOptionIds;
        private String textAnswer;
        private Boolean isMarkedForReview;
    }
}
