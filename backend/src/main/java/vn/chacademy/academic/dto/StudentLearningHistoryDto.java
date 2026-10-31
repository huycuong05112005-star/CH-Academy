package vn.chacademy.academic.dto;

import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentLearningHistoryDto {
    private Long enrollmentId;
    private Long classId;
    private String classCode;
    private String className;
    private Long courseId;
    private String courseName;
    private String academicYear;
    private String primaryTeacherName;
    private LocalDate enrollmentDate;
    private String status; // ENROLLED, COMPLETED, DROPPED
    private Double finalGrade;
    private Integer attendedSessions;
    private Integer totalSessions;
    private Double attendanceRate;
}
