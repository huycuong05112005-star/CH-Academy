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
public class StudentClassDetailDto {
    private Long studentId;
    private String studentCode;
    private String fullName;
    private String email;
    private String phone;
    private Long classId;
    private String className;
    private String classCode;

    // Thống kê tổng hợp học viên trong lớp
    private BigDecimal averageScore;
    private BigDecimal highestScore;
    private BigDecimal lowestScore;
    private BigDecimal passRate;
    private BigDecimal attendanceRate;
    private int completedExamsCount;
    private int unattemptedExamsCount;
    private String teacherNotes;

    // Lịch sử chuyên cần từng buổi học
    private List<StudentSessionAttendanceDto> sessionAttendances;

    // Lịch sử làm bài kiểm tra
    private List<StudentExamRecordDto> examRecords;

    // Chi tiết câu sai hoặc cần cải thiện
    private List<StudentReviewQuestionDto> reviewQuestions;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StudentSessionAttendanceDto {
        private Long sessionId;
        private LocalDate sessionDate;
        private String timeRange;
        private String topic;
        private String room;
        private String status; // "PRESENT", "LATE", "ABSENT", "UNRECORDED"
        private String remarks;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StudentExamRecordDto {
        private Long examId;
        private String examTitle;
        private String examCode;
        private String sessionTopic;
        private LocalDate assignedDate;
        private LocalDate dueDate;
        private int attemptNumber;
        private BigDecimal score;
        private BigDecimal maxScore;
        private BigDecimal percentage;
        private boolean isPassed;
        private String status; // "GRADED", "SUBMITTED", "NOT_ATTEMPTED"
        private String submittedAt;
        private Integer durationMinutes;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StudentReviewQuestionDto {
        private Long questionId;
        private String questionContent;
        private String questionType;
        private String topic;
        private String studentAnswer;
        private String correctAnswer;
        private boolean isCorrect;
        private BigDecimal pointsEarned;
        private BigDecimal maxPoints;
        private String explanation;
    }
}
