package vn.chacademy.finance.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.chacademy.finance.entity.Payment;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    @EntityGraph(attributePaths = {"student", "createdBy", "allocations", "allocations.receivable"})
    Optional<Payment> findWithDetailsById(Long id);

    boolean existsByPaymentCode(String paymentCode);

    @EntityGraph(attributePaths = {"student", "createdBy"})
    @Query("SELECT p FROM Payment p WHERE " +
           "(cast(:keyword as string) IS NULL OR " +
           " lower(p.paymentCode) LIKE lower(concat('%', cast(:keyword as string), '%')) OR " +
           " lower(p.student.fullName) LIKE lower(concat('%', cast(:keyword as string), '%')) OR " +
           " lower(p.student.studentCode) LIKE lower(concat('%', cast(:keyword as string), '%')) OR " +
           " lower(p.referenceNumber) LIKE lower(concat('%', cast(:keyword as string), '%'))) AND " +
           "(cast(:method as string) IS NULL OR p.paymentMethod = :method) AND " +
           "(:studentId IS NULL OR p.student.id = :studentId)")
    Page<Payment> searchPayments(@Param("keyword") String keyword,
                                 @Param("method") String method,
                                 @Param("studentId") Long studentId,
                                 Pageable pageable);

    @Query("SELECT coalesce(sum(p.amount), 0) FROM Payment p")
    BigDecimal sumTotalPayments();

    List<Payment> findByStudentIdOrderByCreatedAtDesc(Long studentId);
}
