package vn.chacademy.chat.dto;

import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiChatResponse {
    private Long conversationId;
    private String answer;
    @Builder.Default
    private List<SourceCitation> sources = new ArrayList<>();

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SourceCitation {
        private String documentName;
        private String section;
        private String snippet;
    }
}

