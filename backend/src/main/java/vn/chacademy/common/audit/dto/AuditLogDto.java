package vn.chacademy.common.audit.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.chacademy.common.audit.entity.AuditLog;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogDto {
    private Long id;
    private Long actorId;
    private String actorUsername;
    private String actorRole;
    private String action;
    private String resourceType;
    private String resourceId;
    private String details;
    private String ipAddress;
    private Instant createdAt;

    public static AuditLogDto fromEntity(AuditLog entity) {
        if (entity == null) return null;
        return AuditLogDto.builder()
                .id(entity.getId())
                .actorId(entity.getActor() != null ? entity.getActor().getId() : null)
                .actorUsername(entity.getActorUsername())
                .actorRole(entity.getActorRole())
                .action(entity.getAction())
                .resourceType(entity.getResourceType())
                .resourceId(entity.getResourceId())
                .details(entity.getDetails())
                .ipAddress(entity.getIpAddress())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
