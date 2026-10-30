package vn.chacademy.chat.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiChatRequest {
    private Long conversationId;

    @NotBlank(message = "Câu hỏi gửi trợ lý AI không được để trống")
    private String question;
}

