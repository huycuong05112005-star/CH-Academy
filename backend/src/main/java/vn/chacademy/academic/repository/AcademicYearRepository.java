package vn.chacademy.academic.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.chacademy.academic.entity.AcademicYear;

import java.util.List;
import java.util.Optional;

@Repository
public interface AcademicYearRepository extends JpaRepository<AcademicYear, Long> {
    Optional<AcademicYear> findByCode(String code);
    Optional<AcademicYear> findByIsCurrentTrue();
    List<AcademicYear> findAllByOrderByStartDateDesc();
    boolean existsByCode(String code);
}

