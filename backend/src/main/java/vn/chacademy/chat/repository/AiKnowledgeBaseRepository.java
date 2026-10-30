package vn.chacademy.chat.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.chacademy.chat.entity.AiKnowledgeBase;

import java.util.List;
import java.util.Optional;

@Repository
public interface AiKnowledgeBaseRepository extends JpaRepository<AiKnowledgeBase, Long> {

    Optional<AiKnowledgeBase> findByCode(String code);

    List<AiKnowledgeBase> findByAccessLevel(String accessLevel);

    List<AiKnowledgeBase> findByAccessLevelIn(List<String> accessLevels);

    List<AiKnowledgeBase> findAllByOrderByUpdatedAtDesc();
}
