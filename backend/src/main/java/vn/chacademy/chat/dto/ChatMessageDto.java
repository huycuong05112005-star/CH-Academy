package vn.chacademy.chat.dto;

import lombok.*;
import vn.chacademy.chat.entity.ChatMessage;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessageDto {
    private Long id;
    private Long conversationId;
    private Long senderId;
    private String senderName;
    private String senderUsername;
    private String messageType;
    private String content;
    private String attachmentUrl;
    private String attachmentName;
    private Boolean isPinned;
    private Instant createdAt;

    public static ChatMessageDto fromEntity(ChatMessage msg) {
        return ChatMessageDto.builder()
                .id(msg.getId())
                .conversationId(msg.getConversation().getId())
                .senderId(msg.getSender().getId())
                .senderName(msg.getSender().getFullName())
                .senderUsername(msg.getSender().getUsername())
                .messageType(msg.getMessageType())
                .content(msg.getContent())
                .attachmentUrl(msg.getAttachmentUrl())
                .attachmentName(msg.getAttachmentName())
                .isPinned(msg.getIsPinned())
                .createdAt(msg.getCreatedAt())
                .build();
    }
}

