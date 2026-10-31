package vn.chacademy.chat.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.chacademy.chat.entity.AiKbDocument;

import java.util.List;

@Repository
public interface AiKbDocumentRepository extends JpaRepository<AiKbDocument, Long> {

    List<AiKbDocument> findByKnowledgeBaseIdOrderByCreatedAtDesc(Long kbId);

    List<AiKbDocument> findByStatus(String status);

    List<AiKbDocument> findAllByOrderByCreatedAtDesc();
}

