package vn.chacademy.lead.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.chacademy.lead.entity.LeadActivity;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeadActivityDto {
    private Long id;
    private Long leadId;
    private Long staffId;
    private String staffName;
    private String actionType;
    private String content;
    private Instant activityTime;
    private Instant createdAt;

    public static LeadActivityDto fromEntity(LeadActivity activity) {
        if (activity == null) return null;
        return LeadActivityDto.builder()
                .id(activity.getId())
                .leadId(activity.getLead() != null ? activity.getLead().getId() : null)
                .staffId(activity.getStaff() != null ? activity.getStaff().getId() : null)
                .staffName(activity.getStaff() != null ? activity.getStaff().getFullName() : null)
                .actionType(activity.getActionType())
                .content(activity.getContent())
                .activityTime(activity.getActivityTime())
                .createdAt(activity.getCreatedAt())
                .build();
    }
}
