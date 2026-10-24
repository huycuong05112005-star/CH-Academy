package vn.chacademy.attendance.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceStatsDto {
    private Long studentId;
    private long totalSessions;
    private long presentCount;
    private long absentCount;
    private long lateCount;
    private long excusedCount;
    private double attendanceRatePercent;
}
