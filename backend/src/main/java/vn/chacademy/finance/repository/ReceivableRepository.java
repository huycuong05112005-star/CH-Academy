package vn.chacademy.finance.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.chacademy.finance.entity.Receivable;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReceivableRepository extends JpaRepository<Receivable, Long> {

    @EntityGraph(attributePaths = {"student", "enrollment", "enrollment.classEntity"})
    Optional<Receivable> findWithDetailsById(Long id);

    Optional<Receivable> findByCode(String code);

    boolean existsByCode(String code);

    @EntityGraph(attributePaths = {"student", "enrollment"})
    @Query("SELECT r FROM Receivable r WHERE " +
           "(cast(:keyword as string) IS NULL OR " +
           " lower(r.code) LIKE lower(concat('%', cast(:keyword as string), '%')) OR " +
           " lower(r.title) LIKE lower(concat('%', cast(:keyword as string), '%')) OR " +
           " lower(r.student.fullName) LIKE lower(concat('%', cast(:keyword as string), '%')) OR " +
           " lower(r.student.studentCode) LIKE lower(concat('%', cast(:keyword as string), '%'))) AND " +
           "(cast(:status as string) IS NULL OR r.status = :status) AND " +
           "(:studentId IS NULL OR r.student.id = :studentId)")
    Page<Receivable> searchReceivables(@Param("keyword") String keyword,
                                       @Param("status") String status,
                                       @Param("studentId") Long studentId,
                                       Pageable pageable);

    @Query("SELECT coalesce(sum(r.totalAmount), 0) FROM Receivable r WHERE r.status != 'CANCELLED'")
    BigDecimal sumTotalReceivables();

    @Query("SELECT coalesce(sum(r.paidAmount), 0) FROM Receivable r WHERE r.status != 'CANCELLED'")
    BigDecimal sumTotalPaid();

    List<Receivable> findByStudentIdAndStatusInOrderByIdAsc(Long studentId, java.util.List<String> statuses);
}
