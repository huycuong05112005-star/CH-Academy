package vn.chacademy.course.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.chacademy.course.entity.CourseCategory;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseCategoryDto {
    private Long id;
    private String code;
    private String name;
    private String description;
    private Integer displayOrder;
    private Boolean isActive;
    private Long courseCount;

    public static CourseCategoryDto fromEntity(CourseCategory entity, Long courseCount) {
        return CourseCategoryDto.builder()
                .id(entity.getId())
                .code(entity.getCode())
                .name(entity.getName())
                .description(entity.getDescription())
                .displayOrder(entity.getDisplayOrder())
                .isActive(entity.getIsActive())
                .courseCount(courseCount != null ? courseCount : 0L)
                .build();
    }
}
