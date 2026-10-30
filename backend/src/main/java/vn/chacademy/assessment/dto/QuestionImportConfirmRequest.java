package vn.chacademy.assessment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionImportConfirmRequest {
    private Long bankId;
    private Long courseId;
    private Long sessionId;
    private List<QuestionImportRowDto> selectedRows;
}
