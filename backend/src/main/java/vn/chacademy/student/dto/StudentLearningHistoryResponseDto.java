package vn.chacademy.student.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentLearningHistoryResponseDto {

    private Long studentId;
    private String studentCode;
    private String fullName;
    private String email;
    private String phone;
    private String targetType;
    private String studentStatus;
    private String accountStatus;
    private String username;
    private LocalDate firstEnrollmentDate;
    private Integer totalYearsEnrolled;
    private Integer totalClassesEnrolled;
    private Integer totalCompletedClasses;
    private Double overallAttendanceRate;
    private BigDecimal totalTuition;
    private BigDecimal totalPaid;
    private BigDecimal totalDebt;

    @Builder.Default
    private List<String> enrolledAcademicYears = new ArrayList<>();

    @Builder.Default
    private List<LearningHistoryEnrollmentItem> enrollments = new ArrayList<>();

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LearningHistoryEnrollmentItem {
        private Long enrollmentId;
        private Long classId;
        private String classCode;
        private String className;
        private String academicYear;
        private Long courseId;
        private String courseName;
        private String primaryTeacherName;
        private LocalDate enrollmentDate;
        private String status; // ENROLLED, ACTIVE, COMPLETED, DROPPED, CANCELLED, WITHDRAWN, SUSPENDED

        // Chuyên cần & Điểm danh
        private Integer totalSessions;
        private Integer attendedSessions;
        private Double attendanceRate;

        // Tài chính & Học phí
        private BigDecimal tuitionFee;
        private BigDecimal paidAmount;
        private BigDecimal remainingDebt;
        private String paymentStatus;

        // Bài kiểm tra & Điểm số
        @Builder.Default
        private List<LearningHistoryExamItem> exams = new ArrayList<>();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LearningHistoryExamItem {
        private Long examId;
        private String examTitle;
        private String examCode;
        private BigDecimal score;
        private BigDecimal maxScore;
        private Boolean isPassed;
        private String status;
        private String submittedAt;
    }
}

