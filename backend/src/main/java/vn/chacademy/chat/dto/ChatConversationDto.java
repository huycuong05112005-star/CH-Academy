package vn.chacademy.chat.dto;

import lombok.*;
import vn.chacademy.chat.entity.ChatConversation;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatConversationDto {
    private Long id;
    private Long classId;
    private String classCode;
    private String className;
    private String courseName;
    private String teacherName;
    private String title;
    private String type;
    private int memberCount;
    private long unreadCount;
    private String lastMessage;
    private Instant lastMessageTime;
    private Instant updatedAt;

    public static ChatConversationDto fromEntity(ChatConversation conv, long unread, String lastMsg, Instant lastTime, int members) {
        String courseName = null;
        String teacherName = null;
        if (conv.getClassEntity() != null) {
            if (conv.getClassEntity().getCourse() != null) {
                courseName = conv.getClassEntity().getCourse().getName();
            }
            if (conv.getClassEntity().getPrimaryTeacher() != null) {
                teacherName = conv.getClassEntity().getPrimaryTeacher().getFullName();
            }
        }

        return ChatConversationDto.builder()
                .id(conv.getId())
                .classId(conv.getClassEntity() != null ? conv.getClassEntity().getId() : null)
                .classCode(conv.getClassEntity() != null ? conv.getClassEntity().getCode() : null)
                .className(conv.getClassEntity() != null ? conv.getClassEntity().getName() : null)
                .courseName(courseName)
                .teacherName(teacherName)
                .title(conv.getTitle())
                .type(conv.getType())
                .memberCount(members)
                .unreadCount(unread)
                .lastMessage(lastMsg)
                .lastMessageTime(lastTime)
                .updatedAt(conv.getUpdatedAt())
                .build();
    }
}

