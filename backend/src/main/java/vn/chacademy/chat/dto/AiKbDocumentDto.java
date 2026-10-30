package vn.chacademy.chat.dto;

import lombok.*;
import vn.chacademy.chat.entity.AiKbDocument;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiKbDocumentDto {
    private Long id;
    private Long kbId;
    private String kbName;
    private String name;
    private String filePath;
    private String fileType;
    private Long fileSize;
    private String status;
    private Integer chunkCount;
    private String rawContent;
    private String errorMessage;
    private Instant createdAt;
    private Instant updatedAt;

    public static AiKbDocumentDto fromEntity(AiKbDocument doc) {
        return AiKbDocumentDto.builder()
                .id(doc.getId())
                .kbId(doc.getKnowledgeBase() != null ? doc.getKnowledgeBase().getId() : null)
                .kbName(doc.getKnowledgeBase() != null ? doc.getKnowledgeBase().getName() : null)
                .name(doc.getName())
                .filePath(doc.getFilePath())
                .fileType(doc.getFileType())
                .fileSize(doc.getFileSize())
                .status(doc.getStatus())
                .chunkCount(doc.getChunkCount())
                .rawContent(doc.getRawContent())
                .errorMessage(doc.getErrorMessage())
                .createdAt(doc.getCreatedAt())
                .updatedAt(doc.getUpdatedAt())
                .build();
    }
}
