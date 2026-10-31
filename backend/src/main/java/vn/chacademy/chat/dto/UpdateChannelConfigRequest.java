package vn.chacademy.chat.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateChannelConfigRequest {
    private Long agentId;
    private Boolean isActive;
    private String configJson;
}

