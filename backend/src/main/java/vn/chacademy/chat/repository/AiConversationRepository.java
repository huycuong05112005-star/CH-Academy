package vn.chacademy.chat.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.chacademy.chat.entity.AiConversation;

import java.util.List;
import java.util.Optional;

@Repository
public interface AiConversationRepository extends JpaRepository<AiConversation, Long> {

    List<AiConversation> findByUserIdOrderByUpdatedAtDesc(Long userId);

    List<AiConversation> findByUserIdAndPortalOrderByUpdatedAtDesc(Long userId, String portal);

    Optional<AiConversation> findByIdAndUserId(Long id, Long userId);

    Optional<AiConversation> findByIdAndUserIdAndPortal(Long id, Long userId, String portal);

    List<AiConversation> findBySessionIdAndPortalOrderByUpdatedAtDesc(String sessionId, String portal);

    Optional<AiConversation> findByIdAndSessionIdAndPortal(Long id, String sessionId, String portal);

    List<AiConversation> findByPortalOrderByUpdatedAtDesc(String portal);

    List<AiConversation> findAllByOrderByUpdatedAtDesc();

    List<AiConversation> findByStatusOrderByUpdatedAtDesc(String status);
}
