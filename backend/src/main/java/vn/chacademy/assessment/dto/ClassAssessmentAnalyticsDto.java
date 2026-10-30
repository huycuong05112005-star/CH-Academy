package vn.chacademy.assessment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassAssessmentAnalyticsDto {
    private Long classId;
    private String className;
    private String classCode;
    private String courseName;
    private String teacherName;

    // KPI Metrics
    private int totalEnrolled;
    private int totalAssigned;
    private int totalParticipated;
    private int totalUnattempted;
    private int totalSubmitted;
    private int totalGraded;
    private int totalPendingGrading;

    private BigDecimal averageScore;
    private BigDecimal medianScore;
    private BigDecimal highestScore;
    private BigDecimal lowestScore;

    private int passCount;
    private int failCount;
    private BigDecimal passRate;

    private BigDecimal avgCompletionTimeMinutes;
    private BigDecimal attendanceRate;
    private int totalSessions;
    private int totalExams;

    // Khi lọc theo Buổi học, nhúng phân tích chất lượng của buổi đó ngay trong cùng trang
    private SessionQualityDto selectedSessionQuality;

    // Charts Data
    private List<ScoreBucketDto> scoreDistribution;
    private List<ScoreTrendDto> scoreTrend;
    private List<TopicMasteryDto> topicMastery;

    // Student Roster
    private List<ClassStudentScoreDto> studentScores;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ScoreBucketDto {
        private String range; // "0-2", "2-4", "4-6", "6-8", "8-10"
        private int count;
        private BigDecimal percentage;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ScoreTrendDto {
        private String examTitle;
        private LocalDate date;
        private BigDecimal averageScore;
        private BigDecimal passRate;
        private int participantsCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TopicMasteryDto {
        private String topic;
        private int totalQuestions;
        private int correctCount;
        private BigDecimal masteryRate; // Percentage 0 - 100
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ClassStudentScoreDto {
        private Long studentId;
        private String studentCode;
        private String fullName;
        private String avatarUrl;
        private int attemptsCount;
        private int totalAssigned;
        private int totalCompleted;
        private int totalUnattempted;
        private BigDecimal averageScore;
        private BigDecimal highestScore;
        private BigDecimal lowestScore;
        private BigDecimal passRate;
        private BigDecimal attendanceRate;
        private int attendedSessions;
        private int totalClassSessions;
        private boolean needsSupport;
        private String supportReason;
        private String progressTrend; // "TIẾN BỘ", "ỔN ĐỊNH", "CẦN HỖ TRỢ"
        private String lastAttemptDate;
        private String status; // "PASSED", "FAILED", "NOT_ATTEMPTED", "WAITING_GRADE"
    }
}
