package vn.chacademy.assessment.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentAssignedExamDto {
    private Long examId;
    private String title;
    private String code;
    private String courseName;
    private String teacherName;
    private Integer durationMinutes;
    private BigDecimal passPercentage;
    private Integer maxAttempts;
    private Integer currentAttemptsCount;
    private String attemptStatus; // null, IN_PROGRESS, GRADED, SUBMITTED
    private Long activeAttemptId;
    private BigDecimal latestScore;
    private BigDecimal maxScore;
    private Boolean isPassed;
    private Instant startTime;
    private Instant endTime;
    private Instant dueDate;
    private Boolean canTake;
    private String cannotTakeReason;
}
