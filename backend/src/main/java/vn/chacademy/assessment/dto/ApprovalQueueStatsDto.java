package vn.chacademy.assessment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApprovalQueueStatsDto {
    private long pendingReviewCount;
    private long approvedCount;
    private long changesRequestedCount;
    private long rejectedCount;
    private long draftCount;
    private long publishedCount;
}
