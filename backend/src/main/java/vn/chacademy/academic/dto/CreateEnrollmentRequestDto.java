package vn.chacademy.academic.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateEnrollmentRequestDto {
    @NotNull(message = "Lớp học không được để trống")
    private Long classId;

    private String studentNotes;
}
