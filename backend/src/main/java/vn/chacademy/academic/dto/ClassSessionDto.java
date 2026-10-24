package vn.chacademy.academic.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.chacademy.academic.entity.ClassSession;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassSessionDto {
    private Long id;
    private Long classId;
    private String classCode;
    private String className;
    private Long teacherId;
    private String teacherName;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate sessionDate;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime startTime;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime endTime;

    private String room;
    private String topic;
    private String status;

    public static ClassSessionDto fromEntity(ClassSession s) {
        if (s == null) return null;
        return ClassSessionDto.builder()
                .id(s.getId())
                .classId(s.getClassEntity() != null ? s.getClassEntity().getId() : null)
                .classCode(s.getClassEntity() != null ? s.getClassEntity().getCode() : null)
                .className(s.getClassEntity() != null ? s.getClassEntity().getName() : null)
                .teacherId(s.getTeacher() != null ? s.getTeacher().getId() : null)
                .teacherName(s.getTeacher() != null ? s.getTeacher().getFullName() : null)
                .sessionDate(s.getSessionDate())
                .startTime(s.getStartTime())
                .endTime(s.getEndTime())
                .room(s.getRoom())
                .topic(s.getTopic())
                .status(s.getStatus())
                .build();
    }
}
