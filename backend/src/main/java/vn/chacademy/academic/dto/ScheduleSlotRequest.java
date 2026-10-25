package vn.chacademy.academic.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleSlotRequest {

    @NotNull(message = "Thứ trong tuần không được để trống")
    @Min(value = 1, message = "Thứ trong tuần từ 1 (Thứ 2) đến 7 (Chủ Nhật)")
    @Max(value = 7, message = "Thứ trong tuần từ 1 (Thứ 2) đến 7 (Chủ Nhật)")
    private Integer dayOfWeek;

    @NotNull(message = "Giờ bắt đầu không được để trống")
    @JsonFormat(pattern = "HH:mm")
    private LocalTime startTime;

    @NotNull(message = "Giờ kết thúc không được để trống")
    @JsonFormat(pattern = "HH:mm")
    private LocalTime endTime;

    private String room;
}
