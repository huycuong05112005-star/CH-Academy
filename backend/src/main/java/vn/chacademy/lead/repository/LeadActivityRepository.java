package vn.chacademy.lead.repository;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.chacademy.lead.entity.LeadActivity;

import java.util.List;

@Repository
public interface LeadActivityRepository extends JpaRepository<LeadActivity, Long> {

    @EntityGraph(attributePaths = {"staff"})
    List<LeadActivity> findByLeadIdOrderByActivityTimeDesc(Long leadId);
}
