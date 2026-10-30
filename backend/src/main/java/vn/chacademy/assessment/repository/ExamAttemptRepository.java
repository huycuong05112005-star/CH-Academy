package vn.chacademy.assessment.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.chacademy.assessment.entity.ExamAttempt;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExamAttemptRepository extends JpaRepository<ExamAttempt, Long> {

    List<ExamAttempt> findByExamIdAndStudentIdOrderByAttemptNumberDesc(Long examId, Long studentId);

    Optional<ExamAttempt> findByExamIdAndStudentIdAndStatus(Long examId, Long studentId, String status);

    Optional<ExamAttempt> findByIdempotencyKey(String idempotencyKey);

    List<ExamAttempt> findByExamIdOrderBySubmittedAtDesc(Long examId);

    List<ExamAttempt> findByStudentIdOrderByStartedAtDesc(Long studentId);

    List<ExamAttempt> findByStudentIdIn(List<Long> studentIds);

    List<ExamAttempt> findByExamIdInAndStudentIdIn(List<Long> examIds, List<Long> studentIds);

    long countByExamIdAndStatus(Long examId, String status);

    long countByExamCreatedByIdAndStatus(Long createdById, String status);


    @Query(value = "SELECT ea FROM ExamAttempt ea " +
           "LEFT JOIN FETCH ea.exam " +
           "LEFT JOIN FETCH ea.student " +
           "WHERE " +
           "(:examId IS NULL OR ea.exam.id = :examId) AND " +
           "(:studentId IS NULL OR ea.student.id = :studentId) AND " +
           "(cast(:status as string) IS NULL OR ea.status = :status) " +
           "ORDER BY ea.id DESC",
           countQuery = "SELECT COUNT(ea) FROM ExamAttempt ea WHERE " +
           "(:examId IS NULL OR ea.exam.id = :examId) AND " +
           "(:studentId IS NULL OR ea.student.id = :studentId) AND " +
           "(cast(:status as string) IS NULL OR ea.status = :status)")
    Page<ExamAttempt> searchAttempts(
            @Param("examId") Long examId,
            @Param("studentId") Long studentId,
            @Param("status") String status,
            Pageable pageable
    );
}
