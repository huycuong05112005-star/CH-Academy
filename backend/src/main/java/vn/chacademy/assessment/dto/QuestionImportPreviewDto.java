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
public class QuestionImportPreviewDto {
    private String fileName;
    private int totalRows;
    private int validRowsCount;
    private int invalidRowsCount;
    private int duplicateRowsCount;
    private List<QuestionImportRowDto> rows;
}
