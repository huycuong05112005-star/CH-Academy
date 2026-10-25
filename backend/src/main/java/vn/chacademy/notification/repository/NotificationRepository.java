package vn.chacademy.notification.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.chacademy.notification.entity.Notification;

import java.util.Collection;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    @EntityGraph(attributePaths = {"targetClass", "createdBy"})
    List<Notification> findAllByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = {"targetClass", "createdBy"})
    @Query("SELECT n FROM Notification n WHERE " +
           "n.targetAudience IN ('ALL', 'TEACHERS') OR " +
           "(n.targetAudience = 'CLASS' AND n.targetClass.id IN :classIds) " +
           "ORDER BY n.createdAt DESC")
    List<Notification> findForTeacher(@Param("classIds") Collection<Long> classIds);

    @EntityGraph(attributePaths = {"targetClass", "createdBy"})
    @Query("SELECT n FROM Notification n WHERE " +
           "n.targetAudience IN ('ALL', 'STUDENTS') OR " +
           "(n.targetAudience = 'CLASS' AND n.targetClass.id IN :classIds) " +
           "ORDER BY n.createdAt DESC")
    List<Notification> findForStudent(@Param("classIds") Collection<Long> classIds);

    @EntityGraph(attributePaths = {"targetClass", "createdBy"})
    List<Notification> findByCreatedByIdOrderByCreatedAtDesc(Long userId);
}
