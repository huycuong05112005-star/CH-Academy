package vn.chacademy.assessment.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.chacademy.assessment.entity.ExamReviewLog;

import java.util.List;

@Repository
public interface ExamReviewLogRepository extends JpaRepository<ExamReviewLog, Long> {
    List<ExamReviewLog> findByExamIdOrderByCreatedAtDesc(Long examId);
}
