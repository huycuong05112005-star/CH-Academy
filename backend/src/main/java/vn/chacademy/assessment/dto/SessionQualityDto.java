package vn.chacademy.assessment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionQualityDto {
    private Long sessionId;
    private Long classId;
    private String className;
    private String classCode;
    private String courseName;
    private String teacherName;
    private LocalDate sessionDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private String room;
    private String topic;
    private String sessionStatus;

    // Attendance Metrics
    private int expectedStudents;
    private int presentCount;
    private int absentCount;
    private int lateCount;
    private int excusedCount;
    private BigDecimal attendanceRate; // 0 - 100%

    // Assessment & Quiz Metrics
    private int quizzesAssignedCount;
    private int quizSubmissionsCount;
    private BigDecimal quizCompletionRate; // 0 - 100%
    private BigDecimal quizAverageScore; // 0.0 - 10.0
    private BigDecimal quizPassRate; // 0 - 100%
    private BigDecimal preClassQuizScore; // if pre-class quiz exists
    private BigDecimal postClassQuizScore; // if post-class quiz exists
    private BigDecimal scoreImprovement; // post - pre

    // Synthesized Quality Index
    private BigDecimal qualityScore; // 0 - 100
    private String qualityRating; // "Xuất sắc", "Tốt", "Khá", "Cần cải thiện"
    private String formulaDescription;
    private List<String> dataWarnings;

    // Students needing support
    private List<StudentNeedingSupportDto> studentsNeedingSupport;

    // Timeline of all sessions in class for comparison
    private List<SessionOverviewItemDto> classSessionsOverview;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StudentNeedingSupportDto {
        private Long studentId;
        private String studentCode;
        private String fullName;
        private String attendanceStatus; // PRESENT, ABSENT, LATE, EXCUSED
        private BigDecimal quizScore;
        private List<String> reasons;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SessionOverviewItemDto {
        private Long sessionId;
        private LocalDate sessionDate;
        private String topic;
        private BigDecimal attendanceRate;
        private BigDecimal quizAverageScore;
        private BigDecimal qualityScore;
        private String status;
    }
}
