package vn.chacademy.academic.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateClassRequest {

    @NotNull(message = "Khóa học không được để trống")
    private Long courseId;

    private Long primaryTeacherId;

    @NotBlank(message = "Mã lớp học không được để trống")
    @Size(max = 30, message = "Mã lớp học tối đa 30 ký tự")
    private String code;

    @NotBlank(message = "Tên lớp học không được để trống")
    @Size(max = 150, message = "Tên lớp học tối đa 150 ký tự")
    private String name;

    @NotNull(message = "Sĩ số tối đa không được để trống")
    @Min(value = 1, message = "Sĩ số tối đa phải lớn hơn 0")
    @Builder.Default
    private Integer maxCapacity = 15;

    private String room;

    @NotNull(message = "Ngày bắt đầu không được để trống")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate startDate;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate endDate;

    @Builder.Default
    private String status = "PLANNING"; // PLANNING, OPEN_FOR_ENROLLMENT, IN_PROGRESS, COMPLETED, CANCELLED

    @Valid
    private List<ScheduleSlotRequest> schedules;
}
