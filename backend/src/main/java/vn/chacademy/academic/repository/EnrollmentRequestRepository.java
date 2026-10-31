package vn.chacademy.academic.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.chacademy.academic.entity.EnrollmentRequest;

import java.util.List;

@Repository
public interface EnrollmentRequestRepository extends JpaRepository<EnrollmentRequest, Long> {

    List<EnrollmentRequest> findByStudentIdOrderByCreatedAtDesc(Long studentId);

    @Query("SELECT r FROM EnrollmentRequest r JOIN r.student s WHERE s.user.id = :userId ORDER BY r.createdAt DESC")
    List<EnrollmentRequest> findByStudentUserIdOrderByCreatedAtDesc(@Param("userId") Long userId);

    List<EnrollmentRequest> findByAcademicYearOrderByCreatedAtDesc(String academicYear);

    List<EnrollmentRequest> findByStatusOrderByCreatedAtDesc(String status);

    List<EnrollmentRequest> findAllByOrderByCreatedAtDesc();

    boolean existsByClassEntityIdAndStudentIdAndStatusIn(Long classId, Long studentId, List<String> statuses);

    @Query("SELECT r FROM EnrollmentRequest r WHERE " +
           "(:academicYear IS NULL OR r.academicYear = :academicYear) AND " +
           "(:status IS NULL OR r.status = :status) " +
           "ORDER BY r.createdAt DESC")
    List<EnrollmentRequest> findFiltered(
            @Param("academicYear") String academicYear,
            @Param("status") String status
    );
}
