package vn.chacademy.academic.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public class TeacherPortalDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TeacherProfileDto {
        private Long id;
        private String teacherCode;
        private String fullName;
        private String email;
        private String phone;
        private String specialization;
        private String bio;
        private String status;
        private int totalClasses;
        private int activeStudents;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TeacherClassDto {
        private Long id;
        private String code;
        private String name;
        private Long courseId;
        private String courseName;
        private String courseCode;
        private String room;
        @JsonFormat(pattern = "yyyy-MM-dd")
        private LocalDate startDate;
        @JsonFormat(pattern = "yyyy-MM-dd")
        private LocalDate endDate;
        private String status;
        private int totalSessions;
        private int enrolledStudents;
        private List<TeacherStudentDto> students;
        private List<TeacherSessionDto> sessions;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TeacherStudentDto {
        private Long studentId;
        private String studentCode;
        private String fullName;
        private String email;
        private String phone;
        private String gender;
        @JsonFormat(pattern = "yyyy-MM-dd")
        private LocalDate dateOfBirth;
        @JsonFormat(pattern = "yyyy-MM-dd")
        private LocalDate enrollmentDate;
        private String status;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TeacherSessionDto {
        private Long id;
        private Long classId;
        @JsonFormat(pattern = "yyyy-MM-dd")
        private LocalDate sessionDate;
        @JsonFormat(pattern = "HH:mm")
        private LocalTime startTime;
        @JsonFormat(pattern = "HH:mm")
        private LocalTime endTime;
        private String room;
        private String topic;
        private String status;
        private List<SessionMaterialDto> materials;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TeacherActionItemDto {
        private String id;
        private String type; // ATTENDANCE, EXAM_REVIEW, GRADING, GENERAL
        private String title;
        private String description;
        private String linkUrl;
        private String priority; // HIGH, MEDIUM, LOW
        private String badge;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TeacherDashboardSummaryDto {
        private int totalClasses;
        private int totalStudents;
        private int todaySessionsCount;
        private int upcomingSessionsCount;
        private int unmarkedAttendanceCount;
        private int draftExamsCount;
        private int pendingReviewExamsCount;
        private int approvedExamsCount;
        private int changesRequestedExamsCount;
        private int publishedExamsCount;
        private int pendingGradingCount;
        private List<TeacherActionItemDto> actionItems;
        private List<TeacherSessionDto> todaySessions;
        private List<TeacherSessionDto> upcomingSessions;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StudentExamResultSummaryDto {
        private Long studentId;
        private String studentCode;
        private String fullName;
        private String email;
        private String status; // NOT_STARTED, IN_PROGRESS, SUBMITTED, GRADED
        private java.math.BigDecimal score;
        private java.math.BigDecimal maxScore;
        private Boolean isPassed;
        private Integer attemptCount;
        private java.time.Instant submittedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ClassExamResultDto {
        private Long examId;
        private String examTitle;
        private String examCode;
        private Long classId;
        private String className;
        private Integer durationMinutes;
        private java.math.BigDecimal totalPoints;
        private int totalStudents;
        private int completedCount;
        private int inProgressCount;
        private int unattemptedCount;
        private Double averageScore;
        private Double passRate;
        private List<StudentExamResultSummaryDto> studentResults;
    }
}
