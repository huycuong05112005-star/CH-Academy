package vn.chacademy.chat.dto;

import lombok.*;
import vn.chacademy.chat.entity.AiFlow;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiFlowDto {
    private Long id;
    private Long agentId;
    private String agentName;
    private String name;
    private String description;
    private String graphJson;
    private String status;
    private String triggerType;
    private Integer version;
    private Instant createdAt;
    private Instant updatedAt;

    public static AiFlowDto fromEntity(AiFlow flow) {
        return AiFlowDto.builder()
                .id(flow.getId())
                .agentId(flow.getAgent() != null ? flow.getAgent().getId() : null)
                .agentName(flow.getAgent() != null ? flow.getAgent().getName() : null)
                .name(flow.getName())
                .description(flow.getDescription())
                .graphJson(flow.getGraphJson())
                .status(flow.getStatus())
                .triggerType(flow.getTriggerType())
                .version(flow.getVersion())
                .createdAt(flow.getCreatedAt())
                .updatedAt(flow.getUpdatedAt())
                .build();
    }
}
