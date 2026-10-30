package vn.chacademy.assessment.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubmitExamRequest {
    private String idempotencyKey;
}
