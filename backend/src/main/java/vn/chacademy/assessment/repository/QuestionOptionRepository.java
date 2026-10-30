package vn.chacademy.assessment.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.chacademy.assessment.entity.QuestionOption;

import java.util.List;

@Repository
public interface QuestionOptionRepository extends JpaRepository<QuestionOption, Long> {
    List<QuestionOption> findByQuestionIdOrderBySortOrderAsc(Long questionId);
    void deleteByQuestionId(Long questionId);
}
