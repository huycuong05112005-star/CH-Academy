package vn.chacademy.academic.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateAcademicYearRequest {
    @NotBlank(message = "Mã năm học không được để trống (ví dụ: 2028-2029)")
    private String code;

    @NotBlank(message = "Tên năm học không được để trống")
    private String name;

    @NotNull(message = "Ngày bắt đầu không được để trống")
    private LocalDate startDate;

    @NotNull(message = "Ngày kết thúc không được để trống")
    private LocalDate endDate;

    private Boolean isCurrent;
    private String status;
}

