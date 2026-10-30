package vn.chacademy.assessment.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.chacademy.assessment.entity.QuestionBank;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuestionBankRepository extends JpaRepository<QuestionBank, Long> {
    Optional<QuestionBank> findByCode(String code);
    List<QuestionBank> findByStatusOrderByCreatedAtDesc(String status);
    Page<QuestionBank> findByCourseId(Long courseId, Pageable pageable);
}
