package vn.chacademy.academic.repository;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.chacademy.academic.entity.ClassSession;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface ClassSessionRepository extends JpaRepository<ClassSession, Long> {

    @EntityGraph(attributePaths = {"classEntity", "teacher"})
    List<ClassSession> findByClassEntityIdOrderBySessionDateAscStartTimeAsc(Long classId);

    @EntityGraph(attributePaths = {"classEntity", "teacher"})
    @Query("SELECT s FROM ClassSession s WHERE " +
           "(:classId IS NULL OR s.classEntity.id = :classId) AND " +
           "(:teacherId IS NULL OR (s.teacher IS NOT NULL AND s.teacher.id = :teacherId)) AND " +
           "s.sessionDate >= :startDate AND s.sessionDate <= :endDate " +
           "ORDER BY s.sessionDate ASC, s.startTime ASC")
    List<ClassSession> findSessionsInDateRange(@Param("classId") Long classId,
                                              @Param("teacherId") Long teacherId,
                                              @Param("startDate") LocalDate startDate,
                                              @Param("endDate") LocalDate endDate);

    @Query("SELECT s FROM ClassSession s WHERE " +
           "s.teacher.id = :teacherId AND " +
           "s.sessionDate = :sessionDate AND " +
           "s.status != 'CANCELLED' AND " +
           "(:excludeSessionId IS NULL OR s.id != :excludeSessionId) AND " +
           "s.startTime < :endTime AND s.endTime > :startTime")
    List<ClassSession> findTeacherSessionConflicts(@Param("teacherId") Long teacherId,
                                                  @Param("sessionDate") LocalDate sessionDate,
                                                  @Param("startTime") LocalTime startTime,
                                                  @Param("endTime") LocalTime endTime,
                                                  @Param("excludeSessionId") Long excludeSessionId);

    @Query("SELECT s FROM ClassSession s WHERE " +
           "s.room = :room AND " +
           "s.sessionDate = :sessionDate AND " +
           "s.status != 'CANCELLED' AND " +
           "(:excludeSessionId IS NULL OR s.id != :excludeSessionId) AND " +
           "s.startTime < :endTime AND s.endTime > :startTime")
    List<ClassSession> findRoomSessionConflicts(@Param("room") String room,
                                               @Param("sessionDate") LocalDate sessionDate,
                                               @Param("startTime") LocalTime startTime,
                                               @Param("endTime") LocalTime endTime,
                                               @Param("excludeSessionId") Long excludeSessionId);
}
