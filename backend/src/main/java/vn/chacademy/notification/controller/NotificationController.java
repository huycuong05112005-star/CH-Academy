package vn.chacademy.notification.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import vn.chacademy.common.dto.ApiResponse;
import vn.chacademy.common.exception.ResourceNotFoundException;
import vn.chacademy.identity.entity.User;
import vn.chacademy.identity.repository.UserRepository;
import vn.chacademy.notification.dto.NotificationDto;
import vn.chacademy.notification.entity.Notification;
import vn.chacademy.notification.repository.NotificationReadRepository;
import vn.chacademy.notification.repository.NotificationRepository;
import vn.chacademy.notification.service.NotificationService;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final NotificationRepository notificationRepository;
    private final NotificationReadRepository notificationReadRepository;
    private final UserRepository userRepository;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<NotificationDto>> getNotificationDetail(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông báo ID: " + id));

        boolean isRead = false;
        if (userDetails != null) {
            User user = userRepository.findByUsername(userDetails.getUsername()).orElse(null);
            if (user != null) {
                isRead = notificationReadRepository.existsByUserIdAndNotificationId(user.getId(), id);
            }
        }

        return ResponseEntity.ok(ApiResponse.success(NotificationDto.fromEntity(notification, isRead, null)));
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<ApiResponse<NotificationDto>> markAsRead(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        if (userDetails == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Vui lòng đăng nhập", "UNAUTHORIZED"));
        }

        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản người dùng"));

        NotificationDto updated = notificationService.markAsRead(id, user.getId());
        return ResponseEntity.ok(ApiResponse.success("Đã đánh dấu thông báo là đã đọc", updated));
    }

    @PostMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(
            @RequestBody(required = false) List<Long> notificationIds,
            @AuthenticationPrincipal UserDetails userDetails) {

        if (userDetails == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Vui lòng đăng nhập", "UNAUTHORIZED"));
        }

        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản người dùng"));

        if (notificationIds != null && !notificationIds.isEmpty()) {
            notificationService.markAllAsRead(user.getId(), notificationIds);
        }

        return ResponseEntity.ok(ApiResponse.success("Đã đánh dấu tất cả thông báo là đã đọc", null));
    }
}

