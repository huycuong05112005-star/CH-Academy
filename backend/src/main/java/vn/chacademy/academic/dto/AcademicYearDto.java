package vn.chacademy.academic.dto;

import lombok.*;
import vn.chacademy.academic.entity.AcademicYear;

import java.time.Instant;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AcademicYearDto {
    private Long id;
    private String code;
    private String name;
    private LocalDate startDate;
    private LocalDate endDate;
    private Boolean isCurrent;
    private String status;
    private Instant createdAt;
    private Instant updatedAt;

    public static AcademicYearDto fromEntity(AcademicYear entity) {
        if (entity == null) return null;
        return AcademicYearDto.builder()
                .id(entity.getId())
                .code(entity.getCode())
                .name(entity.getName())
                .startDate(entity.getStartDate())
                .endDate(entity.getEndDate())
                .isCurrent(Boolean.TRUE.equals(entity.getIsCurrent()))
                .status(entity.getStatus())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}

