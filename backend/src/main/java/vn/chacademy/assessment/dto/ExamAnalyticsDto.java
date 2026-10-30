package vn.chacademy.assessment.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamAnalyticsDto {
    private Long examId;
    private String examTitle;
    private String examCode;
    private Integer totalAssignedStudents;
    private Integer totalAttempts;
    private Integer completedAttempts;
    private BigDecimal averageScore;
    private BigDecimal medianScore;
    private BigDecimal highestScore;
    private BigDecimal lowestScore;
    private BigDecimal passRate;
    private Map<String, Integer> scoreDistribution; // "0-4": 1, "4-6": 3, "6-8": 5, "8-10": 8
    @Builder.Default
    private List<QuestionStatDto> questionStats = new ArrayList<>();

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class QuestionStatDto {
        private Long questionId;
        private String code;
        private String content;
        private String type;
        private String topic;
        private BigDecimal maxPoints;
        private BigDecimal averageScore;
        private BigDecimal correctRate; // % trả lời đúng
        private Boolean isAnomalous; // true nếu tỷ lệ đúng < 20% hoặc quá thấp
    }
}
