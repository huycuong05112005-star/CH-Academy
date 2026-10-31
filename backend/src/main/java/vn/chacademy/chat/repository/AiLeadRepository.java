package vn.chacademy.chat.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.chacademy.chat.entity.AiLead;

import java.util.List;

@Repository
public interface AiLeadRepository extends JpaRepository<AiLead, Long> {

    List<AiLead> findByStatusOrderByCreatedAtDesc(String status);

    List<AiLead> findAllByOrderByCreatedAtDesc();

    boolean existsByPhoneAndCourseInterest(String phone, String courseInterest);
}

