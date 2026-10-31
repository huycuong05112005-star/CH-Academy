package vn.chacademy.academic.entity;

import jakarta.persistence.*;
import lombok.*;
import vn.chacademy.identity.entity.User;
import vn.chacademy.student.entity.Student;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "enrollment_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EnrollmentRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id", nullable = false)
    private ClassEntity classEntity;

    @Column(name = "academic_year", nullable = false, length = 20)
    private String academicYear;

    @Column(name = "request_date", nullable = false)
    @Builder.Default
    private Instant requestDate = Instant.now();

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "PENDING"; // PENDING, APPROVED, REJECTED, CANCELLED

    @Column(name = "applied_tuition_fee", precision = 15, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal appliedTuitionFee = BigDecimal.ZERO;

    @Column(name = "discount_amount", precision = 15, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "final_fee", precision = 15, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal finalFee = BigDecimal.ZERO;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    @Column(name = "review_notes", columnDefinition = "TEXT")
    private String reviewNotes;

    @Column(name = "student_notes", columnDefinition = "TEXT")
    private String studentNotes;

    @Column(name = "created_at", updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    @Builder.Default
    private Instant updatedAt = Instant.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }
}
