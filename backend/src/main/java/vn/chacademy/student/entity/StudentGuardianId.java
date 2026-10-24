package vn.chacademy.student.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;
import java.util.Objects;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class StudentGuardianId implements Serializable {

    @Column(name = "student_id")
    private Long studentId;

    @Column(name = "guardian_id")
    private Long guardianId;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        StudentGuardianId that = (StudentGuardianId) o;
        return Objects.equals(studentId, that.studentId) && Objects.equals(guardianId, that.guardianId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(studentId, guardianId);
    }
}
