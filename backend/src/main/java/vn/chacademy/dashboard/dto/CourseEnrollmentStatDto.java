package vn.chacademy.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseEnrollmentStatDto {
    private Long courseId;
    private String courseName;
    private String courseCode;
    private long enrolledStudents;
    private BigDecimal estimatedRevenue;
}

