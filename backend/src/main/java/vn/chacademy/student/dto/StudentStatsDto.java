package vn.chacademy.student.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentStatsDto {
    private long totalStudents;
    private long activeStudents;
    private long enrolledStudents;
    private long kidStudents;
    private long adultStudents;
}
