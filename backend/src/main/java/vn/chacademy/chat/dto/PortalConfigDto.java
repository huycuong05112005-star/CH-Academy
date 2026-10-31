package vn.chacademy.chat.dto;

import lombok.*;

import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PortalConfigDto {
    private String portal;
    private String agentCode;
    private String agentName;
    private String roleName;
    private String welcomeMessage;
    private String badge;
    private String badgeColor;
    private PortalFeatures features;
    private List<String> suggestedPrompts;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PortalFeatures {
        private boolean hasGroupChat;
        private boolean hasVoiceCall;
        private boolean hasTutoringMode;
        private boolean hasLeadCapture;
        private boolean hasDirectHandoff;
    }
}

