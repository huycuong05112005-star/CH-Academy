package vn.chacademy.course.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.chacademy.course.entity.Course;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseDto {
    private Long id;
    private Long categoryId;
    private String categoryCode;
    private String categoryName;
    private String code;
    private String name;
    private String description;
    private String targetAudience;
    private String level;
    private Integer durationHours;
    private BigDecimal defaultTuitionFee;
    private String learningOutcomes;
    private Integer maxStudents;
    private String status;
    private Boolean isPublic;
    private Instant createdAt;
    private Instant updatedAt;

    public static CourseDto fromEntity(Course entity) {
        return CourseDto.builder()
                .id(entity.getId())
                .categoryId(entity.getCategory() != null ? entity.getCategory().getId() : null)
                .categoryCode(entity.getCategory() != null ? entity.getCategory().getCode() : null)
                .categoryName(entity.getCategory() != null ? entity.getCategory().getName() : null)
                .code(entity.getCode())
                .name(entity.getName())
                .description(entity.getDescription())
                .targetAudience(entity.getTargetAudience())
                .level(entity.getLevel())
                .durationHours(entity.getDurationHours())
                .defaultTuitionFee(entity.getDefaultTuitionFee())
                .learningOutcomes(entity.getLearningOutcomes())
                .maxStudents(entity.getMaxStudents())
                .status(entity.getStatus())
                .isPublic(entity.getIsPublic())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
