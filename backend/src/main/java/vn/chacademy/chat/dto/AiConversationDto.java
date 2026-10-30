package vn.chacademy.chat.dto;

import lombok.*;
import vn.chacademy.chat.entity.AiConversation;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiConversationDto {
    private Long id;
    private String title;
    private String role;
    private String portal;
    private String channel;
    private String agentCode;
    private String status;
    private String sessionId;
    private String guestName;
    private String guestPhone;
    private Instant createdAt;
    private Instant updatedAt;

    public static AiConversationDto fromEntity(AiConversation conv) {
        return AiConversationDto.builder()
                .id(conv.getId())
                .title(conv.getTitle())
                .role(conv.getRole())
                .portal(conv.getPortal())
                .channel(conv.getChannel())
                .agentCode(conv.getAgentCode())
                .status(conv.getStatus())
                .sessionId(conv.getSessionId())
                .guestName(conv.getGuestName())
                .guestPhone(conv.getGuestPhone())
                .createdAt(conv.getCreatedAt())
                .updatedAt(conv.getUpdatedAt())
                .build();
    }
}
