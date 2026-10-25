package vn.chacademy.student.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentAttendanceItemDto {
    private Long id;
    private Long sessionId;
    private Long classId;
    private String classCode;
    private String className;
    private LocalDate sessionDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private String topic;
    private String status; // PRESENT, ABSENT, LATE, EXCUSED
    private String note;
    private Instant recordedAt;
}
