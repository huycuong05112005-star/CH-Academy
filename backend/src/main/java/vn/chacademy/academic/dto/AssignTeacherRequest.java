package vn.chacademy.academic.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignTeacherRequest {
    @NotNull(message = "Lớp học không được để trống")
    private Long classId;

    @NotNull(message = "Giáo viên không được để trống")
    private Long teacherId;

    private String role; // PRIMARY, ASSISTANT, SUBSTITUTE
    private LocalDate startDate;
    private String notes;
}
