package vn.chacademy.assessment.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "attempt_answers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttemptAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attempt_id", nullable = false)
    private ExamAttempt attempt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @Column(name = "selected_option_ids", length = 255)
    private String selectedOptionIds; // Ví dụ "1" hoặc "6,7"

    @Column(name = "text_answer", columnDefinition = "TEXT")
    private String textAnswer;

    @Column(name = "is_marked_for_review", nullable = false)
    @Builder.Default
    private Boolean isMarkedForReview = false;

    @Column(name = "score", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal score = BigDecimal.ZERO;

    @Column(name = "max_score", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal maxScore = BigDecimal.valueOf(1.00);

    @Column(name = "is_correct")
    private Boolean isCorrect;

    @Column(name = "teacher_feedback", columnDefinition = "TEXT")
    private String teacherFeedback;

    @Column(name = "rubric_breakdown", columnDefinition = "TEXT")
    private String rubricBreakdown;

    @Column(name = "auto_graded", nullable = false)
    @Builder.Default
    private Boolean autoGraded = false;

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private Instant updatedAt = Instant.now();
}
