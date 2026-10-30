package vn.chacademy.chat.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.chacademy.chat.entity.AiAgent;

import java.util.List;
import java.util.Optional;

@Repository
public interface AiAgentRepository extends JpaRepository<AiAgent, Long> {

    Optional<AiAgent> findByCode(String code);

    List<AiAgent> findByRoleTarget(String roleTarget);

    List<AiAgent> findByStatusOrderByUpdatedAtDesc(String status);

    List<AiAgent> findAllByOrderByUpdatedAtDesc();
}
