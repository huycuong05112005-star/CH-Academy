package vn.chacademy.assessment.entity;

import jakarta.persistence.*;
import lombok.*;
import vn.chacademy.academic.entity.ClassEntity;
import vn.chacademy.identity.entity.User;
import vn.chacademy.student.entity.Student;

import java.time.Instant;

@Entity
@Table(name = "exam_assignments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", nullable = false)
    private Exam exam;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id")
    private ClassEntity classEntity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id")
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_by")
    private User assignedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id")
    private vn.chacademy.academic.entity.ClassSession session;

    @Column(name = "assessment_type", length = 30)
    @Builder.Default
    private String assessmentType = "STANDARD";

    @Column(name = "title", length = 255)
    private String title;

    @Column(name = "assigned_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant assignedAt = Instant.now();

    @Column(name = "due_date")
    private Instant dueDate;
}
