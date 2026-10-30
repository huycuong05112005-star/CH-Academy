package vn.chacademy.chat.dto;

import lombok.*;
import vn.chacademy.chat.entity.AiMessage;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiMessageDto {
    private Long id;
    private Long conversationId;
    private String role;
    private String content;
    private String sourcesJson;
    private Instant createdAt;

    public static AiMessageDto fromEntity(AiMessage msg) {
        return AiMessageDto.builder()
                .id(msg.getId())
                .conversationId(msg.getConversation().getId())
                .role(msg.getRole())
                .content(msg.getContent())
                .sourcesJson(msg.getSourcesJson())
                .createdAt(msg.getCreatedAt())
                .build();
    }
}

