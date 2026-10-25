package vn.chacademy.academic.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.chacademy.academic.entity.SessionMaterial;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionMaterialDto {
    private Long id;
    private Long sessionId;
    private String sessionTopic;
    private String title;
    private String description;
    private String materialType;
    private String fileUrl;
    private Long uploadedById;
    private String uploadedByName;
    private Instant createdAt;

    public static SessionMaterialDto fromEntity(SessionMaterial m) {
        if (m == null) return null;
        return SessionMaterialDto.builder()
                .id(m.getId())
                .sessionId(m.getSession() != null ? m.getSession().getId() : null)
                .sessionTopic(m.getSession() != null ? m.getSession().getTopic() : null)
                .title(m.getTitle())
                .description(m.getDescription())
                .materialType(m.getMaterialType())
                .fileUrl(m.getFileUrl())
                .uploadedById(m.getUploadedBy() != null ? m.getUploadedBy().getId() : null)
                .uploadedByName(m.getUploadedBy() != null ? m.getUploadedBy().getFullName() : null)
                .createdAt(m.getCreatedAt())
                .build();
    }
}
