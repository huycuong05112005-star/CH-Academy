package vn.chacademy.student.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.chacademy.student.entity.Student;

import java.util.Optional;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {

    Optional<Student> findByStudentCode(String studentCode);

    boolean existsByStudentCode(String studentCode);

    boolean existsByStudentCodeAndIdNot(String studentCode, Long id);

    boolean existsByPhone(String phone);

    @EntityGraph(attributePaths = {"studentGuardians", "studentGuardians.guardian"})
    @Query("SELECT s FROM Student s WHERE " +
           "(cast(:keyword as string) IS NULL OR LOWER(s.fullName) LIKE LOWER(CONCAT('%', cast(:keyword as string), '%')) " +
           "OR LOWER(s.studentCode) LIKE LOWER(CONCAT('%', cast(:keyword as string), '%')) " +
           "OR (s.phone IS NOT NULL AND s.phone LIKE CONCAT('%', cast(:keyword as string), '%'))) " +
           "AND (cast(:status as string) IS NULL OR s.status = :status) " +
           "AND (cast(:targetType as string) IS NULL OR s.targetType = :targetType)")
    Page<Student> searchStudents(
            @Param("keyword") String keyword,
            @Param("status") String status,
            @Param("targetType") String targetType,
            Pageable pageable);

    @Query("SELECT COUNT(s) FROM Student s WHERE s.status = 'ACTIVE'")
    long countActiveStudents();

    long countByTargetType(String targetType);

    long countByStatus(String status);
}
