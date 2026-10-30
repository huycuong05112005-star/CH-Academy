package vn.chacademy.identity.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.chacademy.common.audit.dto.AuditLogDto;
import vn.chacademy.common.audit.repository.AuditLogRepository;
import vn.chacademy.common.audit.service.AuditService;
import vn.chacademy.common.exception.BadRequestException;
import vn.chacademy.common.exception.ResourceNotFoundException;
import vn.chacademy.identity.dto.ResetPasswordResponse;
import vn.chacademy.identity.dto.UserSecurityDto;
import vn.chacademy.identity.entity.Role;
import vn.chacademy.identity.entity.User;
import vn.chacademy.identity.repository.UserRepository;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SecurityAdminService {

    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public List<UserSecurityDto> getStaffAndTeacherSecurityList(String keyword, String roleFilter, String statusFilter) {
        List<User> allUsers = userRepository.findAll();
        List<UserSecurityDto> result = new ArrayList<>();

        for (User u : allUsers) {
            // Only include Admin, Staff and Teacher roles
            boolean isStaffOrTeacher = u.getRoles().stream()
                    .anyMatch(r -> Set.of("SUPER_ADMIN", "CENTER_ADMIN", "ACADEMIC_STAFF", "ADMISSIONS_STAFF", "ACCOUNTANT", "ADMIN", "TEACHER").contains(r.getId()));

            if (!isStaffOrTeacher) {
                continue;
            }

            // Keyword filter
            if (keyword != null && !keyword.isBlank()) {
                String kw = keyword.toLowerCase();
                boolean matches = (u.getUsername() != null && u.getUsername().toLowerCase().contains(kw)) ||
                        (u.getFullName() != null && u.getFullName().toLowerCase().contains(kw)) ||
                        (u.getEmail() != null && u.getEmail().toLowerCase().contains(kw)) ||
                        (u.getPhone() != null && u.getPhone().toLowerCase().contains(kw));
                if (!matches) continue;
            }

            // Role filter
            String primaryRole = u.getRoles().stream()
                    .map(Role::getId)
                    .findFirst()
                    .orElse("USER");

            if (roleFilter != null && !roleFilter.isBlank() && !"ALL".equalsIgnoreCase(roleFilter)) {
                boolean hasRole = u.getRoles().stream().anyMatch(r -> r.getId().equalsIgnoreCase(roleFilter));
                if (!hasRole) continue;
            }

            // Status filter
            if (statusFilter != null && !statusFilter.isBlank() && !"ALL".equalsIgnoreCase(statusFilter)) {
                if (!statusFilter.equalsIgnoreCase(u.getStatus())) continue;
            }

            String roleName = u.getRoles().stream()
                    .map(Role::getName)
                    .findFirst()
                    .orElse("Nhân sự");

            result.add(UserSecurityDto.builder()
                    .id(u.getId())
                    .username(u.getUsername())
                    .fullName(u.getFullName())
                    .email(u.getEmail())
                    .phone(u.getPhone())
                    .role(primaryRole)
                    .roleName(roleName)
                    .status(u.getStatus())
                    .lastLoginAt(u.getLastLoginAt())
                    .lastPasswordChangedAt(u.getLastPasswordChangedAt())
                    .mustChangePassword(u.getMustChangePassword())
                    .passwordResetSource(u.getPasswordResetSource() != null ? u.getPasswordResetSource() : "USER_SELF")
                    .failedLoginAttempts(u.getFailedLoginAttempts())
                    .lockedAt(u.getLockedAt())
                    .build());
        }

        result.sort(Comparator.comparing(UserSecurityDto::getId));
        return result;
    }

    @Transactional
    public void requirePasswordChange(Long userId, String adminUsername) {
        User target = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", "id", userId));

        User admin = userRepository.findByUsername(adminUsername).orElse(null);

        target.setMustChangePassword(true);
        target.setPasswordResetSource("ADMIN_REQUIRE");
        userRepository.save(target);

        auditService.recordAction(admin, "ADMIN_REQUIRE_PASSWORD_CHANGE", "USER", target.getId().toString(),
                "Quản trị viên yêu cầu tài khoản '" + target.getUsername() + "' đổi mật khẩu trong lần đăng nhập tới", null);

        log.info("Admin '{}' đã yêu cầu tài khoản '{}' đổi mật khẩu", adminUsername, target.getUsername());
    }

    @Transactional
    public ResetPasswordResponse generateResetPasswordToken(Long userId, String adminUsername) {
        User target = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", "id", userId));

        User admin = userRepository.findByUsername(adminUsername).orElse(null);

        String resetToken = UUID.randomUUID().toString().replace("-", "");
        Instant expiry = Instant.now().plus(24, ChronoUnit.HOURS);

        target.setPasswordResetToken(resetToken);
        target.setPasswordResetTokenExpiry(expiry);
        target.setMustChangePassword(true);
        target.setPasswordResetSource("ADMIN_RESET");
        userRepository.save(target);

        auditService.recordAction(admin, "ADMIN_RESET_PASSWORD", "USER", target.getId().toString(),
                "Quản trị viên tạo mã đặt lại mật khẩu an toàn cho tài khoản '" + target.getUsername() + "' (hiệu lực 24h)", null);

        log.info("Admin '{}' đã tạo mã đặt lại mật khẩu cho tài khoản '{}'", adminUsername, target.getUsername());

        return ResetPasswordResponse.builder()
                .userId(target.getId())
                .username(target.getUsername())
                .resetToken(resetToken)
                .expiryTime(expiry)
                .instructions("Mã bảo mật có hiệu lực trong 24 giờ. Cung cấp mã này cho người dùng để đặt lại mật khẩu an toàn.")
                .build();
    }

    @Transactional
    public void toggleAccountLock(Long userId, String adminUsername) {
        User target = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", "id", userId));

        if ("admin".equalsIgnoreCase(target.getUsername())) {
            throw new BadRequestException("Không thể khóa tài khoản Quản trị viên tối cao", "CANNOT_LOCK_SUPER_ADMIN");
        }

        User admin = userRepository.findByUsername(adminUsername).orElse(null);

        boolean isCurrentlyLocked = "LOCKED".equalsIgnoreCase(target.getStatus());
        if (isCurrentlyLocked) {
            target.setStatus("ACTIVE");
            target.setLockedAt(null);
            target.setFailedLoginAttempts(0);
            auditService.recordAction(admin, "ADMIN_UNLOCK_USER", "USER", target.getId().toString(),
                    "Mở khóa tài khoản '" + target.getUsername() + "'", null);
        } else {
            target.setStatus("LOCKED");
            target.setLockedAt(Instant.now());
            auditService.recordAction(admin, "ADMIN_LOCK_USER", "USER", target.getId().toString(),
                    "Khóa bảo mật tài khoản '" + target.getUsername() + "'", null);
        }

        userRepository.save(target);
    }

    @Transactional(readOnly = true)
    public List<AuditLogDto> getSecurityAuditHistory() {
        Set<String> securityActions = Set.of(
                "PASSWORD_CHANGE_SUCCESS",
                "PASSWORD_CHANGE_FAIL",
                "ADMIN_REQUIRE_PASSWORD_CHANGE",
                "ADMIN_RESET_PASSWORD",
                "ADMIN_LOCK_USER",
                "ADMIN_UNLOCK_USER"
        );

        return auditLogRepository.findAllByOrderByCreatedAtDesc(org.springframework.data.domain.PageRequest.of(0, 50)).stream()
                .filter(log -> securityActions.contains(log.getAction()))
                .map(AuditLogDto::fromEntity)
                .toList();
    }
}
