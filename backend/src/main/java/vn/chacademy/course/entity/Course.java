package vn.chacademy.course.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "courses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private CourseCategory category;

    @Column(nullable = false, unique = true, length = 30)
    private String code;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "target_audience", nullable = false, length = 50)
    @Builder.Default
    private String targetAudience = "ALL"; // KIDS, TEENS, ADULTS, ALL

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String level = "BEGINNER"; // BEGINNER, INTERMEDIATE, ADVANCED, ALL_LEVELS

    @Column(name = "duration_hours", nullable = false)
    @Builder.Default
    private Integer durationHours = 36;

    @Column(name = "default_tuition_fee", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal defaultTuitionFee = BigDecimal.ZERO;

    @Column(name = "learning_outcomes", columnDefinition = "TEXT")
    private String learningOutcomes;

    @Column(name = "max_students", nullable = false)
    @Builder.Default
    private Integer maxStudents = 20;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "ACTIVE"; // DRAFT, ACTIVE, SUSPENDED, ARCHIVED

    @Column(name = "is_public", nullable = false)
    @Builder.Default
    private Boolean isPublic = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
