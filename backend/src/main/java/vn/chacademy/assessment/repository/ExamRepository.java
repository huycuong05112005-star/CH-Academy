package vn.chacademy.assessment.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.chacademy.assessment.entity.Exam;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExamRepository extends JpaRepository<Exam, Long> {

    Optional<Exam> findByCode(String code);

    @Query("SELECT DISTINCT e FROM Exam e " +
           "LEFT JOIN e.session s " +
           "LEFT JOIN e.assignments a " +
           "WHERE " +
           "(:courseId IS NULL OR e.course.id = :courseId) AND " +
           "(:teacherId IS NULL OR e.teacher.id = :teacherId) AND " +
           "(:sessionId IS NULL OR s.id = :sessionId OR a.session.id = :sessionId) AND " +
           "(:classId IS NULL OR (s IS NOT NULL AND s.classEntity.id = :classId) OR a.classEntity.id = :classId) AND " +
           "(cast(:status as string) IS NULL OR e.status = :status) AND " +
           "(cast(:search as string) IS NULL OR LOWER(e.title) LIKE LOWER(CONCAT('%', cast(:search as string), '%')) OR LOWER(e.code) LIKE LOWER(CONCAT('%', cast(:search as string), '%'))) " +
           "ORDER BY e.id DESC")
    Page<Exam> searchExams(
            @Param("courseId") Long courseId,
            @Param("teacherId") Long teacherId,
            @Param("sessionId") Long sessionId,
            @Param("classId") Long classId,
            @Param("status") String status,
            @Param("search") String search,
            Pageable pageable
    );

    @Query("SELECT DISTINCT e FROM Exam e " +
           "LEFT JOIN e.assignments ea " +
           "LEFT JOIN e.session s " +
           "WHERE e.status = 'PUBLISHED' " +
           "AND (" +
           "   ea.classEntity.id IN :classIds " +
           "   OR ea.student.id = :studentId " +
           "   OR (s IS NOT NULL AND s.classEntity.id IN :classIds) " +
           "   OR (e.course.id IN :courseIds AND ea.id IS NULL) " +
           "   OR :includeAll = TRUE" +
           ") " +
           "ORDER BY e.startTime DESC NULLS LAST")
    List<Exam> findAvailableExamsForStudent(
            @Param("classIds") List<Long> classIds,
            @Param("courseIds") List<Long> courseIds,
            @Param("studentId") Long studentId,
            @Param("includeAll") boolean includeAll
    );

    long countByStatus(String status);

    long countByTeacherIdAndStatus(Long teacherId, String status);

    long countByCreatedByIdAndStatus(Long createdById, String status);
}
