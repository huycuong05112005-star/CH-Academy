package vn.chacademy.chat.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiChatRequest {
    private Long conversationId;

    @NotBlank(message = "Câu hỏi gửi trợ lý AI không được để trống")
    private String question;

    private String portal; // ADMIN, TEACHER, STUDENT, PUBLIC
    private String channel; // PORTAL, WEBSITE, ZALO, VOICE
    private String agentCode; // AGENT_ADMISSIONS, AGENT_STUDENT_TUTOR, AGENT_TEACHER_ASSISTANT, AGENT_ADMIN_ASSISTANT
    private String sessionId; // for guests
    private String guestName;
    private String guestPhone;
}
