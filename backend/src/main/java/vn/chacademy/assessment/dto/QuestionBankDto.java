package vn.chacademy.assessment.dto;

import lombok.*;
import vn.chacademy.assessment.entity.QuestionBank;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionBankDto {
    private Long id;
    private String name;
    private String code;
    private String description;
    private Long courseId;
    private String courseName;
    private String status;
    private Integer questionCount;
    private String createdByName;
    private Instant createdAt;
    private Instant updatedAt;

    public static QuestionBankDto fromEntity(QuestionBank entity, Integer questionCount) {
        if (entity == null) return null;
        return QuestionBankDto.builder()
                .id(entity.getId())
                .name(entity.getName())
                .code(entity.getCode())
                .description(entity.getDescription())
                .courseId(entity.getCourse() != null ? entity.getCourse().getId() : null)
                .courseName(entity.getCourse() != null ? entity.getCourse().getName() : null)
                .status(entity.getStatus())
                .questionCount(questionCount != null ? questionCount : 0)
                .createdByName(entity.getCreatedBy() != null ? entity.getCreatedBy().getFullName() : null)
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
