package vn.chacademy.student.dto;

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
public class StudentScheduleDto {
    private Long sessionId;
    private Long classId;
    private String classCode;
    private String className;
    private String courseName;
    private String teacherName;
    private LocalDate sessionDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private String room;
    private String topic;
    private String status;
    private String attendanceStatus;
    private String teacherNote;
}
