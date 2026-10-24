package vn.chacademy.course.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.chacademy.course.entity.CourseCategory;

import java.util.List;
import java.util.Optional;

@Repository
public interface CourseCategoryRepository extends JpaRepository<CourseCategory, Long> {

    Optional<CourseCategory> findByCode(String code);

    boolean existsByCode(String code);

    List<CourseCategory> findAllByOrderByDisplayOrderAsc();

    List<CourseCategory> findByIsActiveTrueOrderByDisplayOrderAsc();
}
