package vn.chacademy.chat.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.chacademy.chat.entity.AiKbChunk;

import java.util.List;

@Repository
public interface AiKbChunkRepository extends JpaRepository<AiKbChunk, Long> {

    List<AiKbChunk> findByDocumentIdOrderByChunkIndexAsc(Long documentId);

    @Query("SELECT c FROM AiKbChunk c WHERE c.document.knowledgeBase.id IN :kbIds AND LOWER(c.content) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<AiKbChunk> searchInKnowledgeBases(@Param("kbIds") List<Long> kbIds, @Param("keyword") String keyword);

    @Query("SELECT c FROM AiKbChunk c WHERE c.document.knowledgeBase.accessLevel IN :accessLevels AND LOWER(c.content) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<AiKbChunk> searchByAccessLevels(@Param("accessLevels") List<String> accessLevels, @Param("keyword") String keyword);
}
