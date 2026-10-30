package vn.chacademy.academic.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.chacademy.academic.entity.ClassEntity;

import java.util.Optional;

@Repository
public interface ClassRepository extends JpaRepository<ClassEntity, Long> {

    @EntityGraph(attributePaths = {"course", "primaryTeacher", "schedules"})
    Optional<ClassEntity> findWithDetailsById(Long id);

    Optional<ClassEntity> findByCode(String code);

    boolean existsByCode(String code);

    @EntityGraph(attributePaths = {"course", "primaryTeacher"})
    @Query("SELECT c FROM ClassEntity c WHERE " +
           "(cast(:keyword as string) IS NULL OR " +
           " lower(c.code) LIKE lower(concat('%', cast(:keyword as string), '%')) OR " +
           " lower(c.name) LIKE lower(concat('%', cast(:keyword as string), '%')) OR " +
           " lower(c.room) LIKE lower(concat('%', cast(:keyword as string), '%'))) AND " +
           "(cast(:status as string) IS NULL OR c.status = :status) AND " +
           "(:courseId IS NULL OR c.course.id = :courseId) AND " +
           "(:teacherId IS NULL OR (c.primaryTeacher IS NOT NULL AND c.primaryTeacher.id = :teacherId))")
    Page<ClassEntity> searchClasses(@Param("keyword") String keyword,
                                   @Param("status") String status,
                                   @Param("courseId") Long courseId,
                                   @Param("teacherId") Long teacherId,
                                   Pageable pageable);

    @EntityGraph(attributePaths = {"course", "primaryTeacher"})
    java.util.List<ClassEntity> findByPrimaryTeacherIdOrderByStartDateDesc(Long teacherId);

    long countByStatus(String status);

    long countByStatusIn(java.util.Collection<String> statuses);

    @Query("SELECT COUNT(c) FROM ClassEntity c WHERE c.status IN :statuses AND (c.academicYear = :academicYear OR (c.startDate BETWEEN :start AND :end))")
    long countByAcademicYearAndStatusIn(@Param("academicYear") String academicYear,
                                        @Param("start") java.time.LocalDate start,
                                        @Param("end") java.time.LocalDate end,
                                        @Param("statuses") java.util.Collection<String> statuses);

    @Query("SELECT DISTINCT c.academicYear FROM ClassEntity c WHERE c.academicYear IS NOT NULL ORDER BY c.academicYear DESC")
    java.util.List<String> findDistinctAcademicYears();
}
