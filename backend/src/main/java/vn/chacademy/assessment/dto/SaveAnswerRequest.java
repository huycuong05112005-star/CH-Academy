package vn.chacademy.assessment.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SaveAnswerRequest {
    @NotNull(message = "Question ID không được để trống")
    private Long questionId;
    private String selectedOptionIds; // Ví dụ: "1" hoặc "6,7"
    private String textAnswer;
    private Boolean isMarkedForReview;
}
