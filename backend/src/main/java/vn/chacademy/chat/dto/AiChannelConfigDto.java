package vn.chacademy.chat.dto;

import lombok.*;
import vn.chacademy.chat.entity.AiChannelConfig;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiChannelConfigDto {
    private Long id;
    private String channelType;
    private Long agentId;
    private String agentName;
    private Boolean isActive;
    private String configJson;
    private Instant createdAt;
    private Instant updatedAt;

    public static AiChannelConfigDto fromEntity(AiChannelConfig config) {
        return AiChannelConfigDto.builder()
                .id(config.getId())
                .channelType(config.getChannelType())
                .agentId(config.getAgent() != null ? config.getAgent().getId() : null)
                .agentName(config.getAgent() != null ? config.getAgent().getName() : null)
                .isActive(config.getIsActive())
                .configJson(config.getConfigJson())
                .createdAt(config.getCreatedAt())
                .updatedAt(config.getUpdatedAt())
                .build();
    }
}
