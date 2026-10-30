package vn.chacademy.notification.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.chacademy.notification.entity.Notification;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDto {
    private Long id;
    private String title;
    private String content;
    private String targetAudience;
    private Long targetClassId;
    private String targetClassName;
    private Long targetUserId;
    private String targetUserName;
    private String priority;
    private Long createdById;
    private String createdByName;
    private Instant createdAt;
    private Boolean isRead;
    private Instant readAt;

    public static NotificationDto fromEntity(Notification n) {
        return fromEntity(n, false, null);
    }

    public static NotificationDto fromEntity(Notification n, boolean isRead, Instant readAt) {
        if (n == null) return null;
        return NotificationDto.builder()
                .id(n.getId())
                .title(n.getTitle())
                .content(n.getContent())
                .targetAudience(n.getTargetAudience())
                .targetClassId(n.getTargetClass() != null ? n.getTargetClass().getId() : null)
                .targetClassName(n.getTargetClass() != null ? n.getTargetClass().getName() : null)
                .targetUserId(n.getTargetUser() != null ? n.getTargetUser().getId() : null)
                .targetUserName(n.getTargetUser() != null ? n.getTargetUser().getFullName() : null)
                .priority(n.getPriority())
                .createdById(n.getCreatedBy() != null ? n.getCreatedBy().getId() : null)
                .createdByName(n.getCreatedBy() != null ? n.getCreatedBy().getFullName() : null)
                .createdAt(n.getCreatedAt())
                .isRead(isRead)
                .readAt(readAt)
                .build();
    }
}
