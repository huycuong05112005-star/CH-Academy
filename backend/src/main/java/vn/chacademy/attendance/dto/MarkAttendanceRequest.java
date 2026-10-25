package vn.chacademy.attendance.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MarkAttendanceRequest {

    @NotNull(message = "Học viên không được để trống")
    private Long studentId;

    @NotBlank(message = "Trạng thái điểm danh không được để trống")
    @Pattern(regexp = "^(PRESENT|ABSENT|LATE|EXCUSED)$", message = "Trạng thái phải là PRESENT, ABSENT, LATE, hoặc EXCUSED")
    private String status;

    private String note;
}
