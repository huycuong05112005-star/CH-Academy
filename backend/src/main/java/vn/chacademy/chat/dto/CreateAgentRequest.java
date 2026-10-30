package vn.chacademy.chat.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateAgentRequest {

    private String code;

    @NotBlank(message = "Tên Agent không được để trống")
    private String name;

    private String description;

    @NotBlank(message = "Vai trò đích (roleTarget) không được để trống")
    private String roleTarget; // PUBLIC, STUDENT, TEACHER, ADMIN

    private String model;
    private String systemPrompt;
    private String status; // DRAFT, PUBLISHED, PAUSED
    private BigDecimal temperature;
    private Integer maxTokens;
    private String settingsJson;
    private List<Long> knowledgeBaseIds;
}
