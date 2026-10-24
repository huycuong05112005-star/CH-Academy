package vn.chacademy.student.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.chacademy.student.entity.Guardian;

import java.util.Optional;

@Repository
public interface GuardianRepository extends JpaRepository<Guardian, Long> {

    Optional<Guardian> findByGuardianCode(String guardianCode);

    boolean existsByGuardianCode(String guardianCode);

    boolean existsByPhone(String phone);

    @Query("SELECT g FROM Guardian g WHERE " +
           "(cast(:keyword as string) IS NULL OR LOWER(g.fullName) LIKE LOWER(CONCAT('%', cast(:keyword as string), '%')) " +
           "OR LOWER(g.guardianCode) LIKE LOWER(CONCAT('%', cast(:keyword as string), '%')) " +
           "OR g.phone LIKE CONCAT('%', cast(:keyword as string), '%'))")
    Page<Guardian> searchGuardians(@Param("keyword") String keyword, Pageable pageable);
}
