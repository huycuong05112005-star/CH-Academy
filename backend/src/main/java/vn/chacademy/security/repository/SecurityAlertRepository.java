package vn.chacademy.security.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.chacademy.security.entity.SecurityAlert;

import java.util.List;
import java.util.Optional;

@Repository
public interface SecurityAlertRepository extends JpaRepository<SecurityAlert, Long> {

    List<SecurityAlert> findAllByOrderByCreatedAtDesc();

    List<SecurityAlert> findBySeverityOrderByCreatedAtDesc(String severity);

    List<SecurityAlert> findByStatusOrderByCreatedAtDesc(String status);

    @Query("SELECT a FROM SecurityAlert a WHERE " +
           "(:severity IS NULL OR a.severity = :severity) AND " +
           "(:status IS NULL OR a.status = :status) AND " +
           "(cast(:keyword as string) IS NULL OR " +
           " lower(a.title) LIKE lower(concat('%', cast(:keyword as string), '%')) OR " +
           " lower(a.description) LIKE lower(concat('%', cast(:keyword as string), '%')) OR " +
           " lower(a.username) LIKE lower(concat('%', cast(:keyword as string), '%')) OR " +
           " lower(a.ipAddress) LIKE lower(concat('%', cast(:keyword as string), '%')) OR " +
           " (a.alertCode IS NOT NULL AND lower(a.alertCode) LIKE lower(concat('%', cast(:keyword as string), '%')))) " +
           "ORDER BY a.createdAt DESC")
    List<SecurityAlert> findFiltered(
            @Param("severity") String severity,
            @Param("status") String status,
            @Param("keyword") String keyword
    );

    Optional<SecurityAlert> findByAlertCode(String alertCode);

    long countByStatus(String status);

    long countBySeverity(String severity);
}
