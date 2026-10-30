package vn.chacademy.assessment.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.chacademy.assessment.entity.AttemptAnswer;

import java.util.List;
import java.util.Optional;

@Repository
public interface AttemptAnswerRepository extends JpaRepository<AttemptAnswer, Long> {
    List<AttemptAnswer> findByAttemptId(Long attemptId);
    Optional<AttemptAnswer> findByAttemptIdAndQuestionId(Long attemptId, Long questionId);
}
