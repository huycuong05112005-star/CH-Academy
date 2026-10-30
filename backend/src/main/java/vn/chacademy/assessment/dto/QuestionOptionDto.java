package vn.chacademy.assessment.dto;

import lombok.*;
import vn.chacademy.assessment.entity.QuestionOption;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionOptionDto {
    private Long id;
    private String optionCode;
    private String content;
    private Boolean isCorrect; // null nếu là student-safe
    private Integer sortOrder;
    private String explanation; // null nếu là student-safe

    public static QuestionOptionDto fromEntity(QuestionOption entity, boolean studentSafe) {
        if (entity == null) return null;
        return QuestionOptionDto.builder()
                .id(entity.getId())
                .optionCode(entity.getOptionCode())
                .content(entity.getContent())
                .isCorrect(studentSafe ? null : entity.getIsCorrect())
                .sortOrder(entity.getSortOrder())
                .explanation(studentSafe ? null : entity.getExplanation())
                .build();
    }
}
