package vn.chacademy.assessment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionImportRowDto {
    private int rowNumber;
    private String questionText;
    private String questionType; // SINGLE_CHOICE, MULTIPLE_CHOICE, TRUE_FALSE, SHORT_ANSWER, ESSAY
    private String optionA;
    private String optionB;
    private String optionC;
    private String optionD;
    private String optionE;
    private String optionF;
    private String correctAnswer;
    private BigDecimal points;
    private String difficulty; // EASY, MEDIUM, HARD
    private String topic;
    private String explanation;

    // Validation flags
    private boolean valid;
    private boolean duplicate;
    private String errorMessage;

    // Converted options ready for persistence
    private List<QuestionOptionDto> parsedOptions;
}
