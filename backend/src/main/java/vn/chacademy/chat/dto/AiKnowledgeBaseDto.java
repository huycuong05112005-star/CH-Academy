package vn.chacademy.chat.dto;

import lombok.*;
import vn.chacademy.chat.entity.AiKnowledgeBase;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiKnowledgeBaseDto {
    private Long id;
    private String code;
    private String name;
    private String description;
    private String accessLevel;
    private Integer documentCount;
    private Instant createdAt;
    private Instant updatedAt;

    public static AiKnowledgeBaseDto fromEntity(AiKnowledgeBase kb) {
        return AiKnowledgeBaseDto.builder()
                .id(kb.getId())
                .code(kb.getCode())
                .name(kb.getName())
                .description(kb.getDescription())
                .accessLevel(kb.getAccessLevel())
                .documentCount(kb.getDocuments() != null ? kb.getDocuments().size() : 0)
                .createdAt(kb.getCreatedAt())
                .updatedAt(kb.getUpdatedAt())
                .build();
    }
}

