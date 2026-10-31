package vn.chacademy.chat.dto;

import lombok.*;
import vn.chacademy.chat.entity.AiAgent;
import vn.chacademy.chat.entity.AiKnowledgeBase;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiAgentDto {
    private Long id;
    private String code;
    private String name;
    private String description;
    private String roleTarget;
    private String model;
    private String systemPrompt;
    private String status;
    private BigDecimal temperature;
    private Integer maxTokens;
    private Integer version;
    private String settingsJson;
    private List<Long> knowledgeBaseIds;
    private List<String> knowledgeBaseNames;
    private Instant createdAt;
    private Instant updatedAt;

    public static AiAgentDto fromEntity(AiAgent agent) {
        return AiAgentDto.builder()
                .id(agent.getId())
                .code(agent.getCode())
                .name(agent.getName())
                .description(agent.getDescription())
                .roleTarget(agent.getRoleTarget())
                .model(agent.getModel())
                .systemPrompt(agent.getSystemPrompt())
                .status(agent.getStatus())
                .temperature(agent.getTemperature())
                .maxTokens(agent.getMaxTokens())
                .version(agent.getVersion())
                .settingsJson(agent.getSettingsJson())
                .knowledgeBaseIds(agent.getKnowledgeBases() != null
                        ? agent.getKnowledgeBases().stream().map(AiKnowledgeBase::getId).toList()
                        : List.of())
                .knowledgeBaseNames(agent.getKnowledgeBases() != null
                        ? agent.getKnowledgeBases().stream().map(AiKnowledgeBase::getName).toList()
                        : List.of())
                .createdAt(agent.getCreatedAt())
                .updatedAt(agent.getUpdatedAt())
                .build();
    }
}

