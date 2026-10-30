package vn.chacademy.assessment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApprovalActionRequest {
    private String comment;
    private String feedback;
    private String reason;
    private List<Long> assignedClassIds;
    private List<Long> classIds;

    public String getEffectiveFeedback() {
        if (comment != null && !comment.isBlank()) return comment;
        if (feedback != null && !feedback.isBlank()) return feedback;
        return reason;
    }

    public List<Long> getEffectiveClassIds() {
        if (assignedClassIds != null && !assignedClassIds.isEmpty()) {
            return assignedClassIds;
        }
        return classIds;
    }
}
