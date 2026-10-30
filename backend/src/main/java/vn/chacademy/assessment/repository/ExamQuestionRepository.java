package vn.chacademy.assessment.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.chacademy.assessment.entity.ExamQuestion;

import java.util.List;

@Repository
public interface ExamQuestionRepository extends JpaRepository<ExamQuestion, Long> {
    List<ExamQuestion> findByExamIdOrderBySortOrderAsc(Long examId);
    void deleteByExamId(Long examId);
}
