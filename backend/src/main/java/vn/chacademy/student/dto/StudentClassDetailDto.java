package vn.chacademy.student.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.chacademy.academic.dto.SessionMaterialDto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentClassDetailDto {
    private Long id;
    private String code;
    private String name;
    private String courseName;
    private String teacherName;
    private String room;
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate startDate;
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate endDate;
    private String status;
    private List<StudentSessionDto> sessions;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StudentSessionDto {
        private Long id;
        @JsonFormat(pattern = "yyyy-MM-dd")
        private LocalDate sessionDate;
        @JsonFormat(pattern = "HH:mm")
        private LocalTime startTime;
        @JsonFormat(pattern = "HH:mm")
        private LocalTime endTime;
        private String room;
        private String topic;
        private String status;
        private String attendanceStatus; // PRESENT, ABSENT, LATE, NOT_RECORDED
        private String teacherNote;
        private List<SessionMaterialDto> materials;
    }
}
