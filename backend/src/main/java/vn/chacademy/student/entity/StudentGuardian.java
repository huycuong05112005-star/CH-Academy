package vn.chacademy.student.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "student_guardians")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentGuardian {

    @EmbeddedId
    private StudentGuardianId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("studentId")
    @JoinColumn(name = "student_id")
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("guardianId")
    @JoinColumn(name = "guardian_id")
    private Guardian guardian;

    @Column(name = "relationship_type", nullable = false, length = 30)
    @Builder.Default
    private String relationshipType = "OTHER"; // FATHER, MOTHER, GUARDIAN, OTHER

    @Column(name = "is_primary_contact", nullable = false)
    @Builder.Default
    private Boolean isPrimaryContact = false;
}
