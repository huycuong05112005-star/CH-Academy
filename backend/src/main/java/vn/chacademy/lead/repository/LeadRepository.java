package vn.chacademy.lead.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.chacademy.lead.entity.Lead;

import java.util.Optional;

@Repository
public interface LeadRepository extends JpaRepository<Lead, Long> {

    @EntityGraph(attributePaths = {"targetCourse", "assignedStaff", "convertedStudent"})
    Optional<Lead> findByLeadCode(String leadCode);

    @EntityGraph(attributePaths = {"targetCourse", "assignedStaff", "convertedStudent"})
    @Query("SELECT l FROM Lead l WHERE " +
           "(cast(:keyword as string) IS NULL OR " +
           " lower(l.leadCode) LIKE lower(concat('%', cast(:keyword as string), '%')) OR " +
           " lower(l.fullName) LIKE lower(concat('%', cast(:keyword as string), '%')) OR " +
           " lower(l.phone) LIKE lower(concat('%', cast(:keyword as string), '%')) OR " +
           " lower(l.email) LIKE lower(concat('%', cast(:keyword as string), '%'))) AND " +
           "(cast(:status as string) IS NULL OR l.status = :status) AND " +
           "(cast(:source as string) IS NULL OR l.source = :source) AND " +
           "(:assignedStaffId IS NULL OR (l.assignedStaff IS NOT NULL AND l.assignedStaff.id = :assignedStaffId))")
    Page<Lead> searchLeads(@Param("keyword") String keyword,
                           @Param("status") String status,
                           @Param("source") String source,
                           @Param("assignedStaffId") Long assignedStaffId,
                           Pageable pageable);

    boolean existsByPhoneAndStatusNot(String phone, String status);

    long countByStatus(String status);

    long countByCreatedAtBetween(java.time.Instant start, java.time.Instant end);

    long countByStatusAndCreatedAtBetween(String status, java.time.Instant start, java.time.Instant end);
}
