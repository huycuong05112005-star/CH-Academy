package vn.chacademy.notification.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateNotificationRequest {

    @NotBlank(message = "Tiêu đề thông báo không được để trống")
    private String title;

    @NotBlank(message = "Nội dung thông báo không được để trống")
    private String content;

    @Builder.Default
    private String targetAudience = "ALL"; // ALL, TEACHERS, STUDENTS, CLASS

    private Long targetClassId;

    @Builder.Default
    private String priority = "NORMAL"; // NORMAL, HIGH, URGENT
}
