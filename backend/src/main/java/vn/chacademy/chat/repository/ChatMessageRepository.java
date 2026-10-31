package vn.chacademy.chat.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.chacademy.chat.entity.ChatMessage;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    List<ChatMessage> findByConversationIdOrderByCreatedAtAsc(Long conversationId);

    Page<ChatMessage> findByConversationIdOrderByCreatedAtDesc(Long conversationId, Pageable pageable);

    Optional<ChatMessage> findFirstByConversationIdOrderByCreatedAtDesc(Long conversationId);

    @Query("SELECT COUNT(m) FROM ChatMessage m WHERE m.conversation.id = :convId AND (:lastReadId IS NULL OR m.id > :lastReadId)")
    long countUnreadMessages(@Param("convId") Long convId, @Param("lastReadId") Long lastReadId);

    @Query("SELECT COUNT(m) FROM ChatMessage m WHERE m.conversation.id = :convId AND m.sender.id != :userId AND (:lastReadId IS NULL OR m.id > :lastReadId)")
    long countUnreadMessagesExcludingSender(@Param("convId") Long convId, @Param("lastReadId") Long lastReadId, @Param("userId") Long userId);

    Optional<ChatMessage> findByConversationIdAndClientMsgId(Long conversationId, String clientMsgId);
}

