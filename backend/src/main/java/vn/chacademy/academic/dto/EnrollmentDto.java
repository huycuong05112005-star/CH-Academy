package vn.chacademy.academic.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.chacademy.academic.entity.Enrollment;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EnrollmentDto {
    private Long id;
    private Long classId;
    private String classCode;
    private String className;
    private Long studentId;
    private String studentCode;
    private String studentFullName;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate enrollmentDate;

    private BigDecimal appliedTuitionFee;
    private BigDecimal discountAmount;
    private BigDecimal finalFee;
    private String status;
    private String notes;
    private Instant createdAt;

    public static EnrollmentDto fromEntity(Enrollment e) {
        if (e == null) return null;
        return EnrollmentDto.builder()
                .id(e.getId())
                .classId(e.getClassEntity() != null ? e.getClassEntity().getId() : null)
                .classCode(e.getClassEntity() != null ? e.getClassEntity().getCode() : null)
                .className(e.getClassEntity() != null ? e.getClassEntity().getName() : null)
                .studentId(e.getStudent() != null ? e.getStudent().getId() : null)
                .studentCode(e.getStudent() != null ? e.getStudent().getStudentCode() : null)
                .studentFullName(e.getStudent() != null ? e.getStudent().getFullName() : null)
                .enrollmentDate(e.getEnrollmentDate())
                .appliedTuitionFee(e.getAppliedTuitionFee())
                .discountAmount(e.getDiscountAmount())
                .finalFee(e.getFinalFee())
                .status(e.getStatus())
                .notes(e.getNotes())
                .createdAt(e.getCreatedAt())
                .build();
    }
}
