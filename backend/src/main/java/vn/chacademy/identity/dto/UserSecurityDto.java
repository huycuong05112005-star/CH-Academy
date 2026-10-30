package vn.chacademy.identity.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSecurityDto {
    private Long id;
    private String username;
    private String fullName;
    private String email;
    private String phone;
    private String role;
    private String roleName;
    private String status;
    private Instant lastLoginAt;
    private Instant lastPasswordChangedAt;
    private Boolean mustChangePassword;
    private String passwordResetSource;
    private Integer failedLoginAttempts;
    private Instant lockedAt;
}

