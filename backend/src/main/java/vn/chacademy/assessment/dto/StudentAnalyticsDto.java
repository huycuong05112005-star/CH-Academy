package vn.chacademy.assessment.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
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
public class StudentAnalyticsDto {
    private Long studentId;
    private String studentName;
    private Integer totalExamsTaken;
    private Integer passedCount;
    private BigDecimal averageScore;
    private BigDecimal highestScore;
    private BigDecimal passRate;

    @Builder.Default
    private List<ExamHistoryItemDto> examHistory = new ArrayList<>();

    @Builder.Default
    private List<TopicMasteryDto> topicMasteries = new ArrayList<>();

    @Builder.Default
    private List<String> strongTopics = new ArrayList<>();

    @Builder.Default
    private List<String> weakTopics = new ArrayList<>();

    @Builder.Default
    private List<String> studyRecommendations = new ArrayList<>();

    @JsonProperty("topicMastery")
    public List<TopicMasteryDto> getTopicMastery() {
        return topicMasteries != null ? topicMasteries : new ArrayList<>();
    }

    @JsonProperty("recommendations")
    public List<String> getRecommendations() {
        return studyRecommendations != null ? studyRecommendations : new ArrayList<>();
    }

    @JsonProperty("scoreHistory")
    public List<ExamHistoryItemDto> getScoreHistory() {
        return examHistory != null ? examHistory : new ArrayList<>();
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ExamHistoryItemDto {
        private Long attemptId;
        private Long examId;
        private String examTitle;
        private BigDecimal score;
        private BigDecimal maxScore;
        private BigDecimal percentage;
        private Boolean isPassed;
        private Instant submittedAt;

        @JsonProperty("passed")
        public Boolean getPassed() {
            return isPassed;
        }
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TopicMasteryDto {
        private String topic;
        private Integer totalQuestions;
        private Integer correctQuestions;
        private BigDecimal masteryRate; // % đúng trong chủ đề này
        private String status;

        @JsonProperty("correctAnswers")
        public Integer getCorrectAnswers() {
            return correctQuestions;
        }

        @JsonProperty("masteryPercentage")
        public BigDecimal getMasteryPercentage() {
            return masteryRate;
        }
    }
}
