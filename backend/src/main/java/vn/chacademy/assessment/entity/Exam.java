package vn.chacademy.assessment.entity;

import jakarta.persistence.*;
import lombok.*;
import vn.chacademy.academic.entity.Teacher;
import vn.chacademy.course.entity.Course;
import vn.chacademy.identity.entity.User;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "exams")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Exam {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "code", unique = true, nullable = false, length = 50)
    private String code;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id")
    private Course course;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id")
    private Teacher teacher;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id")
    private vn.chacademy.academic.entity.ClassSession session;

    @Column(name = "duration_minutes", nullable = false)
    @Builder.Default
    private Integer durationMinutes = 45;

    @Column(name = "pass_percentage", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal passPercentage = BigDecimal.valueOf(50.00);

    @Column(name = "max_attempts", nullable = false)
    @Builder.Default
    private Integer maxAttempts = 1;

    @Column(name = "shuffle_questions", nullable = false)
    @Builder.Default
    private Boolean shuffleQuestions = true;

    @Column(name = "shuffle_options", nullable = false)
    @Builder.Default
    private Boolean shuffleOptions = true;

    @Column(name = "show_result_mode", nullable = false, length = 30)
    @Builder.Default
    private String showResultMode = "IMMEDIATELY"; // IMMEDIATELY, AFTER_CLOSED, MANUAL

    @Column(name = "start_time")
    private Instant startTime;

    @Column(name = "end_time")
    private Instant endTime;

    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "DRAFT"; // DRAFT, PENDING_REVIEW, CHANGES_REQUESTED, APPROVED, REJECTED, PUBLISHED, ARCHIVED, CLOSED

    @Column(name = "version", nullable = false)
    @Builder.Default
    private Integer version = 1;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    @Column(name = "review_feedback", columnDefinition = "TEXT")
    private String reviewFeedback;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "submitted_at")
    private Instant submittedAt;

    @Column(name = "published_at")
    private Instant publishedAt;

    @OneToMany(mappedBy = "exam", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<ExamQuestion> examQuestions = new ArrayList<>();

    @OneToMany(mappedBy = "exam", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<ExamAssignment> assignments = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private Instant updatedAt = Instant.now();

    public BigDecimal getTotalPoints() {
        if (examQuestions == null || examQuestions.isEmpty()) {
            return BigDecimal.TEN;
        }
        return examQuestions.stream()
                .map(eq -> eq.getPoints() != null ? eq.getPoints() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
