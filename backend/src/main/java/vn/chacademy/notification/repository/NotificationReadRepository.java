package vn.chacademy.notification.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.chacademy.notification.entity.NotificationRead;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
public interface NotificationReadRepository extends JpaRepository<NotificationRead, Long> {

    Optional<NotificationRead> findByUserIdAndNotificationId(Long userId, Long notificationId);

    boolean existsByUserIdAndNotificationId(Long userId, Long notificationId);

    @Query("SELECT nr.notification.id FROM NotificationRead nr WHERE nr.user.id = :userId")
    Set<Long> findReadNotificationIdsByUserId(@Param("userId") Long userId);

    @Query("SELECT nr.notification.id FROM NotificationRead nr WHERE nr.user.id = :userId AND nr.notification.id IN :notificationIds")
    Set<Long> findReadNotificationIdsByUserIdAndNotificationIds(
            @Param("userId") Long userId,
            @Param("notificationIds") Collection<Long> notificationIds
    );

    List<NotificationRead> findByUserId(Long userId);
}

