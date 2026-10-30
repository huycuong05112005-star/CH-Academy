package vn.chacademy.chat.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.chacademy.chat.entity.ChatMember;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatMemberRepository extends JpaRepository<ChatMember, Long> {

    Optional<ChatMember> findByConversationIdAndUserId(Long conversationId, Long userId);

    List<ChatMember> findByConversationId(Long conversationId);

    int countByConversationId(Long conversationId);

    void deleteByConversationIdAndUserId(Long conversationId, Long userId);
}

