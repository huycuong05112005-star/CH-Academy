package vn.chacademy.notification.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.chacademy.common.exception.ResourceNotFoundException;
import vn.chacademy.identity.entity.User;
import vn.chacademy.identity.repository.UserRepository;
import vn.chacademy.notification.dto.NotificationDto;
import vn.chacademy.notification.entity.Notification;
import vn.chacademy.notification.entity.NotificationRead;
import vn.chacademy.notification.repository.NotificationReadRepository;
import vn.chacademy.notification.repository.NotificationRepository;

import java.time.Instant;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationReadRepository notificationReadRepository;
    private final UserRepository userRepository;

    @Transactional
    public NotificationDto markAsRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông báo ID: " + notificationId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng ID: " + userId));

        NotificationRead read = notificationReadRepository.findByUserIdAndNotificationId(userId, notificationId)
                .orElseGet(() -> {
                    NotificationRead newRead = NotificationRead.builder()
                            .notification(notification)
                            .user(user)
                            .build();
                    return notificationReadRepository.save(newRead);
                });

        return NotificationDto.fromEntity(notification, true, read.getReadAt() != null ? read.getReadAt() : Instant.now());
    }

    @Transactional
    public void markAllAsRead(Long userId, Collection<Long> notificationIds) {
        if (notificationIds == null || notificationIds.isEmpty()) return;

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng ID: " + userId));

        Set<Long> alreadyReadIds = notificationReadRepository.findReadNotificationIdsByUserIdAndNotificationIds(userId, notificationIds);

        List<Notification> unreadNotifications = notificationRepository.findAllById(
                notificationIds.stream().filter(id -> !alreadyReadIds.contains(id)).toList()
        );

        List<NotificationRead> newReads = unreadNotifications.stream()
                .map(notif -> NotificationRead.builder()
                        .notification(notif)
                        .user(user)
                        .build())
                .toList();

        if (!newReads.isEmpty()) {
            notificationReadRepository.saveAll(newReads);
        }
    }

    @Transactional(readOnly = true)
    public Set<Long> getReadNotificationIds(Long userId) {
        if (userId == null) return Collections.emptySet();
        return notificationReadRepository.findReadNotificationIdsByUserId(userId);
    }
}

