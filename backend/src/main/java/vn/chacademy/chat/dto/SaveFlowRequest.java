package vn.chacademy.chat.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SaveFlowRequest {

    private Long agentId;

    @NotBlank(message = "Tên Kịch bản không được để trống")
    private String name;

    private String description;

    @NotBlank(message = "Dữ liệu đồ thị kịch bản (graphJson) không được để trống")
    private String graphJson;

    private String status; // DRAFT, PUBLISHED
    private String triggerType; // NEW_CONVERSATION, INTENT
}
