package vn.chacademy.chat.dto;

import lombok.*;
import vn.chacademy.chat.entity.AiKbChunk;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiKbChunkDto {
    private Long id;
    private Long documentId;
    private Integer chunkIndex;
    private String content;
    private String metadataJson;
    private Instant createdAt;

    public static AiKbChunkDto fromEntity(AiKbChunk chunk) {
        return AiKbChunkDto.builder()
                .id(chunk.getId())
                .documentId(chunk.getDocument() != null ? chunk.getDocument().getId() : null)
                .chunkIndex(chunk.getChunkIndex())
                .content(chunk.getContent())
                .metadataJson(chunk.getMetadataJson())
                .createdAt(chunk.getCreatedAt())
                .build();
    }
}
