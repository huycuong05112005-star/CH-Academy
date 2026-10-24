package vn.chacademy.academic.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.chacademy.academic.entity.ClassSchedule;

import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassScheduleDto {
    private Long id;
    private Long classId;
    private Integer dayOfWeek; // 1: Thứ 2, 7: CN

    @JsonFormat(pattern = "HH:mm")
    private LocalTime startTime;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime endTime;

    private String room;

    public static ClassScheduleDto fromEntity(ClassSchedule s) {
        if (s == null) return null;
        return ClassScheduleDto.builder()
                .id(s.getId())
                .classId(s.getClassEntity() != null ? s.getClassEntity().getId() : null)
                .dayOfWeek(s.getDayOfWeek())
                .startTime(s.getStartTime())
                .endTime(s.getEndTime())
                .room(s.getRoom())
                .build();
    }
}
