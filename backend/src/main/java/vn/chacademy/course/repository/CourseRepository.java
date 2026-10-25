package vn.chacademy.course.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.chacademy.course.entity.Course;

import java.util.List;
import java.util.Optional;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {

    Optional<Course> findByCode(String code);

    boolean existsByCode(String code);

    boolean existsByCodeAndIdNot(String code, Long id);

    long countByCategoryId(Long categoryId);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"category"})
    @Query("SELECT c FROM Course c WHERE " +
           "(cast(:keyword as string) IS NULL OR LOWER(c.name) LIKE LOWER(CONCAT('%', cast(:keyword as string), '%')) OR LOWER(c.code) LIKE LOWER(CONCAT('%', cast(:keyword as string), '%'))) " +
           "AND (:categoryId IS NULL OR c.category.id = :categoryId) " +
           "AND (cast(:targetAudience as string) IS NULL OR c.targetAudience = :targetAudience) " +
           "AND (cast(:status as string) IS NULL OR c.status = :status)")
    Page<Course> searchCourses(
            @Param("keyword") String keyword,
            @Param("categoryId") Long categoryId,
            @Param("targetAudience") String targetAudience,
            @Param("status") String status,
            Pageable pageable);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"category"})
    @Query("SELECT c FROM Course c WHERE " +
           "c.isPublic = true AND c.status = 'ACTIVE' " +
           "AND (cast(:keyword as string) IS NULL OR LOWER(c.name) LIKE LOWER(CONCAT('%', cast(:keyword as string), '%')) OR LOWER(c.description) LIKE LOWER(CONCAT('%', cast(:keyword as string), '%'))) " +
           "AND (:categoryId IS NULL OR c.category.id = :categoryId) " +
           "AND (cast(:targetAudience as string) IS NULL OR c.targetAudience = :targetAudience OR c.targetAudience = 'ALL')")
    Page<Course> searchPublicCourses(
            @Param("keyword") String keyword,
            @Param("categoryId") Long categoryId,
            @Param("targetAudience") String targetAudience,
            Pageable pageable);

    List<Course> findTop6ByIsPublicTrueAndStatusOrderByCreatedAtDesc(String status);
}
