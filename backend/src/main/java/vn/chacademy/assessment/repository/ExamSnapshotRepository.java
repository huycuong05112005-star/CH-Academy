package vn.chacademy.assessment.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.chacademy.assessment.entity.ExamSnapshot;

import java.util.Optional;

@Repository
public interface ExamSnapshotRepository extends JpaRepository<ExamSnapshot, Long> {
    Optional<ExamSnapshot> findTopByExamIdOrderByVersionDesc(Long examId);
    Optional<ExamSnapshot> findByExamIdAndVersion(Long examId, Integer version);
}
