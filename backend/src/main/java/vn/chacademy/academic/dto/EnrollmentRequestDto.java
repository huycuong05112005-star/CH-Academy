package vn.chacademy.academic.dto;

import lombok.*;
import vn.chacademy.academic.entity.EnrollmentRequest;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EnrollmentRequestDto {
    private Long id;
    private Long studentId;
    private String studentCode;
    private String studentName;
    private String studentEmail;
    private String studentPhone;
    private Long classId;
    private String classCode;
    private String className;
    private Long courseId;
    private String courseName;
    private String academicYear;
    private Instant requestDate;
    private String status;
    private BigDecimal appliedTuitionFee;
    private BigDecimal discountAmount;
    private BigDecimal finalFee;
    private Long reviewedById;
    private String reviewedByName;
    private Instant reviewedAt;
    private String reviewNotes;
    private String studentNotes;
    private Instant createdAt;

    public static EnrollmentRequestDto fromEntity(EnrollmentRequest e) {
        if (e == null) return null;
        return EnrollmentRequestDto.builder()
                .id(e.getId())
                .studentId(e.getStudent() != null ? e.getStudent().getId() : null)
                .studentCode(e.getStudent() != null ? e.getStudent().getStudentCode() : null)
                .studentName(e.getStudent() != null ? e.getStudent().getFullName() : null)
                .studentEmail(e.getStudent() != null ? e.getStudent().getEmail() : null)
                .studentPhone(e.getStudent() != null ? e.getStudent().getPhone() : null)
                .classId(e.getClassEntity() != null ? e.getClassEntity().getId() : null)
                .classCode(e.getClassEntity() != null ? e.getClassEntity().getCode() : null)
                .className(e.getClassEntity() != null ? e.getClassEntity().getName() : null)
                .courseId(e.getClassEntity() != null && e.getClassEntity().getCourse() != null ? e.getClassEntity().getCourse().getId() : null)
                .courseName(e.getClassEntity() != null && e.getClassEntity().getCourse() != null ? e.getClassEntity().getCourse().getName() : null)
                .academicYear(e.getAcademicYear())
                .requestDate(e.getRequestDate())
                .status(e.getStatus())
                .appliedTuitionFee(e.getAppliedTuitionFee())
                .discountAmount(e.getDiscountAmount())
                .finalFee(e.getFinalFee())
                .reviewedById(e.getReviewedBy() != null ? e.getReviewedBy().getId() : null)
                .reviewedByName(e.getReviewedBy() != null ? e.getReviewedBy().getFullName() : null)
                .reviewedAt(e.getReviewedAt())
                .reviewNotes(e.getReviewNotes())
                .studentNotes(e.getStudentNotes())
                .createdAt(e.getCreatedAt())
                .build();
    }
}
