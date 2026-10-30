package vn.chacademy.assessment.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ManualGradeRequest {
    @Builder.Default
    private List<GradingItemDto> items = new ArrayList<>();

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class GradingItemDto {
        private Long questionId;
        private BigDecimal score;
        private String teacherFeedback;
        private String rubricBreakdown;
    }
}
