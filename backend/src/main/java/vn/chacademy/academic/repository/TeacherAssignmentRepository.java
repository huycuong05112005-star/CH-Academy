package vn.chacademy.academic.repository;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.chacademy.academic.entity.TeacherAssignment;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeacherAssignmentRepository extends JpaRepository<TeacherAssignment, Long> {

    @EntityGraph(attributePaths = {"classEntity", "teacher", "assignedBy"})
    List<TeacherAssignment> findByClassEntityIdOrderByCreatedAtDesc(Long classId);

    @EntityGraph(attributePaths = {"classEntity", "teacher", "assignedBy"})
    List<TeacherAssignment> findByTeacherIdOrderByCreatedAtDesc(Long teacherId);

    @EntityGraph(attributePaths = {"classEntity", "teacher", "assignedBy"})
    List<TeacherAssignment> findAllByOrderByCreatedAtDesc();

    Optional<TeacherAssignment> findByClassEntityIdAndTeacherIdAndStatus(Long classId, Long teacherId, String status);

    boolean existsByClassEntityIdAndTeacherIdAndStatus(Long classId, Long teacherId, String status);
}
