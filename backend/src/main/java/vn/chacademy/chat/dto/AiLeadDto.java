package vn.chacademy.chat.dto;

import lombok.*;
import vn.chacademy.chat.entity.AiLead;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiLeadDto {
    private Long id;
    private Long conversationId;
    private String fullName;
    private String phone;
    private String courseInterest;
    private String note;
    private String status;
    private Instant createdAt;

    public static AiLeadDto fromEntity(AiLead lead) {
        return AiLeadDto.builder()
                .id(lead.getId())
                .conversationId(lead.getConversation() != null ? lead.getConversation().getId() : null)
                .fullName(lead.getFullName())
                .phone(lead.getPhone())
                .courseInterest(lead.getCourseInterest())
                .note(lead.getNote())
                .status(lead.getStatus())
                .createdAt(lead.getCreatedAt())
                .build();
    }
}
