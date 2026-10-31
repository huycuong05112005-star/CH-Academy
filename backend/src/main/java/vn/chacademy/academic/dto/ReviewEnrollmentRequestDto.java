package vn.chacademy.academic.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewEnrollmentRequestDto {
    private String reviewNotes;
    private BigDecimal discountAmount;
}
