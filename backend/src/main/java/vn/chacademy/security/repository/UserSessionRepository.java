package vn.chacademy.security.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.chacademy.security.entity.UserSession;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserSessionRepository extends JpaRepository<UserSession, Long> {

    List<UserSession> findByIsActiveTrueOrderByLastActivityAtDesc();

    List<UserSession> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<UserSession> findBySessionToken(String sessionToken);

    long countByIsActiveTrue();
}
