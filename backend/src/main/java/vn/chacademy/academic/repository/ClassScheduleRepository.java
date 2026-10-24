package vn.chacademy.academic.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.chacademy.academic.entity.ClassSchedule;

import java.time.LocalTime;
import java.util.List;

@Repository
public interface ClassScheduleRepository extends JpaRepository<ClassSchedule, Long> {

    List<ClassSchedule> findByClassEntityId(Long classId);

    void deleteByClassEntityId(Long classId);

    @Query("SELECT s FROM ClassSchedule s WHERE " +
           "s.classEntity.primaryTeacher.id = :teacherId AND " +
           "s.dayOfWeek = :dayOfWeek AND " +
           "(:excludeClassId IS NULL OR s.classEntity.id != :excludeClassId) AND " +
           "s.classEntity.status IN ('PLANNING', 'OPEN_FOR_ENROLLMENT', 'IN_PROGRESS') AND " +
           "s.startTime < :endTime AND s.endTime > :startTime")
    List<ClassSchedule> findTeacherRecurringConflicts(@Param("teacherId") Long teacherId,
                                                      @Param("dayOfWeek") Integer dayOfWeek,
                                                      @Param("startTime") LocalTime startTime,
                                                      @Param("endTime") LocalTime endTime,
                                                      @Param("excludeClassId") Long excludeClassId);

    @Query("SELECT s FROM ClassSchedule s WHERE " +
           "s.room = :room AND " +
           "s.dayOfWeek = :dayOfWeek AND " +
           "(:excludeClassId IS NULL OR s.classEntity.id != :excludeClassId) AND " +
           "s.classEntity.status IN ('PLANNING', 'OPEN_FOR_ENROLLMENT', 'IN_PROGRESS') AND " +
           "s.startTime < :endTime AND s.endTime > :startTime")
    List<ClassSchedule> findRoomRecurringConflicts(@Param("room") String room,
                                                   @Param("dayOfWeek") Integer dayOfWeek,
                                                   @Param("startTime") LocalTime startTime,
                                                   @Param("endTime") LocalTime endTime,
                                                   @Param("excludeClassId") Long excludeClassId);
}
