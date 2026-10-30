package vn.chacademy.assessment.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.chacademy.assessment.entity.Question;

import java.util.List;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {

    List<Question> findByBankId(Long bankId);

    List<Question> findByCourseId(Long courseId);

    boolean existsByBankIdAndContentIgnoreCase(Long bankId, String content);

    boolean existsByContentIgnoreCase(String content);

    @Query("SELECT q FROM Question q WHERE " +
           "(:courseId IS NULL OR q.course.id = :courseId) AND " +
           "(:bankId IS NULL OR q.bank.id = :bankId) AND " +
           "(:sessionId IS NULL OR q.session.id = :sessionId) AND " +
           "(:classId IS NULL OR (q.session IS NOT NULL AND q.session.classEntity.id = :classId)) AND " +
           "(cast(:type as string) IS NULL OR q.type = :type) AND " +
           "(cast(:difficulty as string) IS NULL OR q.difficulty = :difficulty) AND " +
           "(cast(:topic as string) IS NULL OR LOWER(q.topic) LIKE LOWER(CONCAT('%', cast(:topic as string), '%'))) AND " +
           "(cast(:search as string) IS NULL OR LOWER(q.content) LIKE LOWER(CONCAT('%', cast(:search as string), '%')) OR LOWER(q.code) LIKE LOWER(CONCAT('%', cast(:search as string), '%'))) AND " +
           "q.status = 'ACTIVE' ORDER BY q.id DESC")
    Page<Question> searchQuestions(
            @Param("courseId") Long courseId,
            @Param("bankId") Long bankId,
            @Param("sessionId") Long sessionId,
            @Param("classId") Long classId,
            @Param("type") String type,
            @Param("difficulty") String difficulty,
            @Param("topic") String topic,
            @Param("search") String search,
            Pageable pageable
    );
}
