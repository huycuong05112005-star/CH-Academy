package vn.chacademy.common.file.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileMetadataDto {
    private String originalName;
    private String storedName;
    private String fileUrl;
    private String fileSize;
    private String contentType;
}
