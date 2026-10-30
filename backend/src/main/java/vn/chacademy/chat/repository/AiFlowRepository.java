package vn.chacademy.chat.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.chacademy.chat.entity.AiFlow;

import java.util.List;
import java.util.Optional;

@Repository
public interface AiFlowRepository extends JpaRepository<AiFlow, Long> {

    List<AiFlow> findByAgentIdOrderByUpdatedAtDesc(Long agentId);

    List<AiFlow> findByStatusOrderByUpdatedAtDesc(String status);

    Optional<AiFlow> findByAgentIdAndStatus(Long agentId, String status);

    List<AiFlow> findAllByOrderByUpdatedAtDesc();
}
