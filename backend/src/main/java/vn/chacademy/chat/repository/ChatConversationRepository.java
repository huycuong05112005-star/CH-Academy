package vn.chacademy.chat.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.chacademy.chat.entity.ChatConversation;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatConversationRepository extends JpaRepository<ChatConversation, Long> {

    Optional<ChatConversation> findByClassEntityId(Long classId);

    @Query("SELECT c FROM ChatConversation c " +
           "JOIN c.members m " +
           "WHERE m.user.id = :userId " +
           "ORDER BY c.updatedAt DESC")
    List<ChatConversation> findConversationsByUserId(@Param("userId") Long userId);
}

