package vn.chacademy.dashboard.dto;

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
public class UpcomingSessionDto {
    private Long id;
    private Long classId;
    private String className;
    private String classCode;
    private String teacherName;
    private LocalDate sessionDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private String room;
    private String status;
}
