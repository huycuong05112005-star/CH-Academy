package vn.chacademy.attendance.repository;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.chacademy.attendance.entity.AttendanceRecord;

import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, Long> {

    @EntityGraph(attributePaths = {"session", "student", "recordedBy"})
    List<AttendanceRecord> findBySessionId(Long sessionId);

    @EntityGraph(attributePaths = {"session", "student", "recordedBy"})
    List<AttendanceRecord> findByStudentId(Long studentId);

    Optional<AttendanceRecord> findBySessionIdAndStudentId(Long sessionId, Long studentId);

    long countByStudentIdAndStatus(Long studentId, String status);

    long countByStudentId(Long studentId);
}
