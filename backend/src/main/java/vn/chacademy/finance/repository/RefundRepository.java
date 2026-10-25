package vn.chacademy.finance.repository;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import vn.chacademy.finance.entity.Refund;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface RefundRepository extends JpaRepository<Refund, Long> {

    @EntityGraph(attributePaths = {"payment", "approvedBy"})
    List<Refund> findByPaymentId(Long paymentId);

    Optional<Refund> findByRefundCode(String refundCode);

    boolean existsByRefundCode(String refundCode);

    @Query("SELECT coalesce(sum(r.amount), 0) FROM Refund r")
    BigDecimal sumTotalRefunds();
}
