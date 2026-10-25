package vn.chacademy.notification.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import vn.chacademy.academic.dto.SessionMaterialDto;
import vn.chacademy.academic.entity.ClassEntity;
import vn.chacademy.academic.repository.ClassRepository;
import vn.chacademy.academic.repository.SessionMaterialRepository;
import vn.chacademy.common.dto.ApiResponse;
import vn.chacademy.common.exception.ResourceNotFoundException;
import vn.chacademy.identity.entity.User;
import vn.chacademy.identity.repository.UserRepository;
import vn.chacademy.notification.dto.CreateNotificationRequest;
import vn.chacademy.notification.dto.NotificationDto;
import vn.chacademy.notification.entity.Notification;
import vn.chacademy.notification.repository.NotificationRepository;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/notifications")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class NotificationAdminController {

    private final NotificationRepository notificationRepository;
    private final ClassRepository classRepository;
    private final UserRepository userRepository;
    private final SessionMaterialRepository sessionMaterialRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<NotificationDto>>> getAllNotifications() {
        List<NotificationDto> dtos = notificationRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(NotificationDto::fromEntity)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<NotificationDto>> createNotification(
            @Valid @RequestBody CreateNotificationRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        User currentUser = null;
        if (userDetails != null) {
            currentUser = userRepository.findByUsername(userDetails.getUsername()).orElse(null);
        }

        ClassEntity targetClass = null;
        if ("CLASS".equalsIgnoreCase(request.getTargetAudience()) && request.getTargetClassId() != null) {
            targetClass = classRepository.findById(request.getTargetClassId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp học với ID: " + request.getTargetClassId()));
        }

        Notification notification = Notification.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .targetAudience(request.getTargetAudience().toUpperCase())
                .targetClass(targetClass)
                .priority(request.getPriority() != null ? request.getPriority().toUpperCase() : "NORMAL")
                .createdBy(currentUser)
                .build();

        Notification saved = notificationRepository.save(notification);
        return ResponseEntity.ok(ApiResponse.success("Đã gửi thông báo thành công", NotificationDto.fromEntity(saved)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteNotification(@PathVariable Long id) {
        if (!notificationRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy thông báo ID: " + id);
        }
        notificationRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa thông báo thành công", null));
    }

    @GetMapping("/teacher-materials")
    public ResponseEntity<ApiResponse<List<SessionMaterialDto>>> getAllTeacherMaterials() {
        List<SessionMaterialDto> dtos = sessionMaterialRepository.findAll().stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(SessionMaterialDto::fromEntity)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }
}
