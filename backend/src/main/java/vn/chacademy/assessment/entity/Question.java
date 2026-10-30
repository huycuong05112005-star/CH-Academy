package vn.chacademy.assessment.entity;

import jakarta.persistence.*;
import lombok.*;
import vn.chacademy.course.entity.Course;
import vn.chacademy.identity.entity.User;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "questions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bank_id")
    private QuestionBank bank;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id")
    private Course course;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id")
    private vn.chacademy.academic.entity.ClassSession session;

    @Column(name = "code", length = 50)
    private String code;

    @Column(name = "type", nullable = false, length = 30)
    private String type; // SINGLE_CHOICE, MULTIPLE_CHOICE, TRUE_FALSE, FILL_IN_BLANK, SHORT_ANSWER, ESSAY

    @Column(name = "difficulty", nullable = false, length = 20)
    @Builder.Default
    private String difficulty = "MEDIUM"; // EASY, MEDIUM, HARD, EXPERT

    @Column(name = "topic", nullable = false, length = 100)
    @Builder.Default
    private String topic = "Chung";

    @Column(name = "learning_outcome", length = 100)
    @Builder.Default
    private String learningOutcome = "APPLY"; // REMEMBER, UNDERSTAND, APPLY, ANALYZE

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "default_points", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal defaultPoints = BigDecimal.valueOf(1.00);

    @Column(name = "explanation", columnDefinition = "TEXT")
    private String explanation;

    @Column(name = "rubric_json", columnDefinition = "TEXT")
    private String rubricJson;

    @Column(name = "answer_key", columnDefinition = "TEXT")
    private String answerKey;

    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, DRAFT, ARCHIVED

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<QuestionOption> options = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private Instant updatedAt = Instant.now();
}
