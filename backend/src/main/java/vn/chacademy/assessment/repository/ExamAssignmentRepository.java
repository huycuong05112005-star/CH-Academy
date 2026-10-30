package vn.chacademy.assessment.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.chacademy.assessment.entity.ExamAssignment;

import java.util.List;

@Repository
public interface ExamAssignmentRepository extends JpaRepository<ExamAssignment, Long> {
    List<ExamAssignment> findByExamId(Long examId);
    List<ExamAssignment> findByClassEntityId(Long classId);
    List<ExamAssignment> findBySessionId(Long sessionId);
    List<ExamAssignment> findByClassEntityIdAndSessionId(Long classId, Long sessionId);
    List<ExamAssignment> findByStudentId(Long studentId);
    void deleteByExamId(Long examId);
}

