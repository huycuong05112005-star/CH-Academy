package vn.chacademy.attendance.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceMonitoringDto {
    private Long sessionId;
    private Long classId;
    private String classCode;
    private String className;
    private Long teacherId;
    private String teacherName;
    private LocalDate sessionDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private String room;
    private String topic;
    private String sessionStatus;
    private boolean isMarked;
    private int totalEnrolled;
    private int presentCount;
    private int lateCount;
    private int absentCount;
    private int excusedCount;
}
