package vn.chacademy.assessment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.chacademy.assessment.entity.ExamReviewLog;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExamReviewDto {
    private Long id;
    private Long examId;
    private Integer version;
    private String action; // SUBMIT_FOR_REVIEW, REQUEST_CHANGES, REJECT, APPROVE, PUBLISH, CLOSE
    private Long actorId;
    private String actorName;
    private String actorRole;
    private String comment;
    private Instant createdAt;

    public static ExamReviewDto fromEntity(ExamReviewLog log) {
        if (log == null) return null;
        return ExamReviewDto.builder()
                .id(log.getId())
                .examId(log.getExam() != null ? log.getExam().getId() : null)
                .version(log.getVersion())
                .action(log.getAction())
                .actorId(log.getActor() != null ? log.getActor().getId() : null)
                .actorName(log.getActorName())
                .actorRole(log.getActorRole())
                .comment(log.getComment())
                .createdAt(log.getCreatedAt())
                .build();
    }
}
