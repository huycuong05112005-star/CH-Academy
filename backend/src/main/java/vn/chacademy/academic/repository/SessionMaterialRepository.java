package vn.chacademy.academic.repository;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.chacademy.academic.entity.SessionMaterial;

import java.util.List;

@Repository
public interface SessionMaterialRepository extends JpaRepository<SessionMaterial, Long> {

    @EntityGraph(attributePaths = {"uploadedBy"})
    List<SessionMaterial> findBySessionIdOrderByCreatedAtAsc(Long sessionId);

    @EntityGraph(attributePaths = {"session", "uploadedBy"})
    List<SessionMaterial> findBySessionClassEntityIdOrderByCreatedAtDesc(Long classId);
}
