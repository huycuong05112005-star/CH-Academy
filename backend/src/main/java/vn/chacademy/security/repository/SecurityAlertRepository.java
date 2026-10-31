package vn.chacademy.security.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.chacademy.security.entity.SecurityAlert;

import java.util.List;

@Repository
public interface SecurityAlertRepository extends JpaRepository<SecurityAlert, Long> {

    List<SecurityAlert> findAllByOrderByCreatedAtDesc();

    List<SecurityAlert> findBySeverityOrderByCreatedAtDesc(String severity);

    List<SecurityAlert> findByStatusOrderByCreatedAtDesc(String status);

    @Query("SELECT a FROM SecurityAlert a WHERE " +
           "(:severity IS NULL OR a.severity = :severity) AND " +
           "(:status IS NULL OR a.status = :status) " +
           "ORDER BY a.createdAt DESC")
    List<SecurityAlert> findFiltered(
            @Param("severity") String severity,
            @Param("status") String status
    );

    long countByStatus(String status);

    long countBySeverity(String severity);
}
