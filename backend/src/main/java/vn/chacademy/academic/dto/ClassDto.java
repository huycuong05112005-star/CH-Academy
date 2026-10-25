package vn.chacademy.academic.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.chacademy.academic.entity.ClassEntity;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassDto {
    private Long id;
    private Long courseId;
    private String courseCode;
    private String courseName;
    private Long primaryTeacherId;
    private String primaryTeacherName;
    private String code;
    private String name;
    private Integer maxCapacity;
    private Integer enrolledCount;
    private String room;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate startDate;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate endDate;

    private String status;
    private Instant createdAt;
    private List<ClassScheduleDto> schedules;

    public static ClassDto fromEntity(ClassEntity c, int enrolledCount) {
        if (c == null) return null;
        return ClassDto.builder()
                .id(c.getId())
                .courseId(c.getCourse() != null ? c.getCourse().getId() : null)
                .courseCode(c.getCourse() != null ? c.getCourse().getCode() : null)
                .courseName(c.getCourse() != null ? c.getCourse().getName() : null)
                .primaryTeacherId(c.getPrimaryTeacher() != null ? c.getPrimaryTeacher().getId() : null)
                .primaryTeacherName(c.getPrimaryTeacher() != null ? c.getPrimaryTeacher().getFullName() : null)
                .code(c.getCode())
                .name(c.getName())
                .maxCapacity(c.getMaxCapacity())
                .enrolledCount(enrolledCount)
                .room(c.getRoom())
                .startDate(c.getStartDate())
                .endDate(c.getEndDate())
                .status(c.getStatus())
                .createdAt(c.getCreatedAt())
                .schedules(c.getSchedules() != null
                        ? c.getSchedules().stream().map(ClassScheduleDto::fromEntity).toList()
                        : List.of())
                .build();
    }
}
