package vn.chacademy.academic.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.chacademy.academic.entity.Enrollment;

import java.util.List;
import java.util.Optional;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {

    @EntityGraph(attributePaths = {"classEntity", "student", "classEntity.course"})
    Optional<Enrollment> findWithDetailsById(Long id);

    boolean existsByClassEntityIdAndStudentId(Long classId, Long studentId);

    long countByClassEntityIdAndStatus(Long classId, String status);

    @EntityGraph(attributePaths = {"student"})
    List<Enrollment> findByClassEntityIdOrderByCreatedAtDesc(Long classId);

    @EntityGraph(attributePaths = {"classEntity", "student", "classEntity.course"})
    List<Enrollment> findByStudentIdOrderByCreatedAtDesc(Long studentId);

    @EntityGraph(attributePaths = {"classEntity", "student", "classEntity.course"})
    @Query("SELECT e FROM Enrollment e WHERE " +
           "(:classId IS NULL OR e.classEntity.id = :classId) AND " +
           "(:studentId IS NULL OR e.student.id = :studentId) AND " +
           "(cast(:status as string) IS NULL OR e.status = :status)")
    Page<Enrollment> searchEnrollments(@Param("classId") Long classId,
                                       @Param("studentId") Long studentId,
                                       @Param("status") String status,
                                       Pageable pageable);

    @Query("SELECT COUNT(DISTINCT e.student.id) FROM Enrollment e WHERE e.status = 'ENROLLED'")
    long countDistinctActiveEnrolledStudents();
}
