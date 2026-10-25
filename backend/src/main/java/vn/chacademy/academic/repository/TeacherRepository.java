package vn.chacademy.academic.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.chacademy.academic.entity.Teacher;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeacherRepository extends JpaRepository<Teacher, Long> {

    Optional<Teacher> findByTeacherCode(String teacherCode);

    Optional<Teacher> findByUserId(Long userId);

    boolean existsByTeacherCode(String teacherCode);

    List<Teacher> findByStatus(String status);

    @Query("SELECT t FROM Teacher t WHERE " +
           "(cast(:keyword as string) IS NULL OR " +
           " lower(t.teacherCode) LIKE lower(concat('%', cast(:keyword as string), '%')) OR " +
           " lower(t.fullName) LIKE lower(concat('%', cast(:keyword as string), '%')) OR " +
           " lower(t.phone) LIKE lower(concat('%', cast(:keyword as string), '%')) OR " +
           " lower(t.email) LIKE lower(concat('%', cast(:keyword as string), '%'))) AND " +
           "(cast(:status as string) IS NULL OR t.status = :status)")
    Page<Teacher> searchTeachers(@Param("keyword") String keyword, @Param("status") String status, Pageable pageable);
}
